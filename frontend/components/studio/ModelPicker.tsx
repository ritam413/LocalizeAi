'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Check, Sparkles, Zap, ShieldCheck } from 'lucide-react';

export interface DubbingModel {
  id: '1.0' | '2.0' | '3.0';
  name: string;
  badge?: string;
  desc: string;
  rate: string;
  originalRate?: string;
  modeMapping: 'C' | 'B' | 'A';
  tag: string;
}

export const DUBBING_MODELS: DubbingModel[] = [
  {
    id: '1.0',
    name: 'Mode C · Festival Subtitle Master',
    desc: 'Netflix 16 CPS Standard · 100% Original Audio Preserved · <35s',
    rate: '1 Credit/s',
    modeMapping: 'C',
    tag: 'Fast Path',
  },
  {
    id: '2.0',
    name: 'Mode B · Broadcast Streaming Dub',
    badge: '25% Off',
    desc: 'Demucs 4-Stem + Neural Voices · 170+ Languages · ~1m 05s',
    rate: '3 Credits/s',
    originalRate: '4 Credits/s',
    modeMapping: 'B',
    tag: 'Recommended',
  },
  {
    id: '3.0',
    name: 'Mode A · Theatrical Cinema Dub',
    badge: '14% Off',
    desc: '6 Autonomous Agents · Voice Cloning · QA Defect Repair & EBU R128',
    rate: '6 Credits/s',
    originalRate: '7 Credits/s',
    modeMapping: 'A',
    tag: 'Studio Master',
  },
];

interface ModelPickerProps {
  selectedModelId: '1.0' | '2.0' | '3.0';
  onSelectModel: (model: DubbingModel) => void;
}

export function ModelPicker({ selectedModelId, onSelectModel }: ModelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeModel = DUBBING_MODELS.find((m) => m.id === selectedModelId) || DUBBING_MODELS[1];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button replicating aidubbing.io */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-[#fbfbfd] border border-[#dbd8e8] hover:border-[#bd98ec] text-[#1a1a1a] shadow-xs transition-all duration-150 active:scale-[0.98] cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="text-xs font-medium text-[#575268]">Model</span>
        <span className="h-3 w-px bg-[#dbd8e8]" />
        <span className="text-xs font-bold text-[#1a1a1a]">{activeModel.name}</span>
        {activeModel.badge && (
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
            {activeModel.badge}
          </span>
        )}
        {isOpen ? (
          <ChevronUp className="w-3.5 h-3.5 text-[#575268]" />
        ) : (
          <ChevronDown className="w-3.5 h-3.5 text-[#575268]" />
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 mt-2 w-80 rounded-2xl bg-white border border-[#dbd8e8] shadow-2xl z-50 p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-[#575268] border-b border-[#f2f0f8] mb-1 flex items-center justify-between">
            <span>Select Engine Tier</span>
            <span className="text-[#7248ea]">AI Dubbing Models</span>
          </div>

          {DUBBING_MODELS.map((model) => {
            const isSelected = model.id === selectedModelId;
            return (
              <button
                key={model.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelectModel(model);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-xl flex items-start space-x-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#f2eeff] text-[#1a1a1a] border border-[#bd98ec]'
                    : 'hover:bg-[#f8f9fa] text-[#1a1a1a] border border-transparent'
                }`}
              >
                {/* Stylized Violet Logo Badge */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    isSelected ? 'bg-[#7248ea] text-white shadow-xs' : 'bg-[#f2eeff] text-[#7248ea]'
                  }`}
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" />
                  </svg>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-[#1a1a1a]">{model.name}</span>
                    {model.badge && (
                      <span className="text-[9.5px] font-bold px-1.5 py-0.2 rounded-full bg-[#fef3c7] text-[#b45309] border border-[#fde68a]">
                        {model.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#575268] mt-0.5 truncate">{model.desc}</p>
                  <div className="flex items-center space-x-1.5 mt-1 text-[10px] font-mono text-[#7248ea] font-medium">
                    <span>© {model.rate}</span>
                    {model.originalRate && (
                      <span className="text-[#9e9e9e] line-through">{model.originalRate}</span>
                    )}
                  </div>
                </div>

                {isSelected && (
                  <div className="text-[#7248ea] shrink-0 mt-1">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
