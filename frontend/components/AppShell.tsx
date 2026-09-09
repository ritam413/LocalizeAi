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
    { name: 'New Localization Run', path: '/runs/new', icon: Play, desc: 'Ingest footage & dispatch crew' },
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

  const currentSection = pathname === '/runs/new'
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
    <div className="min-h-screen flex flex-col bg-[#f9fbf2] text-[#130e30] font-sans antialiased selection:bg-[#ffe228] selection:text-[#130e30]">
      {/* Sticky Top Hamburger Navigation Bar */}
      <header className="h-16 border-b-[1.5px] border-[#130e30]/15 bg-[#eff2e5]/95 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 select-none shadow-xs">
        <div className="flex items-center space-x-3.5">
          {/* Hamburger Menu Toggle Button */}
          <button
            id="nav-hamburger-toggle"
            aria-label="Toggle Navigation Menu"
            onClick={() => setIsOpen(!isOpen)}
            className="w-10 h-10 rounded-xl bg-[#f9fbf2] hover:bg-[#ffe228] text-[#130e30] border-[1.5px] border-[#130e30] flex items-center justify-center transition-all duration-150 active:scale-[0.97] cursor-pointer shadow-xs group"
          >
            {isOpen ? (
              <X className="w-5 h-5 stroke-[2.5] transition-transform duration-150 group-hover:rotate-90" />
            ) : (
              <Menu className="w-5 h-5 stroke-[2.5]" />
            )}
          </button>

          {/* Brand Logo & Tagline */}
          <Link href="/runs" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-[#130e30] text-[#ffe228] flex items-center justify-center border border-[#130e30] shadow-xs group-hover:bg-[#1f174d] transition-colors">
              <Film className="w-4 h-4 fill-current stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-lg text-[#130e30] tracking-tight uppercase">LOCALIZE</span>
                <span className="w-2 h-2 rounded-full bg-[#ffe228] border border-[#130e30]" />
              </div>
              <p className="text-[9.5px] text-[#5f5c6e] font-mono font-bold uppercase tracking-wider -mt-0.5">
                Autonomous Crew v2.0
              </p>
            </div>
          </Link>

          {/* Breadcrumb Trail */}
          <div className="hidden md:flex items-center space-x-2 text-xs font-mono font-bold text-[#5f5c6e] ml-3 pl-4 border-l border-[#130e30]/15">
            <span className="text-[#5f5c6e] uppercase">Atelier</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#5f5c6e]" />
            <span className="text-[#130e30] uppercase font-extrabold bg-[#f9fbf2] px-2.5 py-0.5 rounded-md border border-[#130e30]/15">
              {currentSection}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-2 bg-[#f9fbf2] px-3 py-1 rounded-full border border-[#130e30]/15 text-[11px] font-mono font-bold text-[#5f5c6e]">
            <Activity className="w-3.5 h-3.5 text-[#59e25d] animate-pulse stroke-[3]" />
            <span className="text-[#130e30]">Crew Ready</span>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-[#ffe228] text-[#130e30] border border-[#130e30] shadow-xs">
            <Sparkles className="w-3.5 h-3.5 mr-1 fill-current" />
            <span className="hidden sm:inline">Ditto × Netflix Sans Edition</span>
            <span className="sm:hidden">Ditto UI</span>
          </span>
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
          className={`fixed inset-0 bg-[#130e30]/30 backdrop-blur-xs transition-opacity duration-200 ${
            isOpen ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Drawer Content Panel */}
        <aside
          className={`fixed top-0 bottom-0 left-0 w-80 max-w-[85vw] bg-[#eff2e5] border-r-[2px] border-[#130e30] flex flex-col justify-between select-none z-50 shadow-2xl transition-transform duration-200 ${
            isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)' }}
        >
          <div>
            {/* Drawer Header with Close Button */}
            <div className="p-5 border-b border-[#130e30]/10 flex items-center justify-between bg-[#f9fbf2]/60">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-xl bg-[#130e30] text-[#ffe228] flex items-center justify-center border border-[#130e30]">
                  <Film className="w-4 h-4 fill-current stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-base text-[#130e30] tracking-tight uppercase">LOCALIZE</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ffe228] border border-[#130e30]" />
                  </div>
                  <p className="text-[9px] text-[#5f5c6e] font-mono font-bold uppercase tracking-wider">
                    Studio Console
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-lg bg-[#eff2e5] hover:bg-[#130e30] hover:text-white border border-[#130e30]/20 flex items-center justify-center transition-all active:scale-[0.97] cursor-pointer"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Navigation Links with Emil Kowalski press physics */}
            <nav className="p-4 space-y-2">
              <div className="px-2 py-1 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#5f5c6e]">
                Studio Workspace
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path) && item.path !== '/runs/new');
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className={`flex items-start space-x-3.5 p-3 rounded-2xl transition-all duration-150 active:scale-[0.97] ${
                      isActive
                        ? 'bg-[#f9fbf2] text-[#130e30] border-[1.5px] border-[#130e30] shadow-[0_0_0_2px_#ffe228,0_4px_12px_rgba(19,14,48,0.06)]'
                        : 'text-[#5f5c6e] hover:text-[#130e30] hover:bg-[#f9fbf2]/70 border border-transparent'
                    }`}
                  >
                    <div className={`p-2 rounded-xl border mt-0.5 ${isActive ? 'bg-[#ffe228] text-[#130e30] border-[#130e30]' : 'bg-[#f9fbf2] border-[#130e30]/15 text-[#5f5c6e]'}`}>
                      <Icon className="w-4 h-4 stroke-[2.5]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-[#130e30]' : 'text-[#130e30]/90'}`}>
                        {item.name}
                      </div>
                      <div className="text-[11px] text-[#5f5c6e] font-normal leading-tight mt-0.5 truncate">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Worker & Reasoning Engine Status Strip */}
          <div className="p-4 border-t border-[#130e30]/10 bg-[#eff2e5] space-y-3">
            <div className="flex items-center justify-between text-xs text-[#5f5c6e]">
              <span className="font-extrabold text-[#130e30] flex items-center space-x-1.5 text-[11px] uppercase tracking-wider">
                <Activity className="w-3.5 h-3.5 text-[#59e25d] animate-pulse stroke-[3]" />
                <span>Crew Telemetry</span>
              </span>
              <span className="text-[#130e30] bg-[#59e25d] font-mono text-[9.5px] font-extrabold px-2 py-0.5 rounded-full border border-[#130e30]">
                READY
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f9fbf2] border border-[#130e30]/10">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#59e25d] stroke-[2.5]" />
                  <span className="text-[#130e30] font-bold text-[11px]">Gemini 2.5 Core</span>
                </div>
                <span className="text-[10px] text-[#5f5c6e] font-mono font-bold">REASONING</span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#f9fbf2] border border-[#130e30]/10">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#59e25d] stroke-[2.5]" />
                  <span className="text-[#130e30] font-bold text-[11px]">Grafana MCP</span>
                </div>
                <span className="text-[10px] text-[#5f5c6e] font-mono font-bold">LOKI/PROM</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Viewport Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="p-4 sm:p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
