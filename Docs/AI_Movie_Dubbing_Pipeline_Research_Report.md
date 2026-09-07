# AI Movie Dubbing Pipeline — Research & Implementation Report
*Automatic multilingual re-voicing of a movie clip using open-source ASR, MT, and voice-cloning TTS*

---

## 0. Verdict, up front

What you've described is a real, working category — it's usually called an **AI dubbing pipeline**, and there are already several open-source projects doing this exact thing (ViDubb, Linly-Dubbing, SoniTranslate, pyVideoTrans, AutoDub). You don't need to invent the architecture; you need to assemble the right components and fix a few things in your original plan:

1. **Don't split the audio into "5 or 10 equal chunks."** Fixed-count chunking is the one part of your plan that will actively hurt quality. Split on *silence/speech boundaries* instead — explained in §3.
2. **You need a source-separation step you didn't mention.** If you don't pull the background music/score/SFX off the dialogue *before* you dub, you either lose the score entirely or the cloned voice sits messily on top of leftover original dialogue. This is a required stage, not optional polish.
3. **There is no clean "just convert English audio directly to Bengali audio" shortcut.** Direct speech-to-speech translation models exist (Meta's SeamlessM4T is the best-known one), but none of the open ones let you control voice cloning fidelity, timing/lip-sync, or produce subtitles as a byproduct — which you clearly want. For a movie, the transcribe → translate → clone-TTS **cascade** (your instinct) is the correct approach, not a workaround.
4. **Bengali is your weak link.** Hindi, French, Spanish, German, Russian are all well-served by current open voice-cloning models. Zero-shot voice-cloning TTS with solid Bengali support is genuinely immature in the open-source world right now — flagged in detail in §5.

Everything below assumes you're running this **locally on your own GPU**, for personal/research use to start. If you plan to ship this as a product, re-check licenses (noted per-model below) — several of the best-sounding voice cloning models are non-commercial by default.

---

## 1. End-to-end architecture

```
15-min movie clip (video+audio, English)
        │
        ▼
[0] Lossless audio extraction (ffmpeg)  →  audio_hq.wav (48kHz/24-bit, stereo)
        │
        ▼
[1] Source separation (Demucs / UVR5)
        ├── vocals.wav  (dialogue only)
        └── background.wav (score + SFX + ambience — kept untouched)
        │
        ▼
[2] Voice-activity / silence-based segmentation (Silero VAD or ffmpeg silencedetect)
        → N variable-length speech segments (NOT fixed 5/6/10 chunks)
        │
        ▼
[3] Speaker diarization (pyannote.audio)  → who spoke which segment
        │
        ▼
[4] Transcription (faster-whisper large-v3 / large-v3-turbo, CUDA, word timestamps)
        │
        ├──► [4a] Subtitle file (.srt/.vtt) — free byproduct
        │
        ▼
[5] Translation (NLLB-200 and/or LLM, per language) → 4–6 translated scripts
        │
        ▼
[6] Per-speaker voice-cloning TTS (XTTS-v2 / CosyVoice2 / Chatterbox / IndexTTS-2)
        → synthesized dubbed speech per segment, per language
        │
        ▼
[7] Duration/timing alignment (time-stretch or re-translate-to-fit)
        │
        ▼
[8] Remix: dubbed vocals + original background.wav (ffmpeg amix)
        │
        ▼
[9] Remux with original video (ffmpeg -c:v copy)
        │
        ▼
[10] (Optional) Lip-sync pass (Wav2Lip / MuseTalk)
        │
        ▼
Hindi.mp4  Bengali.mp4  French.mp4  Spanish.mp4  German.mp4  (+ .srt for each)
```

This is essentially what **Linly-Dubbing**, **ViDubb**, and **SoniTranslate** already do under the hood (Demucs/UVR5 → Whisper → MT → XTTS/CosyVoice → Wav2Lip). Worth cloning one of these repos and reading the source even if you build your own — it'll save you weeks of debugging edge cases (silence hallucination, subtitle drift, VRAM management).

---

## 2. Stage 0–1: Extraction and source separation

**Extraction (lossless):**
```bash
# Pull audio without re-encoding (true lossless, whatever the source codec was)
ffmpeg -i movie_clip.mp4 -vn -acodec copy audio_original.m4a

# Also make a clean PCM master for processing — this is your working copy
ffmpeg -i movie_clip.mp4 -vn -acodec pcm_s24le -ar 48000 -ac 2 audio_hq.wav
```
Do all downstream processing from `audio_hq.wav`. Never re-derive it from an already-processed intermediate — every re-encode adds generational loss, and you're going to run this audio through several models already.

**Source separation** — this is the step your plan is missing:
```bash
# Demucs (Meta) — splits into vocals + everything else
demucs --two-stems=vocals audio_hq.wav
# → separated/htdemucs/audio_hq/vocals.wav
# → separated/htdemucs/audio_hq/no_vocals.wav   (score + SFX + ambience)
```
Why this matters: you're going to replace the *dialogue* with cloned-voice dialogue in 4–5 languages, but the movie's score and sound effects should stay exactly as they were. Without separation, your options are (a) dub over the original mixed track and get overlapping voices, or (b) throw away the score entirely. Neither is acceptable for a "movie" use case. Demucs (or UVR5, which is often cleaner for dialogue-heavy sources) solves this in one pass.

---

## 3. Stage 2: Chunking — replace your "5/6/10 chunks" idea

Splitting into a fixed number of equal chunks is the wrong axis. The two things that actually matter are:
- **Never cut mid-word or mid-sentence** — this breaks both Whisper's transcription (it "sees" a truncated sentence) and the TTS's prosody.
- **Chunk size should be dictated by content (a sentence, a line of dialogue), not by an arbitrary duration or count.**

Practical approach — VAD-based segmentation:
```bash
# Find silences to use as safe cut points
ffmpeg -i audio_hq.wav -af silencedetect=noise=-30dB:d=0.4 -f null - 2> silence.log
```
Or better, use **Silero VAD** (also what faster-whisper uses internally) in Python to get precise speech/non-speech boundaries, then merge tiny segments up to a target window (say 5–20 seconds) without crossing a silence gap. This gives you naturally-sized chunks — some will be 2 seconds, some 15 — instead of 10 mechanically equal slices that ignore where people are actually talking.

Since your `audio_hq.wav` is uncompressed PCM, splitting it with `-c copy` at these boundaries is genuinely lossless — no re-encoding happens:
```bash
ffmpeg -i audio_hq.wav -ss 00:01:12.400 -to 00:01:18.900 -c copy chunk_003.wav
```

---

## 4. Stage 3–4: Diarization + Transcription

**Diarization (pyannote.audio)** — tells you *who* is speaking in each segment, which you need for two reasons: (1) each character should keep a consistent cloned voice across the whole clip, and (2) you need a clean reference sample per speaker to feed the voice-cloning TTS.

**Transcription — your Whisper instinct was right.** Current state of the open Whisper ecosystem (as of mid-2026):

| Model | Notes |
|---|---|
| `faster-whisper` (CTranslate2 backend) | The practical default — 4x faster than stock openai-whisper on GPU, MIT-licensed, runs fully offline on CUDA. |
| `large-v3` | Best accuracy, ~2.5% WER on clean English, needs ~6GB VRAM at INT8. Best for non-English source languages too. |
| `large-v3-turbo` | Same encoder, pruned decoder — ~5x faster, near-identical accuracy. Good default if you're processing many clips. |
| `distil-large-v3` | Fastest, English-only, ~6x real-time-plus throughput; skip if your source isn't English. |

```python
from faster_whisper import WhisperModel

model = WhisperModel("large-v3-turbo", device="cuda", compute_type="float16")
segments, info = model.transcribe(
    "chunk_003.wav",
    word_timestamps=True,     # needed for subtitle sync and duration-matching later
    vad_filter=True,          # built-in Silero VAD, also helps prevent hallucination in silence
)
for seg in segments:
    print(seg.start, seg.end, seg.text)
```
`word_timestamps=True` is important for you specifically — you'll reuse these timestamps in Stage 7 to check whether the translated+cloned audio fits the original slot.

Note: there is no "Whisper Large v4" as of this writing, despite what some SEO blogs imply — large-v3 / large-v3-turbo are still the current top open checkpoints. If you see a tool claiming "v4," verify before trusting it.

**Subtitles** fall out of this stage for free — dump the Whisper segments straight to `.srt`, one file per language after translation.

---

## 5. Stage 5: Translation

You asked which is better — a fixed NMT model or an LLM. Short answer: **it depends on the language pair**, and this is worth getting right because Whisper→MT is the stage where meaning errors compound into the final dub.

- **NLLB-200 (Meta, open, 200 languages)** is specifically strong on Hindi and Bengali — in published benchmarks it outperforms general LLMs (including large ones) on English→Bengali specifically, because it's purpose-trained rather than relying on incidental multilingual pretraining.
- **General LLMs (Gemma 3, Qwen3, GPT-class, Claude-class)** tend to win on French/Spanish/German — high-resource European languages where fluency and idiom-handling matter more than raw coverage, and where the LLM can also take *scene context* into account (a real advantage for movie dialogue, where a line's correct translation depends on who's speaking to whom).
- **Google Translate** actually still edges out most open LLMs on raw Bengali quality in some evaluations, though it's a cloud API, not offline/local.

Practical recommendation for your project: **run NLLB-200 (3.3B) for Hindi and Bengali, and a local LLM (Gemma 3 12B or similar, via Ollama) with scene context in the prompt for French/Spanish/German/Russian.** This is a hybrid, not a single tool — but the quality difference is real, and you're already building a pipeline with per-language branches anyway.

One dubbing-specific technique worth adding: **duration-aware translation**. German and Russian text is routinely 20–35% longer than the equivalent English audio duration; Hindi/Bengali translations vary too. If you just translate literally, the TTS output won't fit the original timing slot. Prompt the LLM stage with something like: *"Translate this line to fit approximately N seconds of spoken [language] at natural pace — prefer a shorter, natural phrasing over a literal one if needed."* This solves a large chunk of the sync problem before you even get to TTS.

---

## 6. Stage 6: Voice cloning TTS — the actual model matrix

This is the part you were most focused on ("open source model on GitHub that can clone voices"). There is no single model that's best across all five of your target languages — here's the current (2026) landscape:

| Model | License | Voice cloning | Language coverage relevant to you | Notes |
|---|---|---|---|---|
| **Coqui XTTS-v2** | CPML (non-commercial without a separate agreement) | Zero-shot, 6-sec reference clip | 17 languages incl. **Hindi**, French, Spanish, German, Russian — **no Bengali** | The most battle-tested, best-documented option. Your best single default for everything except Bengali. |
| **CosyVoice2 / CosyVoice3 (Alibaba)** | Apache 2.0 | Zero-shot, cross-lingual (clone in English, speak another language) | 9 languages incl. French, Spanish, German, Russian — **no Hindi/Bengali** | Genuinely commercial-friendly license. Great for your European-language set. |
| **Chatterbox-Turbo (Resemble AI)** | MIT | Zero-shot cloning, beat ElevenLabs in blind preference tests | Strongest on English; broader multilingual cloning is less proven — verify per-language before relying on it | Good if you want a fully permissive license and English is one of your targets/reference. |
| **Fish Speech V1.5 / Fish Audio S2** | Mixed (some variants CC-BY-NC-SA) | Native multi-speaker dialogue support — useful if two characters talk in one segment | Broad claimed language coverage | Worth it specifically if you don't want to stitch single-voice clips together for two-character scenes. |
| **IndexTTS-2** | Check model card | Zero-shot, with **explicit duration control** — you can specify target output length | Coverage skews toward Chinese/English; verify Hindi/Bengali support before depending on it | The duration-control feature is exactly what solves your sync problem in §7 — worth testing even if you use another model for the actual cloning. |

**For Hindi:** XTTS-v2 is your most reliable path — it's specifically documented with Hindi (`language="hi"`) support and works with the standard 6-second reference clip.

**For Bengali — the actual gap in your plan:** none of the mainstream zero-shot voice-cloning models above support Bengali well. Your realistic options, roughly in order of practicality:
1. **AI4Bharat Indic-TTS** (open, 13 Indic languages incl. Bengali) — good speech quality, but it's *speaker-conditioned*, not true arbitrary-reference zero-shot cloning like XTTS. You get natural Bengali speech, not necessarily *the movie character's* voice.
2. **Meta MMS-TTS** (1100+ languages incl. Bengali) — extremely broad coverage, but single fixed voice per language, no cloning at all. Fine for subtititles-to-speech, not for "clone the actor."
3. **Community XTTS-v2 fine-tunes on Bengali** — exist on Hugging Face, quality varies a lot, treat as experimental.
4. **Commercial APIs** (e.g., Gnani.ai's Vachana TTS, which explicitly supports zero-shot cloning across 12 Indic languages including Bangla) — not open-source/GitHub, but worth knowing about if the open options don't hit the bar you want for Bengali specifically.

Realistic recommendation: build and validate your pipeline on Hindi/French/Spanish/German first (all well-supported), and treat Bengali as a separate R&D track where you either accept AI4Bharat's non-cloned-but-natural output, or budget time to fine-tune a cloning model yourself.

```python
# Example: XTTS-v2 per-segment cloning
from TTS.api import TTS

tts = TTS("tts_models/multilingual/multi-dataset/xtts_v2", gpu=True)
tts.tts_to_file(
    text=translated_segment_text,
    file_path=f"dub_{lang}_{segment_id}.wav",
    speaker_wav=f"reference_{speaker_id}.wav",   # 6s+ clean clip of that character, from diarization
    language="hi",   # "fr", "es", "de", "ru" per target
)
```

---

## 7. Stage 7: Duration/timing alignment (the step most tutorials skip)

Once you have cloned audio per segment, it almost never matches the original segment's duration exactly. You have three tools, best used together:
1. **Duration-aware translation** (already discussed in §5) — cheapest fix, prevention rather than cure.
2. **Model-native duration control** — IndexTTS-2 explicitly supports this; worth testing for your use case even as a secondary model.
3. **Time-stretching as a fallback** — pitch-preserving stretch via `rubberband` or ffmpeg's `atempo` filter for small corrections (±15–20%):
```bash
ffmpeg -i dub_hi_003.wav -filter:a "atempo=1.08" dub_hi_003_fit.wav
```
Chain multiple `atempo` filters for larger corrections since each instance is limited to 0.5–2.0x. If a segment is off by more than ~20%, that's a sign the translation itself should be redone shorter/longer rather than stretched — audible pitch/tempo artifacts start past that point.

---

## 8. Stage 8–9: Remix and remux

```bash
# Concatenate all dubbed segments for one language into a single vocal track,
# placed at the correct timestamps (use ffmpeg's adelay per segment, or an EDL-based assembler)

# Mix dubbed vocals back with the original (untouched) background bed
ffmpeg -i dub_vocals_hindi_full.wav -i background.wav \
  -filter_complex "[0:a][1:a]amix=inputs=2:duration=longest:dropout_transition=0" \
  final_audio_hindi.wav

# Remux with the original video, no video re-encode
ffmpeg -i movie_clip.mp4 -i final_audio_hindi.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -shortest \
  movie_clip_HINDI.mp4
```

---

## 9. Optional: lip-sync

You didn't ask for this explicitly, but since it's the natural next step once you have translated audio: **Wav2Lip** and the newer **MuseTalk** are the two open options that show up across every dubbing repo referenced above. MuseTalk is the more current choice — real-time-capable (30+ fps on decent hardware) and generally cleaner than Wav2Lip's sometimes-blurry mouth region. Treat this as a separate, later pipeline stage — get audio dubbing solid first.

---

## 10. Answering your direct question: "is there a way to skip transcription and go straight audio→audio?"

Yes, technically — **direct speech-to-speech translation models** exist (Meta's SeamlessM4T family is the most relevant open one). But for your specific goals, they're the wrong tool:
- They don't give you subtitles as a byproduct (you explicitly wanted these).
- They don't preserve a specific individual's cloned voice with the fidelity XTTS/CosyVoice give you — voice identity tends to degrade or get replaced with a generic target-language voice.
- They don't give you clean control over background-music separation or per-character voice consistency.
- Every real open-source dubbing tool that exists today (ViDubb, Linly-Dubbing, SoniTranslate, pyVideoTrans, AutoDub) uses the transcribe → translate → clone-TTS cascade, not a direct S2S model — that's a strong signal about which approach actually works in practice for this use case.

Your original instinct (Whisper → subtitles → TTS cloning) is the right one. Stick with it.

---

## 11. Hardware / throughput estimate for a 15-minute clip (single consumer GPU, e.g. RTX 4090)

| Stage | Rough time |
|---|---|
| Extraction + separation (Demucs) | 2–4 min |
| VAD segmentation + diarization | 1–2 min |
| Whisper transcription (large-v3-turbo) | 1–2 min |
| Translation (NLLB / local LLM), all 4–5 languages | 2–5 min |
| TTS cloning, **per language** (~150–250 dialogue lines) | 15–40 min |
| Duration alignment + remix + remux | 2–5 min |

TTS is your bottleneck, and it's the stage that scales linearly with number of target languages — but it's embarrassingly parallel (run languages concurrently if you have VRAM headroom, or queue them sequentially on one GPU). Budget roughly **1–2.5 hours total** for all five languages on a single high-end consumer GPU, most of it unattended.

---

## 12. One practical note on rights

Worth flagging plainly, not as a lecture: cloning a real actor's voice and dubbing a copyrighted film raises two separate issues from the pure engineering question — the film's copyright (translating/redistributing it without a license is an infringement regardless of the tech used) and, increasingly, voice/likeness rights around cloning a specific real person without consent (several jurisdictions are actively legislating this in 2026). For pipeline development and testing, it's worth using footage you own the rights to, or content under a permissive license, until you've confirmed what you intend to do with the output.

---

## 13. Suggested build order (MVP → full system)

1. **Phase 1 — single language, single speaker:** ffmpeg extraction → faster-whisper → NLLB or LLM translation → XTTS-v2 clone → manual remux. Validate on a 2-minute clip with one speaker before touching diarization.
2. **Phase 2 — multi-speaker:** add pyannote diarization, per-speaker reference clips, consistent voice mapping across segments.
3. **Phase 3 — multi-language batch:** parallelize Stage 5–7 across your 4–5 target languages; add duration-alignment logic.
4. **Phase 4 — audio quality:** add Demucs source separation and background remix (don't skip this — it's the difference between "AI dub" and "usable dub").
5. **Phase 5 — polish:** subtitle burn-in, optional MuseTalk lip-sync, a Gradio front-end so you're not running scripts by hand.

---

## Key reference repos worth cloning and reading (not for their code verbatim — for their pipeline structure)
- `medahmedkrichen/ViDubb` — Whisper + MarianMT/LLM + XTTS + Wav2Lip + pyannote diarization
- `Kedreamix/Linly-Dubbing` — Demucs + UVR5 + CosyVoice + local LLM translation
- `R3gm/SoniTranslate` — Whisper + XTTS/OpenVoice/RVC, subtitle editing UI
- GitHub topic pages `video-dubbing` and `dubbing-voice` for the current full list — this space moves fast, worth re-checking every few months for new entrants.

---
---

# PART 2 — Revised Plan: Two Projects, Real Hardware, and OmniVoice Studio

*(Addendum based on follow-up requirements: two separate project types, a 4GB GPU + weak CPU box, a second CPU-only laptop, no LLM dependency, and robustness to degraded source audio.)*

## 14. "OmniBuy/OmniStudio" confirmed — this is OmniVoice Studio

You're thinking of **OmniVoice Studio** (`debpalash/OmniVoice-Studio` on GitHub, also mirrored by a few forks). It's a real, actively-developed, fully local, open-source desktop app that does almost exactly what you're building:

- **Zero-shot voice cloning** from a 3-second reference clip, via its own bundled model (built on `k2-fsa`'s OmniVoice engine) — claims 646 languages.
- **Video dubbing built in**: takes a local file or YouTube URL → transcribes (WhisperX) → translates → re-voices → exports MP4.
- **Demucs-powered source separation** (splits dialogue from music/SFX — the step I flagged as missing from your original plan) — already built in.
- **pyannote + WhisperX diarization** — auto-identifies who spoke what, per character.
- **Wav2Lip v2 lip-sync** as a plug-in module, not required.
- **Pluggable TTS backends** — you're not locked into its own model; it can also drive Chatterbox, Kokoro, VoxCPM, IndexTTS-2, Qwen3-TTS, and others through the same interface.
- **No API keys, fully offline**, Windows/Mac/Linux desktop app (Tauri + Python backend).
- Explicitly designed for low-VRAM machines: **it auto-detects CUDA/MPS/CPU and offloads TTS to CPU automatically when VRAM is ≤8GB** — which is directly relevant to your 4GB card.

Practical recommendation: **clone this repo and run it from source** (it's in active beta — the maintainers recommend source over the prebuilt installer for the latest fixes). Even if you eventually want more manual control than its GUI gives you, its codebase is the fastest way to see a working Whisper→Demucs→pyannote→TTS pipeline you can pick apart and reuse.

```bash
git clone https://github.com/debpalash/OmniVoice-Studio.git
cd OmniVoice-Studio
uv sync        # Python deps
bun install    # frontend deps
bun dev        # frontend at :5173, API at :8000
```

---

## 15. Your two projects, reframed

**Project A — Hindi & Bengali dubs (low volume, maximum quality)**
- These are the minority of your movies, so you can afford to run heavier/slower models and take more time per clip.
- "Very clear voice cuts" = prioritize the highest-quality settings across the board: full `large-v3` Whisper (not turbo), careful VAD-based chunking, XTTS-v2 at full fp16 for Hindi (well-supported), and for Bengali — still the field's weak point (see §6 above) — budget extra time to either use AI4Bharat Indic-TTS or fine-tune a cloning model, since this project's whole point is quality over throughput.

**Project B — Spanish (Colombian) / Portuguese (Brazilian) / Russian → English / Russian / French (majority workload)**
- This is your main pipeline, and good news: **this language set is the best-supported combination in the entire open-source stack.** English, French, Spanish, Russian all have strong coverage in XTTS-v2, CosyVoice2, NLLB-200, and every major Whisper checkpoint. Your quality risk here is low — the challenge is throughput and handling rougher source audio (old rips, compressed re-encodes, inconsistent mic quality), not model availability.
- Since your emphasis is "convert back to English," treat English as the primary target and tune your defaults (denoising, chunk settings, QA effort) around getting that direction right first, then reuse the same pipeline for the Russian/French targets.

---

## 16. Hardware-aware model selection (GTX 1050 Ti, 4GB VRAM)

Real numbers matter here more than general advice, so:

| Component | VRAM footprint | Fits on 4GB alone? |
|---|---|---|
| `faster-whisper large-v3-turbo`, INT8 | ~3GB | Yes, but leaves little headroom — don't run alongside anything else |
| `faster-whisper medium`, INT8 | ~1.5-2GB | Comfortably, if you want more headroom or need to run two things |
| **XTTS-v2**, FP16 | ~2GB generation, 3-4GB with CUDA buffers/overhead | Yes, on its own |
| **LuxTTS** (zipvoice-based, MIT) | **~1GB**, and genuinely faster-than-realtime even on **CPU only** | Comfortably — and it's your best CPU fallback |
| Demucs (separation) | GPU optional, runs fine on CPU | N/A — don't bother spending your 4GB on this |
| pyannote diarization | GPU optional, CPU works, just slower | N/A |

**The one hard rule for a 4GB card: never load two models onto it at once.** Run each stage, unload, move to the next. OmniVoice Studio already does this kind of sequential loading; if you hand-roll your own pipeline, explicitly call `del model; torch.cuda.empty_cache()` between stages.

**LuxTTS is worth calling out specifically for your setup** — it's a lightweight, MIT-licensed cloning model (3-second reference, 48kHz output) that fits in ~1GB VRAM and runs faster-than-realtime even with *no GPU at all*. That makes it a genuinely useful second option: use XTTS-v2 for your best-quality runs (Project A, Hindi especially) and LuxTTS when you want speed or want to run TTS on the laptop instead of the GPU box.

---

## 17. Using the CPU-only laptop (i5 13th-gen, integrated graphics) — yes, put it to work

Your laptop can't do the TTS generation efficiently, but it's a genuinely useful second worker for everything *before* that stage — and a modern i5 mobile chip has decent multi-core throughput for CPU-bound audio work. Split the pipeline across both machines like this:

**Laptop = Stage 1 "preprocessing worker"** (all CPU-tolerant stages):
- ffmpeg extraction
- Audio denoising/enhancement (see §18 below — this matters a lot for your "blurry speech" requirement)
- Demucs source separation (CPU mode — slower than GPU but perfectly usable for offline batch work)
- VAD segmentation + pyannote diarization (CPU-capable)
- Whisper transcription — run `faster-whisper` in CPU/INT8 mode, or try `whisper.cpp` with its Vulkan backend, which can get partial acceleration from the laptop's integrated Iris Xe / Arc graphics even without a dedicated GPU
- NLLB-200 translation, INT8 on CPU (perfectly workable for batch/offline use, and you already said skipping an LLM here is fine — NLLB is lighter and doesn't need GPU at all)
- Subtitle (.srt) generation

**GTX 1050 Ti box = Stage 2 "GPU worker"** (the one stage that actually benefits from CUDA):
- XTTS-v2 (or LuxTTS) voice cloning generation only
- Final remix/remux (ffmpeg, CPU work, could honestly happen on either machine)

**Handoff between machines:** you don't need a heavyweight job queue (Celery/Redis) for a two-machine personal setup — a shared network folder (SMB share, or a synced folder via **Syncthing**, which is open-source and works well for this) carrying per-segment WAV clips + translated-text JSON + speaker reference clips is enough. A small Python "watcher" script on the GPU box that polls the shared folder for new segment batches and starts TTS generation is a day of work, not a project.

**Payoff:** while the GPU box renders TTS for clip N, the laptop preprocesses clip N+1 — the two heaviest, most time-consuming stages (transcription/separation and TTS generation) run in parallel instead of serially on one machine. This is the single biggest speed win available to you given your hardware, and it costs nothing.

---

## 18. Handling "hazy/blurry" (degraded) source audio

This affects transcription accuracy (and therefore subtitle quality) regardless of which project a clip belongs to, so it's worth doing for everything, not just Project A:

1. **Denoise before transcribing, not after.** Run a lightweight speech-enhancement pass on the extracted audio before it ever reaches Whisper. **DeepFilterNet** is the standout open-source pick here — real-time capable, CPU-friendly (good fit for the laptop), and specifically designed to clean up degraded speech without the over-processed artifacts older noise-suppression tools produce. Run it as the very first step in Stage 1, right after extraction.
2. **Tune Whisper against its known failure mode.** Whisper's main weakness on rough audio is *hallucination* — inventing repeated phrases or captions during silence or heavy noise. Mitigate with `vad_filter=True` (skips genuinely silent stretches) and `condition_on_previous_text=False` (stops one bad guess from cascading into the next segment).
3. **Use the larger Whisper model on rough audio, not the smaller one** — counterintuitive when optimizing for speed, but noisy audio is exactly where `large-v3` (or `large-v3-turbo`) meaningfully outperforms `medium`/`small`; the accuracy gap widens as conditions worsen, which is the opposite of what you'd guess if you were only optimizing for clean-audio throughput.
4. **Keep the "clear voice cuts" requirement scoped to the dub audio, not the source.** You don't need to denoise your way to a spotless *source* recording — you need clean *output* for Hindi/Bengali specifically, and that's a property of the TTS-generated voice (which is inherently clean, since it's synthesized), not the noisy source it was cloned from. A blurry English source reference clip can still produce a crisp cloned Hindi voice, as long as the 3–6 second reference sample you feed the cloning model is one of the cleaner segments you can find in that speaker's dialogue.

---

## 19. Confirming: skipping the LLM is a good call here, not a compromise

NLLB-200 (open, Apache-licensed, purpose-built for translation) is lighter, faster on CPU, and — per the benchmarks in §5 — already outperforms general LLMs on several of your language pairs (notably into Bengali). For your Spanish/Portuguese/Russian↔English/French set specifically, dedicated bilingual MarianMT-style models are even smaller and faster than NLLB if you want to shave more time off Stage 1, at a small quality cost — worth A/B testing once your pipeline is running, but not something to set up on day one.

---

## 20. Realistic throughput expectations on your actual hardware

These are rough, meant for planning rather than a guarantee — benchmark your own first clip and adjust:

| Stage | Where it runs | Rough time per 15-min clip |
|---|---|---|
| Extraction + denoise (DeepFilterNet) | Laptop, CPU | 3–6 min |
| Demucs separation | Laptop, CPU | 15–30 min |
| VAD + diarization | Laptop, CPU | 5–10 min |
| Whisper transcription (large-v3-turbo, INT8) | Laptop, CPU | 20–40 min |
| NLLB-200 translation, all target languages | Laptop, CPU | 5–15 min |
| XTTS-v2 / LuxTTS cloning, **per language** | GPU box | 30–70 min |
| Remix + remux | Either | 2–5 min |

With the two-machine split running in parallel (laptop on clip N+1 while GPU box renders clip N), expect **roughly 1.5–2.5 hours of wall-clock time per clip per language** on this hardware, dropping toward the lower end once you've tuned settings and aren't hitting cold-start model loads every run. This is meaningfully slower than the RTX 4090 estimate in §11 — expected, given the VRAM/compute gap — but entirely usable for an offline, non-realtime personal pipeline, and the two-machine split is what keeps it from being far worse.

---
---

# PART 3 — Project C: Universal "Any Source Language → English" Toggle, with a Subtitle-Only Subpart

## 21. Project C overview

A third, separate mode alongside Projects A and B: **input language is not fixed** — the pipeline should auto-detect (or let you manually confirm) whatever language the source clip is in, and always target **English** as output. This is really the same engine as Project B, generalized: instead of "Spanish/Portuguese/Russian → English," it's "whatever → English," with source-language detection as the first real step.

**Source language detection:** `faster-whisper` does this natively — a quick pass on the first ~30 seconds returns a language probability distribution before you commit to full transcription. Use this to auto-select the right Whisper decoding language and the right NLLB language code downstream, with a manual override in your tool's UI in case detection is wrong on a noisy or accented clip (worth having, since low-resource accents can occasionally get misdetected).

**Time cost:** identical to the Project B full-dub estimate in §16 above — the only addition is the ~10–20 second language-ID pass, which is negligible.

## 22. The subpart: subtitle-only mode ("just give me a very good English subtitle")

This is a genuinely different, much lighter pipeline — it skips the single most expensive stage (voice cloning) entirely, so it's worth building as its own explicit mode rather than just "the dubbing pipeline with TTS turned off."

**Stages actually needed:**
1. Extract + denoise (same as before — denoising still meaningfully improves transcription accuracy, so don't skip it even though there's no audio output at the end)
2. Demucs separation — **optional**, only worth the extra 20–40 min if the source has heavy background music/noise fighting the dialogue. Skip it for clean sources to stay in the fast lane.
3. Whisper transcription with **word-level timestamps on** — this is what lets you build well-formed subtitle timing rather than one giant block per Whisper segment.
4. Translation to English (NLLB-200 for the source language, or the target-specific bilingual model if you're doing the context-window trick below).
5. Subtitle assembly with proper timing/formatting rules (below) — this is the step that actually determines whether the subtitles "feel" professional or not, and it's mostly missing from naive Whisper→SRT scripts.

### Making the subtitles good, specifically

You named two real, well-known subtitle-quality problems — here's how each is normally solved:

**"It should have all the gaps between" (timing/formatting):**
- Don't dump raw Whisper segments straight to SRT — Whisper's segment boundaries are transcription-convenient, not reading-convenient.
- Enforce a **minimum gap between consecutive subtitle lines** (industry convention: ~2–3 frames, roughly 80–120ms) so lines don't feel like one continuous scroll even when dialogue is back-to-back.
- Enforce a **minimum display duration per line** (~1 second) and a **maximum reading speed** (roughly 15–17 characters/second for adult viewers) — split long spoken lines into two subtitle cards rather than cramming them into one that flashes by too fast.
- **Snap subtitle start/end to the actual VAD speech boundaries** you already computed in Stage 1, with a small padding (~100–300ms lead-in, similar lead-out) — this is what prevents captions from lingering awkwardly over silence, or cutting off a fraction of a second before the line actually starts.
- Cap subtitle lines at 2 lines, ~42 characters per line (standard convention) for readability.

This is genuinely a formatting/post-processing layer on top of Whisper's word-level timestamps, not a separate model — a `whisper_segments → well-formed .srt` converter that applies these rules is maybe 100–150 lines of Python, and it's the difference between amateur-looking auto-captions and something that reads like a real subtitle track.

**"It should not be out of context" (translation quality):**
- Translating each subtitle line in isolation (what a naive pipeline does) loses cross-line context — pronoun references, character names carried over from the previous line, idioms that only make sense with the surrounding dialogue.
- Since you're staying off LLMs, the practical fix without one is a **context-window translation trick**: instead of translating each line alone, translate a small overlapping window (the current line plus the 1–2 lines before it) as one input, then keep only the newly-translated portion for that line. NLLB handles multi-sentence input fine, so this costs almost nothing extra in compute — it's the same model, just fed slightly more context per call.
- If quality still isn't there after that, the one place a **lightweight local LLM** genuinely earns its keep is as an optional context-correction pass purely on the *translated subtitle text* (not on the audio, not for the dub) — a small model (3B-class, CPU-runnable) re-reading the full translated script in order and fixing obvious continuity errors. This is optional, not required, and it's a very different (much cheaper) use of an LLM than running one as your main translator — worth keeping as a toggle for Project C specifically, since subtitle-only mode has the compute budget to spare that the full dub pipeline doesn't.

### Updated time estimate, subtitle-only mode, 20-minute clip

| Stage | Time |
|---|---|
| Extract + denoise | 4–8 min |
| Demucs (only if source is noisy — optional) | 0, or 20–40 min |
| Whisper transcription, word timestamps | 27–53 min |
| Translation, with context window | 4–10 min |
| Subtitle assembly + gap/timing rules | 1–3 min (automated) |
| **Total** | **~35–75 min** (clean source), **~55–115 min** (noisy source, with separation) |

This mode is worth building first, honestly — it exercises the same detection → transcription → translation core you need for every other project, it's your fastest feedback loop for tuning accuracy and subtitle formatting, and you get a usable deliverable (a genuinely good English subtitle track) in under an hour per clip while the slower full-dub pipeline is still being tuned.
