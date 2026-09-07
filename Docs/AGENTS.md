# LOCALIZE — Agent Specifications & Schemas

Each agent is a structured Gemini model call (JSON output / Pydantic schema) with a defined input, output, and execution seam.

---

## 1. Director Agent
- **Core Job**: Orchestrates crew, holds job state, manages task graph, decides targeted retries.
- **Input**:
  - `job_id`: string
  - `source_video_path`: string
  - `target_language`: string
  - `audience_profile`: string (e.g. "General audiences", "Colloquial Hindi urban youth")
- **Output**:
  - `status`: "in_progress" | "review_needed" | "completed" | "failed"
  - `current_stage`: string
  - `iterations`: int
  - `final_release_candidate_path`: string

---

## 2. Story Analyst Agent
- **Core Job**: Understands what is being spoken, emotional tone, and cultural references before translation.
- **Input**: Source transcript + vocal stems + clip metadata.
- **Output Schema**:
  ```json
  {
    "speakers": [
      { "id": "speaker_1", "gender": "male | female | unspecified", "role": "string", "tone_summary": "string" }
    ],
    "scenes": [
      { "scene_id": "scene_1", "start_s": 0.0, "end_s": 15.2, "mood": "tense", "pacing": "fast" }
    ],
    "annotated_transcript": [
      {
        "segment_id": 1,
        "speaker_id": "speaker_1",
        "start_s": 0.5,
        "end_s": 3.8,
        "source_text": "string",
        "tone_tags": ["sarcastic", "urgent"],
        "cultural_flags": ["idiom: 'spill the beans'"]
      }
    ]
  }
  ```

---

## 3. Localization Director Agent
- **Core Job**: In-character, culturally adapted translation with explicit translation rationale.
- **Input**: Story Analyst output + target language + audience profile.
- **Output Schema**:
  ```json
  {
    "localized_lines": [
      {
        "segment_id": 1,
        "speaker_id": "speaker_1",
        "start_s": 0.5,
        "end_s": 3.8,
        "source_text": "string",
        "translated_text": "string",
        "rationale": "Adapted English idiom to culturally equivalent colloquial expression.",
        "target_character_count": 42
      }
    ]
  }
  ```

---

## 4. Voice Director Agent
- **Core Job**: Character voice profile assignment and localized speech synthesis.
- **Input**: Localized script + speaker map.
- **Output Schema**:
  ```json
  {
    "voice_cast": [
      { "speaker_id": "speaker_1", "voice_id": "string", "gender": "male", "pitch": 1.0, "rate": 1.0 }
    ],
    "audio_stems": [
      { "segment_id": 1, "audio_path": "string", "synthesized_duration_s": 4.1 }
    ]
  }
  ```

---

## 5. Sync Engineer Agent
- **Core Job**: Reconciles speech duration against original timing windows.
- **Input**: Synthesized audio stems + target duration windows (`start_s`, `end_s`).
- **Output Schema**:
  ```json
  {
    "sync_adjustments": [
      {
        "segment_id": 1,
        "original_window_s": 3.3,
        "raw_synthesized_s": 4.1,
        "strategy": "speed_adjust_atempo | truncate_silence | line_shortening",
        "atempo_factor": 1.15,
        "final_duration_s": 3.3,
        "rationale": "Sped up by 1.15x via ffmpeg atempo to fit 3.3s speech window.",
        "aligned_audio_path": "string"
      }
    ]
  }
  ```

---

## 6. Subtitle Director Agent
- **Core Job**: Synchronized subtitles aligned with final audio timing, ensuring zero drift.
- **Input**: Localized script + Sync Engineer aligned timings.
- **Output Schema**:
  ```json
  {
    "srt_path": "string",
    "vtt_path": "string",
    "total_cues": 24,
    "max_cps": 16.5,
    "drift_detected": false
  }
  ```

---

## 7. QA / Continuity Agent (Hero Feature)
- **Core Job**: Post-production QC reviewer inspecting assembled cut for release-readiness.
- **Input**: Release candidate audio, timing windows, subtitle file, localized script.
- **Output Schema**:
  ```json
  {
    "release_readiness_score": 78.5,
    "verdict": "pass | rework_required",
    "defect_count": 1,
    "findings": [
      {
        "scene_id": "scene_1",
        "segment_id": 1,
        "timestamp_s": 3.3,
        "defect_type": "TIMING_OVERFLOW | SUBTITLE_DRIFT | VOICE_INCONSISTENCY | AUDIO_CLIPPING",
        "severity": "critical | major | minor",
        "description": "Synthesized audio exceeds dialogue window by 0.8s.",
        "recommended_fix": "Increase atempo to 1.18x or trim trailing silence.",
        "target_agent": "sync_engineer"
      }
    ]
  }
  ```
