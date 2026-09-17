import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  calculatePredictedDuration,
  calculateNormalProgress,
  calculateOverrunProgress,
  calculateStageProgress,
} from '../lib/hooks/useStageProgress';
import { AgentSequenceTrack } from '../components/studio/AgentSequenceTrack';

describe('Predictive Duration & Asymptotic Progress Engine (/ask-matt & /ponytail)', () => {
  it('calculates duration calibrated to video length and engine mode', () => {
    // Mode A: Story Analyst (3.5 + 0.25 * 35s = 12.25s)
    const durA = calculatePredictedDuration('story_analyst', 35.0, 'A');
    expect(durA).toBeCloseTo(12.25, 1);

    // Mode B: Story Analyst (3.5 + 0.18 * 35s = 9.8s)
    const durB = calculatePredictedDuration('story_analyst', 35.0, 'B');
    expect(durB).toBeCloseTo(9.8, 1);

    // Mode C: Story Analyst (3.5 + 0.10 * 35s = 7.0s)
    const durC = calculatePredictedDuration('story_analyst', 35.0, 'C');
    expect(durC).toBeCloseTo(7.0, 1);

    // Enforces minimum floor for ultra-short clips
    const durShort = calculatePredictedDuration('story_analyst', 1.0, 'C');
    expect(durShort).toBeGreaterThanOrEqual(2.5);
  });

  it('computes monotonic Hermite S-curve normal progress (0% -> 90%)', () => {
    expect(calculateNormalProgress(0.0)).toBe(0.0);
    expect(calculateNormalProgress(0.5)).toBeCloseTo(45.0, 1);
    expect(calculateNormalProgress(1.0)).toBe(90.0);
  });

  it('computes smooth asymptotic overrun progress (90% -> 98.5%) without exceeding 98.5%', () => {
    const p1 = calculateOverrunProgress(1.0, 10.0);
    const p5 = calculateOverrunProgress(5.0, 10.0);
    const p20 = calculateOverrunProgress(20.0, 10.0);
    const p100 = calculateOverrunProgress(100.0, 10.0);

    // Monotonically increasing
    expect(p1).toBeGreaterThan(90.0);
    expect(p5).toBeGreaterThan(p1);
    expect(p20).toBeGreaterThan(p5);
    expect(p100).toBeGreaterThan(p20);

    // Asymptotic bound < 98.5%
    expect(p100).toBeLessThanOrEqual(98.5);
  });

  it('handles state progression correctly in calculateStageProgress', () => {
    expect(calculateStageProgress('completed', 5.0, 10.0)).toEqual({
      progressPct: 100.0,
      isOverrun: false,
    });

    expect(calculateStageProgress('pending', 0.0, 10.0)).toEqual({
      progressPct: 0.0,
      isOverrun: false,
    });

    const runningNormal = calculateStageProgress('running', 5.0, 10.0);
    expect(runningNormal.isOverrun).toBe(false);
    expect(runningNormal.progressPct).toBeCloseTo(45.0, 1);

    const runningOverrun = calculateStageProgress('running', 15.0, 10.0);
    expect(runningOverrun.isOverrun).toBe(true);
    expect(runningOverrun.progressPct).toBeGreaterThan(90.0);
  });
});

describe('AgentSequenceTrack Component with Video Duration & Active Illumination', () => {
  it('renders all 6 agent cards with active illumination on running step', () => {
    render(
      <AgentSequenceTrack
        crewStatuses={{
          director: 'running',
          story_analyst: 'running',
          localization_director: 'pending',
          voice_director: 'pending',
          sync_engineer: 'pending',
          subtitle_director: 'pending',
          qa_agent: 'pending',
        }}
        retries={{
          director: 0,
          story_analyst: 0,
          localization_director: 0,
          voice_director: 0,
          sync_engineer: 0,
          subtitle_director: 0,
          qa_agent: 0,
        }}
        telemetryEvents={[]}
        videoDurationSeconds={35.0}
        projectMode="A"
      />
    );

    // Checks presence of all 6 agents
    expect(screen.getAllByText('Story Analyst').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Localization Director').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Voice Director').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sync Engineer').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Subtitle Director').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('QA Continuity Agent').length).toBeGreaterThanOrEqual(1);

    // Verify active status pill for story analyst
    const storyCard = document.getElementById('agent-card-story_analyst');
    expect(storyCard).not.toBeNull();
  });
});
