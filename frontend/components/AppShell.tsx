'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, History, Cpu, Settings, Film, Activity, CheckCircle2, Sparkles, Menu, X, ChevronRight } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { name: '🎬 Live Judge Demo (35s)', path: '/runs/demo', icon: Sparkles, desc: '35s AI crew showcase + YouTube multi-audio' },
    { name: 'Movie Dubbing Studio', path: '/', icon: Film, desc: 'Ingest footage, model tiers & workbench' },
    { name: 'Swarm Run History', path: '/runs', icon: History, desc: 'Real-time studio monitor & metrics' },
    { name: 'Model & Agent Registry', path: '/models', icon: Cpu, desc: 'Gemini, Whisper & Demucs engines' },
    { name: 'Studio Settings & QA', path: '/settings', icon: Settings, desc: 'EBU R128 & compliance gates' },
  ];

  // Close drawer on path change or Escape key
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const currentSection = pathname === '/'
    ? 'Movie Dubbing'
    : pathname === '/runs/demo'
    ? 'Judge Demo'
    : pathname === '/runs/new'
    ? 'New Run'
    : pathname.startsWith('/runs/')
    ? 'Run Monitor'
    : pathname === '/runs'
    ? 'Run History'
    : pathname === '/models'
    ? 'Agent Registry'
    : pathname === '/settings'
    ? 'Settings & QA'
    : 'Studio';

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfd] text-[#1a1a1a] font-sans antialiased selection:bg-[#f2eeff] selection:text-[#7248ea]">
      {/* Sticky Top Navigation Bar */}
      <header className="h-16 border-b border-[#dbd8e8] bg-[#ffffff]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 select-none shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center space-x-3.5">
          {/* Hamburger Menu Toggle Button */}
          <button
            id="nav-hamburger-toggle"
            aria-label="Toggle Navigation Menu"
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-xl bg-[#ffffff] hover:bg-[#f2eeff] text-[#1a1a1a] hover:text-[#7248ea] border border-[#dbd8e8] hover:border-[#bd98ec] flex items-center justify-center transition-all duration-150 active:scale-[0.97] cursor-pointer shadow-xs group"
          >
            {isOpen ? (
              <X className="w-5 h-5 stroke-[2.5] transition-transform duration-150 group-hover:rotate-90" />
            ) : (
              <Menu className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>

          {/* Brand Logo & Tagline */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#7248ea] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(114,72,234,0.35)] group-hover:bg-[#6847ff] transition-all">
              <Film className="w-4 h-4 fill-current stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-[#1a1a1a] tracking-tight">LOCALIZE</span>
                <span className="w-2 h-2 rounded-full bg-[#00d4aa]" />
              </div>
              <p className="text-[9.5px] text-[#575268] font-mono font-medium uppercase tracking-wider -mt-0.5">
                Autonomous Crew v2.0
              </p>
            </div>
          </Link>

          {/* Breadcrumb Trail */}
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono font-semibold text-[#575268] ml-3 pl-4 border-l border-[#dbd8e8]">
            <span className="text-[#575268] uppercase">Studio</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#9e9e9e]" />
            <span className="text-[#7248ea] uppercase font-bold bg-[#f2eeff] px-2.5 py-0.5 rounded-md border border-[#bd98ec]/40">
              {currentSection}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-[#f0f9eb] px-3 py-1 rounded-full border border-[#c2e7b0] text-[11px] font-mono font-semibold text-[#14804a]">
            <Activity className="w-3.5 h-3.5 text-[#14804a] animate-pulse stroke-[3]" />
            <span>Crew Ready</span>
          </div>
        </div>
      </header>

      {/* Slide-out Navigation Drawer with Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-visibility duration-200 ${
          isOpen ? 'visible' : 'invisible pointer-events-none'
        }`}
      >
        {/* Backdrop overlay */}
        <div
          onClick={() => setIsOpen(false)}
          className={`fixed inset-0 bg-[#07060c]/40 backdrop-blur-xs transition-opacity duration-200 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Drawer Content Panel */}
        <aside
          className={`fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-[#ffffff] border-r border-[#dbd8e8] flex flex-col justify-between select-none z-50 shadow-2xl transition-transform duration-200 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
        >
          <div>
            {/* Drawer Header with Close Button */}
            <div className="p-5 border-b border-[#dbd8e8] flex items-center justify-between bg-[#fbfbfd]">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#7248ea] text-white flex items-center justify-center shadow-[0_2px_8px_rgba(114,72,234,0.35)]">
                  <Film className="w-4 h-4 fill-current stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base text-[#1a1a1a] tracking-tight">LOCALIZE</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00d4aa]" />
                  </div>
                  <p className="text-[9px] text-[#575268] font-mono font-medium uppercase tracking-wider">
                    Studio Console
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#ffffff] hover:bg-[#f2eeff] text-[#575268] hover:text-[#7248ea] border border-[#dbd8e8] flex items-center justify-center transition-all active:scale-[0.97] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Navigation Links */}
            <nav className="p-4 space-y-2">
              <div className="px-2 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[#575268]">
                Studio Workspace
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path) && item.path !== '/runs/new');
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-start space-x-3.5 p-3 rounded-xl transition-all duration-150 active:scale-[0.97] ${
                      isActive
                        ? 'bg-[#f2eeff] text-[#7248ea] border border-[#bd98ec] shadow-sm'
                        : 'text-[#575268] hover:text-[#1a1a1a] hover:bg-[#f8f9fa] border border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-lg border mt-0.5 ${isActive ? 'bg-[#7248ea] text-white border-[#7248ea]' : 'bg-[#fbfbfd] border-[#dbd8e8] text-[#575268]'}`}>
                      <Icon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold uppercase tracking-tight ${isActive ? 'text-[#7248ea]' : 'text-[#1a1a1a]'}`}>
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[#575268] font-normal leading-tight mt-0.5 truncate">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Worker & Reasoning Engine Status Strip */}
          <div className="p-4 border-t border-[#dbd8e8] bg-[#fbfbfd] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#575268]">
              <span className="font-bold text-[#1a1a1a] flex items-center space-x-1.5 text-[11px] uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-[#14804a] animate-pulse stroke-[3]" />
                <span>Crew Telemetry</span>
              </span>
              <span className="text-[#14804a] bg-[#f0f9eb] font-mono text-[9.5px] font-bold px-2 py-0.5 rounded-full border border-[#c2e7b0]">
                READY
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ffffff] border border-[#dbd8e8]">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#14804a] stroke-[2.5]" />
                  <span className="text-[#1a1a1a] font-bold text-[11px]">Gemini 2.5 Core</span>
                </div>
                <span className="text-[10px] text-[#7248ea] font-mono font-bold bg-[#f2eeff] px-2 py-0.5 rounded">REASONING</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#ffffff] border border-[#dbd8e8]">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#14804a] stroke-[2.5]" />
                  <span className="text-[#1a1a1a] font-bold text-[11px]">Grafana MCP</span>
                </div>
                <span className="text-[10px] text-[#575268] font-mono font-bold bg-[#f8f9fa] px-2 py-0.5 rounded">LOKI/PROM</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Viewport Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-[1200px] w-full mx-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
