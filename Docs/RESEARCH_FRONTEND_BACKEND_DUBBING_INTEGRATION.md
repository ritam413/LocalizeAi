# Research Report: Frontend & Backend Dubbing Integration & Stage Forwarding

**Research Date:** 2026-09-18  
**Skill Applied:** `/research` (Primary Source Investigation) & `/serena` (AST / Semantic Search)  
**Subject:** Verification of translation-to-dub forwarding, state propagation, and frontend UI synchronization.

---

## 1. Executive Summary & Root Cause Findings

When examining whether the translation engine forwards into dubbing:

1. **Backend Integration Is 100% Operational:**
   * After `TranslationStage` finishes translating dialogue lines, it writes `current_artifacts["segments"]`.
   * `RunExecutor` sequentially advances to `TTSStage`, which consumes `input_artifacts["segments"]` and invokes `VoiceDirectorAgent._execute()` to synthesize `stems/seg_*.wav`.
   * The pipeline then advances to `DurationAlignStage` (atempo drift reconciliation), `MasteringStage` (dialogue bus compositing + sidechain ducking + EBU R128 mastering), and `RemuxStage` (MP4 stream multiplexing).

2. **The Frontend Disconnect (Root Cause):**
   * In [`frontend/app/runs/[id]/page.tsx:L263`](file:///d:/Games/Hckthons/Side%20Projects/LocalizeAi/frontend/app/runs/%5Bid%5D/page.tsx#L263), the timeline stage list was statically hardcoded as:
     ```typescript
     const stagesList = ['extraction', 'denoise', 'transcription', 'translation'];
     ```
   * Because of this static 4-element array, the frontend UI completely omitted rendering stages 5 to 8 (`tts`, `duration_align`, `remix`, `remux`) and their live progress/status cards, giving the false visual impression that the pipeline terminated at translation.

---

## 2. Primary Source Code Verification

### A. Backend Data Forwarding (`backend/app/engine/stages/`)

```
┌────────────────────────────────────────────────────────┐
│                   TranslationStage                     │
│  Outputs: input_artifacts["segments"]                  │
│  [ { segment_id, speaker_id, start_s, end_s,           │
│      source_text, translated_text } ]                  │
└──────────────────────────┬─────────────────────────────┘
                           │ (Forwarded in-memory & SQLite)
                           ▼
┌────────────────────────────────────────────────────────┐
│                       TTSStage                         │
│  Input: input_artifacts["segments"]                    │
│  Invokes: VoiceDirectorAgent (EdgeTTSAdapter)          │
│  Outputs: stems/seg_1.wav, stems/seg_2.wav...          │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  DurationAlignStage                    │
│  Input: stems/seg_*.wav & target dialogue duration     │
│  Invokes: FFmpeg atempo speed adjustment               │
│  Outputs: aligned/aligned_seg_*.wav                    │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                    MasteringStage                      │
│  Input: aligned stems + Demucs background.wav          │
│  Invokes: Dialogue Bus + Sidechain Ducking (-6dB)      │
│           + EBU R128 (-24.0 LUFS) Mastering            │
│  Outputs: dialogue_bus.wav, mastered_audio.wav         │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                      RemuxStage                        │
│  Input: source video + mastered_audio.wav + SRT/VTT    │
│  Invokes: FFmpeg stream-copy video remuxing            │
│  Outputs: release_candidate.mp4, deliverables.json     │
└────────────────────────────────────────────────────────┘
```

---

## 3. Frontend Architecture Resolution

To dynamically render all configured stages (4 for subtitle-only Mode C, 8 for full dubbing Mode A/B):

### File: `frontend/app/runs/[id]/page.tsx`
Replace static `stagesList` declaration:
```typescript
// Replace:
// const stagesList = ['extraction', 'denoise', 'transcription', 'translation'];

// With dynamic parsing:
const stagesList: string[] = React.useMemo(() => {
  if (!runData?.frozen_stage_config_json) {
    return ['extraction', 'denoise', 'transcription', 'translation'];
  }
  try {
    const cfg = JSON.parse(runData.frozen_stage_config_json);
    if (Array.isArray(cfg.stages) && cfg.stages.length > 0) {
      return cfg.stages;
    }
  } catch {
    // fallback
  }
  return runData.subtitle_only
    ? ['extraction', 'denoise', 'transcription', 'translation']
    : ['extraction', 'denoise', 'transcription', 'translation', 'tts', 'duration_align', 'remix', 'remux'];
}, [runData]);
```

---

## 4. Conclusion & Verification

The translation engine **is already connected and forwards to dubbing**. Applying the dynamic stage resolution in the frontend ensures that users can visually monitor speech synthesis, duration alignment, acoustic remixing, and MP4 multiplexing in real time.
