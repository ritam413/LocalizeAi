import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import {
  Skeleton,
  RunListSkeleton,
  StudioConsoleSkeleton,
  MasterVideoPreviewSkeleton,
  MultiAudioPlayerSkeleton,
  AgentSequenceTrackSkeleton,
  ProducerBoardSkeleton,
  DecisionFeedSkeleton,
  QARepairCardSkeleton,
  ReadinessGaugeSkeleton,
  BeforeAfterPlayerSkeleton,
  SubtitleEditorSkeleton,
  OutputDeliverablesSkeleton,
  ModelRegistrySkeleton,
  SettingsSkeleton,
} from '../components/ui/skeleton';

describe('Impeccable Skeleton Loading System', () => {
  describe('Skeleton Primitive', () => {
    it('renders with accessible role status and aria-busy attributes', () => {
      render(<Skeleton width={100} height={20} ariaLabel="Loading profile..." />);
      const el = screen.getByRole('status');
      expect(el).toBeTruthy();
      expect(el.getAttribute('aria-busy')).toBe('true');
      expect(screen.getByText('Loading profile...')).toBeTruthy();
    });

    it('renders with different variants correctly', () => {
      const { rerender } = render(<Skeleton variant="card" data-testid="skel-card" />);
      expect(screen.getByTestId('skel-card').className).toContain('rounded-[24px]');

      rerender(<Skeleton variant="circular" data-testid="skel-circ" />);
      expect(screen.getByTestId('skel-circ').className).toContain('rounded-full');

      rerender(<Skeleton variant="pill" data-testid="skel-pill" />);
      expect(screen.getByTestId('skel-pill').className).toContain('h-6');

      rerender(<Skeleton variant="button" data-testid="skel-btn" />);
      expect(screen.getByTestId('skel-btn').className).toContain('h-9');
    });

    it('applies shimmer animation class by default', () => {
      render(<Skeleton data-testid="skel-anim" />);
      expect(screen.getByTestId('skel-anim').className).toContain('animate-shimmer');
    });
  });

  describe('Domain & Page Skeleton Loaders', () => {
    it('renders RunListSkeleton table rows', () => {
      render(
        <table>
          <tbody>
            <RunListSkeleton rows={3} />
          </tbody>
        </table>
      );
      const rows = screen.getAllByRole('status');
      expect(rows.length).toBeGreaterThan(0);
    });

    it('renders StudioConsoleSkeleton with complete workbench skeleton', () => {
      const { container } = render(<StudioConsoleSkeleton />);
      expect(container.querySelectorAll('[role="status"]').length).toBeGreaterThan(10);
    });

    it('renders MasterVideoPreviewSkeleton with 16:9 viewport placeholder', () => {
      const { container } = render(<MasterVideoPreviewSkeleton />);
      expect(container.querySelector('.aspect-video')).toBeTruthy();
    });

    it('renders MultiAudioPlayerSkeleton with waveform placeholder', () => {
      const { container } = render(<MultiAudioPlayerSkeleton />);
      expect(container.querySelector('.aspect-video')).toBeTruthy();
      expect(container.querySelectorAll('.rounded-t').length).toBe(32);
    });

    it('renders AgentSequenceTrackSkeleton with 7 agent node placeholders', () => {
      const { container } = render(<AgentSequenceTrackSkeleton />);
      expect(container.querySelectorAll('.rounded-2xl').length).toBe(7);
    });

    it('renders ProducerBoardSkeleton with metrics and readiness gauge skeleton', () => {
      const { container } = render(<ProducerBoardSkeleton />);
      expect(container.querySelector('.w-28')).toBeTruthy();
    });

    it('renders DecisionFeedSkeleton with multiple items', () => {
      const { container } = render(<DecisionFeedSkeleton items={4} />);
      expect(container.querySelectorAll('.rounded-2xl').length).toBe(4);
    });

    it('renders QARepairCardSkeleton with comparison box', () => {
      const { container } = render(<QARepairCardSkeleton />);
      expect(container.querySelector('.rounded-xl')).toBeTruthy();
    });

    it('renders ReadinessGaugeSkeleton with circular score placeholder', () => {
      const { container } = render(<ReadinessGaugeSkeleton />);
      expect(container.querySelector('.w-28')).toBeTruthy();
    });

    it('renders BeforeAfterPlayerSkeleton with dual audio card skeletons', () => {
      const { container } = render(<BeforeAfterPlayerSkeleton />);
      expect(container.querySelectorAll('.rounded-2xl').length).toBe(2);
    });

    it('renders SubtitleEditorSkeleton with table rows and headers', () => {
      render(<SubtitleEditorSkeleton rows={4} />);
      expect(screen.getByText('Dialogue Window')).toBeTruthy();
      expect(screen.getByText('Reading CPS')).toBeTruthy();
    });

    it('renders OutputDeliverablesSkeleton with artifact cards', () => {
      const { container } = render(<OutputDeliverablesSkeleton cards={4} />);
      expect(container.querySelectorAll('.rounded-\\[24px\\]').length).toBe(4);
    });

    it('renders ModelRegistrySkeleton with model cards', () => {
      const { container } = render(<ModelRegistrySkeleton cards={6} />);
      expect(container.querySelectorAll('.rounded-\\[24px\\]').length).toBe(6);
    });

    it('renders SettingsSkeleton with form section skeletons', () => {
      const { container } = render(<SettingsSkeleton />);
      expect(container.querySelectorAll('.rounded-\\[24px\\]').length).toBe(2);
    });
  });
});
