"""
Core Pydantic Interface Contracts & Domain Invariants for Tickets 24-28.

Architect: wshobson-agents [Architect]
Domain: System topology, data flow, API contracts, module seams, and database schema.
Invariants:
    - INV-001: Audio PCM_16 at 24kHz mono standard for all Kokoro stems.
    - INV-002: GPU mutex serialization (Faster-Whisper vs Kokoro) on Pascal 4GB hardware.
    - INV-003: Single source of truth for multilingual voice mapping.
    - INV-004: Windows file-lock defense via atomic .tmp.wav replace.
    - INV-005: Resilient degradation: Kokoro failure -> Edge-TTS fallback without pipeline crash.
"""

from __future__ import annotations
from pathlib import Path
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, ConfigDict, Field, field_validator


# ==============================================================================
# Ticket 24: Centralized Language & Voice Persona Registry Contracts
# ==============================================================================

KokoroLangCode = Literal["a", "b", "e", "f", "h", "i", "j", "z", "p"]
TTSAdapterType = Literal["kokoro", "edge_tts", "mock"]
GenderType = Literal["male", "female", "neutral"]


class LanguageSpec(BaseModel):
    """
    Immutable specification defining language metadata, Kokoro neural voice IDs,
    and Microsoft Edge-TTS fallback voices.
    """
    model_config = ConfigDict(frozen=True)

    code: str = Field(description="ISO 639-1 language code, e.g., 'en', 'hi', 'es'")
    name: str = Field(description="Human-readable language display name")
    flag: str = Field(description="Unicode flag emoji representation")
    kokoro_lang_code: Optional[KokoroLangCode] = Field(
        default=None,
        description="Single-character Kokoro language code ('a','e','f','h','j','z') or None if unsupported"
    )
    kokoro_male_voice: Optional[str] = Field(
        default=None,
        description="Default Kokoro male voice persona (e.g., 'am_adam', 'hm_omega')"
    )
    kokoro_female_voice: Optional[str] = Field(
        default=None,
        description="Default Kokoro female voice persona (e.g., 'af_heart', 'hf_alpha')"
    )
    edge_male_voice: str = Field(
        description="Microsoft Edge-TTS fallback male voice (e.g., 'hi-IN-MadhurNeural')"
    )
    edge_female_voice: str = Field(
        description="Microsoft Edge-TTS fallback female voice (e.g., 'hi-IN-SwaraNeural')"
    )


class LanguageResolutionRequest(BaseModel):
    """Request contract for normalizing and resolving locale identifiers."""
    raw_locale_tag: str = Field(description="Raw locale identifier, e.g., 'hi-IN', 'es_ES', 'fr-FR'")


class LanguageResolutionResult(BaseModel):
    """Normalized resolution result with resolved spec and fallback status."""
    requested_locale: str
    normalized_code: str
    is_fallback: bool
    spec: LanguageSpec


# ==============================================================================
# Ticket 25: Hardened Kokoro-82M Neural TTS Adapter Contracts
# ==============================================================================

class SpeakerVoiceMapping(BaseModel):
    """Voice persona mapping associated with a specific speaker entity."""
    speaker_id: str = Field(description="Unique speaker identifier, e.g. 'speaker_1'")
    gender: GenderType = Field(default="neutral", description="Detected or annotated speaker gender")
    preferred_voice: Optional[str] = Field(default=None, description="Assigned voice persona ID")
    fallback_voice: str = Field(description="Guaranteed fallback voice persona ID")


class KokoroSynthesisRequest(BaseModel):
    """Strict typed input contract for neural speech synthesis calls."""
    text: str = Field(description="Dialogue script line to synthesize")
    voice_id: str = Field(description="Target Kokoro or Edge voice ID (e.g., 'af_heart')")
    output_path: Path = Field(description="Final destination WAV path")
    target_duration_s: float = Field(default=3.0, gt=0.0, description="Target dialogue duration in seconds")
    retry_count: int = Field(default=0, ge=0, description="Current retry iteration count from Director")
    target_lang: str = Field(default="en", description="Target ISO language code or locale tag")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech cadence multiplier")
    sample_rate: int = Field(default=24000, description="Output sample rate in Hz (standard: 24,000)")


class KokoroSynthesisResult(BaseModel):
    """Output contract produced by KokoroTTSAdapter / SpeechSynthesisAdapter."""
    output_path: Path = Field(description="Path to synthesized WAV stem")
    duration_s: float = Field(ge=0.0, description="Actual measured audio duration in seconds")
    sample_rate: int = Field(default=24000, description="Sample rate of generated stem")
    channels: int = Field(default=1, description="Audio channel count (1 = Mono)")
    bit_depth: int = Field(default=16, description="Bit depth per sample (16-bit PCM)")
    audio_format: Literal["PCM_16"] = "PCM_16"
    chunk_count: int = Field(default=1, ge=0, description="Number of generator audio chunks aggregated")
    adapter_used: TTSAdapterType = Field(description="Adapter that produced the final audio stem")
    is_fallback: bool = Field(default=False, description="True if Kokoro failed and Edge-TTS was used")
    fallback_reason: Optional[str] = Field(default=None, description="Diagnostic error trace if fallback occurred")


# ==============================================================================
# Ticket 26: TTS Stage, Executor Seam & GPU Mutex Wiring Contracts
# ==============================================================================

class DialogueSegmentInput(BaseModel):
    """Standardized dialogue segment contract fed into TTSStage."""
    segment_id: int = Field(description="Sequential segment index")
    speaker_id: str = Field(default="speaker_1", description="Speaker attribution key")
    start_s: float = Field(ge=0.0, description="Segment start timestamp in seconds")
    end_s: float = Field(gt=0.0, description="Segment end timestamp in seconds")
    translated_text: str = Field(description="Localized dialogue text to voice")
    source_text: Optional[str] = Field(default=None, description="Original source dialogue text")


class TTSStageConfig(BaseModel):
    """Runtime configuration schema consumed by TTSStage.execute()."""
    run_dir: Path = Field(description="Working directory for the current run")
    target_language: str = Field(default="en", description="Target language ISO code")
    tts_adapter: TTSAdapterType = Field(default="kokoro", description="Configured TTS adapter")
    device: Optional[Literal["cuda", "cpu"]] = Field(default=None, description="Compute device override")
    gpu_required: bool = Field(default=False, description="Whether GPU mutex lock is required")
    sample_rate: int = Field(default=24000, description="Output PCM sample rate")


class StageConfigOverride(BaseModel):
    """Payload schema allowing callers to safely customize pipeline stages."""
    stages: Optional[List[str]] = None
    subtitle_only: Optional[bool] = None
    use_demucs: Optional[bool] = None
    whisper_model: Optional[str] = None
    asr_model: Optional[str] = None
    tts_adapter: TTSAdapterType = Field(default="kokoro", description="Speech synthesis engine")
    diarization_adapter: Optional[Literal["heuristic", "pyannote"]] = None


class CreateRunPayloadContract(BaseModel):
    """
    Validated payload schema for POST /api/v1/runs.
    Eliminates untyped dictionary key dropping across executor seams.
    """
    clip_id: str = Field(description="Identifier of uploaded video clip")
    preset_id: Optional[str] = None
    project_mode: Literal["A", "B", "C"] = Field(default="C", description="A=Theatrical, B=Broadcast, C=Subtitle")
    source_language: str = Field(default="es")
    target_languages: List[str] = Field(default_factory=lambda: ["en"])
    subtitle_only: Optional[bool] = None
    use_demucs: Optional[bool] = None
    whisper_model: Optional[str] = None
    tts_adapter: TTSAdapterType = Field(default="kokoro", description="Default speech synthesis engine")
    stage_config_override: Optional[Dict[str, Any]] = None


# ==============================================================================
# Ticket 27: Downstream Audio Seams & Acoustic QA Verification Contracts
# ==============================================================================

class AudioStemQualityMetrics(BaseModel):
    """
    Acoustic quality and formatting metrics asserted during QA continuity inspection.
    Validates compatibility with Python stdlib wave module and FFmpeg atempo.
    """
    wav_path: Path
    duration_s: float = Field(ge=0.0)
    sample_rate: int = Field(description="Expected standard: 24,000 Hz")
    channels: int = Field(default=1, description="Expected standard: 1 (Mono)")
    bit_depth: int = Field(default=16, description="Expected standard: 16-bit PCM")
    peak_amplitude: float = Field(ge=0.0, le=1.0, description="Normalized maximum signal peak")
    is_clipped: bool = Field(description="True if peak amplitude reaches or exceeds 0.999 threshold")
    clipped_sample_count: int = Field(ge=0, description="Total sample frames exceeding clipping ceiling")

    @field_validator("sample_rate")
    @classmethod
    def validate_sample_rate(cls, v: int) -> int:
        if v not in (24000, 48000, 16000):
            raise ValueError(f"Sample rate {v}Hz is non-standard for LOCALIZE audio stems (expected 24kHz or 48kHz)")
        return v


class DownstreamAudioSeamVerification(BaseModel):
    """End-to-end seam contract verifying synthesized stems survive downstream processing."""
    segment_id: int
    stem_path: Path
    qa_clipping_passed: bool = Field(description="Asserted by qa_agent.check_audio_clipping")
    sync_ratio: float = Field(description="Duration ratio T_synth / T_target calculated by sync_engineer")
    atempo_applied: bool = Field(description="True if FFmpeg atempo filter was executed")
    mixdown_ready: bool = Field(description="True if stem is valid for MasteringStage sidechain ducking")


# ==============================================================================
# Ticket 28: Kokoro TTS Automated Test Harness Contracts
# ==============================================================================

class MockChunkGeneratorItem(BaseModel):
    """Schema representing mock chunks yielded by Kokoro KPipeline generator."""
    graphemes: str
    phonemes: str
    sample_count: int = Field(gt=0)
    amplitude: float = Field(default=0.5, ge=0.0, le=1.0)


class MockSynthesisFixtureContract(BaseModel):
    """Test fixture contract for zero-GPU offline unit testing."""
    test_case_name: str
    input_text: str
    target_duration_s: float
    expected_duration_s: float
    expected_sample_count: int
    expected_sample_rate: int = 24000
    should_fallback: bool = False
    expected_fallback_adapter: Optional[TTSAdapterType] = None
