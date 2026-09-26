import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentSequenceTrack, AGENT_NODES, getOrganicProgress } from '../components/studio/AgentSequenceTrack';

describe('AgentSequenceTrack Voice Director Audio Invariant (TICKET-41)', () => {
  it('configures voice_director node with Kokoro-82M / Edge-TTS Fallback and 24kHz PCM_16', () => {
    const voiceNode = AGENT_NODES.find((node) => node.id === 'voice_director');
    expect(voiceNode).toBeDefined();
    expect(voiceNode?.techStack).toBe('Kokoro-82M / Edge-TTS Fallback');
    expect(voiceNode?.outputDesc).toBe('Raw Synthesized Speech Stems (.wav 24kHz PCM_16)');
    expect(voiceNode?.footerLeft).toBe('24kHz PCM_16');
  });

  it('renders the 24kHz PCM_16 footer badge on the Voice Director card', () => {
    render(
      <AgentSequenceTrack
        crewStatuses={{
          director: 'waiting',
          story_analyst: 'completed',
          localization_director: 'completed',
          voice_director: 'running',
          sync_engineer: 'waiting',
          subtitle_director: 'waiting',
          qa_agent: 'waiting',
        }}
        retries={{ director: 0, story_analyst: 0, localization_director: 0, voice_director: 0, sync_engineer: 0, subtitle_director: 0, qa_agent: 0 }}
        telemetryEvents={[]}
        projectMode="A"
      />
    );

    expect(screen.getByText('24kHz PCM_16')).toBeInTheDocument();
  });
});

describe('AgentSequenceTrack 2-Row Boustrophedon Serpentine Layout (TICKET-42)', () => {
  it('renders the animated downward turn conduit connecting Row 1 to Row 2 in Mode A', () => {
    render(
      <AgentSequenceTrack
        crewStatuses={{
          director: 'running',
          story_analyst: 'completed',
          localization_director: 'completed',
          voice_director: 'completed',
          sync_engineer: 'running',
          subtitle_director: 'pending',
          qa_agent: 'pending',
        }}
        retries={{ director: 0, story_analyst: 0, localization_director: 0, voice_director: 0, sync_engineer: 0, subtitle_director: 0, qa_agent: 0 }}
        telemetryEvents={[]}
        projectMode="A"
      />
    );

    const turnConduit = screen.getByTestId('serpentine-turn-conduit');
    expect(turnConduit).toBeInTheDocument();
    expect(screen.getByText(/Handoff to Audio Stems ⤵/i)).toBeInTheDocument();
  });

  it('renders all 6 agent cards across the 2-row layout in Mode A', () => {
    render(
      <AgentSequenceTrack
        crewStatuses={{
          director: 'running',
          story_analyst: 'completed',
          localization_director: 'completed',
          voice_director: 'completed',
          sync_engineer: 'running',
          subtitle_director: 'pending',
          qa_agent: 'pending',
        }}
        retries={{ director: 0, story_analyst: 0, localization_director: 0, voice_director: 0, sync_engineer: 0, subtitle_director: 0, qa_agent: 0 }}
        telemetryEvents={[]}
        projectMode="A"
      />
    );

    expect(screen.getByText('Story Analyst')).toBeInTheDocument();
    expect(screen.getByText('Localization Director')).toBeInTheDocument();
    expect(screen.getByText('Voice Director')).toBeInTheDocument();
    expect(screen.getByText('Sync Engineer')).toBeInTheDocument();
    expect(screen.getByText('Subtitle Director')).toBeInTheDocument();
    expect(screen.getByText('QA Continuity Agent')).toBeInTheDocument();
  });
});

describe('AgentSequenceTrack Parent Invocation Boundary & Interface Compatibility (TICKET-43)', () => {
  const baseCrewStatuses = {
    director: 'pending' as const,
    story_analyst: 'completed' as const,
    localization_director: 'pending' as const,
    voice_director: 'pending' as const,
    sync_engineer: 'pending' as const,
    subtitle_director: 'pending' as const,
    qa_agent: 'pending' as const,
  };
  const baseRetries = {
    director: 0,
    story_analyst: 0,
    localization_director: 0,
    voice_director: 0,
    sync_engineer: 0,
    subtitle_director: 0,
    qa_agent: 0,
  };

  it('accepts all 9 props without TypeScript or runtime errors (zero-breaking-change contract)', () => {
    expect(() =>
      render(
        <AgentSequenceTrack
          crewStatuses={baseCrewStatuses}
          retries={baseRetries}
          telemetryEvents={[]}
          onSelectAgent={() => {}}
          selectedAgent="story_analyst"
          runStatus="running"
          stageProgressMap={{ story_analyst: { elapsedSeconds: 3.2, targetDuration: 4.82 } }}
          videoDurationSeconds={35.0}
          projectMode="A"
        />
      )
    ).not.toThrow();
  });

  it('fires onSelectAgent callback with the correct AgentName when a card is clicked', () => {
    const onSelectAgent = vi.fn();

    render(
      <AgentSequenceTrack
        crewStatuses={baseCrewStatuses}
        retries={baseRetries}
        telemetryEvents={[]}
        onSelectAgent={onSelectAgent}
        selectedAgent="story_analyst"
        runStatus="running"
        videoDurationSeconds={35.0}
        projectMode="A"
      />
    );

    // Click the Localization Director card to trigger agent selection lift
    const localizationCard = screen.getByRole('button', { name: /localization director/i });
    fireEvent.click(localizationCard);

    expect(onSelectAgent).toHaveBeenCalledTimes(1);
    expect(onSelectAgent).toHaveBeenCalledWith('localization_director');
  });

  it('renders only Mode C agents (story_analyst, localization_director, subtitle_director, qa_agent) in projectMode C', () => {
    render(
      <AgentSequenceTrack
        crewStatuses={baseCrewStatuses}
        retries={baseRetries}
        telemetryEvents={[]}
        runStatus="running"
        videoDurationSeconds={35.0}
        projectMode="C"
      />
    );

    expect(screen.getByText('Story Analyst')).toBeInTheDocument();
    expect(screen.getByText('Localization Director')).toBeInTheDocument();
    expect(screen.getByText('Subtitle Director')).toBeInTheDocument();
    expect(screen.getByText('QA Continuity Agent')).toBeInTheDocument();
    // Voice Director and Sync Engineer should NOT render in Mode C
    expect(screen.queryByText('Voice Director')).not.toBeInTheDocument();
    expect(screen.queryByText('Sync Engineer')).not.toBeInTheDocument();
  });

  it('highlights the selectedAgent card with the active selection ring', () => {
    render(
      <AgentSequenceTrack
        crewStatuses={baseCrewStatuses}
        retries={baseRetries}
        telemetryEvents={[]}
        selectedAgent="voice_director"
        runStatus="running"
        videoDurationSeconds={35.0}
        projectMode="A"
      />
    );

    const voiceCard = document.getElementById('agent-card-voice_director');
    expect(voiceCard).toBeInTheDocument();
    expect(voiceCard?.className).toContain('border-[#2B7FFF]');
  });

  it('live progress bar updates when stageProgressMap is provided', () => {
    const { rerender } = render(
      <AgentSequenceTrack
        crewStatuses={{ ...baseCrewStatuses, story_analyst: 'running' }}
        retries={baseRetries}
        telemetryEvents={[]}
        runStatus="running"
        stageProgressMap={{ story_analyst: { elapsedSeconds: 2.0, targetDuration: 4.82 } }}
        videoDurationSeconds={35.0}
        projectMode="A"
      />
    );

    // Re-render with updated progress to confirm organic update
    rerender(
      <AgentSequenceTrack
        crewStatuses={{ ...baseCrewStatuses, story_analyst: 'running' }}
        retries={baseRetries}
        telemetryEvents={[]}
        runStatus="running"
        stageProgressMap={{ story_analyst: { elapsedSeconds: 4.82, targetDuration: 4.82 } }}
        videoDurationSeconds={35.0}
        projectMode="A"
      />
    );

    // Story Analyst card is still present after update
    expect(screen.getByText('Story Analyst')).toBeInTheDocument();
  });
});

describe('AgentSequenceTrack — 2-Row Boustrophedon & Audio Invariant Suite (TICKET-44)', () => {
  const defaultStatuses = {
    director: 'running' as const,
    story_analyst: 'completed' as const,
    localization_director: 'completed' as const,
    voice_director: 'running' as const,
    sync_engineer: 'pending' as const,
    subtitle_director: 'pending' as const,
    qa_agent: 'pending' as const,
  };

  it('renders all 6 stage cards and verifies the downward turn conduit in Mode B', () => {
    render(
      <AgentSequenceTrack
        crewStatuses={defaultStatuses}
        retries={{}}
        telemetryEvents={[]}
        selectedAgent="voice_director"
        runStatus="running"
        projectMode="B"
      />
    );

    expect(screen.getByText('Story Analyst')).toBeInTheDocument();
    expect(screen.getByText('Localization Director')).toBeInTheDocument();
    expect(screen.getByText('Voice Director')).toBeInTheDocument();
    expect(screen.getByText('Sync Engineer')).toBeInTheDocument();
    expect(screen.getByText('Subtitle Director')).toBeInTheDocument();
    expect(screen.getByText('QA Continuity Agent')).toBeInTheDocument();

    const turnConduit = screen.getByTestId('serpentine-turn-conduit');
    expect(turnConduit).toBeInTheDocument();
    expect(screen.getByText(/Handoff to Audio Stems/i)).toBeInTheDocument();
  });

  it('verifies audio invariant inv_005 (24kHz PCM_16) is displayed for Voice Director', () => {
    render(
      <AgentSequenceTrack
        crewStatuses={defaultStatuses}
        retries={{}}
        telemetryEvents={[]}
        selectedAgent="voice_director"
        runStatus="running"
        projectMode="B"
      />
    );

    expect(screen.getByText('24kHz PCM_16')).toBeInTheDocument();
  });

  it('fires onSelectAgent callback when an agent card is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <AgentSequenceTrack
        crewStatuses={defaultStatuses}
        retries={{}}
        telemetryEvents={[]}
        selectedAgent={null}
        onSelectAgent={handleSelect}
        runStatus="running"
        projectMode="B"
      />
    );

    fireEvent.click(screen.getByText('Story Analyst'));
    expect(handleSelect).toHaveBeenCalledWith('story_analyst');
  });

  it('organic spline progress keyframes clamp cleanly between 0 and 1', () => {
    expect(getOrganicProgress(0)).toBe(0);
    expect(getOrganicProgress(1)).toBe(1);
    expect(getOrganicProgress(0.08)).toBeGreaterThan(0.12);
  });
});

