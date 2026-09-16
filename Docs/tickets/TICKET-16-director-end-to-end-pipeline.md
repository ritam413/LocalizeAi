# TICKET-16: End-to-End Post-Production Director Pipeline Runner

## Status
- **State**: Completed
- **Primary Seam**: `backend/app/agents/director.py` (`DirectorAgent.run_pipeline`)
- **Supporting Engine Modules**: `backend/app/engine/stages/` (`extraction.py`, `denoise.py`, `transcription.py`, `mixer.py`), `backend/app/engine/localization/`
- **Verification**: Pytest (`backend/tests/test_director_pipeline.py`) & Vitest (`frontend/__tests__/director_pipeline.test.ts`)
- **Blocking Dependencies**: TICKET-08, TICKET-13, TICKET-14, TICKET-15

---

## Objective
Encapsulate the entire post-production workflow behind a single deep, high-leverage interface: `DirectorAgent.run_pipeline(spec: PipelineJobSpec) -> PipelineReleaseResult`.

The runner must natively support both short clips and **50-minute full-length videos** on local hardware (NVIDIA GTX 1050 Ti 4GB VRAM) and cloud setups, featuring:
1. **Configurable Vocal Isolation**: Support `use_demucs=True` (HTDemucs stem separation) and `use_demucs=False` (instant FFmpeg speech formant enhancement for 50-minute runs).
2. **GPU VRAM Mutex & Sequential Memory Hygiene**: Unload Faster-Whisper and clear PyTorch CUDA caches (`torch.cuda.empty_cache()` / `gc.collect()`) before downstream LLM/TTS stages.
3. **Scene-Batched Reasoning & Resumption**: Partition long transcripts into 25–30 line scene batches with intermediate disk checkpoints (`scenes_translated.json`) to prevent token blowouts and allow resume-on-failure.
4. **Pluggable LLM Provider**: Route scene translation to either Gemini 2.5 Flash API or local Ollama (`qwen2.5:3b` / `llama3.2:3b`).
5. **Zero-Reencode Video Stream Copy**: Mux final mastered audio onto original video via FFmpeg `-c:v copy` in seconds.

---

## Seams & Interfaces

### Python Contract: `backend/app/agents/director.py`

```python
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Dict, Any, Optional

@dataclass
class PipelineJobSpec:
    job_id: str
    video_path: Path
    target_language: str
    source_language: str = "en"
    output_dir: Optional[Path] = None
    use_demucs: bool = False  # False = fast FFmpeg filter (recommended for 50m on 1050 Ti); True = HTDemucs
    whisper_model: str = "medium"  # "small", "medium", "large-v3"
    whisper_compute_type: str = "int8"  # "int8", "float32", "float16"
    llm_provider: str = "gemini"  # "gemini" (Free tier) or "ollama" (Local 3B)
    tts_adapter: str = "edge_tts"  # "edge_tts", "kokoro", "mock"
    scene_batch_size: int = 30  # Max dialogue lines per agent translation batch
    ducking_db: float = -6.0  # M&E background ducking level during dialogue
    min_readiness_threshold: float = 85.0
    glossary_locks: Optional[List[str]] = None
    speaker_overrides: Optional[Dict[str, str]] = None

@dataclass
class PipelineReleaseResult:
    job_id: str
    status: str  # "completed" | "failed"
    readiness_score: float
    total_latency_ms: int
    release_candidate_video: Optional[Path]
    mastered_audio_path: Optional[Path]
    dialogue_bus_path: Optional[Path]
    background_me_path: Optional[Path]
    subtitles_srt_path: Optional[Path]
    subtitles_vtt_path: Optional[Path]
    repaired_defects: List[Dict[str, Any]] = field(default_factory=list)
    telemetry_events: List[Dict[str, Any]] = field(default_factory=list)
    error_message: Optional[str] = None
```

---

## Pipeline Execution Stages (Deep Seam Sequence)

```
                       [ Input: PipelineJobSpec ]
                                   │
                                   ▼
    1. Audio Extraction ──► Local FFmpeg extracts 16kHz audio stem
                                   │
                                   ▼
    2. Denoise / Separation ──► if use_demucs: HTDemucs; else: FFmpeg Formant
                                   │
                                   ▼
    3. Transcription ──► Faster-Whisper (INT8) + VRAM cleanup (empty_cache)
                                   │
                                   ▼
    4. Multi-Agent Crew ──► Scene-Batched (30 lines/scene):
       ├── StoryAnalyst: Scene tags, speaker maps & emotional cues
       ├── LocalizationDirector: Isometric syllable budgets & proper noun locks
       ├── VoiceDirector: Neural speech audio synthesis (Kokoro / Edge-TTS)
       ├── SyncEngineer: Duration atempo reconciliation & timing shifts
       └── SubtitleDirector: Drift-free .srt / .vtt subtitle generation
                                   │
                                   ▼
    5. Perceptual QA & Repair ──► QAContinuityAgent signal inspection
       └── If Defect (TIMING_OVERFLOW / AUDIO_CLIPPING):
             Targeted retry re-routes to LocalizationDirector / VoiceDirector
                                   │
                                   ▼
    6. Acoustic Mastering ──► Sidechain ducking (-6dB) + EBU R128 (-24 LUFS)
                                   │
                                   ▼
    7. Broadcast Multiplexing ──► FFmpeg -c:v copy muxes audio to video
                                   │
                                   ▼
                   [ Output: PipelineReleaseResult ]
```

---

## TDD Strategy (`/tdd`)

1. **Red Test (`backend/tests/test_director_pipeline.py`)**:
   - Test 1: `test_run_pipeline_end_to_end_fast_path` — verifies full run with `use_demucs=False` and `MockAudioAdapter`, asserting all output paths (MP4, mastered WAV, SRT, VTT) and Section 6 telemetry events are populated.
   - Test 2: `test_run_pipeline_scene_batching` — verifies that 60+ dialogue turns are sliced into $\le 30$-turn batches and re-assembled without timestamp drift.
   - Test 3: `test_run_pipeline_targeted_self_repair` — injects an acoustic clipping defect and asserts the director triggers a targeted repair pass before final mastering.
   - Test 4: `test_run_pipeline_vram_cleanup` — verifies that after transcription, memory cleanup hook is invoked.

2. **Green Implementation**:
   - Implement `DirectorAgent.run_pipeline()` in `backend/app/agents/director.py`.
   - Wire input validation, stage dispatching, scene batching, and error handling.

3. **Refactor & Codebase Health**:
   - Connect FastAPI endpoint (`backend/app/api/runs.py` / `router.py`) to call `DirectorAgent.run_pipeline()` directly, eliminating duplicated worker scripts.

---

## Acceptance Criteria
1. Single function call `await director.run_pipeline(spec)` executes end-to-end and returns `PipelineReleaseResult`.
2. Respects `use_demucs=False` for instant offline execution on 4GB GTX 1050 Ti hardware.
3. Automatically breaks multi-scene transcripts into configurable batches (default 30 lines) with absolute canvas timestamping.
4. Emits Section 6 telemetry events at every phase transition (`extraction`, `denoise`, `transcription`, `story_analyst`, `localization`, `voice_director`, `sync_engineer`, `subtitles`, `qa_continuity`, `mastering`, `muxing`).
5. Successfully triggers closed-loop targeted self-repair on QA defect detection without restarting transcription or audio extraction.
6. `backend/tests/test_director_pipeline.py` passes 100% with Pytest.
