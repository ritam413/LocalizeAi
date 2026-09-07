# Autonomous Multi-Agent Sequence & Timing Visualizer (Ditto × Netflix Sans Edition)

This implementation plan details the technical architecture, visual tokens, and motion design for showcasing how each autonomous agent in **LOCALIZE** works on its own and in sequential coordination, strictly adhering to the official [Docs/14-design.md](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/Docs/14-design.md) specification (**Ditto Colors × Netflix Sans Typography**).

---

## User Review Required

> [!IMPORTANT]
> **We are currently in the PLANNING PHASE.** No production code will be modified until you review and approve this implementation plan.

> [!TIP]
> You can preview the updated interactive prototype right now by opening [mock_agent_sequence_visualizer.html](file:///c:/CCodes_WebDevelopment\hckthon\localize_movie_dub\mock_agent_sequence_visualizer.html) in your browser, and review the authoritative design tokens in [Docs/14-design.md](file:///c:/CCodes_WebDevelopment\hckthon\localize_movie_dub\Docs\14-design.md).

![Ditto Netflix Mockup Preview](ditto_netflix_agent_visualizer_mockup_1788726860864.jpg)

---

## Design System & Tokens ([Docs/14-design.md](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/Docs/14-design.md))

Following the authoritative **Ditto × Netflix Sans** specification and **Emil Kowalski's Design Engineering philosophy** (`/emil-design-eng`):

1. **Color Palette & Atmospheric Surfaces (Ditto)**:
   - **Canvas**: Warm Cream (`--color-canvas: #f9fbf2`)
   - **Elevated Surfaces**: Soft Meadow (`--color-soft-meadow: #eff2e5`) with Deep Ink borders (`--color-deep-ink: #130e30`)
   - **Primary Action (Highlighter)**: Hi-Yellow (`--color-hi-yellow: #ffe228`) — 16.2:1 contrast against `#130e30`
   - **Text**: Deep Ink (`#130e30`), Slate (`#5f5c6e`)
   - **Accents**: Moss Green (`#59e25d`) for success & completed stems; Fuchsia (`#e261e5`) for targeted retry loops
2. **Typography Hierarchy (Netflix Sans)**:
   - Marquee headers & wordmarks at **900 weight** (`LOCALIZE`).
   - High-contrast Deep Ink titles (`#130e30`) and slate helper metadata (`#5f5c6e`).
   - Monospaced numerals for real-time execution tickers (`JetBrains Mono`, `font-variant-numeric: tabular-nums`).
3. **Serpentine (Boustrophedon) 2-Row Progressive Reveal**:
   - **Initial State**: Only Step 01 (Story Analyst) is visible in active execution state (`RUNNING`). Steps 02–06 start hidden in an Emil Kowalski rest state (`opacity: 0; transform: scale(0.95) translateY(6px)`).
   - **Row 1 (Left to Right ➔)**: Step 01 (Story Analyst) ➔ Step 02 (Localization Director) ➔ Step 03 (Voice Director).
   - **Downward Corner Turn (⤵)**: When Step 03 finishes, an animated downward SVG connector draws into Row 2 (*"Handoff Down to Audio Stems ⤵"*).
   - **Row 2 (Right to Left 🠔)**: Step 04 (Sync Engineer) 🠔 Step 05 (Subtitle Director) 🠔 Step 06 (QA Continuity Agent).
   - **Targeted Self-Repair Loop**: Direct Fuchsia / Hi-Yellow feedback arc from Step 06 back across Row 2 to Step 04 (Sync Engineer).
4. **The Producer Board**:
   - Soft Meadow sidebar summarizing continuity, active locks, lip-sync drift (<18ms), and primary Hi-Yellow `#ffe228` filled `APPROVE FOR DISTRIBUTION` button.
5. **Micro-Interactions**:
   - `:active` press scale: `scale(0.97)`
   - Smooth 220ms ease-out transitions (`cubic-bezier(0.23, 1, 0.32, 1)`)

---

## Proposed Changes

### Frontend Design & Components

---

#### [NEW] [AgentSequenceTrack.tsx](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/frontend/components/studio/AgentSequenceTrack.tsx)
- Reusable React component rendering the 2-row serpentine boustrophedon sequence graph styled in Ditto Warm Canvas/Soft Meadow and Netflix Sans typography.
- Handles progressive reveal, real-time timer progression, active node highlight, pulse animations, and expandable telemetry drilldowns.

#### [NEW] [ProducerBoard.tsx](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/frontend/components/studio/ProducerBoard.tsx)
- Executive sidebar in Soft Meadow/Deep Ink displaying cumulative pipeline latencies, token consumption, QA continuity score, and the Hi-Yellow `#ffe228` approval trigger.

#### [MODIFY] [CrewStatus.tsx](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/frontend/components/studio/CrewStatus.tsx)
- Update color scheme to Ditto palette with live execution latency meters and smooth state transitions.

#### [MODIFY] [page.tsx](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/frontend/app/runs/%5Bid%5D/page.tsx)
- Integrate the `AgentSequenceTrack` and `ProducerBoard` into the Studio Console tab on the run dashboard.
- Connect WebSocket real-time telemetry events (`job_id`, `agent`, `latency_ms`, `retry_count`, `quality_score`, `status`) to live timers and status indicators.

---

## Verification Plan

### Automated Tests
- Run Vitest component tests in `frontend/`:
  ```bash
  npm test
  ```
- Run TypeScript type checks:
  ```bash
  npx tsc --noEmit
  ```
- Run backend telemetry & agent tests:
  ```bash
  pytest backend/tests
  ```

### Manual Verification
1. Open the updated prototype in browser: [mock_agent_sequence_visualizer.html](file:///c:/CCodes_WebDevelopment\hckthon\localize_movie_dub\mock_agent_sequence_visualizer.html)
2. Trigger the "Simulate Step-by-Step Flow" button to verify the progressive reveal (Row 1 L->R, downward conduit, Row 2 R->L) and millisecond tickers.
3. Trigger "Demo Targeted Self-Repair" to verify the reverse feedback conduit across Row 2 and quality score recovery.
