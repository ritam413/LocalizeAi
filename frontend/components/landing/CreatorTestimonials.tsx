'use client';

import React from 'react';
import { Star, Quote, CheckCircle } from 'lucide-react';

interface Testimonial {
  name: string;
  role: string;
  tag: string;
  text: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Elena Rostova',
    role: 'Independent Filmmaker · Berlin',
    tag: 'Festival Laureate',
    text: 'Submitted our 18-minute short to festivals in Tokyo and Madrid. LOCALIZE generated localized audio tracks with genuine actor emotion. The judges thought we hired native voice casts!',
    rating: 5,
  },
  {
    name: 'Marcus Vance',
    role: 'Cinema Explainer Channel (1.4M Subs)',
    tag: 'YouTube Creator',
    text: 'Translating our movie retrospectives into Spanish and Japanese used to take 2 weeks of agency back-and-forth. Now it happens in 90 seconds right inside the studio.',
    rating: 5,
  },
  {
    name: 'Kenji Sato',
    role: 'Anime Sound Designer & Post-Supervisor',
    tag: 'Studio Post',
    text: 'The Demucs 4-stem vocal separation is pristine. It keeps our foley, musical orchestrations, and background ambience intact while swapping only the dialogue.',
    rating: 5,
  },
  {
    name: 'Sofia Al-Mansoor',
    role: 'Documentary Director · Sundance 2026',
    tag: 'Docu-Series',
    text: 'The autonomous QA retry loop is magic. It caught a syllable drift on line 14, autonomously instructed the Sync Engineer to compress silence, and delivered a 100% compliant cut.',
    rating: 5,
  },
  {
    name: 'David Lindqvist',
    role: 'Nordic Film Board Executive',
    tag: 'Broadcast Compliance',
    text: 'EBU R128 loudness matching right out of the box. True Peak never exceeded -2.0 dB, meaning our broadcast delivery QC passed on the very first submission.',
    rating: 5,
  },
  {
    name: 'Claire Dupont',
    role: 'Film Translation Specialist & Subtitler',
    tag: 'Localization Pro',
    text: 'The Isometric syllable engine is a game changer for lip-sync dubbing. Translations don’t just carry the emotional context—they physically fit the actor’s mouth motion.',
    rating: 5,
  },
];

export function CreatorTestimonials() {
  return (
    <section className="py-12 space-y-10">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#f2eeff] text-[#7248ea] text-[11px] font-mono font-bold mb-2">
          <span>Global Creator Trust</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1a1a]">
          Loved by Directors, Creators & Studios
        </h2>
        <p className="text-xs sm:text-sm text-[#575268] max-w-xl mx-auto">
          See how filmmakers worldwide use LOCALIZE to premiere their stories across borders.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={idx}
            className="p-6 rounded-3xl bg-white border border-[#dbd8e8] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-[#bd98ec] hover:shadow-lg transition-all duration-200 flex flex-col justify-between"
          >
            <div className="space-y-4">
              {/* Star Rating */}
              <div className="flex items-center space-x-1">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#f59e0b] text-[#f59e0b]" />
                ))}
              </div>

              {/* Review Text */}
              <p className="text-xs text-[#1a1a1a] leading-relaxed font-normal">
                "{t.text}"
              </p>
            </div>

            {/* Reviewer Info */}
            <div className="pt-4 mt-4 border-t border-[#f2f0f8] flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-[#1a1a1a] flex items-center gap-1">
                  <span>{t.name}</span>
                  <CheckCircle className="w-3 h-3 text-[#00d4aa] fill-current" />
                </h4>
                <p className="text-[10px] text-[#575268]">{t.role}</p>
              </div>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#f8f9fa] text-[#7248ea] border border-[#dbd8e8]">
                {t.tag}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
