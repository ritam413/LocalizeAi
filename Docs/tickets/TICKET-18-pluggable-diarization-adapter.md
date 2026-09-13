# TICKET-18: Pluggable Speaker Diarization Adapter & Voiceprint Mapping

## Status
- **State**: Planned
- **Primary Seam**: `backend/app/agents/story_analyst.py` (`DiarizationAdapter`, `HeuristicDiarizationAdapter`, `PyAnnoteDiarizationAdapter`) & `frontend/lib/agents/story_analyst.ts`
- **Verification**: Pytest (`backend/tests/test_diarization_adapter.py`) & Vitest (`frontend/__tests__/story_analyst.test.ts`)
- **Blocking Dependencies**: TICKET-02

## Objective
Introduce a pluggable `DiarizationAdapter` interface behind `StoryAnalystAgent` to decouple speaker identification and voiceprint assignment. Support `HeuristicDiarizationAdapter` (zero-dependency, fast, rule/LLM-based) as default, while providing `PyAnnoteDiarizationAdapter` (acoustic embedding clustering) for multi-speaker overlap scenes and custom `speaker_overrides` mapping.

## TDD Strategy (`/tdd`)
1. **Red Test**: Author `backend/tests/test_diarization_adapter.py` asserting:
   - `HeuristicDiarizationAdapter` attributes speakers from transcript cues and handles custom speaker overrides (`"SPEAKER_00": "Alvaro"`).
   - Abstract `DiarizationAdapter` enforces `diarize(audio_path, transcript_segments, speaker_overrides) -> List[SpeakerSegment]`.
   - `StoryAnalystAgent` respects injected custom adapters and passes speaker profiles to `LocalizationDirectorAgent`.
2. **Green Implementation**: Implement `DiarizationAdapter(ABC)`, `HeuristicDiarizationAdapter`, and adapter selection logic in `StoryAnalystAgent`.
3. **Refactor**: Align TypeScript interface in `frontend/lib/agents/story_analyst.ts` with optional `diarization_adapter_used` and speaker profile schema.

## Seams & Interfaces
- Python: `backend/app/agents/story_analyst.py`
  ```python
  @dataclass
  class SpeakerSegment:
      segment_id: str
      speaker_id: str
      start_s: float
      end_s: float
      confidence: float = 1.0
      gender: str = "neutral"
      detected_emotion: str = "neutral"

  class DiarizationAdapter(ABC):
      @abstractmethod
      def diarize(
          self,
          audio_path: Optional[Path],
          transcript_segments: List[Dict[str, Any]],
          speaker_overrides: Optional[Dict[str, str]] = None,
      ) -> List[SpeakerSegment]:
          pass

  class HeuristicDiarizationAdapter(DiarizationAdapter):
      """Fast, zero-dependency transcript and LLM-based diarizer."""
      pass

  class PyAnnoteDiarizationAdapter(DiarizationAdapter):
      """Acoustic waveform embedding clustering with fallback."""
      pass
  ```

## Input / Output Contracts
- **Input**:
  - `audio_path`: Path to mono/stereo vocal stem WAV (optional for heuristic).
  - `transcript_segments`: List of timestamped dialogue lines.
  - `speaker_overrides`: Optional user-specified dictionary mapping IDs to character names.
- **Output**:
  - `speaker_segments`: List of `SpeakerSegment` with attributed speaker IDs, start/end timestamps, and emotional tone flags.

## Acceptance Criteria
1. `StoryAnalystAgent` supports pluggable `adapter: DiarizationAdapter` dependency injection.
2. `HeuristicDiarizationAdapter` operates completely offline without PyTorch/CUDA dependencies.
3. User-supplied `speaker_overrides` cleanly re-attribute speaker IDs across all dialogue segments.
4. Section 6 telemetry records `adapter_used` in decision logs.
5. All Pytest (`backend/tests/test_diarization_adapter.py`) and Vitest tests pass 100%.
