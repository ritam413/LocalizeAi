# WAYFINDER MAP: Hindi TTS Localization & Resilient Stem Persistence Pipeline

**Label:** `wayfinder:map`  
**Status:** Active Frontier  
**Last Updated:** 2026-09-21  

---

## Destination
A production-hardened, fully persistent dubbing pipeline that reliably translates dialogue into Hindi, preserves segment translations on disk, synthesizes and rehydrates 142+ dialogue audio stems without desync, composites multitrack mixes within Windows OS buffer limits, and streams deliverables cleanly in the browser.

---

## Notes
- **Domain:** Neural Localization, Faster-Whisper ASR, Ollama Qwen2.5-3B, Kokoro-82M TTS, FFmpeg Multitrack Mastering, Next.js 16 Studio Console.
- **Skills Consulted:** `/wayfinder`, `/tdd`, `/ponytail`, `/adversarial-review`, `/context7`, `/codegraph`.
- **Standing Invariant:** Resumability & Zero-Pill Geometry (4px button radius, 16-bit PCM 24kHz WAV standard).

---

## Active Ticket Frontier (Unblocked & Ready)

| Ticket | Type | Seams | Blocked By | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **[TICKET-32](file:///d:/Games/Hckthons/Side%20Projects/LocalizeAi/Docs/tickets/TICKET-32-translation-stage-disk-persistence.md)** | `task` (AFK) | `backend/app/engine/stages/translation.py` | None | Persists `translated_text` to `transcript.json` & `transcript_hi.json` |
| **[TICKET-36](file:///d:/Games/Hckthons/Side%20Projects/LocalizeAi/Docs/tickets/TICKET-36-frontend-preview-stream-object-bridge.md)** | `task` (AFK) | `frontend/lib/mediaTrackHelpers.ts` | None | Fixes `[object Object]` preview stream 404s |

---

## Blocked Downstream Tickets (Sequential Cascade)

| Ticket | Type | Seams | Blocked By | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **[TICKET-33](file:///d:/Games/Hckthons/Side%20Projects/LocalizeAi/Docs/tickets/TICKET-33-voice-director-timeline-and-stems-manifest.md)** | `task` (AFK) | `voice_director.py`, `tts.py` | TICKET-32 | Preserves `start_s`/`end_s` & writes `stems.json` |
| **[TICKET-34](file:///d:/Games/Hckthons/Side%20Projects/LocalizeAi/Docs/tickets/TICKET-34-executor-state-rehydration-and-mutex.md)** | `task` (AFK) | `backend/app/engine/executor.py` | TICKET-32, TICKET-33 | Rehydrates stems by `segment_id` map & adds stage mutex |
| **[TICKET-35](file:///d:/Games/Hckthons/Side%20Projects/LocalizeAi/Docs/tickets/TICKET-35-scalable-filtergraph-script-generation.md)** | `task` (AFK) | `backend/app/engine/stages/mixer.py` | TICKET-33, TICKET-34 | Writes `-filter_complex_script` avoiding Windows 8k limit |

---

## Decisions So Far
- **Decision 1:** Rehydration must NEVER use list index enumeration (`for idx, file in enumerate(files): seg = segs[idx]`); it must use dictionary lookup `seg_map[seg_id]` to prevent complete timeline desynchronization when segments are pruned.
- **Decision 2:** All disk manifest writes (`transcript.json`, `stems.json`, `deliverables.json`) must use atomic temporary replacement (`.tmp` + `os.replace`).
- **Decision 3:** FFmpeg compositing for >64 stems must use `-filter_complex_script` to prevent Windows `CreateProcess` command-line buffer overflow.

---

## Not Yet Specified (Fog of War)
- Studio-level interactive phoneme editor for manual Hindi pronunciation override.
- Real-time WebRTC audio waveform synchronization in multi-track player.
