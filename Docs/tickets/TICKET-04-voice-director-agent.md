# TICKET-04: Voice Director Agent

## Status
- **State**: Completed
- **Verification**: Vitest (`frontend/__tests__/voice_director.test.ts`) + Pytest (`backend/tests/test_voice_director.py`)

## Objective
Implement the Voice Director agent responsible for character voice assignment matching gender and tone, generating localized dialogue audio stems per speech segment with exact audio duration tracking.

## Seams & Interfaces
- Python: `backend/app/agents/voice_director.py` (`VoiceDirectorAgent`)
- TypeScript: `frontend/lib/agents/voice_director.ts` (`assignVoiceProfiles`, `validateVoiceDirectorOutput`)

## Input / Output Contracts
- **Input**: `target_language`, `speakers`, `localized_lines`.
- **Output**:
  - `voice_cast`: list of `VoiceAssignment` (`speaker_id`, `voice_id`, `gender`, `pitch`, `rate`)
  - `synthesized_stems`: list of `SynthesizedStem` (`segment_id`, `audio_path`, `synthesized_duration_s`, `target_duration_s`)

## Verification Results
- Vitest: 3 tests passed
- Pytest: 1 test passed
