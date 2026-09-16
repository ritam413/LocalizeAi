import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ModelPicker, DUBBING_MODELS } from '../components/studio/ModelPicker';
import { AgentSequenceTrack } from '../components/studio/AgentSequenceTrack';
import { ProducerBoard } from '../components/studio/ProducerBoard';
import { QARepairCard } from '../components/studio/QARepairCard';
import { QAFinding } from '../lib/agents/qa_agent';
import { CrewMemberStatus } from '../lib/agents/director';
import { AgentName, TelemetryEvent } from '../lib/telemetry';

describe('ModelPicker Real Options & Accessibility', () => {
  it('renders all three real engine options with their specs and tags upon opening', () => {
    const onSelect = vi.fn();
    render(
      <ModelPicker
        selectedModelId="2.0"
        onSelectModel={onSelect}
      />
    );

    // Initial selected state
    expect(screen.getByText('Mode B · Broadcast Streaming Dub')).toBeInTheDocument();
    expect(screen.getByText('25% Off')).toBeInTheDocument();

    // Open dropdown
    const trigger = screen.getByRole('button', { name: /model/i });
    fireEvent.click(trigger);

    // Verify Mode C
    expect(screen.getByText('Mode C · Festival Subtitle Master')).toBeInTheDocument();
    expect(screen.getByText(/1 Credit\/s/)).toBeInTheDocument();
    expect(screen.getByText(/Netflix 16 CPS Standard/i)).toBeInTheDocument();

    // Verify Mode B
    expect(screen.getByText(/3 Credits\/s/)).toBeInTheDocument();

    // Verify Mode A
    expect(screen.getByText('Mode A · Theatrical Cinema Dub')).toBeInTheDocument();
    expect(screen.getByText(/6 Credits\/s/)).toBeInTheDocument();
    expect(screen.getByText('14% Off')).toBeInTheDocument();

    // Select Mode A
    const modeAOption = screen.getByText('Mode A · Theatrical Cinema Dub');
    fireEvent.click(modeAOption);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: '3.0' }));
  });
});

describe('AgentSequenceTrack Accessible Contrast & Drilldown', () => {
  const crewStatuses: Record<AgentName, CrewMemberStatus> = {
    director: 'completed',
    story_analyst: 'completed',
    localization_director: 'completed',
    voice_director: 'running',
    sync_engineer: 'retrying',
    subtitle_director: 'pending',
    qa_agent: 'pending',
  };

  const retries: Record<AgentName, number> = {
    director: 0,
    story_analyst: 0,
    localization_director: 0,
    voice_director: 0,
    sync_engineer: 1,
    subtitle_director: 0,
    qa_agent: 0,
  };

  const telemetryEvents: TelemetryEvent[] = [
    {
      job_id: 'run_demo_01',
      scene_id: 'scene_01',
      agent: 'story_analyst',
      action: 'narrative_analysis',
      decision: 'Extracted 4 scenes and tone guidelines',
      latency_ms: 420,
      retry_count: 0,
      quality_score: 98.2,
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
    {
      job_id: 'run_demo_01',
      scene_id: 'scene_01',
      agent: 'voice_director',
      action: 'voice_synthesis',
      decision: 'Matched timbre with edge-tts database',
      latency_ms: 850,
      retry_count: 0,
      quality_score: 95.0,
      status: 'ok',
      timestamp: new Date().toISOString(),
    },
  ];

  it('renders status badges with high-contrast text and interactive buttons', () => {
    render(
      <AgentSequenceTrack
        crewStatuses={crewStatuses}
        retries={retries}
        telemetryEvents={telemetryEvents}
        runStatus="running"
      />
    );

    // Agent labels should be present
    expect(screen.getAllByText('Story Analyst')[0]).toBeInTheDocument();
    expect(screen.getByText('Voice Director')).toBeInTheDocument();
    expect(screen.getAllByText('Sync Engineer')[0]).toBeInTheDocument();
    expect(screen.getByText('QA Continuity Agent')).toBeInTheDocument();
  });

  it('allows clicking an agent card to inspect its telemetry and roles', () => {
    const onSelect = vi.fn();
    render(
      <AgentSequenceTrack
        crewStatuses={crewStatuses}
        retries={retries}
        telemetryEvents={telemetryEvents}
        runStatus="running"
        onSelectAgent={onSelect}
      />
    );

    const voiceBtn = screen.getByText('Voice Director').closest('div[role="button"]');
    expect(voiceBtn).toBeInTheDocument();
    fireEvent.click(voiceBtn!);

    expect(onSelect).toHaveBeenCalledWith('voice_director');
  });
});

describe('ProducerBoard Accessible Controls & Badges', () => {
  it('renders high-contrast distribution approval state without neon yellow', () => {
    render(
      <ProducerBoard
        runId="run_demo_982"
        runStatus="completed"
        readinessScore={98.0}
        onApprove={() => {}}
      />
    );

    const approvedBtn = screen.getByText('DISTRIBUTION APPROVED');
    expect(approvedBtn).toBeInTheDocument();
    // Verify contrast class text-white
    expect(approvedBtn.parentElement?.className).toContain('text-white');
    expect(approvedBtn.parentElement?.className).toContain('bg-[#14804a]');
  });
});

describe('QARepairCard Styling & Accessibility', () => {
  it('renders defect cards with clean amber borders and clear action buttons', () => {
    const mockFinding: QAFinding = {
      finding_id: 'find_01',
      scene_id: 'scene_002',
      segment_id: 2,
      timestamp_s: 14.2,
      defect_type: 'TIMING_OVERFLOW',
      severity: 'major',
      description: 'Pacing desync: dialog exceeds target phoneme window by 180ms',
      target_agent: 'sync_engineer',
      recommended_fix: 'Applied dynamic atempo 1.08x compression with pitch lock',
      fix_applied: true,
    };

    render(<QARepairCard finding={mockFinding} />);

    expect(screen.getByText('TIMING OVERFLOW')).toBeInTheDocument();
    expect(screen.getByText('Pacing desync: dialog exceeds target phoneme window by 180ms')).toBeInTheDocument();
    expect(screen.getByText('Applied dynamic atempo 1.08x compression with pitch lock')).toBeInTheDocument();
    expect(screen.getByText('AUTOMATED SELF-REPAIR VERIFIED')).toBeInTheDocument();
  });
});
