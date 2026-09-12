# LOCALIZE — Media Translation & Dubbing Pipeline Upgrade Specification

> **Engineering Design Document & Implementation Specification**  
> Formulated via `/research`, `/ask-matt`, and `/codebase-design`.  
> Target: **LOCALIZE Post-Production Crew (Deepening Tier 1 & 2)**  
> Date: 2026-09-12

---

## 1. Executive Summary & Architectural Scope

Following the industry benchmark research and skeptical audit ([MEDIA_TRANSLATION_PIPELINE_COMPARISON_AND_CRITIQUE.md](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/Docs/MEDIA_TRANSLATION_PIPELINE_COMPARISON_AND_CRITIQUE.md)), this implementation plan executes a structured deepening of the **LOCALIZE** post-production pipeline across 4 key seams:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                ARCHITECTURAL UPGRADE SCOPE                               │
├────────────────────────────────┬─────────────────────────────────────────────────────────┤
│ Seam / Subsystem               │ Upgrade Target                                          │
├────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 1. Linguistic Adaptation Seam  │ Deepen LocalizationDirector with Syllable & Rhythmic     │
│                                │ Isometry Quotas ($N_{syllables} \approx \Delta t \times 3.2$). │
├────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 2. Speech Synthesis Seam       │ Pluggable SpeechSynthesisAdapter with Edge-TTS          │
│                                │ (300+ live neural voices) & Mock fallback.              │
├────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 3. Acoustic Mastering Seam     │ Deep AcousticMasteringEngine collapsing separation,     │
│                                │ multitrack sidechain ducking (-6dB), and EBU R128.      │
├────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ 4. Acoustic QA & Repair Seam   │ Objective clipping detector (0 dBFS peak) + quantitative│
│                                │ retry instructions from QAAgent -> LocalizationDirector.│
└────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 2. Detailed Technical Design by Component

### Seam 1: Isometric Dialogue Engine (`backend/app/agents/localization_director.py`)
* **Objective**: Prevent speech duration overflows upfront during the LLM translation phase rather than relying on aggressive, destructive downstream `atempo` speedups.
* **Mechanism**:
  1. For each input dialogue segment with duration window $T = \text{end\_s} - \text{start\_s}$:
     - Calculate target syllable budget: $S_{target} = \text{round}(T \times R_{target})$, where $R_{target}$ is the language speaking rate (default: $3.2 \text{ syllables/sec}$).
     - Calculate strict upper bound: $S_{max} = \text{round}(T \times 3.6)$.
  2. Inject explicit prompt constraint into Gemini structured outputs:
     ```
     Duration Window: {T:.2f}s
     Target Syllable Budget: {S_target} syllables (STRICT MAXIMUM: {S_max} syllables)
     Constraint: The translated dialogue MUST be rhythmically compact and fit within {S_max} syllables.
     ```
  3. Include a fallback heuristic syllable counter for automated prompt verification.

---

### Seam 2: Pluggable Speech Synthesis Adapter (`backend/app/agents/voice_director.py`)
* **Objective**: Upgrade from synthetic sine-wave tones (`generate_synthetic_wav`) to studio-grade neural voices with zero-cost Edge-TTS while retaining instant offline mock capability for unit tests.
* **Mechanism**:
  1. Define abstract base adapter `SpeechSynthesisAdapter`:
     ```python
     class SpeechSynthesisAdapter(ABC):
         @abstractmethod
         async def synthesize(self, text: str, voice_id: str, output_path: Path) -> float:
             """Synthesizes speech to WAV/MP3 and returns actual audio duration in seconds."""
     ```
  2. Implement `EdgeTTSAdapter` using `edge-tts`:
     - Asynchronously fetches high-quality Microsoft Neural voices (`hi-IN-MadhurNeural`, `es-ES-AlvaroNeural`, `fr-FR-HenriNeural`, `de-DE-ConradNeural`, `en-US-GuyNeural`).
     - Converts output to 16kHz/48kHz PCM WAV.
  3. Implement `MockAudioAdapter`:
     - Generates clean synthetic PCM tones for test isolation and offline environments.
  4. Wire adapter factory into `VoiceDirectorAgent(adapter=...)`.

---

### Seam 3: Deep Acoustic Mastering Engine (`backend/app/engine/stages/mixer.py`)
* **Objective**: Transform raw dialogue stems into a broadcast cinema mix by dynamically ducking the separated Demucs background track and applying EBU R128 loudness normalization.
* **Mechanism**:
  1. Interface:
     ```python
     class AcousticMasteringEngine:
         def __init__(self, base_storage_dir: Path): ...
         
         async def master_mix(
             self,
             job_id: str,
             background_audio_path: Path,
             dialogue_segments: List[Dict[str, Any]],
             output_path: Path,
             ducking_db: float = -6.0,
             target_lufs: float = -24.0
         ) -> Path: ...
     ```
  2. Construction of FFmpeg multitrack filtergraph:
     - Positions each dubbed audio stem at its exact timecode: `[1]adelay=delay_ms|delay_ms[d1]; [2]adelay=...`
     - Mixes dialogue stems into a unified `dialogue_bus`.
     - Feeds `dialogue_bus` and `background_track` into `sidechaincompress=threshold=0.08:ratio=4:attack=20:release=250` so background music ducks smoothly by -6dB whenever an actor speaks.
     - Passes composite mix through `loudnorm=I=-24:LRA=7:tp=-1.5` for EBU R128 / ITU-R BS.1770 cinema loudness mastering.

---

### Seam 4: Acoustic QA & Quantitative Retry Feedback (`backend/app/agents/qa_agent.py` & `director.py`)
* **Objective**: Detect real acoustic defects and pass actionable numerical deltas to upstream agents when self-repair is required.
* **Mechanism**:
  1. Signal Analysis:
     - `check_audio_clipping(audio_path: Path)`: Scans WAV samples for digital saturation ($\ge 0.999$) and flags `AUDIO_CLIPPING`.
     - `check_duration_overflow(actual_s: float, target_s: float, tolerance_s: float = 0.15)`: Flags `TIMING_OVERFLOW`.
  2. Quantitative Feedback:
     - When `TIMING_OVERFLOW` occurs ($\Delta t > 0.3s$), `QAAgent` calculates exact syllable reduction required:
       $$\Delta S = \text{ceil}(\Delta t \times 3.2)$$
     - Director routes targeted retry directly to `LocalizationDirector` with explicit rework directive:
       `"Re-translate segment {id}: previous translation exceeded timing by {delta_s:.2f}s. Reduce by at least {delta_syllables} syllables."`

---

## 3. Step-by-Step Implementation & Verification Plan

| Phase | Action Item | Target Files | Verification Method |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Implement Syllable Estimator & Isometric Constraints | `backend/app/agents/localization_director.py` | Pytest `backend/tests/test_localization_director.py` |
| **Phase 2** | Create SpeechSynthesisAdapter & Edge-TTS Adapter | `backend/app/agents/voice_director.py` | Pytest `backend/tests/test_voice_director.py` |
| **Phase 3** | Implement AcousticMasteringEngine & Sidechain Ducking | `backend/app/engine/stages/mixer.py` | Pytest `backend/tests/test_acoustic_mixer.py` |
| **Phase 4** | Enhance QAAgent with Clipping Check & Delta Retries | `backend/app/agents/qa_agent.py`, `director.py` | Pytest `backend/tests/test_qa_agent.py`, `test_director.py` |
| **Phase 5** | Full Pipeline Integration & Telemetry Verification | Full backend suite | `pytest backend/tests` (All 35+ tests pass) |

---
*Specification ready for review and execution.*
