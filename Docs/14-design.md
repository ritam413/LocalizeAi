---
version: alpha
name: LOCALIZE Studio — Design System (Ditto × Netflix Sans Edition)
description: Visual design language, color tokens from Ditto (Warm Cream, Deep Ink, Hi-Yellow), and bold geometric typography from Netflix Sans.
colors:
  color-deep-ink: "#130e30"
  color-hi-yellow: "#ffe228"
  color-moss-green: "#59e25d"
  color-fuchsia: "#e261e5"
  color-slate: "#5f5c6e"
  color-canvas: "#f9fbf2"
  color-soft-meadow: "#eff2e5"
  color-charcoal: "#222222"
  color-onyx: "#000000"
typography:
  sans:
    fontFamily: "Netflix Sans", Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
  mono:
    fontFamily: "JetBrains Mono", "Fira Code", monospace
  display:
    fontFamily: "Netflix Sans", Inter, sans-serif
    fontSize: 56px
    lineHeight: 56px
    fontWeight: 900
rounded:
  sm: 4px
  md: 8px
  lg: 16px
  pill: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 32px
  3xl: 48px
---

# LOCALIZE Studio — Official Design System (14-design.md)
> "Sunlit wildflower compliance atelier meets high-contrast cinema telemetry."

## 1. Overview & Aesthetic Direction
LOCALIZE Studio pairs a warm, human, sunlit SaaS color palette (**Ditto Design System**) with authoritative, high-impact marquee typography (**Netflix Sans**).

- **Page Canvas**: Sunlit warm cream (`--color-canvas: #f9fbf2`) with green-tinted elevated cards (`--color-soft-meadow: #eff2e5`).
- **Primary Ink & Structure**: Deep Navy-Violet (`--color-deep-ink: #130e30`), adding rich warmth over sterile pure black.
- **High-Contrast Primary Action & Active Signal**: Hi-Yellow (`--color-hi-yellow: #ffe228`) — reads like an illuminated highlighter with 16.2:1 contrast against `#130e30`.
- **Atmospheric Accents**: Moss Green (`#59e25d`) and Fuchsia (`#e261e5`) for status highlights and self-repair loops.
- **Typography**: **Netflix Sans** (geometric grotesque, weights 400, 500, 700, 900) for sharp hierarchical readability, paired with `JetBrains Mono` for live execution timers.

---

## 2. Color System & Surface Hierarchy

| Token | Value | Role | Purpose |
|---|---|---|---|
| `--color-deep-ink` | `#130e30` | Structural Ink & Headings | Primary text, titles, dark pill buttons, card borders, active glowing borders. |
| `--color-hi-yellow` | `#ffe228` | Primary Action (Highlighter) | Active CTA buttons (`Get Started`, `Approve`), active stage highlights, timer fills. |
| `--color-canvas` | `#f9fbf2` | Page Canvas | Base viewport background — soft warm cream. |
| `--color-soft-meadow` | `#eff2e5` | Elevated Card Surface | Agent cards, nav background, Producer Board surface. |
| `--color-slate` | `#5f5c6e` | Muted Text & Helpers | Secondary copy, metadata descriptions, inactive conduit borders. |
| `--color-charcoal` | `#222222` | Secondary Dark UI | Dark button hover states, terminal backdrops. |
| `--color-moss-green` | `#59e25d` | Success & Completed Stems | Completed agent badges, verified timing compliance indicators. |
| `--color-fuchsia` | `#e261e5` | Self-Repair Alerts | Targeted retry feedback arc and QA defect highlights. |
| `--color-onyx` | `#000000` | Fine Stroke Details | Wordmark details, high-contrast borders. |

---

## 3. Typography & Hierarchy (Netflix Sans + Mono)

- **Marquee Title**: `56px` / `24px` header, Weight `900`, Line-height `1.0`, Letter-spacing `-0.02em`, Color `#130e30`
- **Subheading**: `20px` / `18px`, Weight `700`, Line-height `1.2`, Color `#130e30`
- **Body & Agent Titles**: `14px` / `16px`, Weight `500` / `700`, Line-height `1.5`, Color `#130e30`
- **Metadata & Subtext**: `12px` / `10px`, Weight `400`, Color `#5f5c6e`
- **Precision Numerals (Timers & Latencies)**: `JetBrains Mono`, `tabular-nums`, Weight `700`

---

## 4. Spacing & Shapes

- **Base Unit**: `8px` (with `4px` sub-increments)
- **Border Radii**:
  - `16px` (`lg`): Agent node cards, metrics containers, Producer Board
  - `9999px` (`pill`): Primary action buttons, status pills, live execution timers
  - `8px` (`md`): Inner telemetry boxes, code pills
  - `2px` (`sm`): Hairline dividers

---

## 5. Serpentine (Boustrophedon) Workflow Track Architecture

The 6-agent localization crew is laid out in a 2-row serpentine flow to guarantee 100% viewport visibility on all screens:

1. **Executive Top HUD**:
   - Total Execution Duration (`14.82s`), Token Usage (`2,410 tok`), Readiness Score (`98.0% PASS`), Production Status (`APPROVED`).
2. **Serpentine Agent Workflow Route (Center)**:
   - **Initial State**: Only Step 01 (Story Analyst) is visible on load. Steps 02–06 start at `opacity: 0; transform: scale(0.95) translateY(6px)` (Emil Kowalski progressive entrance).
   - **Row 1 (Left to Right ➔)**:
     - `Step 01: Story Analyst` (Demucs + Whisper + Diarization) ➔
     - `Step 02: Localization Director` (Cultural Adaptation & Rationale) ➔
     - `Step 03: Voice Director` (Neural Voice Casting & TTS Synthesis) ⤵
   - **Downward Corner Transition (Row 1 ➔ Row 2)**:
     - When Step 03 completes, an animated downward SVG conduit in Deep Ink / Hi-Yellow draws down into Row 2 (*"Handoff Down to Audio Stems ⤵"*).
   - **Row 2 (Right to Left 🠔)**:
     - `Step 04: Sync Engineer` (Atempo 1.25x & Silence Compression) 🠔 (under Step 03)
     - `Step 05: Subtitle Director` (SRT/VTT Sync & CPS Formatting) 🠔 (under Step 02)
     - `Step 06: QA Continuity Agent` (Defect Scanner & Self-Repair) (under Step 01)
   - **Targeted Self-Repair Loop**:
     - Direct Fuchsia / Hi-Yellow feedback arc from Step 06 back across Row 2 to Step 04 (Sync Engineer).
3. **The Producer Board (Right)**:
   - Soft Meadow surface summarizing continuity score, active locks, lip-sync drift (<18ms), and Hi-Yellow `#ffe228` filled `APPROVE FOR DISTRIBUTION` CTA button.

---

## 6. Motion & Polish Guidelines (Emil Kowalski Philosophy)

- **Responsive Button Press**: Add `transform: scale(0.97)` on `:active`.
- **Never animate from `scale(0)`**: Start entering states from `scale(0.95)` with `opacity: 0`.
- **Strong Custom Easing**: `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` for fast, purposeful sub-250ms feedback.
- **Tabular Figures**: `font-variant-numeric: tabular-nums` for timers to eliminate layout reflows.
- **Asymmetric Timing**: Deliberate progress timers paired with snappy 180ms ease-out UI transitions.
