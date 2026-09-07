# User Journeys — DubForge Studio

## Journey 1 — Full dub, Project A (Archivist), first time on a clip
1. **Dashboard** → click "New Run"
2. **New Run wizard**: drag in `movie_clip.mp4` → auto-probe shows duration/codec → pick **Project A preset** (Hindi + Bengali) → source language auto-detected as English (confirm)
3. Wizard shows the pre-configured stage list (from the A preset) with model choices visible; user leaves defaults, optionally toggles "degraded audio mode" if the clip is an old rip
4. Click **Start Run** → redirected to **Run Detail** screen
5. Watches stage progress: Extraction → Denoise → Separation → VAD → Diarization → Transcription (Whisper) complete
6. **Review gate**: notified "Transcript ready for review" → opens **Transcript Review** screen, skims ASR text against playback, fixes 2 misheard names
7. Approves → **Translation** stage runs (NLLB for Hindi/Bengali) → **Review gate**: "Translation ready" → opens **Translation Review**, checks duration-fit indicators, edits one over-long Bengali line
8. Approves → **Speaker Review** screen: confirms 2 speakers detected correctly, auditions 3 candidate reference clips per speaker, picks the cleanest for cloning
9. Approves → **TTS stage** runs per language (this is the long stage — user leaves it running)
10. Notified on completion → **Run Detail** shows dubbed segment previews; user spot-checks 2–3 lines in **Segment Preview**
11. Approves final remix/remux → **Output** tab shows `Hindi.mp4 + .srt`, `Bengali.mp4 + .srt`
12. Downloads via **Download Center**, or leaves in shared folder for direct pickup

## Journey 2 — Batch throughput, Project B (Batcher)
1. **Dashboard** → "New Run" → toggles to **Batch mode**
2. Selects 8 clips from a network folder (F-02) → applies saved **Project B Preset**
3. Reviews the auto-generated queue table (clip, source lang guess, target langs) → adjusts one row's target language → clicks **Queue All**
4. Closes laptop; pipeline runs unattended overnight, laptop doing Stage 1 preprocessing for clip N+1 while GPU box does TTS for clip N (F-08)
5. Next morning opens **Run History**, filters by "Failed" — sees 1 of 8 failed at Transcription stage (bad audio)
6. Opens that run, checks **Logs**, re-runs just that stage with `large-v3` instead of `turbo` (F-11)
7. Once green, batch-downloads all 8 completed runs as a zip (F-33)

## Journey 3 — Fast captioning, Project C subtitle-only (Fast Captioner)
1. **Dashboard** → "New Run" → **Project C preset**, toggles **Subtitle-only**
2. Uploads clip, source language left on auto-detect
3. Pipeline runs the light path only: Extract → (optional Demucs if noisy) → Whisper (word timestamps) → Translate to English → Subtitle assembly
4. Notified in ~35–75 min → opens **Subtitle Editor**: sees CPS/gap validation flags inline (e.g., a line flagged for exceeding 17 CPS), fixes wording to shorten it
5. Exports `.srt`/`.vtt` directly, no video re-encode needed

## Journey 4 — Recovering from a crash
1. Run is mid-TTS-stage when the GPU box reboots unexpectedly
2. User reopens DubForge Studio → **Run Detail** shows status "Interrupted at Stage 6 (TTS) — 60% of segments complete"
3. Clicks **Resume** → engine re-attaches to the job, re-generates only the remaining segments, does not redo Stages 0–5
