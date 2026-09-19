# DESIGN SYSTEM SPECIFICATION — LOCALIZE AI & MOVIE DUBBING
> Codified with `/awesome_design`, `@google/design.md`, `/taste-skill`, and `/emil-design-eng` guidelines.

---

## 1. Visual Theme & Atmosphere

- **Product Archetype**: Autonomous AI Post-Production Studio & Multilingual Film Localization Platform
- **Visual Direction**: High-Fidelity Cinema Studio Precision ("Light-Blue Mintlify & Electric Violet Studio")
- **Color Temperature & Density**: Crisp, high-contrast light canvas base with deep ink slate text and luminous accent highlights. High visual density rating (**7/10**) tailored for audio engineers, filmmakers, and AI pipeline operators.
- **Design Dials**:
  - `DESIGN_VARIANCE: 6` (Balanced cockpit layout with distinct 2-row serpentine pipeline & comparison monitors)
  - `MOTION_INTENSITY: 6` (Hermite S-curve stage progress, live telemetry heartbeat pulses, tactile `active:scale-[0.98]`)
  - `VISUAL_DENSITY: 7` (High data density with tabular-nums timecodes, EBU R128 metrics, and live Section 6 telemetry)

---

## 2. Curated Color Palette & Semantic Roles

| Role | Token / CSS Variable | Hex Code | Purpose / Usage |
|---|---|---|---|
| **Canvas Base** | `--bg-canvas` / `--bg-primary` | `#F0F6FC` | Global page backdrop, light-blue tinted canvas |
| **Card / Paper Surface** | `--surface-card` / `--paper` | `#FFFFFF` | Elevating card surface, dialogs, dropzones, inspector panes |
| **Border Muted** | `--border-subtle` / `--line` | `#D0DFEE` | Clean 1px card outlines, divider rules, grid seams |
| **Border Focus** | `--border-focus` | `#2B7FFF` | Focus outlines, active stage borders, drag hover states |
| **Primary Accent (Signal Blue)** | `--accent-primary` | `#2B7FFF` | Primary CTAs, active status indicators, active links |
| **Studio Violet** | `--violet-primary` | `#7248EA` | AI Director badges, neural reasoning indicators, model badges |
| **Secondary Mint** | `--accent-mint` | `#00D4AA` | Real-time audio sync lock, 100% QA release score, waveform stems |
| **Text Primary (Ink Slate)** | `--text-primary` | `#0F172A` | Primary headlines, modal titles, high-contrast labels |
| **Text Secondary (Muted)** | `--text-secondary` | `#475569` | Subtitles, descriptive paragraphs, secondary field labels |
| **Text Subtle / Metadata** | `--text-muted` | `#94A3B8` | Timestamps, file size metadata, placeholders |
| **Dark Cinema Chassis** | `--bg-cinema` | `#07060C` | Master video player bezel, timeline scrub bar background |

### Semantic QA Defect & Self-Repair Statuses

| Status | Text Color | Background Fill | Border | Usage in Pipeline |
|---|---|---|---|---|
| **Success / Certified** | `#15803D` | `#F0FDF4` | `#BBF7D0` | QA score ≥ 85, EBU R128 passed, zero clipping |
| **Danger / Defect** | `#B91C1C` | `#FEF2F2` | `#FECACA` | Timing overflow > 1.25x, digital clipping at 0 dBFS |
| **Warning / Retry** | `#B45309` | `#FFFBEB` | `#FDE68A` | Targeted retry dispatched, atempo speed adjust in-flight |
| **Telemetry Stream** | `#0369A1` | `#F0F9FF` | `#BAE6FD` | Section 6 decision events, Grafana MCP query records |

---

## 3. Typography Scales & Hierarchy

### 3.1 Font Stacks
```css
/* Primary Interface & Headings */
font-family: 'Inter', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Timecodes, Audio Specs, Hashes, Tokens & Monospace */
font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', monospace;
```

### 3.2 Typographic Scale

| Level | Font Size | Line Height | Weight | Letter Spacing | Tailwind Class | Usage |
|---|---|---|---|---|---|---|
| **Display H1** | `2.5rem` (40px) | `1.15` | `800` | `-0.025em` | `text-4xl font-extrabold tracking-tight` | Studio hero headline, run title |
| **Section H2** | `1.875rem` (30px) | `1.2` | `700` | `-0.02em` | `text-3xl font-bold tracking-tight` | Major console section headers |
| **Subhead H3** | `1.25rem` (20px) | `1.35` | `600` | `-0.01em` | `text-xl font-semibold` | Modal titles, stage category titles |
| **Card Title H4** | `1rem` (16px) | `1.4` | `600` | `0em` | `text-base font-semibold` | Agent node titles, producer checklist |
| **Body Regular** | `0.875rem` (14px) | `1.5` | `400` | `0em` | `text-sm font-normal leading-relaxed` | Defect descriptions, rationale text |
| **Body Small** | `0.8125rem` (13px) | `1.45` | `400` | `0em` | `text-[13px] font-normal text-[#475569]` | Helper text, secondary specs |
| **Caption / Metric** | `0.75rem` (12px) | `1.35` | `600` | `0.02em` | `text-xs font-mono font-semibold tabular-nums` | Timecodes, token counts, Q-scores |

---

## 4. Zero-Pill Geometry & Spatial Tokens

> **CRITICAL RULE — STRICTLY ZERO PILL BUTTONS**:
> All interactive buttons, action triggers, and form inputs must use a crisp **4px radius** (`rounded-[4px]`). Pill shapes (`rounded-full`) are strictly prohibited on interactive buttons.

### 4.1 Border Radius Scales

| Token Name | Radius Value | Tailwind Class | Exact Component Domain |
|---|---|---|---|
| `--radius-button` | **`4px`** | `rounded-[4px]` | **All interactive buttons, input boxes, dropdown selectors, action triggers** |
| `--radius-tag` | **`4px`** | `rounded-[4px]` | Status tags, language chips, codec badges |
| `--radius-card` | **`16px`** | `rounded-[16px]` | Agent pipeline cards, Producer Board, Defect cards, Audio monitor |
| `--radius-container`| **`24px`** | `rounded-[24px]` | Master footage ingestion dropzone, Cinema player chassis, Modal windows |

### 4.2 Spatial Rhythm & Padding
```css
--space-1:  4px;
--space-2:  8px;
--space-3:  12px;
--space-4:  16px;
--space-5:  20px;
--space-6:  24px;
--space-8:  32px;
--space-12: 48px;
```
- **Page Container Max Width**: `1400px` (`max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8`)
- **Card Padding**: `20px` to `24px` (`p-5` to `p-6`)

---

## 5. Component Stylings & Elevation

### 5.1 Buttons (4px Radius — Zero Pill)
- **Primary Action CTA**:
  ```tsx
  <button className="bg-[#2B7FFF] hover:bg-[#1E6BDB] active:scale-[0.98] text-white text-xs font-bold px-4 py-2.5 rounded-[4px] shadow-sm transition-all flex items-center gap-2">
    <span>APPROVE DISTRIBUTION</span>
  </button>
  ```
- **Secondary Action Button**:
  ```tsx
  <button className="bg-white hover:bg-[#F0F6FC] active:scale-[0.98] text-[#0F172A] border border-[#D0DFEE] text-xs font-semibold px-4 py-2.5 rounded-[4px] transition-all flex items-center gap-2">
    <span>Download Master Package (.zip)</span>
  </button>
  ```
- **Danger / Retry Trigger**:
  ```tsx
  <button className="bg-[#B91C1C] hover:bg-[#991B1B] active:scale-[0.98] text-white text-xs font-bold px-3 py-1.5 rounded-[4px] transition-all">
    <span>RERUN TARGETED RETRY</span>
  </button>
  ```

### 5.2 Cards & Surfaces (16px Radius)
- **Card Chassis**:
  ```tsx
  <div className="bg-white border border-[#D0DFEE] rounded-[16px] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.05)] text-[#0F172A]">
    {/* Card Content */}
  </div>
  ```
- **Active / Focused Card (e.g. In-Flight Stage)**:
  ```tsx
  <div className="bg-white border-2 border-[#2B7FFF] rounded-[16px] p-6 shadow-[0_0_20px_rgba(43,127,255,0.15)] ring-1 ring-[#2B7FFF]/20">
    {/* Active Stage Content */}
  </div>
  ```

### 5.3 Ingestion & Cinema Chassis (24px Radius)
- **Master Dropzone**:
  ```tsx
  <div className="bg-white border-2 border-dashed border-[#D0DFEE] hover:border-[#2B7FFF] rounded-[24px] p-8 md:p-12 text-center transition-all">
    {/* Dropzone Content */}
  </div>
  ```

---

## 6. Depth & Layering

- **1px Layered Borders**: All card elements utilize crisp, single-pixel borders (`border-[#D0DFEE]`) to maintain sharp structural boundaries without muddy dropshadows.
- **Subtle Ambient Shadows**:
  ```css
  --shadow-card: 0 1px 3px rgba(15, 23, 42, 0.05), 0 1px 2px rgba(15, 23, 42, 0.03);
  --shadow-float: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
  ```

---

## 7. Do's and Don'ts

- **DO**: Use `rounded-[4px]` for all buttons, inputs, tabs, and action pills.
- **DO**: Use `rounded-[16px]` for cards and `rounded-[24px]` for major view containers.
- **DO**: Enforce `tabular-nums` on all timecodes, latencies, tokens, and percentage scores.
- **DON'T**: Use `rounded-full` on buttons or inputs (**STRICT ZERO PILL BUTTONS**).
- **DON'T**: Default to generic AI-purple glows or unreadable low-contrast badge text.
- **DON'T**: Mix conflicting radius scales (e.g. 50px pill button inside a 4px sharp box).

---

## 8. Frontend Engineering Agent Prompt
```
Follow the Canonical LOCALIZE AI Design System (DESIGN.md):
- Canvas Base: #F0F6FC
- Card Surface: #FFFFFF (border #D0DFEE)
- Primary Accent: #2B7FFF (Signal Blue)
- Violet Accent: #7248EA (Neural Reasoning)
- Text Primary: #0F172A (Ink Slate)
- Geometry: 4px button/input radius (rounded-[4px]), 16px card radius (rounded-[16px]), 24px container radius (rounded-[24px]) — STRICTLY ZERO PILL BUTTONS.
- Typography: Inter/Roboto sans with tabular-nums for all numbers and metrics.
```
