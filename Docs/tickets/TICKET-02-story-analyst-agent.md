# TICKET-02: Story Analyst Agent

## Status
- **State**: Completed
- **Verification**: Vitest (`frontend/__tests__/story_analyst.test.ts`) + Pytest (`backend/tests/test_story_analyst.py`)

## Objective
Implement the Story Analyst agent that analyzes dialogue context prior to translation, identifying character speaker maps, scene boundaries, emotional tone tags (e.g. urgent, warning, inquisitive), and cultural idiom flags.

## Seams & Interfaces
- Python: `backend/app/agents/story_analyst.py` (`StoryAnalystAgent`)
- TypeScript: `frontend/lib/agents/story_analyst.ts` (`validateStoryAnalystOutput`, `parseStoryAnalysis`)

## Input / Output Contracts
- **Input**: `segments` (transcribed dialogue items with `start_s`, `end_s`, `source_text`).
- **Output**:
  - `speakers`: list of `SpeakerProfile` (`speaker_id`, `name_or_label`, `gender`, `tone_summary`)
  - `scenes`: list of `SceneBoundary` (`scene_id`, `start_s`, `end_s`, `mood`, `pacing`)
  - `annotated_segments`: list of `AnnotatedSegment` (`segment_id`, `speaker_id`, `tone_tags`, `cultural_flags`)

## Verification Results
- Vitest: 3 tests passed
- Pytest: 1 test passed
