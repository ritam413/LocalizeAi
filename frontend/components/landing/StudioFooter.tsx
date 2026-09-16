'use client';

import React from 'react';
import Link from 'next/link';
import { Film, Globe, Shield, Sparkles, Heart } from 'lucide-react';

export function StudioFooter() {
  return (
    <footer className="border-t border-[#dbd8e8] bg-white mt-16 pt-14 pb-12 text-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-[#f2f0f8]">
          {/* Brand Info Column */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#7248ea] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(114,72,234,0.35)]">
                <Film className="w-4 h-4 fill-current stroke-[2]" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-[#1a1a1a] tracking-tight">LOCALIZE</span>
                <span className="w-2 h-2 rounded-full bg-[#00d4aa]" />
              </div>
            </div>

            <p className="text-xs text-[#575268] max-w-sm leading-relaxed">
              Autonomous AI Post-Production Crew for Film & Video Localization. Localizing cinema with actor voice cloning, isometric syllable matching, and defect repair.
            </p>

            <div className="flex items-center space-x-3 text-xs text-[#575268]">
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#7248ea]" />
                <span>170+ Languages</span>
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-[#14804a]" />
                <span>EBU R128 Certified</span>
              </span>
            </div>
          </div>

          {/* Column 1: Product */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1a1a1a]">
              Product
            </h4>
            <ul className="space-y-2 text-xs text-[#575268]">
              <li>
                <Link href="/" className="hover:text-[#7248ea] transition-colors">
                  Movie Dubbing
                </Link>
              </li>
              <li>
                <Link href="/runs/demo" className="hover:text-[#7248ea] transition-colors">
                  Interactive Demo
                </Link>
              </li>
              <li>
                <Link href="/models" className="hover:text-[#7248ea] transition-colors">
                  Voice Cloning
                </Link>
              </li>
              <li>
                <Link href="/runs/new" className="hover:text-[#7248ea] transition-colors">
                  Stem Extractor
                </Link>
              </li>
              <li>
                <Link href="/runs" className="hover:text-[#7248ea] transition-colors">
                  Studio History
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Solutions */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1a1a1a]">
              Solutions
            </h4>
            <ul className="space-y-2 text-xs text-[#575268]">
              <li>
                <a href="#workbench-dropzone" className="hover:text-[#7248ea] transition-colors">
                  YouTube Explainers
                </a>
              </li>
              <li>
                <Link href="/runs/demo" className="hover:text-[#7248ea] transition-colors">
                  Indie Filmmakers
                </Link>
              </li>
              <li>
                <a href="#workbench-dropzone" className="hover:text-[#7248ea] transition-colors">
                  Festival Submissions
                </a>
              </li>
              <li>
                <Link href="/settings" className="hover:text-[#7248ea] transition-colors">
                  OTT Broadcasts
                </Link>
              </li>
              <li>
                <Link href="/models" className="hover:text-[#7248ea] transition-colors">
                  Anime Dubbing
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Technology & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-[#1a1a1a]">
              Technology
            </h4>
            <ul className="space-y-2 text-xs text-[#575268]">
              <li>
                <Link href="/models" className="hover:text-[#7248ea] transition-colors">
                  Gemini 2.5 Pro
                </Link>
              </li>
              <li>
                <Link href="/models" className="hover:text-[#7248ea] transition-colors">
                  Demucs HTDemucs
                </Link>
              </li>
              <li>
                <Link href="/models" className="hover:text-[#7248ea] transition-colors">
                  Faster-Whisper
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-[#7248ea] transition-colors">
                  Grafana MCP
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-[#7248ea] transition-colors">
                  Compliance Gates
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#575268]">
          <p>© 2026 LOCALIZE Studio Inc. All rights reserved.</p>
          <div className="flex items-center space-x-6">
            <span className="hover:text-[#1a1a1a] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#1a1a1a] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#1a1a1a] cursor-pointer">Security</span>
            <span className="text-[#7248ea] font-medium">aidubbing.io Studio v2.0</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
