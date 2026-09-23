# Serpentine Agent Workflow Route Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the 2-row boustrophedon (snake flow) Serpentine Agent Workflow Route layout in `frontend/components/studio/AgentSequenceTrack.tsx` with animated SVG downward turn conduit, right-to-left Row 2 progression, 4px anti-slop geometry tokens, GPU-accelerated motion, and updated 24kHz PCM_16 audio metadata.

**Architecture:** Decompose the agent sequence track into Row 1 (Steps 01 ➔ 02 ➔ 03, L-to-R), an animated corner turn conduit linking Step 03 down to Step 04, and Row 2 (Steps 06 ⮌ 05 ⮌ 04, R-to-L) while retaining linear/asymptotic spline time interpolation (`useStageProgress`) and telemetry bindings.

**Tech Stack:** Next.js 16 / React 19, Tailwind CSS v4, Lucide React icons, Vitest / React Testing Library.

## Global Constraints & Design Intelligence

- **Design System (`/taste-skill`):** Light-Blue Mintlify (`#F0F6FC` base, `#FFFFFF` cards with `#D0DFEE` borders, `#2B7FFF` Signal Blue, `#0F172A` Ink Slate, 4px button/badge radius, 16px container radius, strictly ZERO pill buttons). Dials: `DESIGN_VARIANCE: 4`, `MOTION_INTENSITY: 5`, `VISUAL_DENSITY: 6`.
- **Anti-Slop Geometry (`/awesome-design`):** 4px box radius on all buttons, chips, and directional connector badges (`w-5 h-5 rounded-[4px] bg-white border border-[#D0DFEE]`).
- **Domain Invariant `inv_005`:** Speech stems are 24,000 Hz 16-bit PCM WAV (`24kHz PCM_16 WAV`), not 48kHz.
- **Hardware-Accelerated Motion (`/animate`):** GPU transforms (`scaleX` with `transform-origin: left`, `active:scale-[0.98]`), `motion-safe:animate-pulse` on SVG dashed conduit, and `prefers-reduced-motion` compliance.
- **Pure Frontend Execution:** Zero backend code modifications.
- **Component Seam:** Modify only `frontend/components/studio/AgentSequenceTrack.tsx` and verify with `frontend/__tests__/studio_console.test.tsx` and `frontend/__tests__/AgentSequenceTrack.test.tsx`.

---

### Task 1: Update Invariant Metadata & Add Unit Test Specs for 2-Row Serpentine Flow

**Files:**
- Create: `frontend/__tests__/AgentSequenceTrack.test.tsx`
- Modify: `frontend/components/studio/AgentSequenceTrack.tsx:54-139`

**Interfaces:**
- Consumes: `AgentSequenceTrackProps` (`crewStatuses`, `retries`, `telemetryEvents`, `onSelectAgent`, `selectedAgent`, `runStatus`, `stageProgressMap`, `videoDurationSeconds`, `projectMode`)
- Produces: `AGENT_NODES` with updated `24kHz PCM_16 WAV` descriptions and full test coverage for 2-row layout rendering and turn conduits.

- [ ] **Step 1: Write the failing unit tests for the 2-row serpentine track**

```tsx
// frontend/__tests__/AgentSequenceTrack.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AgentSequenceTrack } from '../components/studio/AgentSequenceTrack';

describe('AgentSequenceTrack 2-Row Serpentine Flow', () => {
  const defaultStatuses = {
    director: 'idle',
    story_analyst: 'completed',
    localization_director: 'completed',
    voice_director: 'completed',
    sync_engineer: 'running',
    subtitle_director: 'pending',
    qa_agent: 'pending',
  } as const;

  const defaultRetries = {
    director: 0,
    story_analyst: 0,
    localization_director: 0,
    voice_director: 0,
    sync_engineer: 1,
    subtitle_director: 0,
    qa_agent: 0,
  };

  it('renders both Row 1 and Row 2 in boustrophedon sequence with turn conduit', () => {
    render(
      <AgentSequenceTrack
        crewStatuses={defaultStatuses}
        retries={defaultRetries}
        telemetryEvents={[]}
        projectMode="A"
      />
    );

    // Track Title
    expect(screen.getByText('Serpentine Agent Workflow Route')).toBeInTheDocument();

    // Verify All 6 Agent Cards are rendered
    expect(screen.getByText('Story Analyst')).toBeInTheDocument();
    expect(screen.getByText('Localization Director')).toBeInTheDocument();
    expect(screen.getByText('Voice Director')).toBeInTheDocument();
    expect(screen.getByText('Sync Engineer')).toBeInTheDocument();
    expect(screen.getByText('Subtitle Director')).toBeInTheDocument();
    expect(screen.getByText('QA Continuity Agent')).toBeInTheDocument();

    // Verify Downward Turn Conduit is present
    expect(screen.getByTestId('serpentine-turn-conduit')).toBeInTheDocument();

    // Verify 24kHz invariant text in Voice Director configuration
    expect(screen.getByText('24kHz PCM_16')).toBeInTheDocument();
  });

  it('triggers onSelectAgent when an agent card is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <AgentSequenceTrack
        crewStatuses={defaultStatuses}
        retries={defaultRetries}
        telemetryEvents={[]}
        onSelectAgent={handleSelect}
      />
    );

    const voiceCard = screen.getByRole('button', { name: /Voice Director/i });
    fireEvent.click(voiceCard);
    expect(handleSelect).toHaveBeenCalledWith('voice_director');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend; npx vitest run __tests__/AgentSequenceTrack.test.tsx`
Expected: FAIL with missing test id `serpentine-turn-conduit` and missing text `24kHz PCM_16`.

- [ ] **Step 3: Update `AGENT_NODES` metadata in `AgentSequenceTrack.tsx`**

Update `outputDesc` and `footerLeft` for `voice_director` from `48kHz` to `24kHz PCM_16` adhering to `inv_005`:
```typescript
  {
    id: 'voice_director',
    stepNumber: '03',
    stepLabel: 'Voice Director',
    role: 'Neural Voice Casting & TTS Synthesis',
    techStack: 'Kokoro-82M / Edge-TTS Fallback',
    inputDesc: 'Adapted Dialogue Script + Speaker Timestamps',
    outputDesc: 'Raw Synthesized Speech Stems (.wav 24kHz PCM_16)',
    defaultLatency: 6840,
    row: 1,
    positionInRow: 2,
    footerLeft: '24kHz PCM_16',
    footerRight: '0 retries',
  },
```

---

### Task 2: Implement 2-Row Boustrophedon Layout & Turn Conduit in `AgentSequenceTrack.tsx`

**Files:**
- Modify: `frontend/components/studio/AgentSequenceTrack.tsx:320-368`

**Interfaces:**
- Consumes: `displayNodes` partitioned into `row1Nodes` (steps 01, 02, 03) and `row2Nodes` (steps 06, 05, 04)
- Produces: 2-Row visual grid with inter-card horizontal conduit connectors (`➔` for Row 1, `⮌` for Row 2 with 4px box geometry) and an animated downward SVG turn conduit (`32px × 32px`).

- [ ] **Step 1: Partition Row 1 and Row 2 Nodes in `AgentSequenceTrack.tsx`**

```tsx
  const row1Nodes = displayNodes.filter((n) => n.row === 1);
  const row2Nodes = displayNodes.filter((n) => n.row === 2);
  const row2VisualOrder = [...row2Nodes].sort((a, b) => b.positionInRow - a.positionInRow);
```

- [ ] **Step 2: Render 2-Row Boustrophedon Layout with Animated SVG Conduit & 4px Conduits**

```tsx
      {/* 2-ROW SERPENTINE WORKFLOW GRAPH */}
      <div className="space-y-2 relative" id="serpentine-track-container">
        {/* ROW 1: Steps 01 -> 02 -> 03 (Going Right ➔) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center relative">
          {row1Nodes.map((node, idx) => (
            <div key={node.id} className="relative flex items-center">
              <div className="w-full">
                <AgentCard
                  node={node}
                  status={getAgentStatus(node.id)}
                  isSelected={activeAgent === node.id}
                  retryCount={retries[node.id] || 0}
                  latencyMs={getAgentLatency(node)}
                  progressInfo={stageProgressMap?.[node.id]}
                  videoDurationSec={videoDurationSeconds}
                  projectMode={projectMode}
                  onClick={() => handleSelect(node.id)}
                />
              </div>
              {idx < row1Nodes.length - 1 && (
                <div className="hidden md:flex absolute -right-2.5 z-10 w-5 h-5 rounded-[4px] bg-white border border-[#D0DFEE] items-center justify-center text-[#2B7FFF] text-[10px] font-bold shadow-xs">
                  ➔
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Downward Turn Conduit linking Row 1 Step 03 down into Row 2 Step 04 */}
        <div
          data-testid="serpentine-turn-conduit"
          className="hidden md:flex items-center justify-end pr-10 -my-1.5 relative h-8 select-none"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-bold px-2 py-0.5 rounded-[4px] bg-[#F0F6FC] border border-[#D0DFEE] text-[#475569] uppercase tracking-wider">
              Handoff to Audio Stems ⤵
            </span>
            <svg className="w-8 h-8 text-[#2B7FFF]" viewBox="0 0 32 32" fill="none">
              <path
                d="M 16,2 L 16,18 A 8,8 0 0,1 8,26 L 2,26"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="4 2"
                className="motion-safe:animate-pulse"
              />
            </svg>
          </div>
        </div>

        {/* ROW 2: Steps 04 <- 05 <- 06 (Going Left ⮌) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center relative">
          {row2VisualOrder.map((node, idx) => (
            <div key={node.id} className="relative flex items-center">
              <div className="w-full">
                <AgentCard
                  node={node}
                  status={getAgentStatus(node.id)}
                  isSelected={activeAgent === node.id}
                  retryCount={retries[node.id] || 0}
                  latencyMs={getAgentLatency(node)}
                  progressInfo={stageProgressMap?.[node.id]}
                  videoDurationSec={videoDurationSeconds}
                  projectMode={projectMode}
                  onClick={() => handleSelect(node.id)}
                />
              </div>
              {idx < row2VisualOrder.length - 1 && (
                <div className="hidden md:flex absolute -right-2.5 z-10 w-5 h-5 rounded-[4px] bg-white border border-[#D0DFEE] items-center justify-center text-[#2B7FFF] text-[10px] font-bold shadow-xs">
                  ⮌
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
```

- [ ] **Step 3: Run Vitest unit tests to verify**

Run: `cd frontend; npx vitest run __tests__/AgentSequenceTrack.test.tsx __tests__/studio_console.test.tsx`
Expected: PASS with 100% test assertions passing.

---

### Task 3: Regression Verification & Handoff Tracking

**Files:**
- Modify: `TRACKER.md`
- Modify: `features_implemented.md`

- [ ] **Step 1: Execute complete frontend test suite**

Run: `cd frontend; npm test`
Expected: 121+ passing tests with 0 failures.

- [ ] **Step 2: Update `features_implemented.md` and `TRACKER.md`**

Record the 2-row serpentine track fix, test results, and verified invariants.
