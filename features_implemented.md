# Features Implemented & Feature Status
Last updated: 2026-09-06

This document tracks the current functionality and implementation status of LOCALIZE.

---

## Translation & Localization Engine Features
- **Dual-Engine Translation Routing (`Faster-Whisper` ⇄ `Ollama LLM`) & Same-Language Rephrase**:
  - **Status**: Implemented & Verified
  - **Details**: Added support for selecting between `Faster-Whisper` (direct speech-to-English audio translation) and `Ollama LLM` (contextual dialogue and cultural adaptation). For non-English to English translation (`es->en`, `ja->en`, `hi->en`), picking Ollama routes dialogue through `_call_ollama_translation` rather than Whisper audio translation. When source and target languages are identical (e.g. `en->en`), added interactive same-language detection with user options to either `[Adapt with Ollama]` (applies colloquial rephrasing) or `[Skip / Verbatim]` (bypasses LLM for zero-latency verbatim subtitle generation). Configured connect timeout on candidate Ollama endpoints to 2.0s with fast-path for stub mode.
  - **Modules**: `frontend/components/studio/WorkbenchCard.tsx`, `backend/app/engine/stages/translation.py`, `backend/app/api/runs.py`, `backend/app/engine/executor.py`, `backend/tests/test_translation_multilingual.py`.
  - **Verification**: Frontend Vitest 134/134 passed across 22 test files; Pytest 10/10 passed in `test_translation_multilingual.py` and `test_translation_persistence.py`.

## Agent Deliberation, Review & Editorial Skills
- **Council Review (`/council-review`)**: 5-advisor Diverse Multi-Agent Debate (DMAD) system (Architect, Security, Minimalist, DX, Contrarian) + Chairman synthesis for architectural and plan validation.
- **Adversarial Review (`/adversarial-review`)**: Hostile Red-Team stress-testing across Saboteur (malicious/chaos inputs), Concurrency (races/locks), Resource Scaling (exhaustion/leaks), and Assumptions.
- **Humanizer (`/humanizer`)**: Wikipedia AI-Cleanup standard text de-slopper to eliminate robotic patterns, staging, forced triads, and chatbot residue.
- **Rigorous Review (`/rigorous-review`)**: Behavior-preserving multi-vector audit (Correctness, Security, Performance, Observability, Maintainability).
- **Six-Pager (`/six-pager`)**: Amazon-style 6-page narrative memo generator for complex proposals.
- **Emil Kowalski Design Engineering & Animation Suite**:
  - `emil-design-eng`: UI polish, interaction craft, spring physics, and invisible compounding details.
  - `animate`: Motion implementation from scratch (spring curves, durations, interruptible transitions, GPU performance).
  - `review-animations`: Strict auditor for motion code against craft standards and easing slop.
  - `improve-animations`: Full-codebase motion audit and prioritized execution plans.
  - `find-animation-opportunities`: Read-only UI analysis for natural motion injection opportunities.
  - `apple-design`: Fluid physical motion, spring dynamics, materials, depth, and spatial consistency.
  - `animation-vocabulary`: Reverse glossary translating motion descriptions into exact terminology.
  - `pick-ui-library`: Opinionated UI library selection for specialized interactive components.
  - `emil-prototype`: Multi-variant UI divergence with a live visual switcher.
  - `taste-skill`: Anti-slop frontend design system and aesthetic standards.
- **Codebase Memory Index & Gated Inspection Engine (`/agentmemory`, `/repomix`, `/context7`)**:
  - **Status**: Implemented & Updated (v1.2.0)
  - **Details**: Enforces zero-tool fast bypass on non-codebase queries and a deterministic tiered inspection pipeline on repo inquiries. Includes streaming $O(1)$ RAM parser (`ingest_repomix.py`) extracting 5,835 exported symbols across 196 files into an instant $O(1)$ dictionary (`symbols_manifest.json`). Implements structured episodic memory store (`.agents/memory/agent_memory.json` & `query_memory.py`) holding 12 domain invariants (temporal continuity, 4GB VRAM limits, Kokoro 24kHz PCM_16 standard, Demucs bypass pass-through, atomic ASR checkpointing, downstream defensive duration clamping, translation transcript persistence, stems manifest rehydration, scalable FFmpeg filtergraph scripts), 13 bug resolution traces, and clean code patterns.
  - **Modules**: `.agents/scripts/ingest_repomix.py`, `.agents/memory/agent_memory.json`, `.agents/memory/query_memory.py`, `.agents/skills/agentmemory/SKILL.md`, `.agents/rules/codebase-indexing.md`, `.agents/rules/session-init.md`, `.agents/memory/symbols_manifest.json`, `.agents/memory/.indexed_hash`.
  - **Verification**: `python .agents/scripts/ingest_repomix.py --local` regenerated 5,835 symbols; `python .agents/memory/query_memory.py "hindi"` and `query_memory.py "stems"` verified.

- **Voice Director Audio Invariant Metadata (`inv_005` - TICKET-41)**:
  - **Status**: Implemented & Verified
  - **Details**: Updated `AGENT_NODES` in `frontend/components/studio/AgentSequenceTrack.tsx` to align with the core system audio invariant (`inv_005` / Kokoro-82M 24kHz PCM_16 standard). Voice Director card configures `techStack: 'Kokoro-82M / Edge-TTS Fallback'`, `outputDesc: 'Raw Synthesized Speech Stems (.wav 24kHz PCM_16)'`, and renders `footerLeft: '24kHz PCM_16'` badge in the DOM. Added defensive prop defaults (`crewStatuses = {}`, `retries = {}`, `telemetryEvents = []`) and safe array iteration guards.
  - **Modules**: `frontend/components/studio/AgentSequenceTrack.tsx`, `frontend/__tests__/AgentSequenceTrack.test.tsx`.
  - **Verification**: Vitest (`frontend/__tests__/AgentSequenceTrack.test.tsx`: 2/2 passed, full frontend suite 123/123 passed across 22 test files).

- **2-Row Boustrophedon Serpentine Grid Layout & SVG Turn Conduit (TICKET-42)**:
  - **Status**: Implemented & Verified
  - **Details**: Refactored `AgentSequenceTrack.tsx` from a flat grid into a 2-row serpentine boustrophedon sequence track. Row 1 renders left-to-right (`story_analyst` -> `localization_director` -> `voice_director`) with `ArrowRight` connectors. The track features an animated downward SVG turn conduit (`data-testid="serpentine-turn-conduit"`) labeled `"Handoff to Audio Stems ⤵"`, connecting Step 03 to Step 04. Row 2 renders right-to-left (`sync_engineer` -> `subtitle_director` -> `qa_agent`) with reverse `ArrowLeft` connectors. Follows the Light-Blue Mintlify design system with `rounded-[4px]` badges and `rounded-[16px]` card surfaces.
  - **Modules**: `frontend/components/studio/AgentSequenceTrack.tsx`, `frontend/__tests__/AgentSequenceTrack.test.tsx`.
  - **Verification**: Vitest (`frontend/__tests__/AgentSequenceTrack.test.tsx`: 4/4 passed; full frontend suite 125/125 passed across 22 test files).

- **Parent Invocation Boundary & Interface Compatibility — `AgentSequenceTrackProps` 9-Prop Contract (TICKET-43)**:
  - **Status**: Implemented & Verified
  - **Details**: Both parent call sites now pass all 9 props from `AgentSequenceTrackProps` to `AgentSequenceTrack` with zero breaking changes. `frontend/app/runs/demo/page.tsx` added the missing `videoDurationSeconds={TOTAL_DEMO_SECONDS}` and `projectMode="A"` props. `frontend/app/runs/[id]/page.tsx` added `const [selectedAgent, setSelectedAgent] = useState<AgentName>('story_analyst')` state and wired `selectedAgent` + `onSelectAgent` into the call site — enabling live run agent card selection to lift state up to telemetry inspection panels (`DecisionFeed`, `ProducerBoard`). 5 new Vitest assertions cover: full 9-prop render (zero-breaking-change contract), `onSelectAgent` lift on card click, Mode C agent filtering, selection ring CSS, and live `stageProgressMap` rerender stability.
  - **Modules**: `frontend/app/runs/demo/page.tsx`, `frontend/app/runs/[id]/page.tsx`, `frontend/__tests__/AgentSequenceTrack.test.tsx`.
  - **Verification**: Vitest (`AgentSequenceTrack.test.tsx`: 9/9 passed; full frontend suite 130/130 passed across 22 test files).

- **Serpentine Track Unit Test Suite — Mode B Coverage & Spline Assertions (TICKET-44)**:
  - **Status**: Implemented & Verified
  - **Details**: Added 4 targeted tests to `frontend/__tests__/AgentSequenceTrack.test.tsx`: (1) all-6-agent-cards + `data-testid="serpentine-turn-conduit"` present in Mode B, (2) `inv_005` 24kHz PCM_16 badge visible in Mode B, (3) `onSelectAgent` fires with `'story_analyst'` on card click, (4) `getOrganicProgress` spline clamps at 0 and 1 with monotone interior. Ponytail: zero new files, zero new deps — shortest append-only diff.
  - **Modules**: `frontend/__tests__/AgentSequenceTrack.test.tsx`.
  - **Verification**: Vitest 13/13 passed in 499ms (<2s acceptance criterion).

- **SenseVoice-Small (FunASR) + Faster-Whisper Hybrid ASR & Acoustic Intelligence (Planned Upgrade)**:
  - **Status**: Architectural Specification Complete (`Docs/SENSEVOICE_FUNASR_HYBRID_INTEGRATION_REPORT.md`)
  - **Details**: Dual-engine integration combining Alibaba FunASR `SenseVoice-Small` (234M params, ~600MB VRAM, 15x-25x real-time speed) with `Faster-Whisper` (`large-v3-turbo`). Emits real-time Speech Emotion Recognition (`<|HAPPY|>`, `<|SAD|>`, `<|ANGRY|>`, `<|FEARFUL|>`) and Acoustic Event Detection (`<|LAUGHTER|>`, `<|CRY|>`, `<|COUGH|>`, `<|APPLAUSE|>`) directly from actor audio. Injects emotional cues into `StoryAnalystAgent` and `VoiceDirectorAgent` for expressive TTS style matching, and formats dialogue reactions into broadcast subtitle tracks (`Mode C`).
  - **Modules**: `Docs/SENSEVOICE_FUNASR_HYBRID_INTEGRATION_REPORT.md`, `backend/app/engine/stages/transcription.py`, `backend/app/engine/subtitle_formatter.py`.
  - **Verification**: Architectural specification & VRAM sizing on GTX 1050 Ti verified.

- **Mode C Festival Subtitle Master Adaptive Stage Routing & Completion (TICKET-43)**:
  - **Status**: Implemented & Verified
  - **Details**: In `backend/app/api/runs.py` and `frontend/components/studio/WorkbenchCard.tsx`, Mode C (`project_mode == "C"` / `subtitle_only == True`) dynamically configures the exact pipeline stages needed based on source and target languages. For same-language runs (`source_language == target_language`, e.g. `en == en`), `TranscriptionStage` produces full subtitles and transcripts directly, so the pipeline configures `['extraction', 'denoise', 'transcription']` and completes immediately after transcription, skipping translation and deliverable remux steps. For cross-language runs (`source_language != target_language`, e.g. `!en -> en`), it configures `['extraction', 'denoise', 'transcription', 'translation']` and completes immediately after translation, skipping all subsequent audio dubbing steps (`tts`, `duration_align`, `remix`, `remux`).
  - **Modules**: `backend/app/api/runs.py`, `frontend/components/studio/WorkbenchCard.tsx`, `backend/tests/test_mode_c_pipeline.py`.
  - **Verification**: `pytest backend/tests/test_mode_c_pipeline.py` (3/3 passed), full backend suite (144/144 passed), and frontend suite (121/121 passed).

- **Translation Stage Disk Persistence & Multi-Language Manifests (TICKET-32)**:
  - **Status**: Implemented & Verified
  - **Details**: `TranslationStage` atomically persists sanitized dialogue segments with `translated_text` into `transcript.json` (active hot state pointer) and `transcript_{target_lang}.json` (immutable multi-language audit deliverable). Utilizes a 4-line standard library helper `_atomic_write_json` with `.tmp.json` + `os.replace` (`MoveFileExW`) to eliminate partial-write race conditions and Windows `[WinError 32]` file-lock crashes. Guarantees 100% UTF-8 Devanagari script preservation (`ensure_ascii=False`) and incorporates defensive `run_dir.mkdir(parents=True, exist_ok=True)` guards.
  - **Modules**: `backend/app/engine/stages/translation.py`, `backend/tests/test_translation_persistence.py`.
  - **Verification**: `pytest backend/tests/test_translation_persistence.py` (3/3 passed).

- **Voice Director Timeline Preservation & Stems Manifest (TICKET-33)**:
  - **Status**: Implemented & Verified
  - **Details**: `VoiceDirectorAgent` and `TTSStage` preserve exact dialogue segment timing boundaries (`start_s`, `end_s`, `target_duration_s`) with defensive timestamp clamping (`max(start_s + 0.1, end_s)`), integer `segment_id` coercion, and standard 3-decimal float rounding. `TTSStage` atomically writes `stems.json` to the active `run_dir` via `_atomic_write_json()` (`.tmp.json` + `os.replace`), providing disk-backed stem persistence and eliminating downstream audio desync during multi-stage execution and targeted retries.
  - **Modules**: `backend/app/agents/voice_director.py`, `backend/app/engine/stages/tts.py`, `backend/tests/test_tts_stems_manifest.py`.
  - **Verification**: `pytest backend/tests/test_tts_stems_manifest.py` (3/3 passed in 1.92s).

- **Executor State Rehydration & Single-Flight Stage Mutex (TICKET-34)**:
  - **Status**: Implemented & Verified
  - **Details**: `RunExecutor` rehydrates in-memory stage artifacts from disk manifests (`stems.json`, `transcript.json`) and disk directories (`stems/seg_*.wav`, `aligned/aligned_seg_*.wav`) via `_rehydrate_disk_artifacts()`. Stems are matched strictly by `segment_id` map lookup (`seg_map[seg_id]`) extracted via regex (`re.search(r"seg_(\d+)", sf.stem)`), preventing timeline desynchronization when segments are filtered. Implements class-level single-flight mutex locking (`_active_stage_locks: Dict[str, asyncio.Lock]`) with `cleanup_stage_locks()` on run termination, serializing concurrent duplicate stage retry requests and eliminating Windows `[WinError 32]` file access collisions.
  - **Modules**: `backend/app/engine/executor.py`, `backend/tests/test_executor_rehydration.py`.
  - **Verification**: `pytest backend/tests/test_executor_rehydration.py` (5/5 passed in 0.87s) and full chain regression (27/27 passed).

- **Scalable Filtergraph Script Generation & Windows 8k-Buffer Defense (TICKET-35)**:
  - **Status**: Implemented & Verified
  - **Details**: `AcousticMasteringEngine.composite_dialogue_bus` passes FFmpeg multitrack compositing filtergraphs via `-filter_complex_script` written to isolated temporary files (`.filtergraph_{uuid}.tmp.txt`), eliminating Windows `CreateProcess` 8,191-character command-line buffer overflow crashes (`[WinError 206]`) when compositing 150+ stems. Features strict UTF-8 with `newline="\n"` formatting to defend against Windows CRLF parser errors, defensive stem file validation filtering out non-existent or zero-byte audio stems, a 1.0s silence generator fallback, and deterministic `try ... finally` script file deletion.
  - **Modules**: `backend/app/engine/stages/mixer.py`, `backend/tests/test_scalable_filtergraph.py`, `backend/tests/test_acoustic_mixer.py`.
  - **Verification**: `pytest backend/tests/test_scalable_filtergraph.py` (150-stem scale test passed), `pytest backend/tests/test_acoustic_mixer.py` (10/10 passed), and targeted integration suites (26/26 passed).

- **Hierarchical Batching for Stem Compositing & Windows Command Buffer Fix (TICKET-42)**:
  - **Status**: Implemented & Verified
  - **Details**: `AcousticMasteringEngine.composite_dialogue_bus` (`backend/app/engine/stages/mixer.py`) implements hierarchical stem batching (slices of $\le 35$ stems per sub-invocation). While `-filter_complex_script` solved the filtergraph string limit, large runs with 200–500+ stems on Windows exceeded the 32,767-character `CreateProcess` command-line limit due to hundreds of `-i <long_path>` arguments. Batched compositing generates intermediate `.temp_bus_chunk_*.wav` stems that are recursively mixed down via `amix=inputs=N:duration=longest`, keeping command lengths under $\sim 4.5$ KB per execution and cleanly handling arbitrary stem counts without `[WinError 206]`.
  - **Modules**: `backend/app/engine/stages/mixer.py`, `backend/tests/test_scalable_filtergraph.py`, `backend/tests/test_acoustic_mixer.py`.
  - **Verification**: `pytest backend/tests/test_scalable_filtergraph.py` (2/2 passed including 350-stem scale test with deep paths in 2.92s).

- **Deliverables Subtitle Packaging & On-the-Fly Generation (TICKET-41)**:
  - **Status**: Implemented & Verified
  - **Details**: `BroadcastDeliverablesExporter` (`backend/app/engine/stages/exporter.py`) and `GET /api/v1/runs/{run_id}/deliverables` (`backend/app/api/deliverables.py`) implement robust multi-candidate subtitle discovery (`subtitles_{target_lang}.srt`, `subtitles.srt`, `subtitles_en.srt`) and automatic on-the-fly subtitle generation. If `.srt`/`.vtt` are missing from the run artifacts when packaging deliverables, but `transcript.json` exists in `run_dir`, the exporter immediately formats and writes `subtitles.srt` and `subtitles.vtt` to disk, packaging them into `deliverables/` and `deliverables.json`.
  - **Modules**: `backend/app/engine/stages/exporter.py`, `backend/app/api/deliverables.py`, `backend/app/engine/stages/transcription.py`, `backend/app/engine/stages/translation.py`.
  - **Verification**: `pytest backend/tests/test_deliverables_exporter.py` (3/3 passed); verified against run `Santana_Ayo_-_Leaving_Ladies_Nig_37c72f` producing 14KB `subtitles.srt` and `subtitles.vtt` in `deliverables/`.

- **ASR Overlapping Speech Sensitivity & Faster-Whisper Large-v3-Turbo Default (TICKET-39 & TICKET-40)**:
  - **Status**: Implemented & Verified
  - **Details**: Default ASR model upgraded to `large-v3-turbo` in int8 on CTranslate2 (~1.3GB VRAM footprint on GTX 1050 Ti). Relaxed Silero VAD parameters (`threshold=0.30`, `min_speech_duration_ms=150`, `min_silence_duration_ms=250`, `speech_pad_ms=200`) and Whisper thresholds (`no_speech_threshold=0.85`, `log_prob_threshold=-1.5`, `temperature=[0.0, 0.2, 0.4]`) to capture rapid overlapping dialogue. `subtitle_formatter.py` stacks simultaneous multi-speaker dialogue turns with broadcast `- ` dashes under `max_chars_per_line=42`.
  - **Modules**: `backend/app/engine/stages/transcription.py`, `backend/app/engine/subtitle_formatter.py`, `backend/tests/test_transcription_overlap_vad.py`, `backend/tests/test_subtitle_stacking.py`.
  - **Verification**: `pytest backend/tests/test_transcription_overlap_vad.py backend/tests/test_subtitle_stacking.py` (8/8 passed).

- **Custom Run Slug Generation & Human-Readable Storage Directories (TICKET-37)**:
  - **Status**: Implemented & Verified
  - **Details**: `generate_run_slug` in `backend/app/api/runs.py` replaces raw generic UUIDs with human-readable slugs `{clean_filename_stem}_{6char_uuid}` (e.g., `trial1_a1b2c3`). Sanitizes filename stems against special characters, deduplicates and strips underscores, bounds stems to 32 characters for Windows `MAX_PATH` safety, and falls back to safe NTFS timestamp strings (`22_tuesday_september_10_45pm_a1b2c3`, zero colons) on empty or non-Latin inputs. `create_run` endpoint validates clip existence with HTTP 404 guards and guarantees uniqueness via database candidate checks.
  - **Modules**: `backend/app/api/runs.py`, `backend/tests/test_run_slug.py`.
  - **Verification**: `pytest backend/tests/test_run_slug.py` (6/6 passed) and full test suite passing (132/132).

- **English-to-English Translation Skip & Preview Stream Security Hardening (TICKET-38)**:
  - **Status**: Implemented & Verified
  - **Details**: When `source_lang == target_lang` (e.g. English-to-English), `TranslationStage` bypasses external Ollama LLM requests by default, directly generating synchronized subtitle tracks (`subtitles_en.srt`, `subtitles_en.vtt`) and `transcript.json` from transcription segments with zero latency hang. Emits a `PROMPT` log event allowing clients to checkpoint or force colloquial rephrasing via `force_ollama_translation=True`. Isolates batch translation maps per candidate model in `_call_ollama_translation()` to prevent cross-model state contamination on partial failures. Hardens `/api/v1/clips/preview-stream` by strictly restricting path roots to `settings.STORAGE_DIR` and allowed media extensions (`.mp4`, `.mov`, `.webm`, `.mkv`, `.mp3`, `.wav`, `.vtt`, `.srt`), blocking arbitrary file disclosure.
  - **Modules**: `backend/app/engine/stages/translation.py`, `backend/app/api/clips.py`, `backend/tests/test_translation_multilingual.py`, `backend/tests/test_clip_streaming.py`.
  - **Verification**: `pytest backend/tests/test_translation_multilingual.py backend/tests/test_clip_streaming.py` (9/9 passed).




- **Multilingual Translation Engine & Multitrack Audio Duration Preservation (TICKET-30)**:
  - **Status**: Implemented & Verified
  - **Details**: Full multilingual translation and subtitle pipeline supporting English, Hindi, Spanish, and Japanese (`en➔hi`, `es➔en➔hi`, `ja➔en➔hi`, `hi➔en➔ja`). Connected `TranslationStage` to Ollama LLM endpoint with automatic intermediate English pivot for foreign-to-foreign audio translation. Fixed FFmpeg multitrack audio duration truncation by enforcing `duration=longest` in `composite_dialogue_bus` and `duration=first` in `apply_sidechain_ducking`, ensuring mastered audio and multiplexed release video preserve the full 20.4-minute media length. Added language code alias normalization (`"jp" ➔ "ja"`, `"sp" ➔ "es"`).
  - **Modules**: `backend/app/engine/stages/translation.py`, `backend/app/engine/stages/mixer.py`, `backend/app/core/languages.py`.
  - **Verification**: `pytest backend/tests/test_translation_multilingual.py`, `pytest backend/tests/test_acoustic_mixer.py`, and `pytest backend/tests/` (114/114 tests passed).

- **Centralized Language & Voice Persona Registry (TICKET-24)**:
  - **Status**: Implemented & Verified
  - **Details**: Single authoritative registry (`backend/app/core/languages.py`) centralizing ISO 639-1 language specifications, Kokoro 1-character codes (`'a'`, `'e'`, `'f'`, `'h'`, `'j'`, `'z'`), Kokoro style voices (`af_heart`, `am_adam`, `ef_dora`, `hm_omega`), and Microsoft Edge-TTS fallback personas. Features `resolve_language()` which normalizes compound tags (`"hi-IN"` -> `"hi"`, `"es_ES"` -> `"es"`), gracefully defaults unknown tags to English (`en`), and explicitly flags German (`de`) with `kokoro_lang_code=None` for clean Edge fallback without phonemization overhead. Built with `/ponytail` (YAGNI, minimal, zero boilerplate, leveraging immutable `LanguageSpec` from `app.core.tts_contracts`).
  - **Modules**: `backend/app/core/languages.py`, `backend/app/core/tts_contracts.py`.
  - **Verification**: `pytest backend/tests/test_languages.py` (4/4 tests passed in 0.20s).

- **Hardened Kokoro-82M Neural TTS Adapter (TICKET-25)**:
  - **Status**: Implemented & Verified
  - **Details**: Neural speech synthesis adapter (`backend/app/agents/voice_director.py`) solving multi-sentence generator truncation (`np.concatenate`), zero-frame punctuation pause crashes (`re.search(r'\w')` silence generator), Windows atomic `.tmp.wav` file-locking safety, 24kHz PCM_16 WAV standard compliance, and graceful exception/language degradation to `EdgeTTSAdapter`.
  - **Modules**: `backend/app/agents/voice_director.py`.
  - **Verification**: `pytest backend/tests/test_voice_director.py` (13/13 tests passed in 15.16s).

- **TTS Stage, RunExecutor Override & GPU Mutex Wiring (TICKET-26)**:
  - **Status**: Implemented & Verified
  - **Details**: Full pipeline pass-through for `tts_adapter` defaulting to `"kokoro"`. Implements `sanitize_tts_adapter()` enforcing whitelist `{"kokoro", "edge_tts", "mock"}` against `null` or invalid payloads. Dynamically calculates `gpu_required = (adapter == "kokoro" and torch.cuda.is_available())` during `TTSStage` initialization in `RunExecutor` to serialize against Faster-Whisper and Demucs on Pascal 4GB GPUs via `gpu_lock`.
  - **Modules**: `backend/app/engine/stages/tts.py`, `backend/app/engine/executor.py`, `backend/app/api/runs.py`.
  - **Verification**: `pytest backend/tests/test_dubbing_stages_chain.py` (16/16 tests passed), Full suite (101/101 tests passed).

- **Downstream Audio Seams & Acoustic QA Verification (TICKET-27)**:
  - **Status**: Implemented & Verified
  - **Details**: Validates end-to-end integration of 24,000 Hz 16-bit PCM WAV stems across downstream stages without sample-rate conversion errors or clipping false-positives. Verifies `qa_agent.py` (`check_audio_clipping`) correctly parses 24kHz PCM_16 samples with amplitude bounds ($0.79 \le \text{peak} \le 0.81$ unclipped vs $\ge 0.999$ clipped). Incorporates adversarial zero-division defenses in `duration_align.py` and `sync_engineer.py` (`max(0.1, duration)`), and validates `DurationAlignStage` (`atempo` speed reconciliation) and `MasteringStage` (`amix`, `adelay`, and EBU R128 -24 LUFS loudness mastering) producing standard release soundtracks.
  - **Modules**: `backend/app/agents/qa_agent.py`, `backend/app/engine/stages/duration_align.py`, `backend/app/agents/sync_engineer.py`, `backend/app/engine/stages/mixer.py`.
  - **Verification**: `pytest backend/tests/test_qa_agent.py backend/tests/test_downstream_audio_seams.py` (9/9 passed).

- **Kokoro TTS Automated Test Harness & CI Gatekeeper (TICKET-28)**:
  - **Status**: Implemented & Verified
  - **Details**: Established a 100% offline, fast (<1.5s runtime SLA) test suite in `backend/tests/test_voice_director.py` verifying `VoiceDirectorAgent` and `KokoroTTSAdapter`. Validates multi-sentence chunk aggregation, non-lexical/whitespace pause silence generation, unsupported language degradation to `EdgeTTSAdapter`, and runtime exception recovery without requiring live GPU hardware or Hugging Face downloads.
  - **Modules**: `backend/app/agents/voice_director.py`, `backend/tests/test_voice_director.py`.
  - **Verification**: `pytest backend/tests/test_voice_director.py` (9/9 passed in <1.5s).


---

### Hardware-Accelerated Spring Physics & Animation Gating (`/find-animation-opportunities`, `/animate`)
- **Status**: Implemented
- **Details**: Rigorously gated animation opportunities using Emil Kowalski's motion framework. Implemented hardware-accelerated spring physics (`.btn-spring` with `:active { transform: scale(0.97); }`, `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`, and `will-change: transform`), GPU-composited waveform stem level adjustments (`transform-origin: left center` with `scaleX`), sliding segmented indicator transitions (`.segmented-slider`), and interruptible cinema video scrubbing without layout thrashing. Enforces strict `@media (prefers-reduced-motion: reduce)` accessibility fallback and `@media (hover: hover) and (pointer: fine)` touch gating. Deliberately rejected motion on high-frequency log streams and raw data counters to prevent cognitive fatigue.
- **Modules**: `frontend/app/globals.css`, `mockup.html`, `mockup_v2.html`
- **Verification**: Full Vitest test suite (`npm --prefix frontend test`: 19 / 19 test files passed, 100 / 100 tests passed, 100%).

### Frontend Dubbing Timeline & Dynamic Video/Stem Player Integration
- **Status**: Implemented & Verified (100%)
- **Details**: Wires live pipeline deliverables (`GET /api/v1/runs/{id}/deliverables`) into the Frontend Run Console (`frontend/app/runs/[id]/page.tsx`). Constructs dynamic `AudioTrackOption[]` mapping `release_video_mp4`, `mastered_soundtrack_wav`, `subtitles_vtt`, and `subtitles_srt` served over HTTP 206 partial content streaming (`/api/v1/clips/preview-stream`), replacing hardcoded demo clips in `MultiAudioPlayer`. Converts `BeforeAfterPlayer.tsx` from a static UI into an active HTML5 stem player supporting continuous timestamp preservation (`currentTime` continuity) across Master, Isolated Dialogue, and Background stems. Updates pipeline stage timeline with GPU badging for `tts` (Kokoro neural engine) alongside `denoise`, `transcription`, and `translation`.
- **Modules**: `frontend/app/runs/[id]/page.tsx`, `frontend/components/studio/BeforeAfterPlayer.tsx`, `frontend/components/video/MultiAudioPlayer.tsx`
- **Verification**: `npm --prefix frontend test` (19/19 files, 100/100 tests passed) & Pytest test suite (82/82 tests passed).

### Predictive Duration Engine & Multi-Device Log Synchronizer
- **Status**: Implemented
- **Details**: Dynamically calibrates expected pipeline stage durations based on input video length ($D$) and engine mode (Mode A, B, C). Emits Hermite S-curve progress ($0\% \rightarrow 90\%$) and asymptotic deceleration ($90\% \rightarrow 98.5\%$) during processing overruns with anxiety-reducing contextual status text. Integrates zero-bloat run-length duplicate log bundling with Raycast-style multiplier badges (`×4`) and multi-device WebSocket connectivity (`NEXT_PUBLIC_WS_URL`).
- **Modules**: `frontend/lib/hooks/useStageProgress.ts`, `frontend/components/studio/AgentSequenceTrack.tsx`, `frontend/app/runs/[id]/page.tsx`
- **Verification**: `frontend/__tests__/stage_progress_and_logs.test.tsx` (100% passed).

---

## 1. Execution Layer (Inherited Scaffold)

### Audio Extraction
- **Status**: Implemented
- **Details**: Uses `ffmpeg` to extract mono/stereo 16kHz WAV from MP4/MKV video containers.
- **Modules**: `backend/app/engine/stages/extraction.py`
- **Verification**: Verified on sample videos.

### Audio Routing & Direct Pass-Through (DenoiseStage)
- **Status**: Implemented & Verified
- **Details**: Decommissioned heavy Demucs neural stem separation overhead. Extracted 16kHz mono audio is routed directly into vocals and background audio stems with zero GPU VRAM allocation and sub-50ms execution speed, freeing ~1.8GB VRAM and eliminating startup delays.
- **Modules**: `backend/app/engine/stages/denoise.py`
- **Verification**: `backend/tests/test_denoise_passthrough.py`

### Resumable Chunked ASR Speech Transcription (Faster-Whisper Large-v3-Turbo & Overlap VAD)
- **Status**: Implemented & Verified
- **Details**: Standardized on `faster-whisper` `large-v3-turbo` (int8 CTranslate2) with relaxed Silero VAD filtering (`threshold=0.30`, `min_speech_duration_ms=150`, `no_speech_threshold=0.85`, `logprob_threshold=-1.5`, `temperature=[0.0, 0.2, 0.4]`), integrated with `AudioChunker` for windowed audio slicing (~60s chunks). Eliminates missing/dropped overlapping speech during multi-speaker crosstalk, runs in ~1.3GB VRAM on GTX 1050 Ti (4GB), and features persistent incremental checkpointing (`transcription_checkpoint.json`) written atomically (`.tmp.json` + `os.replace`) after every completed chunk.
- **Modules**: `backend/app/engine/stages/transcription.py`, `backend/app/engine/audio_chunker.py`
- **Verification**: `backend/tests/test_transcription_overlap_vad.py`, `backend/tests/test_transcription_checkpointing.py` (140/140 full backend suite passed).

### Subtitle Formatting & Multi-Speaker Dialogue Stacking
- **Status**: Implemented & Verified
- **Details**: End-to-end subtitle generation verified on full-length media files (audio extraction -> direct pass-through -> Faster-Whisper Turbo ASR -> Translation -> Subtitle Director .srt/.vtt formatting). Includes broadcast multi-speaker dialogue stacking (`- Person 1\n- Person 2`), deduplication, minimum gap enforcement (100ms), minimum duration (1.0s), max characters per line (42 chars), max characters per second (17.0 CPS), and live log streaming to the frontend console.
- **Modules**: `backend/app/engine/subtitle_formatter.py`, `backend/app/engine/stages/translation.py`, `backend/app/agents/subtitle_director.py`
- **Verification**: `backend/tests/test_subtitle_stacking.py`, `backend/tests/test_subtitle_formatter.py` (140/140 passed).

### Subtitle Fine-Tuning & Screenplay Dataset Pipeline (Unsloth richardyoung/qwen2.5-3b-instruct-abliterated)
- **Status**: Implemented & Verified
- **Details**: Dedicated dataset preprocessing and fine-tuning suite to adapt `richardyoung/qwen2.5-3b-instruct-abliterated` (refusal-free / uncensored Qwen 2.5 3B) for cinematic scriptwriting, dialogue completion, and movie-grade subtitle generation without censorship refusals. Includes:
  1. `scripts/srt_to_jsonl.py`: Pure-Python zero-dependency SRT parser, Humanizer text cleaner (strips disfluencies, collapses stutters, normalizes punctuation), hybrid character attribution (CSV line-range overrides, global `character_config.json` filename aliases, and silence-gap heuristic diarization), and sliding-window ChatML chunking preserving file-level narrative context (`sub1/chunk_0`, `sub1/chunk_1`...).
  2. `scripts/assign_roles.py`: Interactive and template-based character role assigner tool that generates `data/subtitles/character_config.json` and previews dialogue turns per speaker.
  3. `scripts/auto_name_characters.py`: Automatic character role assigner script supporting `--mode sequential` (Subtitle 1 gets `[SPEAKER_A, SPEAKER_B]`, Subtitle 2 gets `[SPEAKER_C, SPEAKER_D]`, etc.), `--mode filename` (extracts actor/character names from title), and `--mode hybrid`.
  4. `scripts/validate_jsonl.py`: Line-by-line JSON validator, token distribution calculator (flags > 2048), character dialogue breakdown, and GO/WARN/STOP readiness verdict.
  4. `notebooks/finetune_qwen25_3b_subtitles.ipynb` / `.py`: Google Colab training notebook targeting free-tier Tesla T4 GPU (4-bit QLoRA, rank=32, packing=True, 8-bit AdamW, pre-training dataset health dashboard, inference preview, and GGUF Q4_K_M export).
  5. `scripts/Modelfile.subtitles`: Ollama modelfile with 100% GPU offloading (`num_gpu 99`), anti-repetition penalties (`1.22`), and 2048 context length optimized for GTX 1050 Ti (4GB VRAM).
- **Modules**: `scripts/srt_to_jsonl.py`, `scripts/assign_roles.py`, `scripts/validate_jsonl.py`, `notebooks/finetune_qwen25_3b_subtitles.ipynb`, `scripts/Modelfile.subtitles`
- **Verification**: Verified on real subtitle collection (27 files, 9,699 lines, 2,430 training chunks) with 0 errors, eliminating numeric character artifacts and testing role assignment with `JAZMINE` and `DEREK`.

### Full Voice Dubbing Pipeline (Mode A & Mode B)
- **Status**: Implemented & Operational
- **Details**: Full 8-stage autonomous dubbing pipeline (`extraction` -> `denoise` -> `transcription` -> `translation` -> `tts` -> `duration_align` -> `remix` -> `remux`) registered in `RunExecutor.STAGE_CLASSES`. Connects `VoiceDirectorAgent` (EdgeTTS 300+ Microsoft neural voices with MockAudio fallback), `DurationAlignStage` (FFmpeg atempo duration reconciliation), `MasteringStage` (dialogue bus compositing, dynamic -6dB sidechain ducking, EBU R128 -24 LUFS loudness mastering), and `RemuxStage` (lossless stream copy MP4 multiplexing and deliverables manifest).
- **Modules**: `backend/app/engine/stages/tts.py`, `backend/app/engine/stages/duration_align.py`, `backend/app/engine/stages/mixer.py`, `backend/app/engine/stages/exporter.py`, `backend/app/engine/executor.py`, `backend/app/api/runs.py`
- **Verification**: `backend/tests/test_dubbing_stages_chain.py`

### Acoustic Mastering Engine (TICKET-13)
- **Status**: Implemented
- **Details**: Collapses timeline positioning via `adelay`, multitrack compositing into a dialogue bus via `amix`, dynamic sidechain compression ducking background M&E by `-6.0 dB` with smooth 20ms attack / 250ms release, and EBU R128 (`loudnorm=I=-24.0:LRA=7.0:TP=-2.0`) broadcast loudness mastering into a unified engine.
- **Modules**: `backend/app/engine/stages/mixer.py`
- **Verification**: `backend/tests/test_acoustic_mixer.py` (10/10 tests passed).

---

## 2. Autonomous Agent Crew Layer (`LOCALIZE_AGENT_BUILD_BRIEF.md`)

### Section 6 Event Schema & Telemetry Shim (TICKET-01)
- **Status**: Implemented
- **Details**: Full Section 6 JSON event schema (`job_id`, `scene_id`, `agent`, `action`, `decision`, `latency_ms`, `retry_count`, `quality_score`, `status`, `timestamp`), async event logging to JSONL files, in-memory aggregation with average latency, retry counts, defect counts, and TypeScript validation + summary utilities.
- **Modules**: `backend/app/telemetry/events.py`, `frontend/lib/telemetry.ts`
- **Verification**: Vitest (`frontend/__tests__/telemetry.test.ts`: 3 tests passed), Pytest (`backend/tests/test_telemetry.py`: 2 tests passed).

### Story Analyst Agent & Pluggable Diarization Adapter (TICKET-02 & TICKET-18)
- **Status**: Implemented
- **Details**: Extracts character speaker attribution, scene boundaries, emotional tone tags (e.g. urgent, warning, inquisitive), and cultural idiom flags from raw transcripts. Features pluggable `DiarizationAdapter` architecture supporting `HeuristicDiarizationAdapter` (zero-dependency, rule/text-based speaker mapping with custom `speaker_overrides` support) and `PyAnnoteDiarizationAdapter` (acoustic embedding clustering with fallback). Emits `adapter_used` in Section 6 telemetry events.
- **Modules**: `backend/app/agents/story_analyst.py`, `frontend/lib/agents/story_analyst.ts`
- **Verification**: Vitest (`frontend/__tests__/story_analyst.test.ts`: 3 tests passed), Pytest (`backend/tests/test_diarization_adapter.py`: 4 tests passed, `backend/tests/test_story_analyst.py`: 1 test passed, 71/71 full backend suite passed).

### Localization Director Agent & Isometric Dialogue Engine (TICKET-03 & TICKET-11)
- **Status**: Implemented
- **Details**: Character-consistent and culturally adapted script localization with required translation rationale per line. Features full **Isometric Dialogue Engine** enforcing rhythmic syllable budgets ($S_{target} \approx \Delta t \times 3.2$, $S_{max} \approx \Delta t \times 3.6$), language-aware heuristic syllable estimation across English, Spanish, French, German, and Hindi Devanagari aksharas, quantitative rework reduction delta handling during targeted retries, and overall isochrony compliance scoring (0–100).
- **Modules**: `backend/app/agents/localization_director.py`, `frontend/lib/agents/localization_director.ts`
- **Verification**: Vitest (`frontend/__tests__/localization_director.test.ts`: 5 tests passed), Pytest (`backend/tests/test_localization_director.py`: 4 tests passed).

### Voice Director Agent & Pluggable Speech Synthesis Adapter (TICKET-04 & TICKET-12)
- **Status**: Implemented (EdgeTTS & MockAudio) | **Ready to Implement (TDD Tickets Specified)**: Kokoro-82M & Centralized Language Registry (`Docs/tickets/TICKET-24` through `TICKET-28`)
- **Details**: Assigns language and gender-appropriate neural voices per character, synthesizes per-segment speech audio stems with exact durations, and logs telemetry decisions. Employs a pluggable `SpeechSynthesisAdapter` architecture featuring `EdgeTTSAdapter` for live 300+ Microsoft neural voices with FFmpeg PCM 16kHz transcoding, `MockAudioAdapter` for instant deterministic test isolation, and production-hardened specification for `KokoroTTSAdapter` (StyleTTS 2 / 24kHz PCM_16 uncompressed audio, chunk aggregation, pause silence generator, Windows file-lock defense, and centralized language registry).
- **Modules**: `backend/app/agents/voice_director.py`, `backend/app/core/languages.py`, `Docs/tickets/TICKET-24-centralized-language-registry.md` through `TICKET-28-kokoro-tts-automated-test-harness.md`
- **Verification**: Vitest (`frontend/__tests__/voice_director.test.ts`: 3 tests passed), Pytest (`backend/tests/test_voice_director.py`: 4 tests passed).

### Sync Engineer Agent (TICKET-05)
- **Status**: Implemented
- **Details**: Reconciles audio duration vs dialogue windows via `ffmpeg atempo` speed factors (e.g. 1.25x), silence trimming, or timing shifts. Emits Section 6 telemetry with detailed sync rationale.
- **Modules**: `backend/app/agents/sync_engineer.py`, `frontend/lib/agents/sync_engineer.ts`
- **Verification**: Vitest (`frontend/__tests__/sync_engineer.test.ts`: 3 tests passed), Pytest (`backend/tests/test_sync_engineer.py`: 1 test passed).

### Subtitle Director Agent (TICKET-06)
- **Status**: Implemented
- **Details**: Generates synchronized SRT and WebVTT subtitle files with millisecond precision, matching Sync Engineer adjusted speech timings. Checks reading speed (CPS) and prevents subtitle drift.
- **Modules**: `backend/app/agents/subtitle_director.py`, `frontend/lib/agents/subtitle_director.ts`
- **Verification**: Vitest (`frontend/__tests__/subtitle_director.test.ts`: 3 tests passed), Pytest (`backend/tests/test_subtitle_director.py`: 1 test passed).

### QA / Continuity Agent (Hero Feature - TICKET-07 & TICKET-14)
- **Status**: Implemented
- **Details**: Autonomous reviewer evaluating assembled release candidates. Performs perceptual digital signal inspection (detecting audio clipping at 0 dBFS / $\ge 0.999$ peak amplitude), calculates exact quantitative syllable delta deficits ($\Delta S = \lceil \Delta t \times 3.2 \rceil$) for timing overflows, checks subtitle drift, scores release-readiness (0–100), and outputs structured fix proposals targeting upstream agents for deterministic self-repair.
- **Modules**: `backend/app/agents/qa_agent.py`, `frontend/lib/agents/qa_agent.ts`
- **Verification**: Vitest (`frontend/__tests__/qa_agent.test.ts`: 5 tests passed), Pytest (`backend/tests/test_qa_agent.py`: 4 tests passed).

### Director Orchestrator & Quantitative Targeted Retry Loop (TICKET-08 & TICKET-14)
- **Status**: Implemented
- **Details**: Orchestrates the multi-agent crew execution graph (Story Analyst -> Localization Director -> Voice Director -> Sync Engineer -> Subtitle Director -> QA Agent). Intercepts QA defect reports and executes closed-loop targeted retries, routing quantitative syllable delta reduction directives directly to `LocalizationDirectorAgent` (for script-level re-budgeting) and gain remediation to `VoiceDirectorAgent` (for clipping) without restarting the full pipeline, verifying automated repair.
- **Modules**: `backend/app/agents/director.py`, `frontend/lib/agents/director.ts`
- **Verification**: Vitest (`frontend/__tests__/director_orchestration.test.ts`: 3 tests passed), Pytest (`backend/tests/test_director.py`: 2 tests passed).

### Director End-to-End Pipeline Runner (TICKET-16)
- **Status**: Implemented
- **Details**: High-leverage unified interface `DirectorAgent.run_pipeline(spec: PipelineJobSpec) -> PipelineReleaseResult`. Encapsulates full lifecycle: (1) Audio extraction (16kHz WAV), (2) Vocal isolation (`use_demucs=True/False` with fast FFmpeg speech-formant fallback), (3) Faster-Whisper ASR + PyTorch CUDA VRAM cleanup (`torch.cuda.empty_cache()` / `gc.collect()`), (4) Scene-batched multi-agent crew execution (configurable batch size $\le 30$ dialogue lines/scene) with closed-loop QA self-repair and combined subtitle merging, (5) Acoustic mastering (dialogue bus compositing, -6dB background M&E sidechain ducking, EBU R128 -24 LUFS loudness mastering), and (6) Broadcast video multiplexing (`ffmpeg -c:v copy`). Full Section 6 telemetry events emitted across every phase transition.
- **Modules**: `backend/app/agents/director.py`, `frontend/lib/agents/director.ts`
- **Verification**: Pytest (`backend/tests/test_director_pipeline.py`: 5/5 passed, full backend suite 67/67 passed), Vitest (`frontend/__tests__/director_pipeline.test.ts`: 3/3 passed, full frontend suite 83/83 passed), Next.js production build (`npm run build` compiled 9/9 pages with 0 errors).

### Post-QA Acoustic Master Mixdown & Sidechain Bus Integration (TICKET-17)
- **Status**: Implemented
- **Details**: Deep method `DirectorAgent.execute_acoustic_mixdown()` coordinating timeline positioning (`adelay`), dialogue bus multitrack compositing (`amix`), dynamic `-6.0 dB` sidechain ducking against background M&E stem, and EBU R128 (`-24.0 LUFS`) broadcast loudness mastering. Guarantees mixdown executes strictly post-QA on verified and repaired stems, with graceful dialogue-only normalization when background stems are absent, and emits Section 6 telemetry events.
- **Modules**: `backend/app/agents/director.py`, `backend/app/engine/stages/mixer.py`
- **Verification**: Pytest (`backend/tests/test_director_acoustic_mixdown.py`: 4/4 passed, full backend suite 74/74 passed).

### Broadcast Video Multiplexing & Studio Deliverables Exporter (TICKET-19)
- **Status**: Implemented
- **Details**: Studio deliverables packaging and broadcast multiplexing engine (`BroadcastDeliverablesExporter`). Packages release candidate MP4 (stream-copied H.264 video with AAC 192k audio and embedded `mov_text` soft subtitles), standalone dialogue bus WAV, master composite soundtrack WAV, timed subtitle files (.srt and .vtt), and structured `deliverables.json` manifest with SHA-256 checksums, durations, and codecs. Exposes `/api/v1/runs/{id}/deliverables` REST endpoints with path traversal defenses.
- **Modules**: `backend/app/engine/stages/exporter.py`, `backend/app/api/deliverables.py`
- **Verification**: Pytest (`backend/tests/test_deliverables_exporter.py`: 3/3 passed, full backend suite 74/74 passed).

### Grafana Telemetry & MCP Integration (TICKET-09)
- **Status**: Implemented
- **Details**: Telemetry router exposing `/api/v1/telemetry/events`, `/api/v1/telemetry/summary`, and `/api/v1/telemetry/metrics` (Prometheus exposition format). `GrafanaMcpAdapter` enables the Director to query stage latency and defect percentages at runtime.
- **Modules**: `backend/app/telemetry/grafana_mcp.py`, `backend/app/api/telemetry.py`, `frontend/lib/grafana_telemetry.ts`
- **Verification**: Vitest (`frontend/__tests__/grafana_telemetry.test.ts`: 2 tests passed), Pytest (`backend/tests/test_grafana_mcp.py`: 1 test passed).

### Post-Production Studio Console UI (TICKET-10)
- **Status**: Implemented
- **Details**: Full Post-Production Studio Console with live crew status indicators, QA defect self-repair cards, release-readiness score gauge, before/after dual comparison monitor, and live Section 6 decision telemetry stream.
- **Modules**: `frontend/components/studio/`, `frontend/app/runs/[id]/page.tsx`
- **Verification**: Vitest (`frontend/__tests__/studio_console.test.tsx`: 3 tests passed).

### Ditto × Netflix Sans UI Design System & Emil Kowalski Micro-Interactions
- **Status**: Implemented
- **Details**: Full-application visual unification following `Docs/14-design.md`, `Docs/OPEN_SOURCE_COMPONENT_LIBRARIES_RESEARCH.md`, `/emil-design-eng`, `/impeccable`, and `/improve-ui`. Implements Ditto warm cream (`#f9fbf2`), soft meadow (`#eff2e5`), deep ink (`#130e30`), and hi-yellow (`#ffe228`) palette with `scale(0.97)` active press feedback, tabular numeric timing precision, and boustrophedon 2-row multi-agent pipeline routing with self-repair loops.
- **Modules**: `frontend/components/AppShell.tsx`, `frontend/components/studio/`, `frontend/app/runs/`, `frontend/app/models/`, `frontend/app/settings/`
- **Verification**: Vitest (`frontend/` 10 suites, 29 tests passed), Pytest (`backend/` 32 tests passed).


### Autonomous Multi-Agent Sequence Track & Producer Board (Ditto × Netflix Sans)
- **Status**: Implemented
- **Details**: 2-row serpentine (boustrophedon) agent execution visualizer matching Ditto palette (Warm Canvas `#f9fbf2`, Soft Meadow `#eff2e5`, Deep Ink `#130e30`, Hi-Yellow `#ffe228`, Moss Green `#59e25d`, Fuchsia `#e261e5`) and Netflix Sans typography. Features live execution latency tickers, progressive reveals, animated downward conduit between Row 1 and Row 2, targeted self-repair loop indicators across Row 2, and the executive Producer Board for broadcast delivery sign-off.
- **Modules**: `frontend/components/studio/AgentSequenceTrack.tsx`, `frontend/components/studio/ProducerBoard.tsx`, `frontend/components/studio/CrewStatus.tsx`, `frontend/app/runs/[id]/page.tsx`
- **Verification**: Vitest (`frontend/__tests__/studio_console.test.tsx`: passed), `npx tsc --noEmit` (0 errors).

### Hamburger Style Navigation & 7-Tier Typographic Hierarchy Overhaul
- **Status**: Implemented
- **Details**: Replaced rigid left sidebar with responsive, animated Hamburger Navigation Topbar and slide-out navigation drawer with `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`, backdrop blur, and keyboard shortcut (`Escape`) dismissal. Standardized a 7-tier typographic hierarchy across `runs/new` and the application, transforming flat uppercase monotony into distinct visual contrast between Page Headlines (`text-3xl font-black`), Section Headers (`text-base font-extrabold uppercase`), Group Headers (`text-sm font-bold`), Field Labels (`text-xs font-bold uppercase tracking-wider`), and readable, muted descriptions (`text-xs font-normal leading-relaxed text-[#5f5c6e]`).
- **Modules**: `frontend/components/AppShell.tsx`, `frontend/app/runs/new/page.tsx`, `frontend/app/globals.css`
- **Verification**: Vitest (10 / 10 suites passed, 29 / 29 tests passed), `npx tsc --noEmit` (0 errors).

### Cinema Filmmaker Studio UX & Master Footage Hero Ingestion
- **Status**: Implemented
- **Details**: Re-architected `frontend/app/runs/new/page.tsx` making **Master Movie Footage Ingestion** the grand primary hero focal point of the page. Removed redundant vertical space, elevated the Master Footage dropzone with a 32px rounded high-contrast card (`border-[2.5px] border-[#130e30] shadow-[0_8px_30px_rgba(19,14,48,0.08)]`), added a dedicated *"Load Studio 4K Sample Reel"* quick-loader, and implemented an instant cinema footage verification state card displaying technical video specs (4K Cinema Master, 5.1 Multitrack Audio, 24 FPS DCI).
- **Modules**: `frontend/app/runs/new/page.tsx`
### Production Containerization & Cloud Deployment Infrastructure
- **Status**: Implemented
- **Details**: Full-stack multi-stage Docker containerization and orchestration. Includes `backend/Dockerfile` (Python 3.11 with FFmpeg, libsndfile, PyTorch, Demucs, Faster-Whisper, and non-root runtime), `frontend/Dockerfile` (Next.js standalone multi-stage Alpine build), `docker-compose.yml` (multi-container bridge network with health checks, persistent storage and database volume mounts), `docker-compose.gpu.yml` (NVIDIA CUDA hardware acceleration passthrough), configurable CORS origins (`CORS_ORIGINS`), dynamic reverse proxy rewrite configuration (`BACKEND_URL`), production WebSocket host handling (`NEXT_PUBLIC_WS_URL`), and a comprehensive production runbook in `DEPLOYMENT.md`.
- **Modules**: `backend/Dockerfile`, `backend/.dockerignore`, `frontend/Dockerfile`, `frontend/.dockerignore`, `docker-compose.yml`, `docker-compose.gpu.yml`, `DEPLOYMENT.md`, `backend/app/config.py`, `frontend/next.config.mjs`
- **Verification**: `pytest backend/tests` (32 passed), `npm --prefix frontend test` (29 passed), `npm --prefix frontend run build` (standalone build passed).

### Master Video Preview Tab & Direct Local Disk Zero-Copy Playback
- **Status**: Implemented
- **Details**: Implemented a cinema-grade viewfinder and video player interface for live footage inspection. Uses client-side `URL.createObjectURL(file)` for zero-latency local disk playback without server roundtrips when files are dropped or selected via file picker, and range-request streaming (`Accept-Ranges: bytes` / HTTP 206) via FastAPI endpoints (`/api/v1/clips/{clip_id}/stream` and `/api/v1/clips/preview-stream`) for storage/NVMe paths and registered clips. Features custom playback controls, scrub bar, millisecond-precision timecodes (`00:00:00.00`), DCI resolution badges, transport pills, and memory leak cleanup on unmount.
- **Modules**: `frontend/components/studio/MasterVideoPreview.tsx`, `frontend/app/runs/new/page.tsx`, `frontend/app/runs/[id]/page.tsx`, `backend/app/api/clips.py`
- **Verification**: Pytest (`backend/tests/test_clip_streaming.py` & full suite 33/33 passed), Vitest (`frontend/__tests__/MasterVideoPreview.test.tsx` & full suite 34/34 passed).

### Anti-Slop Motion Component System (`/taste` & `/awesome-design`)
- **Status**: Implemented
- **Details**: Production-grade motion components implementing physical spring kinetics, viewport staggers, and 3D pointer tilt. Employs GPU Motion Values (`useMotionValue`, `useSpring`, `useTransform`) outside the React render cycle, strictly animates compositor properties (`transform`, `opacity`), and enforces full `prefers-reduced-motion` compliance.
- **Modules**: `frontend/components/ui/motion/SpringButton.tsx`, `frontend/components/ui/motion/MagneticCard.tsx`, `frontend/components/ui/motion/FeatureStaggerGrid.tsx`, `frontend/components/ui/motion/MotionReveal.tsx`, `frontend/components/ui/motion/index.ts`
- **Verification**: `frontend/__tests__/motion_components.test.tsx` & Vitest (13 / 13 suites passed, 52 / 52 tests passed).

### 35-Second Autonomous Crew Judge Demo & YouTube-Style Multi-Audio Track Player
- **Status**: Implemented
- **Details**: Full interactive presentation demo mode designed for 30–40 second hackathon judge reviews. Slices the 6-agent post-production pipeline (Story Analyst -> Localization Director -> Voice Director -> Sync Engineer -> Subtitle Director -> QA Continuity Agent + Targeted Self-Repair) into a calibrated ~35s automated sequence with progressive reveals, latency tickers, and Section 6 telemetry event streams. Upon completion (or skip), unlocks a cinema-grade video player with a YouTube-style Multi-Audio Track switcher (English Original, Spanish Alvaro Dub, Hindi Madhur Dub, French Henri Dub) with seamless timestamp preservation on audio switch and synchronized WebVTT subtitles.
- **Modules**: `frontend/app/runs/demo/page.tsx`, `frontend/components/studio/MultiAudioPlayer.tsx`, `backend/app/api/demo.py`, `frontend/app/runs/new/page.tsx`, `frontend/app/runs/[id]/page.tsx`
- **Verification**: Pytest (`backend/tests/test_demo_api.py` passed & 35/35 full suite passed), Vitest (`frontend/__tests__/MultiAudioPlayer.test.tsx` passed & 55/55 full suite passed), Next.js production build (`npm run build` compiled all routes with 0 errors).

### Autonomous Agent Sequence Track Dynamic Timers & Organic Bumps/Speedups Motion System (`/animate`, `/taste`, `/improve-ui`)
- **Status**: Implemented
- **Details**: Upgraded the agent cards in `AgentSequenceTrack` from static latencies to dynamic live counting timers (starting at `0.00s` and linearly reaching target durations like `5.91s` for Localization Director, `4.82s` for Story Analyst, `6.84s` for Voice Director, etc.) paired with an organic AI pipeline progress bar. The progress bar uses a monotonic Hermite cubic spline that introduces realistic neural inference speedup surges and processing bumps, strictly non-decreasing with GPU-accelerated transforms and glowing active head indicators.
- **Modules**: `frontend/components/studio/AgentSequenceTrack.tsx`, `frontend/app/runs/demo/page.tsx`, `mock_agent_sequence_visualizer.html`
- **Verification**: Vitest (`frontend/__tests__/studio_console.test.tsx`: 5/5 tests passed, full suite 57/57 passed across 14 test files).

### Impeccable Skeleton Loading System (`/impeccable`)
- **Status**: Implemented
- **Details**: Comprehensive suite of accessible, geometry-matched skeleton loaders with buttery smooth `--ease-out` shimmer wave gradients (`.animate-shimmer`) that mirror the exact physical layouts of every studio view and component. Features dedicated components: `Skeleton` (core primitive with variants for cards, circular avatars, pills, badges, buttons, text), `RunListSkeleton` (swarm table rows), `StudioConsoleSkeleton` (full workbench skeleton), `MasterVideoPreviewSkeleton` (16:9 viewport & transport controls), `MultiAudioPlayerSkeleton` (waveform & track switcher), `AgentSequenceTrackSkeleton` (7-node agent pipeline), `ProducerBoardSkeleton` (readiness gauge & metrics), `DecisionFeedSkeleton` (telemetry cards), `QARepairCardSkeleton` (self-healing comparison card), `ReadinessGaugeSkeleton` (circular score gauge), `BeforeAfterPlayerSkeleton` (dual audio comparison tracks), `SubtitleEditorSkeleton` (CPS dialogue review table), `OutputDeliverablesSkeleton` (downloadable deliverables grid), `ModelRegistrySkeleton` (AI model cards), and `SettingsSkeleton` (hardware & QA constraints). Fully integrated across all application pages (`/runs`, `/runs/[id]`, `/runs/[id]/output`, `/runs/[id]/subtitles`, `/models`, `/settings`). Accessible with `role="status"`, `aria-busy="true"`, `aria-live="polite"`, and screen-reader announcements, plus complete reduced-motion handling.
- **Modules**: `frontend/components/ui/skeleton/*`, `frontend/components/studio/index.ts`, `frontend/app/globals.css`, `frontend/app/runs/page.tsx`, `frontend/app/runs/[id]/page.tsx`, `frontend/app/runs/[id]/output/page.tsx`, `frontend/app/runs/[id]/subtitles/page.tsx`, `frontend/app/models/page.tsx`, `frontend/app/settings/page.tsx`
- **Verification**: Vitest (`frontend/__tests__/skeleton_components.test.tsx` 17/17 passed, full suite 74/74 passed across 15 test files), `tsc --noEmit` (passed with 0 errors).

### English Proper Noun Preservation & Colloquial Numeral Localization (TICKET-15)
- **Status**: Implemented
- **Details**: Deepened `LocalizationDirectorAgent` with dedicated `EntityPreserver` (`backend/app/engine/localization/entity_preserver.py`) for locking tech brands, frameworks, products, and person names (e.g. `Claude Code`, `Anthropic`, `Supabase`, `Zenith Chat`, `Afan Mustafa`, `Playwright`, `Vitest`) against literal translation distortion, and `NumeralLocalizer` (`backend/app/engine/localization/numeral_localizer.py`) for adapting metric quantities and numbers (e.g. `2.4k` -> `2.4 hazar` / `2.4 हज़ार` in Hindi, `2.4 mil` in Spanish, `2,4 mille` in French, `2,4 Tausend` in German; `10M` -> `10 मिलियन` / `10 millones` / `10 millions` / `10 Millionen`) into natural spoken dubbing terms for clean Microsoft Edge-TTS neural speech synthesis. Includes full TypeScript parity and schema validation.
- **Modules**: `backend/app/agents/localization_director.py`, `backend/app/engine/localization/entity_preserver.py`, `backend/app/engine/localization/numeral_localizer.py`, `backend/app/engine/localization/__init__.py`, `frontend/lib/agents/localization_director.ts`
- **Verification**: Pytest (`backend/tests/test_localization_director.py`: 44/44 full suite passed), Vitest (`frontend/__tests__/localization_director.test.ts`: 78/78 full suite passed across 15 test files), Next.js production build (`npm run build` 0 errors).

### Canonical Design System & Token Extraction (`/extract-design-system`, `/create-design-md`, `/awesome-design`, `/impeccable`, `/taste`)
- **Status**: Implemented
- **Details**: Extracted and codified the full design system, visual language, color tokens, typography scales, spatial grids, and component patterns from `https://aidubbing.io/movie-dubbing` into the project root `DESIGN.md`. Formalized Electric Violet brand hierarchy (`#7248EA`, `#6847FF`, `#F2EEFF`), Secondary Mint sync highlights (`#00D4AA`), high-contrast dark foundations (`#1A1A1A`, `#07060C`), crisp paper surfaces (`#FBFBFD`, `#FFFFFF`), QA defect statuses (`#14804A`, `#B42318`, `#A96F00`), standard transition tokens, and ready-to-use Tailwind / CSS Custom Property code exports. Fully integrated across the frontend styling layer (`frontend/tailwind.config.ts`, `frontend/app/globals.css`, `frontend/components/AppShell.tsx`) with zero-slop anti-aliased typography, tactile interactive feedback, and responsive layout mechanics.
- **Modules**: `DESIGN.md`, `frontend/tailwind.config.ts`, `frontend/app/globals.css`, `frontend/components/AppShell.tsx`
- **Verification**: Conforms to `@google/design.md` canonical specification. Vitest (16/16 suites, 83/83 passed), Next.js production build (`npm run build` compiled 9/9 pages with 0 errors).

### aidubbing.io Studio & 4-Section Landing Experience (`/adversarial-review`, `/council-review`, `/awesome_design`, `/create-design-md`, `/emil-design-eng`, `/ui-skills-root`)
- **Status**: Implemented
- **Details**: Reconstructed the master Studio & Landing page (`/`) according to the exact aidubbing.io specification and user uploaded reference screenshots:
  1. **Top Ingestion Workbench & Model Dropdown**: Features `ModelPicker` popover supporting `Mode C · Festival Subtitle Master` (1 Credit/s), `Mode B · Broadcast Streaming Dub` (3 Credits/s, 25% Off), and `Mode A · Theatrical Cinema Dub` (6 Credits/s, 14% Off). Includes drag-and-drop video/link ingestion with instant 35s demo scene loading, language selection (Auto-detect -> English/Spanish/French/German/Japanese/Hindi/Chinese), and subtitle toggle.
  2. **Section 1 (YouTube Film Explainers & Reviews)**: Vector illustration of multilingual creator at laptop with EN/FR/ES/JA/ZH speech bubbles, headline, overview copy, and `Try Movie Dubbing` CTA button that smoothly scrolls to and highlights `#workbench-dropzone`.
  3. **Section 2 (Indie Filmmakers & Festival Submissions)**: International film festival foreign audio track overview with clapperboard slate illustration and `See Our Demo` button that routes directly to `/runs/demo`.
  4. **Section 3 (How to Use Movie Dubbing for Film Translation)**: 3 tactile step cards (`Step 1: Upload Your Movie File`, `Step 2: Set Dubbing Parameters`, `Step 3: Review & Download`) paired with Emil Kowalski-styled Model variation switcher tabs (`Mode C · Festival Subtitle Master`, `Mode B · Broadcast Streaming Dub`, `Mode A · Theatrical Cinema Dub`).
  5. **Section 4 (Call to Action Banner)**: Full-width Electric Violet banner (`bg-gradient-to-r from-[#7248EA] to-[#6847FF]`) with `Your Film Deserves a Global Audience` and `Start Dubbing Now` tactile CTA.
  6. **Genre Video Showcase**: Emil-style floating pill tabs (`Cartoon`, `Concert`, `Horror`, `Comedy`, `Science Fiction`), studio video player preview, and expandable engine specifications disclosure.
  7. **Creator Testimonials, Ecosystem Tools, FAQ Accordion & Footer**: 6-card creator review grid, 4-card tool ecosystem, 7 collapsible FAQs, and multi-column global studio footer.
- **Modules**: `frontend/app/page.tsx`, `frontend/components/studio/ModelPicker.tsx`, `frontend/components/studio/WorkbenchCard.tsx`, `frontend/components/studio/GenreVideoShowcase.tsx`, `frontend/components/landing/FeatureExplainers.tsx`, `frontend/components/landing/HowItWorksSteps.tsx`, `frontend/components/landing/CTABanner.tsx`, `frontend/components/landing/CreatorTestimonials.tsx`, `frontend/components/landing/MoreToolsGrid.tsx`, `frontend/components/landing/FAQAccordion.tsx`, `frontend/components/landing/StudioFooter.tsx`, `frontend/components/AppShell.tsx`
- **Verification**: Vitest (`frontend/__tests__/aidubbing_studio_landing.test.tsx`: 7/7 passed, full suite 95/95 passed across 18 test files), TypeScript type-checking (0 errors), Next.js production build (`npm run build` compiled 9/9 pages with 0 errors).

### Live Judge Demo & Studio Console Accessible Redesign (`/taste`, `/emil-design-eng`, `/fixing-accessibility`, `/impeccable`, `/improve-ui`)
- **Status**: Implemented
- **Details**: Overhauled the Live Judge Demo view (`/runs/demo`) and associated studio console components:
  1. **Real Engine Options Integration**: Replaced all generic placeholders across `ModelPicker.tsx` and `HowItWorksSteps.tsx` with actual engine capabilities: `Mode C · Festival Subtitle Master` (Faster-Whisper Turbo, 100% actor audio preserved, Netflix 16 CPS Standard), `Mode B · Broadcast Streaming Dub` (Demucs 4-stem vocal separation + Edge-TTS 300+ neural voices, 170+ languages), and `Mode A · Theatrical Cinema Dub` (6 Autonomous Crew Agents, character voice cloning, atempo sync, and QA defect repair).
  2. **WCAG 2.1 Contrast AA/AAA Remediation**: Fixed low-contrast color pairings across buttons, badges, and status pills. Eliminated dark text on solid violet (`#7248ea`) or dark green (`#14804a`), replacing them with high-contrast text combinations (`text-white` on saturated fills, dark `#1a1a1a` on soft pastel backgrounds `#f0f9eb`, `#f2eeff`, `#fffbeb`).
  3. **Visual Hierarchy & Palette De-slopping**: Stripped out legacy neo-brutalist neon yellow (`#ffe228`), clashing magenta borders (`#e261e5`), and raw dark backgrounds (`#130e30`). Introduced warm amber (`#f59e0b`/`#b45309`) for targeted self-repair and QA warnings.
  4. **Emil Kowalski Tactile Micro-Interactions**: Segmented view switcher (`Console Workbench` vs `Multi-Audio Player`) with white active pill on soft lavender background (`#f2f0f8`), smooth spring clicks (`active:scale-[0.97]`), and expandable telemetry drawer on step click.
  5. **Tabular Timer Stability**: Added `tabular-nums` and a fixed minimum width (`min-w-[70px]`) to the demo countdown and elapsed timer in `Demo HUD` to eliminate horizontal layout jitter during execution.
- **Modules**: `frontend/app/runs/demo/page.tsx`, `frontend/components/studio/ModelPicker.tsx`, `frontend/components/landing/HowItWorksSteps.tsx`, `frontend/components/studio/AgentSequenceTrack.tsx`, `frontend/components/studio/ProducerBoard.tsx`, `frontend/components/studio/QARepairCard.tsx`
- **Verification**: Vitest (`frontend/__tests__/demo_page_redesign.test.tsx` 5/5 passed, full test suite 18/18 files and 95/95 tests passed), TypeScript `tsc --noEmit` passed with 0 errors, Next.js production build (`npm run build` 9/9 routes compiled with 0 errors).





### Hardened Kokoro-82M Neural TTS Adapter (TICKET-25)
- **Status**: Implemented
- **What it does**: Provides on-device neural speech synthesis using Kokoro-82M (StyleTTS 2) as a pluggable `SpeechSynthesisAdapter`. Resolves four production failure modes: multi-sentence truncation, pause crashes, Windows file-lock contention, and 32-bit float WAV format incompatibility.
- **Key implementation details**:
  - `KokoroTTSAdapter` class in `backend/app/agents/voice_director.py` (lines 147–221).
  - Singleton `KPipeline` cache per `kokoro_lang_code` guarded by `threading.Lock()` — prevents VRAM over-allocation on 4 GB GPUs.
  - `asyncio.to_thread(_generate)` wraps synchronous inference to avoid event-loop blocking.
  - Zero-chunk pause guard: non-lexical text (`"..."`, `"—"`) writes a clean PCM_16 silence rather than invoking inference.
  - Chunk aggregation via `np.concatenate` across the full generator output prevents first-chunk-only truncation.
  - Atomic write: `sf.write(*.tmp.wav)` → `os.replace()` avoids Windows file-lock errors.
  - All WAV output uses `subtype="PCM_16"` (Format Tag 1, 16-bit integer) for Python stdlib `wave.open()` compatibility.
  - Unsupported language (e.g., German, `kokoro_lang_code=None`) and runtime exceptions (missing `espeak-ng`, CUDA OOM, `ImportError`) fall back to `EdgeTTSAdapter` automatically.
  - `VoiceDirectorAgent` now accepts `adapter_type="kokoro"` and passes `target_lang=` to every `synthesize()` call.
- **Modules**: `backend/app/agents/voice_director.py`, `backend/tests/test_voice_director.py`
- **Verification**: `pytest backend/tests/test_voice_director.py backend/tests/test_languages.py -v` → **13/13 passed in 2.35s** (exit code 0).
- **Known limitations**: Kokoro model weights downloaded separately; `espeak-ng` must be installed at OS level for real inference. Tests use monkeypatched pipelines.

