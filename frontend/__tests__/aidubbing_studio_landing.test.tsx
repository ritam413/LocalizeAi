import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ModelPicker, DUBBING_MODELS } from '../components/studio/ModelPicker';
import { WorkbenchCard } from '../components/studio/WorkbenchCard';
import { FeatureExplainers } from '../components/landing/FeatureExplainers';
import { HowItWorksSteps } from '../components/landing/HowItWorksSteps';
import { CTABanner } from '../components/landing/CTABanner';
import { GenreVideoShowcase } from '../components/studio/GenreVideoShowcase';

// Mock useRouter from next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => '/',
}));

describe('aidubbing.io Studio & Landing Experience Specification', () => {
  describe('ModelPicker Component', () => {
    it('renders the active model label and opens options on click', () => {
      const onSelect = vi.fn();
      render(<ModelPicker selectedModelId="2.0" onSelectModel={onSelect} />);

      const trigger = screen.getByRole('button', { name: /model/i });
      expect(trigger).toBeInTheDocument();
      expect(screen.getByText('Mode B · Broadcast Streaming Dub')).toBeInTheDocument();
      expect(screen.getByText('25% Off')).toBeInTheDocument();

      // Open menu
      fireEvent.click(trigger);
      expect(screen.getByText('Mode C · Festival Subtitle Master')).toBeInTheDocument();
      expect(screen.getByText('Mode A · Theatrical Cinema Dub')).toBeInTheDocument();

      // Select Dubbing 3.0
      const option3 = screen.getByText('Mode A · Theatrical Cinema Dub');
      fireEvent.click(option3);
      expect(onSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: '3.0', name: 'Mode A · Theatrical Cinema Dub' })
      );
    });
  });

  describe('FeatureExplainers (Section 1 & Section 2)', () => {
    it('renders Section 1 with YouTube reviews copy and Try Movie Dubbing CTA', () => {
      render(<FeatureExplainers />);
      expect(
        screen.getByText('YouTube Film Explainers & Reviews')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Create multilingual versions of your movie analysis/i)
      ).toBeInTheDocument();

      const ctaBtn = screen.getByRole('button', { name: /try movie dubbing/i });
      expect(ctaBtn).toBeInTheDocument();
    });

    it('renders Section 2 with Indie Filmmakers copy and See Our Demo routing link', () => {
      render(<FeatureExplainers />);
      expect(
        screen.getByText('Indie Filmmakers & Festival Submissions')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Quickly generate foreign-language audio tracks for international film festivals/i)
      ).toBeInTheDocument();

      const demoLink = screen.getByRole('link', { name: /see our demo/i });
      expect(demoLink).toBeInTheDocument();
      expect(demoLink).toHaveAttribute('href', '/runs/demo');
    });
  });

  describe('HowItWorksSteps (Section 3)', () => {
    it('renders 3 step cards and model variation switcher pills', () => {
      render(<HowItWorksSteps />);

      expect(
        screen.getByText('How to Use Movie Dubbing for Film Translation')
      ).toBeInTheDocument();

      // Step cards
      expect(screen.getByText('Step 1: Upload Your Movie File')).toBeInTheDocument();
      expect(screen.getByText('Step 2: Set Dubbing Parameters')).toBeInTheDocument();
      expect(screen.getByText('Step 3: Review & Download')).toBeInTheDocument();

      // Variation switchers
      const fastTab = screen.getByRole('button', { name: /Mode C · Festival Subtitles/i });
      const masterTab = screen.getByRole('button', { name: /Mode A · Theatrical Cinema Master/i });
      expect(fastTab).toBeInTheDocument();
      expect(masterTab).toBeInTheDocument();

      // Switch to Dubbing 3.0 Master
      fireEvent.click(masterTab);
      expect(
        screen.getByText(/character speaker diarization/i)
      ).toBeInTheDocument();
    });
  });

  describe('CTABanner (Section 4)', () => {
    it('renders Electric Violet banner copy and Start Dubbing Now CTA', () => {
      render(<CTABanner />);
      expect(
        screen.getByText('Your Film Deserves a Global Audience')
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Dub your movie scene today—no sign-up, no cost/i)
      ).toBeInTheDocument();

      const startBtn = screen.getByRole('button', { name: /start dubbing now/i });
      expect(startBtn).toBeInTheDocument();
    });
  });

  describe('GenreVideoShowcase Component', () => {
    it('renders genre pill buttons and toggles expandable engine specs', () => {
      render(<GenreVideoShowcase />);

      expect(screen.getByText('Tailored Dubbing for Every Film Genre')).toBeInTheDocument();
      expect(screen.getByText('Cartoon')).toBeInTheDocument();
      expect(screen.getByText('Concert')).toBeInTheDocument();
      expect(screen.getByText('Horror')).toBeInTheDocument();

      const expandBtn = screen.getByRole('button', {
        name: /view engine specs & acoustic information/i,
      });
      expect(expandBtn).toBeInTheDocument();

      // Click to expand
      fireEvent.click(expandBtn);
      expect(screen.getByText('EBU R128 VERIFIED')).toBeInTheDocument();
      expect(screen.getByText('Stem Separation')).toBeInTheDocument();
      expect(screen.getByText('Isometric Lip-Sync')).toBeInTheDocument();
      expect(screen.getByText('Mastering Bus')).toBeInTheDocument();
    });
  });

  describe('WorkbenchCard Component', () => {
    it('renders dropzone, language selectors, subtitles toggle and launch button', () => {
      render(<WorkbenchCard />);

      expect(screen.getByText('Click to upload or drag file here')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /upload a video/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /load 35s festival demo/i })).toBeInTheDocument();
      expect(screen.getByText('Add Subtitles')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /generate dubbed movie/i })).toBeInTheDocument();
    });
  });
});
