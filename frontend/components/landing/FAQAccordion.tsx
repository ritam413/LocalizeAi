'use client';

import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  q: string;
  a: string;
}

const FAQS: FAQItem[] = [
  {
    q: 'How does AI movie dubbing preserve original actor emotions and vocal timbre?',
    a: 'LOCALIZE uses a multi-agent post-production pipeline. The Story Analyst detects emotional tone tags (e.g. urgent, whispering, sorrowful) per dialogue segment. The Voice Director then samples the actor’s vocal acoustics from the Demucs-isolated dialogue stem, matching pitch, formant contours, and pacing in the target language.',
  },
  {
    q: 'What video file formats, resolutions, and size limits are supported?',
    a: 'We accept MP4, MOV, MKV, and WebM containers up to 1024MB. Input resolutions range from 720p through 4K DCI (24fps, 25fps, 29.97fps, and 60fps). Audio tracks can be stereo 2.0 or 5.1 surround.',
  },
  {
    q: 'Can I localize into multiple target languages simultaneously in a single run?',
    a: 'Yes! The Director Agent can fan out localization jobs across multiple language tracks (e.g., Spanish, French, Japanese, German, and Hindi) in parallel, delivering synchronized audio stems and master subtitle packages for each locale.',
  },
  {
    q: 'How does the autonomous QA retry loop repair defects?',
    a: 'Rather than failing the whole export or delivering out-of-sync audio, our QA Agent inspects release candidates against 3 defect classes: TIMING_OVERFLOW, SUBTITLE_DRIFT, and AUDIO_CLIPPING. If an issue is detected, the Director re-routes only the offending scene back to the Sync Engineer or Localization Director with targeted fix parameters.',
  },
  {
    q: 'Are the exported audio stems compliant with broadcast and theatrical standards?',
    a: 'Every export passes through our unified acoustic mastering engine. It applies EBU R128 loudness normalization (-24.0 LUFS integrated loudness, 7.0 LU loudness range, and -2.0 dB True Peak ceiling) with dynamic sidechain ducking (-6.0 dB) behind dialogue, fully certified for OTT and TV delivery.',
  },
  {
    q: 'Do I retain full commercial rights to my dubbed films and translations?',
    a: '100% yes. You retain complete commercial ownership and copyright over all localized audio stems, video deliverables, translated scripts, and subtitle files generated through the platform.',
  },
  {
    q: 'How does the Free tier compare to Studio Pro?',
    a: 'The Free tier gives you full access to Dubbing 1.0 (Fast TTS) and Dubbing 2.0 (Neural Sync) for clips up to 15s with watermarked demo exports. Studio Pro unlocks Dubbing 3.0 (Full Autonomous Multi-Agent Director Crew), unlimited footage duration, 5.1 multichannel audio stems, and direct Grafana MCP telemetry.',
  },
];

export function FAQAccordion() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIdx(openIdx === idx ? null : idx);
  };

  return (
    <section className="py-12 space-y-10 max-w-4xl mx-auto">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#f2eeff] text-[#7248ea] text-[11px] font-mono font-bold mb-2">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Frequently Asked Questions</span>
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1a1a]">
          Everything You Need to Know
        </h2>
        <p className="text-xs sm:text-sm text-[#575268]">
          Common questions about autonomous film translation, vocal cloning, and broadcast delivery.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-white border border-[#dbd8e8] overflow-hidden transition-all duration-150 shadow-2xs hover:border-[#bd98ec]"
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer"
                aria-expanded={isOpen}
              >
                <span className="text-sm font-bold text-[#1a1a1a]">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#7248ea] shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-[13px] text-[#575268] leading-relaxed border-t border-[#f2f0f8] animate-in fade-in duration-150">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
