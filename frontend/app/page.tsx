'use client';

import React from 'react';
import Link from 'next/link';
import { WorkbenchCard } from '../components/studio/WorkbenchCard';
import { GenreVideoShowcase } from '../components/studio/GenreVideoShowcase';
import { FeatureExplainers } from '../components/landing/FeatureExplainers';
import { HowItWorksSteps } from '../components/landing/HowItWorksSteps';
import { CTABanner } from '../components/landing/CTABanner';
import { CreatorTestimonials } from '../components/landing/CreatorTestimonials';
import { MoreToolsGrid } from '../components/landing/MoreToolsGrid';
import { FAQAccordion } from '../components/landing/FAQAccordion';
import { StudioFooter } from '../components/landing/StudioFooter';
import { Sparkles, ArrowRight, Film, ShieldCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-12 max-w-[1200px] mx-auto font-sans text-[#1a1a1a]">
      {/* Top Announcement Banner (From aidubbing.io header) */}
      <div className="flex items-center justify-center">
        <Link
          href="/runs/demo"
          className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#f2eeff] hover:bg-[#ebd9fc] text-[#7248ea] text-xs font-semibold border border-[#bd98ec]/50 shadow-xs transition-all duration-150 active:scale-[0.98] group"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#7248ea] animate-pulse" />
          <span>Subscribe and enjoy up to 50% off! See Judge Demo (35s)</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Hero Headline */}
      <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1a1a1a] leading-tight">
          AI-Powered Movie Dubbing
          <span className="block text-[#7248ea] mt-1">Film Translation Studio</span>
        </h1>
        <p className="text-xs sm:text-base text-[#575268] leading-relaxed max-w-2xl mx-auto">
          Autonomous multi-agent crew localizing multi-speaker cinema dialogue into 170+ languages with character-consistent voice cloning, acoustic mastering, and defect self-repair.
        </p>
      </div>

      {/* Hero Workbench Ingestion Card */}
      <div className="max-w-4xl mx-auto">
        <WorkbenchCard />
      </div>

      {/* SECTION 1 & SECTION 2: Feature Explainers */}
      <FeatureExplainers />

      {/* SECTION 3: How to Use Movie Dubbing (with Model Variation Switcher) */}
      <HowItWorksSteps />

      {/* SECTION 4: Call to Action Banner */}
      <CTABanner />

      {/* Tailored Dubbing for Every Film Genre Showcase */}
      <GenreVideoShowcase />

      {/* Creator Testimonials Grid */}
      <CreatorTestimonials />

      {/* More AI Post-Production Tools */}
      <MoreToolsGrid />

      {/* Frequently Asked Questions */}
      <FAQAccordion />

      {/* Global Multi-Column Studio Footer */}
      <StudioFooter />
    </div>
  );
}
