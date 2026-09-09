import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CrewStatus } from '../components/studio/CrewStatus';
import { QARepairCard } from '../components/studio/QARepairCard';
import { ReadinessGauge } from '../components/studio/ReadinessGauge';
import { AgentSequenceTrack, getOrganicProgress } from '../components/studio/AgentSequenceTrack';

describe('TICKET-10: Post-Production Studio Console UI', () => {
  it('renders all 7 crew members with live status badges', () => {
    const crewStatuses = {
      director: 'completed' as const,
      story_analyst: 'completed' as const,
      localization_director: 'completed' as const,
      voice_director: 'completed' as const,
      sync_engineer: 'retrying' as const,
      subtitle_director: 'pending' as const,
      qa_agent: 'running' as const,
    };

    const retries = {
      director: 0,
      story_analyst: 0,
      localization_director: 0,
      voice_director: 0,
      sync_engineer: 1,
      subtitle_director: 0,
      qa_agent: 0,
    };

    render(<CrewStatus crewStatuses={crewStatuses} retries={retries} />);

    expect(screen.getByText('Director')).toBeInTheDocument();
    expect(screen.getByText('Story Analyst')).toBeInTheDocument();
    expect(screen.getByText('Localization Director')).toBeInTheDocument();
    expect(screen.getByText('Voice Director')).toBeInTheDocument();
    expect(screen.getByText('Sync Engineer')).toBeInTheDocument();
    expect(screen.getByText('Subtitle Director')).toBeInTheDocument();
    expect(screen.getByText('QA / Continuity')).toBeInTheDocument();
    expect(screen.getByText('Retry #1')).toBeInTheDocument();
  });

  it('renders QA repair card displaying detected defect and self-repair resolution', () => {
    const finding = {
      finding_id: 'finding-07',
      scene_id: 'scene_07',
      segment_id: 7,
      timestamp_s: 3.2,
      defect_type: 'TIMING_OVERFLOW' as const,
      severity: 'critical' as const,
      description: 'Scene 7 dialogue exceeds speech window by 1.40s.',
      recommended_fix: 'Apply atempo 1.25x speed adjust via Sync Engineer.',
      target_agent: 'sync_engineer' as const,
      fix_applied: true,
    };

    render(<QARepairCard finding={finding} />);

    expect(screen.getByText('TIMING OVERFLOW')).toBeInTheDocument();
    expect(screen.getByText(/exceeds speech window by 1.40s/i)).toBeInTheDocument();
    expect(screen.getByText(/AUTOMATED SELF-REPAIR VERIFIED/i)).toBeInTheDocument();
  });

  it('renders readiness score meter with pass threshold indicator', () => {
    render(<ReadinessGauge score={94.5} threshold={85.0} />);
    expect(screen.getByText('94.5%')).toBeInTheDocument();
    expect(screen.getByText('RELEASE READY')).toBeInTheDocument();
  });

  it('calculates strictly monotonic organic progress with natural bumps and speedups', () => {
    expect(getOrganicProgress(0)).toBe(0);
    expect(getOrganicProgress(1)).toBe(1);

    // Verify monotonicity across 100 sample points
    let prev = 0;
    for (let i = 0; i <= 100; i++) {
      const u = i / 100;
      const prog = getOrganicProgress(u);
      expect(prog).toBeGreaterThanOrEqual(prev);
      expect(prog).toBeLessThanOrEqual(1.0);
      prev = prog;
    }

    // Verify speedup bursts (e.g. initial surge and neural synthesis phase)
    expect(getOrganicProgress(0.08)).toBeGreaterThan(0.12);
    expect(getOrganicProgress(0.50)).toBeGreaterThan(0.60);
  });

  it('renders AgentSequenceTrack with dynamic stage progress and linear counting timer', () => {
    const crewStatuses = {
      director: 'running' as const,
      story_analyst: 'completed' as const,
      localization_director: 'running' as const,
      voice_director: 'pending' as const,
      sync_engineer: 'pending' as const,
      subtitle_director: 'pending' as const,
      qa_agent: 'pending' as const,
    };

    const stageProgressMap = {
      localization_director: {
        elapsedSeconds: 2.955, // Halfway through 5.91s
        targetDuration: 5.91,
      },
    };

    render(
      <AgentSequenceTrack
        crewStatuses={crewStatuses}
        retries={{ director: 0, story_analyst: 0, localization_director: 0, voice_director: 0, sync_engineer: 0, subtitle_director: 0, qa_agent: 0 }}
        telemetryEvents={[]}
        stageProgressMap={stageProgressMap}
      />
    );

    // Localization Director card is present and displays dynamic linear elapsed time (2.96s)
    expect(screen.getByText(/2\.9[56]s/)).toBeInTheDocument();
    expect(screen.getByText('Serpentine Agent Workflow Route')).toBeInTheDocument();
  });
});
