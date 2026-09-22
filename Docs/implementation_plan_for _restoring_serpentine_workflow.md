# Implementation Plan — Restore Serpentine Agent Workflow Route (2-Row Boustrophedon)

Restore the 2-row boustrophedon (snake-flow) Serpentine Agent Workflow Route in `frontend/components/studio/AgentSequenceTrack.tsx`, replacing the flattened 6-column grid with Row 1 (Left ➔ Right: Steps 01, 02, 03), an animated SVG downward turn conduit (`03 ➔ 04`), and Row 2 (Right ➔ Left: Steps 04 ⮌ 05 ⮌ 06), while enforcing anti-slop geometry tokens, GPU-accelerated motion, and domain invariant `inv_005` (`24kHz PCM_16 WAV`).

---

## 1. Design Intelligence & Anti-Slop Specification

### A. Design Read & Dials (`/taste-skill`)
> **Design Read:** Mission-critical AI post-production studio console for film & video localization engineers. Light-Blue Mintlify design system (`#F0F6FC` canvas, `#FFFFFF` cards, `#D0DFEE` borders, `#2B7FFF` Signal Blue, `#0F172A` Ink Slate), strictly **zero pill buttons** (4px radius geometry), tabular timing precision, and restrained mechanical motion.

| Dial | Value | Rationale |
|---|---|---|
| `DESIGN_VARIANCE` | **4** | Structured 2-row boustrophedon routing with strict grid alignment |
| `MOTION_INTENSITY` | **5** | Subtle pulsing turn conduit, tactile card press (`scale-[0.98]`), spline tickers |
| `VISUAL_DENSITY` | **6** | Studio technical metadata (24kHz PCM_16, latency tickers, retries) |

### B. Anti-Slop Geometry Matrix (`/awesome-design`)
| Element | Slop / Default | Anti-Slop Enforced Token | Tailwind Class |
|---|---|---|---|
| **Buttons & Badges** | `rounded-full` (Pill Slop) | **4px Box Radius** | `rounded-[4px]` |
| **Directional Conduits (`➔`, `⮌`)** | Floating circle pill | **Square Matrix Node** | `w-5 h-5 rounded-[4px] bg-white border border-[#D0DFEE]` |
| **Downward Turn Conduit Badge** | Rounded pill tag | **Technical Chip** | `rounded-[4px] bg-[#F0F6FC] border border-[#D0DFEE] text-[#475569]` |
| **Agent Card Surface** | `rounded-3xl` / `rounded-xl` | **16px Precision Card** | `rounded-[16px] border border-[#D0DFEE] bg-white` |
| **Container Frame** | `rounded-lg` | **24px Section Frame** | `rounded-[24px]` / `rounded-[16px]` |
| **Active Card Selection** | Inset glow / generic shadow | **2px Signal Blue Frame** | `border-[#2B7FFF] ring-2 ring-[#2B7FFF]/20` |

### C. Component State Matrix & A11y (`/ui-ux-pro-max`)
| State | Visual Affordance | Tailwind & Tokens | A11y / ARIA |
|---|---|---|---|
| **`pending` / `idle`** | Muted slate surface, dashed progress placeholder | `border-[#D0DFEE] bg-white text-[#64748B]` | `aria-label="[Step] [Name] - Idle"` |
| **`running`** | Signal Blue pulse dot, live spline progress bar, active glow | `border-[#2B7FFF] ring-2 ring-[#2B7FFF]/20 bg-[#F0F6FC]/50` | `aria-live="polite" aria-busy="true"` |
| **`completed`** | Forest Emerald badge, checkmark icon, locked latency | `border-[#10B981]/30 bg-white text-[#047857]` | `aria-label="[Step] [Name] - Completed"` |
| **`failed` / `retrying`** | Amber/Rose border, retry multiplier chip (`×1`) | `border-[#EF4444] bg-[#FEF2F2] text-[#B91C1C]` | `role="alert" aria-label="Retry [N]"` |
| **`selected`** | Signal Blue focus boundary with tactile depression | `border-[#2B7FFF] shadow-xs active:scale-[0.98]` | `aria-selected="true"` |

- **Responsive Grid**:
  - **Desktop (`≥ 768px`)**: 2-Row Boustrophedon Grid (`md:grid-cols-3 gap-3`) with inter-card `➔` / `⮌` badges and downward SVG turn conduit.
  - **Mobile (`< 768px`)**: Single-column vertical flow (`grid-cols-1 gap-2.5`) with downward step progression (`↓`).
- **A11y Standards (WCAG 2.1 AA)**:
  - Tabular numerals (`tabular-nums font-mono`) on step numbers, timers, and latencies.
  - Full keyboard focusability (`tabIndex={0}`, `focus-visible:ring-2 focus-visible:ring-[#2B7FFF]`).
  - `prefers-reduced-motion` support (`motion-reduce:animate-none`, `motion-reduce:transform-none`).

### D. Hardware-Accelerated Motion Specification (`/animate`)
- **Card Press**: `active:scale-[0.98]` (`transition-transform duration-100 ease-out`).
- **Card Hover**: `transition-[border-color,box-shadow] duration-150 ease-out`.
- **Progress Bar Fill**: GPU `transform: scaleX(...)` with `transform-origin: left` (`transition: transform 200ms cubic-bezier(0.23, 1, 0.32, 1)`).
- **Turn Conduit Path**: SVG `stroke-dasharray="4 2"` with `motion-safe:animate-pulse`.
- **Zero layout thrashing**: No transitions on `width`, `height`, `top`, or `left`.

---

## 2. Invariant & Implementation Slices (`agentmemory` `inv_014` & `inv_005`)

### Slice A: Metadata & Audio Invariant (`inv_005`)
- File: `frontend/components/studio/AgentSequenceTrack.tsx` (Lines 54-139)
- Update `voice_director`:
  - `techStack: 'Kokoro-82M / Edge-TTS Fallback'`
  - `outputDesc: 'Raw Synthesized Speech Stems (.wav 24kHz PCM_16)'`
  - `footerLeft: '24kHz PCM_16'`

### Slice B: 2-Row Boustrophedon Grid & SVG Turn Conduit
- File: `frontend/components/studio/AgentSequenceTrack.tsx` (Lines 320-366)
- Partition `displayNodes`:
  - `row1Nodes = displayNodes.filter(n => n.row === 1)` (Render 01 ➔ 02 ➔ 03 with `➔` nodes).
  - Downward Turn Conduit: `data-testid="serpentine-turn-conduit"` with `Handoff to Audio Stems ⤵` chip and animated dashed SVG path.
  - `row2Nodes = displayNodes.filter(n => n.row === 2)` sorted descending by `positionInRow` (Render 04 ⮌ 05 ⮌ 06 with `⮌` nodes).

### Slice C: Parent Invocation Boundary
- Files: `frontend/app/runs/demo/page.tsx` & `frontend/app/runs/[id]/page.tsx`
- Interface bindings (`crewStatuses`, `retries`, `telemetryEvents`, `onSelectAgent`, `selectedAgent`, `runStatus`, `stageProgressMap`, `videoDurationSeconds`, `projectMode`) remain 100% backward compatible.

### Slice D: Unit Test Suite
- Create: `frontend/__tests__/AgentSequenceTrack.test.tsx`
- Asserts:
  - 2-row layout rendering and card count.
  - Presence of `data-testid="serpentine-turn-conduit"`.
  - `24kHz PCM_16` badge text.
  - Agent selection callback on click.
  - 4px geometry token compliance.

---

## 3. Verification Plan

### Automated Tests
```bash
# 1. Run dedicated Serpentine Track unit test suite
cd frontend && npx vitest run __tests__/AgentSequenceTrack.test.tsx

# 2. Run studio console integration tests
cd frontend && npx vitest run __tests__/studio_console.test.tsx

# 3. Run full frontend regression suite
cd frontend && npm test
```

### Manual Verification
- Visual inspection on `http://localhost:3000/runs/demo` to confirm:
  - Row 1 leads left-to-right (01 Story Analyst ➔ 02 Localization Director ➔ 03 Voice Director).
  - Downward turn conduit animates smoothly into Row 2.
  - Row 2 progresses right-to-left (04 Sync Engineer ⮌ 05 Subtitle Director ⮌ 06 QA Continuity Agent).
  - All buttons and badges maintain crisp 4px box geometry with zero pill buttons.

---

## 4. Handoff & Memory Tracking
- Update `TRACKER.md` with execution log and verification results.
- Update `features_implemented.md` reflecting the 2-row boustrophedon serpentine workflow route.
