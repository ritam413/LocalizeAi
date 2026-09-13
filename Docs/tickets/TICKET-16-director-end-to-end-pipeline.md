# TICKET-16: End-to-End Post-Production Director Pipeline Runner

## Status
- **State**: Planned
- **Primary Seam**: `backend/app/agents/director.py` (`DirectorAgent.run_pipeline`) & `backend/app/engine/pipeline_runner.py`
- **Verification**: Pytest (`backend/tests/test_director_pipeline.py`) & Vitest contract test (`frontend/__tests__/director_pipeline.test.ts`)
- **Blocking Dependencies**: TICKET-08, TICKET-13, TICKET-14, TICKET-15

## Objective
Encapsulate the entire post-production workflow (video ingestion, audio extraction, Demucs M&E vocal stem separation, speech transcription, multi-agent crew execution, closed-loop self-repair, and final acoustic mastering) behind a single deep, high-leverage interface: `DirectorAgent.run_pipeline(spec: PipelineJobSpec) -> PipelineReleaseResult`.

## TDD Strategy (`/tdd`)
1. **Red Test**: Author `backend/tests/test_director_pipeline.py` with mock audio/video fixtures and synthetic speech adapters asserting that a single call to `run_pipeline()` executes extraction, transcription, crew reasoning, self-repair (if defects simulated), and outputs a release candidate with all stage artifacts.
2. **Green Implementation**: Implement `DirectorAgent.run_pipeline()` coordinating `AudioExtractor`, `DenoiseSeparation`, `Transcription`, the multi-agent crew graph, and `AcousticMasteringEngine`.
3. **Refactor**: Eliminate fragmented background worker glue across API endpoints, ensuring all state transitions and Section 6 telemetry events emit from this single deep seam.

## Seams & Interfaces
- Python: `backend/app/agents/director.py`
  ```python
  @dataclass
  class PipelineJobSpec:
      job_id: str
      video_path: Path
      target_language: str
      source_language: str = "en"
      glossary_locks: Optional[List[str]] = None
      speaker_overrides: Optional[Dict[str, str]] = None
      min_readiness_threshold: float = 85.0
      ducking_db: float = -6.0

  @dataclass
  class PipelineReleaseResult:
      job_id: str
      status: str  # "completed" | "failed"
      readiness_score: float
      release_candidate_video: Optional[Path]
      mastered_audio_path: Optional[Path]
      dialogue_bus_path: Optional[Path]
      background_me_path: Optional[Path]
      subtitles_srt_path: Optional[Path]
      subtitles_vtt_path: Optional[Path]
      telemetry_events: List[Dict[str, Any]]
      repaired_defects: List[Dict[str, Any]]
  ```

## Input / Output Contracts
- **Input**: `PipelineJobSpec` specifying input media path, target language, and optional constraints.
- **Output**: `PipelineReleaseResult` containing all produced paths, telemetry events, and release-readiness metrics.

## Acceptance Criteria
1. Single method execution `DirectorAgent.run_pipeline(spec)` runs end-to-end without external script coordination.
2. If Demucs background stem is available, it is preserved and passed to `AcousticMasteringEngine`.
3. Emits Section 6 telemetry events at every pipeline phase boundary (`extraction`, `transcription`, `story_analyst`, `localization`, `voice_director`, `sync_engineer`, `subtitles`, `qa_continuity`, `mastering`).
4. If simulated defects are injected during QA, the closed-loop targeted retry triggers and re-synthesizes/re-budgets without restarting extraction or transcription.
5. Pytest suite passes 100% in `backend/tests/test_director_pipeline.py`.
