# TICKET-12: Pluggable Speech Synthesis Adapter Seam

## Status
- **State**: Completed
- **Primary Seam**: `backend/app/agents/voice_director.py` (`VoiceDirectorAgent`, `SpeechSynthesisAdapter`)
- **Verification**: Pytest (`backend/tests/test_voice_director.py`) + Vitest (`frontend/__tests__/voice_director.test.ts`)
- **Blocking Dependencies**: TICKET-04, TICKET-11

## Objective
Introduce a clean, swappable `SpeechSynthesisAdapter` interface behind `VoiceDirectorAgent` to support real studio-grade neural voice synthesis via Microsoft `edge-tts` (300+ multilingual neural voices) with zero cloud costs and zero GPU overhead, while maintaining `MockAudioAdapter` for instant offline unit testing and predictable durations.

## Seams & Interfaces
- Python: `backend/app/agents/voice_director.py`
  - `SpeechSynthesisAdapter(ABC)`: `@abstractmethod async def synthesize(text, voice_id, output_path, target_duration_s) -> float`
  - `EdgeTTSAdapter(SpeechSynthesisAdapter)`: Live neural voice synthesis using `edge-tts`
  - `MockAudioAdapter(SpeechSynthesisAdapter)`: Synthetic PCM waveform generator for CI/testing
  - `VoiceDirectorAgent(adapter_type="edge_tts"|"mock")`

## Input / Output Contracts
- **Input Context**:
  - `target_language`: e.g. `"hi"`, `"es"`, `"fr"`, `"de"`, `"en"`.
  - `speakers`: List of speaker profiles.
  - `localized_lines`: List of translated lines from `LocalizationDirector`.
- **Output Schema**:
  - `voice_cast`: Character-to-voice assignment list.
  - `synthesized_stems`: List of items with `segment_id`, `speaker_id`, `audio_path`, `synthesized_duration_s`, `target_duration_s`.
  - `adapter_used`: Identifier of the active synthesis adapter (`"edge_tts"` or `"mock"`).

## Acceptance Criteria
1. `SpeechSynthesisAdapter` interface decouples `VoiceDirectorAgent` from the physical synthesis engine.
2. `EdgeTTSAdapter` successfully connects to Microsoft neural voice service and outputs valid 16kHz/24kHz/48kHz WAV audio stems.
3. `MockAudioAdapter` works instantaneously without internet access for test suites.
4. Voice casting maps genders to natural regional voices across all supported languages (Hindi, Spanish, French, German, Japanese, English).
