'use client';

import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';

export function CTABanner() {
  const scrollToWorkbench = () => {
    const el = document.getElementById('workbench-dropzone');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-4', 'ring-[#bd98ec]/60');
      setTimeout(() => {
        el.classList.remove('ring-4', 'ring-[#bd98ec]/60');
      }, 1500);
    }
  };

  return (
    <section className="py-12">
      {/* ========================================================================= */}
      {/* SECTION 4: Electric Violet Banner (reproducing media_1789568864041.png)   */}
      {/* ========================================================================= */}
      <div className="rounded-3xl bg-gradient-to-r from-[#7248ea] via-[#6a33e9] to-[#6847ff] p-10 sm:p-16 text-center text-white shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Blur Highlights */}
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Your Film Deserves a Global Audience
          </h2>

          <p className="text-sm sm:text-base text-white/90 font-medium leading-relaxed">
            Dub your movie scene today—no sign-up, no cost, studio-quality results.
          </p>

          <div className="pt-4">
            <button
              type="button"
              onClick={scrollToWorkbench}
              className="px-8 py-3.5 rounded-full bg-white text-[#6847ff] hover:bg-[#fbfbfd] font-bold text-sm shadow-[0_4px_20px_rgba(0,0,0,0.15)] transition-all duration-150 active:scale-[0.97] hover:shadow-lg cursor-pointer inline-flex items-center space-x-2"
            >
              <span>Start Dubbing Now</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
