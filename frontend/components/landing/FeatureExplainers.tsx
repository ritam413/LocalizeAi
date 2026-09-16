'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, Play, Film, Globe } from 'lucide-react';

export function FeatureExplainers() {
  const router = useRouter();

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
    <section className="space-y-16 py-12">
      {/* Global Section Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#1a1a1a]">
          What Can You Use Movie Dubbing For?
        </h2>
        <p className="text-xs sm:text-sm text-[#575268] max-w-xl mx-auto">
          Scale your film productions and video channels into 170+ territories with autonomous character consistency.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: YouTube Film Explainers & Reviews (Photo 1)                    */}
      {/* Left: Multilingual creator vector illustration                           */}
      {/* Right: Copy + "Try Movie Dubbing" CTA button (scrolls to top workbench)  */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-5xl mx-auto">
        {/* Left Illustration Box */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#dbd8e8] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex items-center justify-center relative overflow-hidden group hover:border-[#bd98ec] transition-all">
          <svg
            className="w-full max-w-[340px] h-auto drop-shadow-xs"
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Soft Glow */}
            <circle cx="200" cy="150" r="120" fill="#F8F6FF" />

            {/* Character Body & Hoodie */}
            <path
              d="M140 280 C140 220, 260 220, 260 280 Z"
              fill="#EAE8F5"
              stroke="#1A1A1A"
              strokeWidth="3.5"
            />
            {/* Laptop Back */}
            <rect
              x="110"
              y="180"
              width="140"
              height="85"
              rx="8"
              fill="#FFFFFF"
              stroke="#1A1A1A"
              strokeWidth="3.5"
            />
            {/* Laptop Screen Accent */}
            <rect
              x="120"
              y="190"
              width="120"
              height="65"
              rx="4"
              fill="#F2EEFF"
            />
            <circle cx="180" cy="222" r="10" fill="#7248EA" />

            {/* Film Timeline Window on Right */}
            <rect
              x="230"
              y="165"
              width="80"
              height="60"
              rx="6"
              fill="#FFFFFF"
              stroke="#1A1A1A"
              strokeWidth="3"
            />
            <rect x="236" y="171" width="68" height="34" rx="3" fill="#1A1A1A" />
            <polygon points="266,182 278,188 266,194" fill="#FFFFFF" />
            {/* Film Perforations */}
            <line x1="236" y1="212" x2="304" y2="212" stroke="#7248EA" strokeWidth="3" />
            <circle cx="244" cy="219" r="2.5" fill="#575268" />
            <circle cx="254" cy="219" r="2.5" fill="#575268" />
            <circle cx="264" cy="219" r="2.5" fill="#575268" />
            <circle cx="274" cy="219" r="2.5" fill="#575268" />
            <circle cx="284" cy="219" r="2.5" fill="#575268" />
            <circle cx="294" cy="219" r="2.5" fill="#575268" />

            {/* Character Head */}
            <circle
              cx="200"
              cy="135"
              r="40"
              fill="#FFFFFF"
              stroke="#1A1A1A"
              strokeWidth="3.5"
            />
            {/* Glasses */}
            <circle cx="186" cy="132" r="11" fill="none" stroke="#1A1A1A" strokeWidth="3" />
            <circle cx="214" cy="132" r="11" fill="none" stroke="#1A1A1A" strokeWidth="3" />
            <line x1="197" y1="132" x2="203" y2="132" stroke="#1A1A1A" strokeWidth="3" />
            {/* Smile */}
            <path
              d="M192 152 Q200 160 208 152"
              fill="none"
              stroke="#1A1A1A"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Hair */}
            <path
              d="M162 125 C165 95, 235 95, 238 125 C230 110, 170 110, 162 125 Z"
              fill="#D8D4E8"
              stroke="#1A1A1A"
              strokeWidth="3"
            />

            {/* Headphones */}
            <path
              d="M160 135 C150 70, 250 70, 240 135"
              fill="none"
              stroke="#7248EA"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <rect x="154" y="120" width="12" height="30" rx="6" fill="#7248EA" />
            <rect x="234" y="120" width="12" height="30" rx="6" fill="#7248EA" />

            {/* Film Reels */}
            <g transform="translate(145, 110)">
              <circle cx="0" cy="0" r="18" fill="#F8F6FF" stroke="#1A1A1A" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="5" fill="#1A1A1A" />
              <circle cx="-8" cy="-5" r="3" fill="#7248EA" />
              <circle cx="8" cy="-5" r="3" fill="#7248EA" />
              <circle cx="0" cy="9" r="3" fill="#7248EA" />
            </g>

            <g transform="translate(305, 185)">
              <circle cx="0" cy="0" r="18" fill="#F8F6FF" stroke="#1A1A1A" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="5" fill="#1A1A1A" />
              <circle cx="-8" cy="-5" r="3" fill="#7248EA" />
              <circle cx="8" cy="-5" r="3" fill="#7248EA" />
              <circle cx="0" cy="9" r="3" fill="#7248EA" />
            </g>

            {/* Floating Language Bubbles with Flags/Tags */}
            {/* EN */}
            <g transform="translate(90, 120)">
              <rect
                x="0"
                y="0"
                width="46"
                height="28"
                rx="6"
                fill="#FFFFFF"
                stroke="#1A1A1A"
                strokeWidth="2.5"
              />
              <circle cx="10" cy="8" r="5" fill="#7248EA" />
              <text
                x="28"
                y="19"
                fontSize="12"
                fontWeight="bold"
                fontFamily="sans-serif"
                fill="#1A1A1A"
                textAnchor="middle"
              >
                EN
              </text>
            </g>

            {/* FR */}
            <g transform="translate(130, 155)">
              <rect
                x="0"
                y="0"
                width="44"
                height="26"
                rx="6"
                fill="#FFFFFF"
                stroke="#1A1A1A"
                strokeWidth="2.5"
              />
              <circle cx="8" cy="8" r="4" fill="#00D4AA" />
              <text
                x="26"
                y="18"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
                fill="#1A1A1A"
                textAnchor="middle"
              >
                FR
              </text>
            </g>

            {/* ES */}
            <g transform="translate(265, 85)">
              <rect
                x="0"
                y="0"
                width="44"
                height="26"
                rx="6"
                fill="#FFFFFF"
                stroke="#1A1A1A"
                strokeWidth="2.5"
              />
              <circle cx="36" cy="8" r="4" fill="#7248EA" />
              <text
                x="18"
                y="18"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
                fill="#1A1A1A"
                textAnchor="middle"
              >
                ES
              </text>
            </g>

            {/* JA */}
            <g transform="translate(275, 140)">
              <rect
                x="0"
                y="0"
                width="44"
                height="26"
                rx="6"
                fill="#FFFFFF"
                stroke="#1A1A1A"
                strokeWidth="2.5"
              />
              <circle cx="36" cy="8" r="4" fill="#00D4AA" />
              <text
                x="18"
                y="18"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
                fill="#1A1A1A"
                textAnchor="middle"
              >
                JA
              </text>
            </g>

            {/* ZH */}
            <g transform="translate(315, 175)">
              <rect
                x="0"
                y="0"
                width="44"
                height="26"
                rx="6"
                fill="#FFFFFF"
                stroke="#1A1A1A"
                strokeWidth="2.5"
              />
              <circle cx="36" cy="8" r="4" fill="#7248EA" />
              <text
                x="18"
                y="18"
                fontSize="11"
                fontWeight="bold"
                fontFamily="sans-serif"
                fill="#1A1A1A"
                textAnchor="middle"
              >
                ZH
              </text>
            </g>

            {/* Desk Line */}
            <line x1="100" y1="280" x2="330" y2="280" stroke="#1A1A1A" strokeWidth="3" />
          </svg>
        </div>

        {/* Right Content */}
        <div className="space-y-5 text-left">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">
            YouTube Film Explainers & Reviews
          </h3>
          <p className="text-sm sm:text-base text-[#575268] leading-relaxed">
            Create multilingual versions of your movie analysis videos without re-recording voiceovers. Great for reaching global audiences with AI-dubbed film commentary.
          </p>

          <div className="pt-2">
            <button
              type="button"
              onClick={scrollToWorkbench}
              className="px-6 py-3 rounded-xl bg-[#7248ea] hover:bg-[#6847ff] text-white font-bold text-xs shadow-[0_4px_14px_rgba(114,72,234,0.35)] transition-all duration-150 active:scale-[0.97] cursor-pointer inline-flex items-center space-x-2"
            >
              <span>Try Movie Dubbing</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: Indie Filmmakers & Festival Submissions (Photo 2)              */}
      {/* Left: Copy + "See Our Demo" CTA button (routes to /runs/demo)             */}
      {/* Right: Film slate clapperboard & international flags illustration         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center max-w-5xl mx-auto pt-6">
        {/* Left Content */}
        <div className="space-y-5 text-left order-2 lg:order-1">
          <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1a1a1a]">
            Indie Filmmakers & Festival Submissions
          </h3>
          <p className="text-sm sm:text-base text-[#575268] leading-relaxed">
            Quickly generate foreign-language audio tracks for international film festivals—especially useful when adding dubbed audio to short films without budget for professional voice actors.
          </p>

          <div className="pt-2">
            <Link
              href="/runs/demo"
              className="px-6 py-3 rounded-xl bg-[#7248ea] hover:bg-[#6847ff] text-white font-bold text-xs shadow-[0_4px_14px_rgba(114,72,234,0.35)] transition-all duration-150 active:scale-[0.97] cursor-pointer inline-flex items-center space-x-2"
            >
              <span>See Our Demo</span>
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </Link>
          </div>
        </div>

        {/* Right Illustration Box */}
        <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#dbd8e8] shadow-[0_4px_24px_rgba(0,0,0,0.03)] flex items-center justify-center relative overflow-hidden group hover:border-[#bd98ec] transition-all order-1 lg:order-2">
          <svg
            className="w-full max-w-[340px] h-auto drop-shadow-xs"
            viewBox="0 0 400 300"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Background Accent */}
            <circle cx="210" cy="150" r="110" fill="#F8F6FF" />

            {/* International Flag Fan behind slate */}
            {/* Japan */}
            <g transform="translate(230, 55) rotate(10)">
              <rect x="0" y="0" width="36" height="24" rx="2" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
              <circle cx="18" cy="12" r="6" fill="#D32F2F" />
            </g>
            {/* Korea */}
            <g transform="translate(275, 60) rotate(25)">
              <rect x="0" y="0" width="36" height="24" rx="2" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
              <circle cx="18" cy="12" r="5" fill="#1976D2" />
            </g>
            {/* Germany */}
            <g transform="translate(265, 95) rotate(18)">
              <rect x="0" y="0" width="36" height="24" rx="2" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
              <rect x="0" y="0" width="36" height="8" fill="#1A1A1A" />
              <rect x="0" y="8" width="36" height="8" fill="#D32F2F" />
              <rect x="0" y="16" width="36" height="8" fill="#FBC02D" />
            </g>
            {/* France */}
            <g transform="translate(285, 118) rotate(32)">
              <rect x="0" y="0" width="36" height="24" rx="2" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
              <rect x="0" y="0" width="12" height="24" fill="#1976D2" />
              <rect x="24" y="0" width="12" height="24" fill="#D32F2F" />
            </g>
            {/* India */}
            <g transform="translate(285, 155) rotate(42)">
              <rect x="0" y="0" width="36" height="24" rx="2" fill="#FFFFFF" stroke="#1A1A1A" strokeWidth="1.5" />
              <rect x="0" y="0" width="36" height="8" fill="#F57C00" />
              <rect x="0" y="16" width="36" height="8" fill="#388E3C" />
              <circle cx="18" cy="12" r="3" fill="#1976D2" />
            </g>
            {/* Spain / Colombia */}
            <g transform="translate(130, 160) rotate(-25)">
              <rect x="0" y="0" width="36" height="24" rx="2" fill="#FBC02D" stroke="#1A1A1A" strokeWidth="1.5" />
              <rect x="0" y="6" width="36" height="12" fill="#D32F2F" />
            </g>
            {/* Brazil */}
            <g transform="translate(130, 205) rotate(-35)">
              <rect x="0" y="0" width="36" height="24" rx="2" fill="#388E3C" stroke="#1A1A1A" strokeWidth="1.5" />
              <polygon points="18,4 32,12 18,20 4,12" fill="#FBC02D" />
              <circle cx="18" cy="12" r="4" fill="#1976D2" />
            </g>

            {/* Clapperboard Slate Body */}
            <g transform="translate(160, 115) rotate(5)">
              {/* Clapper Top Stripe bar */}
              <rect x="0" y="0" width="120" height="22" rx="3" fill="#1A1A1A" />
              <polygon points="15,0 30,0 15,22 0,22" fill="#FFFFFF" />
              <polygon points="45,0 60,0 45,22 30,22" fill="#FFFFFF" />
              <polygon points="75,0 90,0 75,22 60,22" fill="#FFFFFF" />
              <polygon points="105,0 120,0 105,22 90,22" fill="#FFFFFF" />

              {/* Main Slate Board */}
              <rect x="0" y="24" width="120" height="85" rx="4" fill="#1A1A1A" />
              <text x="60" y="48" fill="#BD98EC" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle">
                SHORT FILM
              </text>
              <line x1="12" y1="56" x2="108" y2="56" stroke="#575268" strokeWidth="1" />
              <text x="14" y="70" fill="#FFFFFF" fontSize="8" fontFamily="monospace">
                DIRECTOR: AI CREW
              </text>
              <text x="14" y="84" fill="#FFFFFF" fontSize="8" fontFamily="monospace">
                PROD: LOCALIZE
              </text>
              <text x="14" y="98" fill="#00D4AA" fontSize="8" fontFamily="monospace">
                TAKE: 01 · 100% QA
              </text>
            </g>

            {/* Hands Holding Slate */}
            <path
              d="M100 115 C130 115, 160 125, 175 140 L160 155 C145 145, 125 135, 100 135 Z"
              fill="#EAE8F5"
              stroke="#1A1A1A"
              strokeWidth="2.5"
            />
            <path
              d="M330 240 C300 230, 275 220, 260 200 L275 185 C290 200, 310 215, 330 220 Z"
              fill="#EAE8F5"
              stroke="#1A1A1A"
              strokeWidth="2.5"
            />

            {/* Film Reel Underneath with Audio Wave Arcs */}
            <g transform="translate(210, 245)">
              <circle cx="0" cy="0" r="22" fill="#1A1A1A" stroke="#7248EA" strokeWidth="2.5" />
              <circle cx="0" cy="0" r="8" fill="#FFFFFF" />
              <circle cx="-10" cy="-6" r="3" fill="#FFFFFF" />
              <circle cx="10" cy="-6" r="3" fill="#FFFFFF" />
              <circle cx="0" cy="11" r="3" fill="#FFFFFF" />
              {/* Soundwaves */}
              <path d="M-28 -12 C-34 0, -34 10, -28 20" fill="none" stroke="#7248EA" strokeWidth="2" strokeLinecap="round" />
              <path d="M-36 -18 C-44 0, -44 15, -36 26" fill="none" stroke="#BD98EC" strokeWidth="2" strokeLinecap="round" />
              <path d="M28 -12 C34 0, 34 10, 28 20" fill="none" stroke="#7248EA" strokeWidth="2" strokeLinecap="round" />
              <path d="M36 -18 C44 0, 44 15, 36 26" fill="none" stroke="#BD98EC" strokeWidth="2" strokeLinecap="round" />
            </g>
          </svg>
        </div>
      </div>
    </section>
  );
}
