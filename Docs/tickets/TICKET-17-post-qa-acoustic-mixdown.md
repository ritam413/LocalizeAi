# TICKET-17: Post-QA Acoustic Master Mixdown & Sidechain Bus Integration

## Status
- **State**: Planned
- **Primary Seam**: `backend/app/agents/director.py` & `backend/app/engine/stages/mixer.py` (`AcousticMasteringEngine`)
- **Verification**: Pytest (`backend/tests/test_director_acoustic_mixdown.py`)
- **Blocking Dependencies**: TICKET-08, TICKET-13, TICKET-14

## Objective
Wire the `AcousticMasteringEngine` directly into `DirectorAgent`'s post-QA lifecycle. Ensure that final acoustic mixdown (timeline `adelay` positioning, `amix` dialogue bus compositing, dynamic `-6.0 dB` sidechain ducking against Demucs M&E background audio, and EBU R128 `-24 LUFS` broadcast mastering) only executes on verified and repaired dialogue stems.

## TDD Strategy (`/tdd`)
1. **Red Test**: Author `backend/tests/test_director_acoustic_mixdown.py` with test cases verifying:
   - When dialogue stems have QA defects, mastering is deferred until targeted retries succeed.
   - When retries resolve defects, `AcousticMasteringEngine.master_mix()` receives the repaired stems, not the discarded defective ones.
   - When background audio is absent (dialogue-only clip), fallback mixdown succeeds without crashing.
2. **Green Implementation**: Connect `AcousticMasteringEngine` in `DirectorAgent` after QA evaluation and targeted repair loops complete.
3. **Refactor**: Remove duplicate audio mixing code or manual ffmpeg concatenation across handlers.

## Seams & Interfaces
- Python: `backend/app/agents/director.py`
  ```python
  class DirectorAgent(BaseAgent):
      def execute_acoustic_mixdown(
          self,
          repaired_stems: List[Dict[str, Any]],
          background_audio_path: Optional[Path],
          output_dir: Path,
          ducking_db: float = -6.0,
      ) -> Dict[str, Any]:
          """Composites dialogue bus, applies sidechain ducking, and masters to EBU R128."""
  ```

## Input / Output Contracts
- **Input**:
  - `repaired_stems`: List of validated dialogue stem segments with `audio_path`, `start_s`, `end_s`, `duration_s`.
  - `background_audio_path`: Path to separated background M&E stem (optional).
  - `ducking_db`: Ducking attenuation level in dB (default `-6.0`).
- **Output**:
  - `mastered_audio_path`: Path to broadcast-mastered final mixdown WAV.
  - `dialogue_bus_path`: Path to composited speech-only bus WAV.
  - `ducking_applied`: Boolean indicating if dynamic sidechain ducking was active.
  - `integrated_lufs`: Target EBU R128 loudness level (`-24.0`).

## Acceptance Criteria
1. Mixing only triggers after QA report status is `"pass"` or max retry iterations are exhausted.
2. Defective stems rejected during QA are replaced with the final repaired stems in the mixdown input.
3. Sidechain ducking applies dynamic gain reduction on the background M&E track when speech is present.
4. If background audio is `None`, a clean dialogue bus is normalized to EBU R128 and returned safely.
5. Emits Section 6 telemetry event for `action="acoustic_master_mixdown"` with latency and ducking metrics.
6. All tests in `backend/tests/test_director_acoustic_mixdown.py` pass 100%.
