'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Play, History, Cpu, Settings, Subtitles, Film, Activity, CheckCircle2 } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { name: 'New Run', path: '/runs/new', icon: Play },
    { name: 'Run History', path: '/runs', icon: History },
    { name: 'Model Registry', path: '/models', icon: Cpu },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-[#0b0f19] text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 border-r border-gray-800 bg-[#0f172a]/80 backdrop-blur-md flex flex-col justify-between">
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-gray-800 flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-glow">
              <Film className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white tracking-wide">DubForge</h1>
              <p className="text-xs text-indigo-400 font-mono">STUDIO v1.0</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-glow'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Worker Status Strip (F-08 / TechSpec Topology) */}
        <div className="p-4 border-t border-gray-800/80 bg-gray-900/40 space-y-3">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="font-semibold text-gray-300 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Topology Cluster</span>
            </span>
            <span className="text-emerald-400 font-mono text-[10px]">2 ONLINE</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-gray-800/40 border border-gray-700/50">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-gray-300 font-medium">GPU Box (GTX 1050Ti)</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">4GB VRAM</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded bg-gray-800/40 border border-gray-700/50">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-gray-300 font-medium">CPU Laptop Worker</span>
              </div>
              <span className="text-[10px] text-gray-400 font-mono">Preprocessing</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {/* Top Header */}
        <header className="h-16 border-b border-gray-800/80 bg-[#0f172a]/40 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center space-x-2 text-sm text-gray-400">
            <span>Orchestrator Dashboard</span>
            <span>/</span>
            <span className="text-white font-medium capitalize">
              {pathname.split('/')[1] || 'Dashboard'}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              GpuLock Ready
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8 max-w-7xl w-full mx-auto flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}
