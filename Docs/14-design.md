# LOCALIZE — Cinematic Post-Production Studio UI Design System & Technical Specification

> **Platform**: Autonomous AI Film Localization & Dubbing Suite  
> **Aesthetic Metaphor**: Modern Film Post-Production Studio Control Room (DaVinci Resolve / Pro Tools / Frame.io Pro Dark Environment)  
> **Version**: 2.0 Production Master  
> **Theme**: Deep Obsidian & Anodized Charcoal with Precision Neon Telemetry Accents  

---

## 1. Executive Product Philosophy & Aesthetic Direction

**LOCALIZE** is not a generic AI SaaS dashboard or chatbot interface. It is an **Autonomous AI Post-Production Crew** operating within a mission-critical, broadcast-grade film studio control room.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│  LOCALIZE CONTROL ROOM WORKSPACE                                                      [REEL 03 - FINAL QA]       │
├──────────────┬────────────────────────────────────────────────────────────────────────┬──────────────────────────┤
│ MODULES      │  MASTER VIDEO MONITOR & A/B COMPARISON                                  │  AUTONOMOUS AI CREW      │
│ ──────────   │  ┌──────────────────────────────────────────────────────────────────┐  │  🎬 Director Agent       │
│ 📁 Project   │  │  [ ORIGINAL: EN (US) ]         │   [ DUBBED: HI (IN) ]           │  │  📝 Localization Agent   │
│ 🎞 Media     │  │  "You think they won't find us?"│   "तुम्हें सच में लगता है...?"   │  │  🎙 Voice Director       │
│ 📝 Transcript│  │  Timecode: 01:14:22:18         │   Audio: EBU R128 -23 LUFS      │  │  ⏱ Sync Agent           │
│ 🌐 Localize  │  └──────────────────────────────────────────────────────────────────┘  │  💬 Subtitle Agent       │
│ 🎙 Voices    │  PROFESSIONAL MULTI-TRACK TIMELINE & WAVEFORMS                         │  🔍 QA Director          │
│ 💬 Subtitles │  ┌──────────────────────────────────────────────────────────────────┐  ├──────────────────────────┤
│ 🛡 QA Auto   │  │ [V1] Video Cuts  | Sc 01 | Sc 02 | Sc 03 | Sc 04 | Sc 07 [!] |    │  │  AUTONOMOUS QA LOOP      │
│ 🚀 Release   │  │ [A1] EN Waveform  ▃▅▇█▇▅▃ ▃▅▇█ ▃▅▇█▇▅▃ ▃▅  ▃▅▇█▇▅▃ (2.4s)        │  │  DETECT ➜ REWRITE ➜ FIX  │
│              │  │ [A2] HI Dub Wave  ▃▅▇██▇▅ ▃▅▇█ ▃▅▇█▇▅▃ ▃▅  ▃▅▇█████ (3.8s ➜ 2.3s)│  │  Readiness: 94 / 100     │
│              │  │ [CC] Subtitle     |  Sub 01  |  Sub 02  |  Sub 03  | Sub 07 |    │  │  Timing: +1.4s (Repaired)│
│              │  └──────────────────────────────────────────────────────────────────┘  └──────────────────────────┘
└──────────────┴───────────────────────────────────────────────────────────────────────────────────────────────────┘
```

### Visual & Environmental Pillars
* **Deep Cinematic Obsidian Baseline**: `#090A0F` background with `#11141D` matte panels and `#171B26` surface elevations.
* **Restrained Precision Accents**:
  * **Electric Royal Blue (`#3B82F6`)**: Primary interface focus, active timeline markers, and cursor telemetry.
  * **Violet & Indigo (`#8B5CF6` / `#6366F1`)**: Neural reasoning and translation rationale conduits.
  * **Emerald Glow (`#10B981`)**: Broadcast-grade QC approval, verified timing compliance, and clean audio stems.
  * **Amber / Gold (`#F59E0B`)**: Active automated retries, atempo speed warping, and non-blocking warnings.
  * **Crimson Signal (`#EF4444`)**: Detected speech window overflow, clipping anomalies, and defect flags.
* **Studio-Grade Micro-Interactions**:
  * Micro-hairline borders (`1px solid rgba(255, 255, 255, 0.08)`).
  * Monospaced timecode readouts (`JetBrains Mono`, tabular figures `01:14:22:18`).
  * Real-time multi-channel canvas waveforms with scrub-head tracking.
  * Zero cartoon illustrations, zero floating chatbots, zero fluffy SaaS cards.

---

## 2. Color Palette & Token Specification

| Design Token | Hex Code | Purpose & Semantic Role |
|---|---|---|
| `--studio-void` | `#08090D` | Deepest root viewport canvas; absorbs light like an editing suite suite. |
| `--studio-surface` | `#0F121A` | Main workspace panels, monitor framing, and timeline backdrop. |
| `--studio-card` | `#151924` | Elevated agent telemetry cards, decision inspector, and modal overlays. |
| `--studio-card-hover` | `#1C2232` | Interactive element hover states with instant 150ms ease-out transitions. |
| `--studio-border-subtle`| `rgba(255, 255, 255, 0.07)`| Hairline boundaries between panels and timeline tracks. |
| `--studio-border-active`| `rgba(59, 130, 246, 0.45)` | Active selected dialogue segment or armed timeline track. |
| `--studio-text-bright` | `#F8FAFC` | Timecode digits, speaker names, and primary localized lines. |
| `--studio-text-muted`  | `#94A3B8` | Track descriptions, agent explanations, and metadata labels. |
| `--studio-text-dim`    | `#475569` | Frame tick marks, disabled states, and grid rulers. |
| `--studio-blue`        | `#3B82F6` | Master action CTA, active playhead scrubber, and Director conduit. |
| `--studio-violet`      | `#8B5CF6` | Localization reasoning, cultural adaptation, and neural timbre tags. |
| `--studio-emerald`     | `#10B981` | QA Passed stamp, EBU R128 audio gate passed, 100% synchronized lines. |
| `--studio-amber`       | `#F59E0B` | In-flight automated repair, speed warp active (1.15x–1.25x). |
| `--studio-rose`        | `#F43F5E` | Timing window overflow defect, subtitle character overflow. |

---

## 3. Global Information Architecture & Screen Anatomy

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP NAVIGATION BAR (Height: 56px)                                                                      │
│ [ 🎬 LOCALIZE PRO ]  [ Project: THE LAST SIGNAL ]  [ EN (US) ➜ HI (IN) ]  [ STATUS: FINAL QA ]  [ EXPORT ]│
├─────────┬───────────────────────────────────────────────────────────────┬──────────────────────────────┤
│ LEFT    │ CENTER WORKSPACE (Flex: 1)                                    │ RIGHT CREW PANEL (Width: 380px│
│ SIDEBAR │ ┌───────────────────────────────────────────────────────────┐ │ ┌──────────────────────────┐ │
│ (72px)  │ │ MASTER VIDEO MONITOR & A/B COMPARISON THEATER             │ │ │ 🎬 AI CREW TELEMETRY     │ │
│         │ │ [Timecode: 01:14:22:18]  [VU Meters]  [Split Slider]      │ │ │ Director, Localization,  │ │
│ [ 📁 ]  │ └───────────────────────────────────────────────────────────┘ │ │ Voice, Sync, Subtitle, QA│ │
│ [ 🎞 ]  │ ┌───────────────────────────────────────────────────────────┐ │ ├──────────────────────────┤ │
│ [ 📝 ]  │ │ MULTI-TRACK TIMELINE & WAVEFORM VISUALIZER                │ │ │ 🛡 AUTONOMOUS QA LOOP   │ │
│ [ 🌐 ]  │ │ Timecode Ruler | Video Cuts | Original | Dubbed | Subs    │ │ │ Closed-loop auto-repair  │ │
│ [ 🎙 ]  │ └───────────────────────────────────────────────────────────┘ │ │ Readiness: 94 / 100      │ │
│ [ 💬 ]  │ ┌───────────────────────────────────────────────────────────┐ │ ├──────────────────────────┤ │
│ [ 🛡 ]  │ │ AI DECISION RATIONALE INSPECTOR                           │ │ │ 📊 FILM TELEMETRY        │ │
│ [ 🚀 ]  │ │ Original vs Candidate A/B • Speech Window Match • Voice   │ │ │ 24 Scenes • 186 Segments │ │
│         │ └───────────────────────────────────────────────────────────┘ │ └──────────────────────────┘ │
└─────────┴───────────────────────────────────────────────────────────────┴──────────────────────────────┘
```

---

## 4. Component Hierarchy & Detailed Specifications

### 4.1. Top Navigation Bar (Studio Header)
* **Branding**: `LOCALIZE` in bold geometric typography, paired with a glowing studio indicator dot (`● ONLINE`).
* **Active Project Pill**: `THE LAST SIGNAL — REEL 03 (4K MASTER)` with duration `00:14:32:00`.
* **Language Direction Conduit**: `EN (US)` ➔ `HI (IN) [Hindi - Cinematic Theatrical]`.
* **Autonomous Pipeline Status Badge**:
  * `LIVE PRODUCTION`: Pulsing blue halo.
  * `AUTONOMOUS QA LOOP`: Pulsing amber halo.
  * `MASTER READY`: Solid emerald glow with checkmark.
* **Primary Header Actions**:
  * **[ 🎬 Project Overview ]**: Opens complete 24-scene film summary modal.
  * **[ ⚡ Ingest & Prompt ]**: Opens Director high-level instruction modal.
  * **[ 🚀 Release Master Package ]**: Triggers multi-stem ProRes & Dolby Atmos export.

---

### 4.2. Left Studio Module Sidebar
A sleek, collapsed icon rail (with tooltips and expandable drawer) providing instant access to every layer of the film's post-production lifecycle:
1. **📁 Project**: Metadata, reel settings, target audience specs, tone guardrails.
2. **🎞 Media**: Video source files, 4K proxy streams, vocal stem separation (Demucs HTDemucs v4).
3. **📝 Transcript**: Whisper ASR transcript, speaker diarization, confidence heatmaps.
4. **🌐 Localization**: Cultural dialogue adaptation, idiom preservation, candidate generator.
5. **🎙 Voices**: Neural character voice cast, timbre matching, pitch contour & emotion tuning.
6. **💬 Subtitles**: Broadcast subtitle editor, reading cadence (CPS limit: 17), line-break optimizer.
7. **🛡 QA Auto-Repair**: Automated defect detection, closed-loop repair tracking, readiness scoring.
8. **🚀 Release**: Master compliance verification, EBU R128 loudness certificate, stem packaging.

---

### 4.3. Master Video Monitor & Review Theater

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  MASTER VIDEO MONITOR — SCENE 07 [01:14:20:00 - 01:14:28:12]         [ 4K PROXY 24.00 FPS ]│
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│    ┌──────────────────────────────────┬──────────────────────────────────┐  [VU METERS]  │
│    │  ORIGINAL SOURCE (ENGLISH)       │  LOCALIZED DUB (HINDI)           │  L █ █ █ █ ░  │
│    │                                  │                                  │  R █ █ █ ░ ░  │
│    │  [ Commander Vance ]             │  [ कमांडर वैंस ]                 │  -14 dBFS Peak│
│    │  "You really think they won't    │  "तुम्हें सच में लगता है वो       │  -23 LUFS Int │
│    │   find us out here?"             │   हमें नहीं ढूंढेंगे?"           │               │
│    │                                  │                                  │               │
│    │  Audio: Clean Boom Stem          │  Audio: Vance Neural (1.12x)     │               │
│    └──────────────────────────────────┴──────────────────────────────────┘               │
│                                       ▲                                                  │
│                              [ A/B SPLIT SLIDER ]                                        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  [⏮ 1s] [⏪ Frame]  [ ▶ PLAY / PAUSE (Space) ]  [⏩ Frame] [⏭ 1s]   TC: 01:14:22:18 / 00:14:32:00│
│  View: [ Single ] [ Side-by-Side ] [ Split Wipe ]   Audio: [ EN Only ] [ HI Dub ] [ Mix 50/50 ]  │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Key Capabilities:
* **Triple Display Modes**:
  1. *Single Master*: Full-bleed view of either original or localized dubbed render.
  2. *Side-by-Side Dual Cinema*: Synchronous dual playback for frame-by-frame lip and cadence comparison.
  3. *A/B Interactive Wipe Slider*: Draggable vertical split curtain directly over the video player to inspect visual lip-sync alignment in real time.
* **Dual VU Meters**:
  * Real-time stereo peak and integrated loudness (-23.0 LUFS ±0.5 LUFS EBU R128 standard).
* **Interactive HUD Overlays**:
  * Active speaker identifier (`Commander Vance` / `Dr. Maya Lin`).
  * Subtitle overlay in high-contrast cinematic subtitle styling (yellow/white with translucent black backing).
  * Timing window duration badge (`2.4s Window`).

---

### 4.4. Professional Multi-Track Timeline & Waveform Engine

```
┌───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ TIMELINE TRACKS (Zoom: 100% | Snapping: ON | Follow Playhead: ON)                       Timecode: [ 01:14:22:18 ]         │
├─────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ TC RULER    │ 01:14:18:00          01:14:20:00          01:14:22:00          01:14:24:00          01:14:26:00             │
├─────────────┼───────────────────────────────────────────────────────────────────▼─────────────────────────────────────────┤
│ [V1] VIDEO  │ [ Scene 05: Bridge ] [ Scene 06: Corridor ]  [ Scene 07: Air Lock Bay (Defect Fixed) ] [ Scene 08: Reactor]│
├─────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [A1] SOURCE │ Vance: "Are you ready?"    Maya: "Almost."     Vance: "You really think they won't find us?"                │
│   ORIGINAL  │ ── ▂▃▅▆▇▆▅▃ ──            ── ▂▃▅▃ ──           ─── ▂▃▅▆▇█▇▆▅▃▂ ─── (2.4s) ────────────────────────────────── │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [A2] DUBBED │ Vance: "क्या तुम तैयार हो?" Maya: "बस हो गया।"  Vance: "तुम्हें सच में लगता है वो हमें नहीं ढूंढेंगे?"         │
│   HINDI     │ ── ▂▃▅▆▇▆▅▃ ──            ── ▂▃▅▃ ──           ─── ▂▃▅▆▇█▇▆▅▃▂ ─── [✓ Synced 2.3s / 2.4s] ───────────────────│
├─────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [CC] SUBS   │ [ 05: क्या तुम तैयार हो? ]   [ 06: बस हो गया ]   [ 07: तुम्हें सच में लगता है वो हमें नहीं ढूंढेंगे? ]         │
├─────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ [QA] GATES  │ [ ✓ PASS ]                 [ ✓ PASS ]           [ 🛡 QA AUTO-REPAIRED: Speech window reduced -1.4s ] [ ✓ PASS ]│
└─────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

#### Timeline Capabilities:
* **Audio Waveform Visualization**: Dual canvas-rendered audio waveforms (Source English vs Localized Hindi) with dynamic amplitude peaks and silence detection.
* **Scrubbing & Navigation**: Draggable playhead with millisecond timecode readout, click-to-seek, and loop region support.
* **Track Controls**: Solo (`[S]`), Mute (`[M]`), and volume gain faders per track.
* **Interactive Dialogue Blocks**: Click any dialogue block to instantly populate the **AI Decision Inspector** and focus the video monitor on that scene.
* **Defect Flags**: Distinct color-coded highlight boxes directly on defective or auto-repaired segments.

---

### 4.5. Right-Side Autonomous AI Crew Panel

Presents the multi-agent post-production crew as active, collaborative studio professionals:

```
┌────────────────────────────────────────────────────────────────────────┐
│  AUTONOMOUS AI CREW                                    ● 6 AGENTS ACTIVE│
├────────────────────────────────────────────────────────────────────────┤
│  🎬 Director Agent                                     [ IDLE / MONITOR ]│
│  Orchestrating scene boundaries, narrative pacing, and targeted retries│
│  Decision: "Approved Scene 07 repair. Pacing matches original reel."   │
│  Progress: [████████████████████████] 100%               Latency: 142ms│
├────────────────────────────────────────────────────────────────────────┤
│  📝 Localization Agent                                 [ ADAPTING DIALOG]│
│  Adapting dialogue for Hindi streaming audience with character nuances │
│  Decision: "Replaced literal phrasing with conversational idiom."      │
│  Progress: [████████████████████████] 100%              Tokens: 1,420tok│
├────────────────────────────────────────────────────────────────────────┤
│  🎙 Voice Director                                     [ SYNTHESIZING ] │
│  Neural voice casting & emotional pitch modeling (6 character voices)  │
│  Decision: "Selected Vance Gritty Baritone with +4dB urgency boost."   │
│  Progress: [████████████████████████] 100%             Duration: 18.2s │
├────────────────────────────────────────────────────────────────────────┤
│  ⏱ Sync Agent                                         [ TIMING MATCHED ]│
│  Reconciling translated speech duration with video speech windows      │
│  Decision: "Applied atempo 1.12x warping + 80ms leading silence trim." │
│  Progress: [████████████████████████] 100%               Drift: <12ms  │
├────────────────────────────────────────────────────────────────────────┤
│  💬 Subtitle Agent                                     [ VTT/SRT COMPILED│
│  Generating broadcast-compliant subtitles (CPS <= 17 chars/sec)       │
│  Decision: "Split Scene 07 into 2 balanced lines for mobile readability│
│  Progress: [████████████████████████] 100%              Lines: 186/186 │
├────────────────────────────────────────────────────────────────────────┤
│  🔍 QA Director                                        [ GATES PASSED ] │
│  Real-time defect scanner: timing overflow, lip drift, audio clipping  │
│  Decision: "Targeted retry on Scene 07 resolved timing overflow."      │
│  Progress: [████████████████████████] 100%             Readiness: 94%  │
└────────────────────────────────────────────────────────────────────────┘
```

---

### 4.6. Autonomous QA Self-Repair Closed Loop (Visually Prominent)

The system does not just report errors—it **autonomously resolves defects** through closed-loop targeted retries:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  🛡 AUTONOMOUS QUALITY ASSURANCE ENGINE                                  RELEASE: 94/100 │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                          │
│   [ 1. DETECTED ] ──➔ [ 2. INVESTIGATING ] ──➔ [ 3. REWRITE ]                            │
│    Scene 07 Dialogue     Director diagnoses:     Localization Agent                      │
│    exceeds window by     speech rate exceeds     condenses script from                   │
│    +1.40 seconds         max natural threshold   14 words ➔ 9 words                      │
│                                                            │                             │
│   [ 6. QA PASSED ] 🠔── [ 5. RESYNCHRONIZE ] 🠔── [ 4. REGEN AUDIO ]                        │
│    Timing compliance     Sync Agent applies      Voice Director                          │
│    100% (2.3s in 2.4s)   1.12x atempo warp       synthesizes new Hindi                   │
│    Readiness +8.5 pts    silence trim 80ms       vocal stem with urgency                 │
│                                                                                          │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  QUALITY SCORECARD BREAKDOWN                                                             │
│  • Translation Fidelity & Nuance:   [████████████████████░░] 96%  (Idiom match: High)    │
│  • Character Voice Consistency:     [███████████████████░░░] 95%  (Timbre delta: 0.04)   │
│  • Lip & Speech Window Timing:      [██████████████████░░░░] 91%  (Drift: 14ms)          │
│  • Subtitle Cadence (CPS Limit):    [████████████████████░░] 98%  (Max CPS: 15.2)        │
│  • Audio & Loudness (EBU R128):     [███████████████████░░░] 97%  (-23.1 LUFS)           │
│                                                                                          │
│  [ ⚡ Simulate Defect & Auto-Repair ]          [ 📜 View Full Telemetry Audit Log ]      │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.7. AI Candidate Decision Rationale Inspector

When a user clicks on any dialogue segment on the timeline or in the script view:

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  AI DECISION INSPECTOR — SCENE 07 • SEGMENT #142                    SPEECH WINDOW: 2.40s│
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  ORIGINAL SOURCE (ENGLISH):                                                              │
│  "You really think they won't find us out here?"                                         │
│  Speaker: Commander Vance  •  Emotion: Paranoid / Urgent  •  Audio Duration: 2.38s       │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  TRANSLATION CANDIDATES GENERATED BY LOCALIZATION AGENT:                                 │
│                                                                                          │
│  ○ Candidate A (Literal Translation):                                                    │
│    "क्या आप वास्तव में सोचते हैं कि वे हमें यहाँ बाहर नहीं ढूंढ पाएंगे?"                 │
│    Est. Duration: 3.80s  [ ❌ EXCEEDS WINDOW BY +1.40s — WOULD REQUIRE 1.6x WARP ]        │
│                                                                                          │
│  ● Candidate B (Selected Conversational Localization):                                   │
│    "तुम्हें सच में लगता है वो हमें यहाँ नहीं ढूंढेंगे?"                                  │
│    Est. Duration: 2.30s  [ ✓ FITS WINDOW PERFECTLY (95.8% FILL) — 1.05x NATURAL PACE ]  │
│                                                                                          │
│  ○ Candidate C (Ultra-Short Dramatic):                                                   │
│    "सच में लगता है हम बच जाएंगे?"                                                        │
│    Est. Duration: 1.65s  [ ⚠️ UNDERFILLS WINDOW BY -0.75s — NOTICEABLE LIP GAP ]          │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  📝 AGENT REASONING RATIONALE:                                                           │
│  "Candidate B preserves Commander Vance's colloquial cynicism and urgency while fitting  │
│   the exact 2.40-second speech window. Hindi phrasing maintains natural syllable cadence │
│   without requiring aggressive atempo compression."                                      │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  Character Voice: Vance (Neural Baritone) | Speed Factor: 1.05x | Action: [ Force Retry ]│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.8. Comprehensive Project Overview Screen

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  FILM PRODUCTION OVERVIEW — THE LAST SIGNAL (REEL 03)                                    │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  PROJECT METRICS                                                                         │
│  • Project Title:        THE LAST SIGNAL                                                 │
│  • Status:               FINAL QA & MASTER VERIFICATION                                  │
│  • Source Language:      English (US) [Cinematic Dolby Master]                           │
│  • Target Language:      Hindi (India) [Theatrical Streaming Localization]               │
│  • Total Reel Runtime:   00:14:32:00 (20,928 Frames @ 24.00 FPS)                         │
│  • Total Scenes:         24 Scenes                                                       │
│  • Dialogue Segments:    186 Distinct Lines                                              │
│  • Character Cast:       6 Diarized Voice Profiles                                       │
│  • Scenes Completed:     23 / 24 Scenes (95.8%)                                          │
│  • Detected Issues:      2 Total (1 Auto-Repaired, 1 Pending Final QA Stamp)             │
│  • Release Readiness:    94% (Threshold: 85% for Master Delivery)                        │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  CHARACTER VOICE CAST MATRIX                                                             │
│  1. Commander Vance:     Gritty Baritone (Actor Match: Kabir Bedi timbre) [48 segments]  │
│  2. Dr. Maya Lin:        Empathetic Alto (Actor Match: Vidya Balan timbre) [52 segments] │
│  3. Ensign Miller:       Youthful Tenor (Actor Match: Ishaan Khatter timbre) [34 segs]   │
│  4. Ship AI Core:        Resonant Synthesized Vocoder [28 segments]                      │
│  5. General Sterling:    Authoritative Deep Bass [16 segments]                           │
│  6. Background Radio:    Filtered VHF Comms [8 segments]                                 │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.9. Ingest & Director Instruction Workflow (Setup Flow)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  ⚡ NEW LOCALIZATION PROJECT — AI DIRECTOR SETUP                                          │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  1. SOURCE MEDIA INGESTION                                                               │
│     [ Drop Master Film / Proxy (.mp4, .mov, .mxf, .prores) or Select Sample Reel ]      │
│     Selected: the_last_signal_reel03_4k_master.mp4 (4.2 GB • 14m 32s)                    │
│                                                                                          │
│  2. TARGET LANGUAGE & REGIONAL DIALECT                                                   │
│     [ Hindi (India - Modern Theatrical) ▾ ]  [ Spanish (Latin America) ]  [ Japanese ]    │
│                                                                                          │
│  3. TARGET AUDIENCE & CULTURAL CONSTRAINTS                                               │
│     [ Streaming Theatrical (Prime/Netflix) ▾ ] [ Broadcast Safe ] [ Youth / Conversational]│
│                                                                                          │
│  4. HIGH-LEVEL AI DIRECTOR PROMPT & CREW INSTRUCTION                                     │
│     ┌──────────────────────────────────────────────────────────────────────────────────┐ │
│     │ "Localize this film for Hindi-speaking streaming audiences while preserving      │ │
│     │  character personalities, cynical military tone, and keeping exact original      │ │
│     │  runtime without lip-sync drift."                                                │ │
│     └──────────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                          │
│  5. AUTOMATED CREW GATES                                                                 │
│     [✓] Enable Demucs HTDemucs Vocal Stem Separation                                     │
│     [✓] Enable Autonomous QA Error Detection & Self-Repair Retry Loop                    │
│     [✓] Enforce EBU R128 (-23 LUFS) Broadcast Audio Compliance                           │
│                                                                                          │
│  [ 🎬 LAUNCH AUTONOMOUS POST-PRODUCTION CREW ]                 [ Save Draft Configuration]│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4.10. Master Release Packaging & Delivery Modal

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│  🚀 MASTER RELEASE PACKAGING & DISTRIBUTION EXPORT                                       │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  RELEASE CANDIDATE: THE_LAST_SIGNAL_REEL03_HINDI_DUB_RC2_MASTER                          │
│  QC Compliance Score: 94/100 (PASSED) • EBU R128: -23.1 LUFS • Zero Clipping             │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  SELECT DELIVERY PACKAGES:                                                               │
│                                                                                          │
│  [✓] Apple ProRes 422 HQ (4K UHD 24fps) with Muxed Hindi 5.1 Surround Dub   (18.4 GB)    │
│  [✓] Streaming Master (H.265 / HEVC 10-bit with Stereo LT/RT Dub)             (2.1 GB)    │
│  [✓] Isolated Audio Stems Package:                                            (1.2 GB)    │
│      - Hindi Dialogue Stem (M&E Free, Dry + Studio Reverb)                               │
│      - Clean Music & Sound Effects (M&E) Track                                           │
│      - Print Master 5.1 Mix                                                              │
│  [✓] Timed Subtitle Bundles:                                                  (140 KB)    │
│      - Hindi Subtitles (.srt / .vtt / Netflix TTML with CPS compliance)                  │
│      - English SDH Subtitles (.srt / .vtt)                                               │
│  [✓] Autonomous QA Verification & Continuity Audit Certificate (.pdf / .json)             │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│  Delivery Destination: [ Direct Download ]  [ AWS S3 / Cloud Bucket ]  [ Frame.io Studio ]│
│                                                                                          │
│  [ 🚀 EXPORT & DOWNLOAD RELEASE PACKAGE ]                          [ Close ]             │
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. State Machine & Event-Driven Telemetry Schema

Every agent action emits structured JSON telemetry events to drive real-time UI animation, waveform rendering, and Grafana MCP observability:

```json
{
  "job_id": "the_last_signal_reel03",
  "scene_id": "scene_07",
  "segment_id": 142,
  "timecode_start": "01:14:22:04",
  "timecode_end": "01:14:24:14",
  "agent": "qa_director",
  "action": "evaluate_release_candidate",
  "defect_type": "TIMING_OVERFLOW",
  "severity": "CRITICAL",
  "defect_details": {
    "target_speech_window_s": 2.40,
    "synthesized_duration_s": 3.80,
    "overflow_delta_s": 1.40
  },
  "self_repair_flow": {
    "status": "AUTO_REPAIRED",
    "retried_agents": ["localization_agent", "voice_director", "sync_agent"],
    "new_duration_s": 2.30,
    "speed_warp_factor": 1.05,
    "quality_score_after": 94.2
  },
  "latency_ms": 380,
  "retry_count": 1,
  "timestamp": "2026-09-09T00:15:30.400Z"
}
```

---

## 6. Verification & Implementation Roadmap

1. **Visual Cohesion & Contrast**: Verify all panels meet WCAG AAA contrast in dark mode while preserving cinematic mood.
2. **Timeline Precision**: Confirm scrubbing maintains sub-frame timecode accuracy with synchronous video frame update.
3. **Audio-Visual Interactivity**: Test A/B split-slider, audio channel crossfading, and real-time waveform updates.
4. **Self-Repair Simulation**: Ensure one-click simulation of the 6-stage QA defect loop (`DETECTED` ➜ `INVESTIGATING` ➜ `REWRITE` ➜ `REGEN AUDIO` ➜ `RESYNC` ➜ `PASSED`) provides clear, engaging visual feedback.
