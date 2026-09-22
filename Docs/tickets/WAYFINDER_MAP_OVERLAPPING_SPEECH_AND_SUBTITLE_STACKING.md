# WAYFINDER MAP: Overlapping Speech Recovery & Subtitle Dialogue Stacking

**Label:** `wayfinder:map`  
**Status:** Active Frontier  
**Last Updated:** 2026-09-22  

---

## Destination
A high-accuracy, low-VRAM transcription and subtitle formatting pipeline for the GTX 1050 Ti (4GB VRAM) that captures simultaneous/overlapping dialogue without dropped lines, eliminates aggressive VAD speech suppression, and formats multi-speaker turns into clean broadcast stacked subtitle lines (`- Line 1\n- Line 2`) without requiring heavy speaker identification overhead.

---

## Notes
- **Domain:** Faster-Whisper ASR, Silero VAD Tuning, CTranslate2 INT8 Quantization, Subtitle Formatter (`subtitle_formatter.py`), Broadcast SRT/VTT Standards.
- **Hardware Constraint:** NVIDIA GeForce GTX 1050 Ti (Pascal sm_61, 4GB VRAM limit). Model inference memory must remain under 1.5GB VRAM.
- **Skills Consulted:** `/wayfinder`, `/tdd`, `/research`, `/council-review`, `/ponytail`, `/clean-code`.
- **Standing Invariant:** Zero Pill Buttons, Zero CUDA OOM, Atomic Checkpointing, 42 Max Chars Per Line.

---

## Active Ticket Frontier (Unblocked & Ready)

| Ticket | Type | Seams | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **[TICKET-39](file:///d:/Games/Hckthons/Side%20Projects/LocalizeAi/Docs/tickets/TICKET-39-asr-overlapping-speech-vad-tuning.md)** | `task` (AFK) | `backend/app/engine/stages/transcription.py` | Completed | Relaxes VAD threshold (0.30) & no_speech_threshold (0.85) to prevent dropped crosstalk |
| **[TICKET-40](file:///d:/Games/Hckthons/Side%20Projects/LocalizeAi/Docs/tickets/TICKET-40-multispeaker-dialogue-stacking-formatter.md)** | `task` (AFK) | `backend/app/engine/subtitle_formatter.py` | Completed | Stacks simultaneous dialogue into broadcast dash cues without speaker-name bloat |

---

## Decisions So Far
- **Decision 1 (Council Review):** Standardize on `faster-whisper-large-v3-turbo` (int8) over WhisperX. WhisperX requires PyAnnote + Wav2Vec2 + Faster-Whisper simultaneously, exceeding the 4GB VRAM budget and risking CUDA OOM on GTX 1050 Ti.
- **Decision 2 (ASR Tuning):** Dropped speech in overlapping banter is caused by aggressive `vad_parameters` (threshold=0.5) and `no_speech_threshold=0.6`. Relaxing threshold to `0.30` and `no_speech_threshold` to `0.85` recovers simultaneous dialogue without hallucinations.
- **Decision 3 (Minimalist Subtitle Stacking):** Omit explicit speaker names per user preference; auto-stack concurrent dialogue into standard dual-line dash notation (`- Person 1\n- Person 2`).

---

## Not Yet Specified (Fog of War)
- Dynamic acoustic overlap energy classifier to adjust VAD sensitivity per audio segment.
- Interactive multi-line subtitle re-split tool in the frontend Subtitle Editor.
