'use client';

import React from 'react';
import Link from 'next/link';
import { Mic, FileText, Music, Sparkles, ArrowRight, Video, Scissors } from 'lucide-react';

interface ToolCard {
  title: string;
  desc: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const TOOLS: ToolCard[] = [
  {
    title: 'Actor Voice Cloning',
    desc: 'Sample 5 seconds of character speech to clone identical vocal timbre, cadence, and emotion in 170+ target languages.',
    badge: 'Neural Engine',
    icon: Mic,
    href: '/models',
  },
  {
    title: 'Master Subtitle Generator',
    desc: 'Netflix-compliant 16 CPS timed subtitles with automatic line breaks, speaker tags, and zero-drift timestamp synchronization.',
    badge: 'SRT / WebVTT',
    icon: FileText,
    href: '/runs/demo',
  },
  {
    title: 'Demucs Vocal Stem Extractor',
    desc: 'Clean 4-stem vocal separation isolating speech dialogue from ambient background scores, Foley, and room reverb.',
    badge: 'HTDemucs 4-Stem',
    icon: Music,
    href: '/runs/new',
  },
  {
    title: 'Lip-Sync & Isometric Engine',
    desc: 'Syllable-budget translation matching target speech duration to original actor mouth movements within ±80ms.',
    badge: 'Isochronous',
    icon: Scissors,
    href: '/runs/new',
  },
];

export function MoreToolsGrid() {
  return (
    <section className="py-12 space-y-10">
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1a1a]">
          Explore More AI Post-Production Tools
        </h2>
        <p className="text-xs sm:text-sm text-[#575268] max-w-xl mx-auto">
          A complete autonomous toolkit for modern film directors, sound designers, and content localization studios.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {TOOLS.map((tool, idx) => {
          const Icon = tool.icon;
          return (
            <Link
              key={idx}
              href={tool.href}
              className="p-6 rounded-3xl bg-white border border-[#dbd8e8] shadow-[0_2px_12px_rgba(0,0,0,0.02)] hover:border-[#bd98ec] hover:shadow-lg transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-2xl bg-[#f2eeff] text-[#7248ea] group-hover:bg-[#7248ea] group-hover:text-white transition-all flex items-center justify-center shadow-xs">
                  <Icon className="w-6 h-6 stroke-[2]" />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-[#1a1a1a] group-hover:text-[#7248ea] transition-colors">
                      {tool.title}
                    </h3>
                  </div>
                  <p className="text-xs text-[#575268] leading-relaxed">
                    {tool.desc}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#f2f0f8] flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-[#f8f9fa] text-[#575268]">
                  {tool.badge}
                </span>
                <ArrowRight className="w-4 h-4 text-[#7248ea] group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
