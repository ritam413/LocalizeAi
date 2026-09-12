# TICKET-13: Deep Acoustic Mastering Engine (Multitrack Sidechain Ducking & EBU R128)

## Status
- **State**: Planned
- **Primary Seam**: `backend/app/engine/stages/mixer.py` (`AcousticMasteringEngine`)
- **Verification**: Pytest (`backend/tests/test_acoustic_mixer.py`)
- **Blocking Dependencies**: TICKET-05, TICKET-12

## Objective
Implement a deep `AcousticMasteringEngine` that collapses stem alignment, multitrack timeline compositing, dynamic sidechain ducking (-6dB on background M&E during dialogue), and EBU R128 (-24 LUFS) broadcast loudness mastering into a single high-leverage module.

## Seams & Interfaces
- Python: `backend/app/engine/stages/mixer.py` (`AcousticMasteringEngine`)
  - `master_mix(job_id, background_audio_path, dialogue_segments, output_path, ducking_db=-6.0, target_lufs=-24.0) -> Path`
  - `composite_dialogue_bus(dialogue_segments, output_path) -> Path`

## Input / Output Contracts
- **Input Parameters**:
  - `background_audio_path`: Path to separated Demucs `background.wav` (Music & Sound Effects).
  - `dialogue_segments`: List of dicts with `audio_path`, `start_s`, `end_s`, `duration_s`.
  - `output_path`: Destination path for the mastered broadcast audio file.
  - `ducking_db`: Volume reduction for background music during dialogue (default: `-6.0 dB`).
  - `target_lufs`: Target integrated broadcast loudness (default: `-24.0 LUFS`).
- **Output**:
  - Path to final mixed master `.wav` / `.m4a` file.

## Acceptance Criteria
1. Dialogue stems are positioned at their exact timeline millisecond offsets.
2. Dynamic sidechain compression smoothly ducks the background M&E track whenever dialogue is active.
3. When dialogue stops, background audio smoothly ramps back up to normal volume without pumping or clicking.
4. Composite mix is normalized to EBU R128 standard (-24 ± 0.5 LUFS).
5. Comprehensive unit tests verify fallback behavior when background audio is absent or empty.
