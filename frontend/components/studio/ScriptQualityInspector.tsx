'use client';

import React from 'react';
import { MessageSquare, Check, Shield, Sparkles, BookOpen } from 'lucide-react';

export interface ScriptDialogueLine {
  sceneId: string;
  timestamp: string;
  speaker: string;
  sourceText: string;
  localizedText: string;
  sourceLang: string;
  targetLang: string;
  syllablesSource: number;
  syllablesTarget: number;
  tone: string;
  isIsometricMatch: boolean;
  properNounPreserved: boolean;
}

interface ScriptQualityInspectorProps {
  dialogueLine?: ScriptDialogueLine;
  properNounLockCount?: number;
  properNounTotal?: number;
}

export const ScriptQualityInspector: React.FC<ScriptQualityInspectorProps> = ({
  dialogueLine = {
    sceneId: 'scene_07',
    timestamp: '03.20s',
    speaker: 'Ichigo Kurosaki',
    sourceText: '護廷十三隊を救う気があるなら、引くな！',
    localizedText: 'अगर तुम सचमुच सोल सोसाइटी को बचाना चाहते हो, तो पीछे मत हटना!',
    sourceLang: 'JP',
    targetLang: 'HI',
    syllablesSource: 14,
    syllablesTarget: 14,
    tone: 'Defiant · Urgent',
    isIsometricMatch: true,
    properNounPreserved: true,
  },
  properNounLockCount = 100,
  properNounTotal = 100,
}) => {
  return (
    <div className="bg-white border border-[#D0DFEE] rounded-[16px] p-6 shadow-sm space-y-4 font-sans text-[#0F172A]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#F0F6FC] pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#2B7FFF]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#0F172A]">
            Character Tone & Script Localization Quality
          </h2>
        </div>
        <span className="px-2 py-0.5 rounded-[4px] bg-[#F0FDF4] text-[#15803D] font-mono text-[10px] font-bold uppercase border border-[#BBF7D0]">
          ISOMETRIC PASS
        </span>
      </div>

      <div className="space-y-3 text-xs">
        {/* Dialogue Line Card */}
        <div className="p-3.5 bg-[#F0F6FC] rounded-[8px] border border-[#D0DFEE] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#0F172A] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#7248EA]" />
              Speaker: <strong>{dialogueLine.speaker}</strong>
            </span>
            <span className="font-mono text-[10px] text-[#64748B]">
              Scene: {dialogueLine.sceneId} @ {dialogueLine.timestamp}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
            <div className="p-2 bg-white rounded-[4px] border border-[#D0DFEE]">
              <span className="text-[10px] text-[#64748B] block uppercase font-sans font-bold">
                Source Script ({dialogueLine.sourceLang}):
              </span>
              <p className="text-[#0F172A] mt-0.5 font-sans leading-relaxed">{dialogueLine.sourceText}</p>
            </div>
            <div className="p-2 bg-white rounded-[4px] border border-[#D0DFEE]">
              <span className="text-[10px] text-[#2B7FFF] block uppercase font-sans font-bold">
                Localized Script ({dialogueLine.targetLang}):
              </span>
              <p className="text-[#0F172A] mt-0.5 font-sans leading-relaxed">{dialogueLine.localizedText}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1">
            <span>
              Syllable Match:{' '}
              <strong className="text-[#15803D]">
                {dialogueLine.syllablesTarget} / {dialogueLine.syllablesSource} (Exact Isochrony)
              </strong>
            </span>
            <span>
              Tone: <strong className="text-[#7248EA]">{dialogueLine.tone}</strong>
            </span>
          </div>
        </div>

        {/* Quality Standards Checklist */}
        <div className="divide-y divide-[#F0F6FC] pt-1">
          <div className="py-2 flex items-center justify-between">
            <span className="text-[#475569] flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-[#2B7FFF]" />
              English Proper Noun Lock
            </span>
            <span className="font-mono font-bold text-[#15803D] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#15803D]" />
              {properNounLockCount}% Preserved (Soul Society, Bankai)
            </span>
          </div>

          <div className="py-2 flex items-center justify-between">
            <span className="text-[#475569] flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#7248EA]" />
              Colloquial Numeral Localization
            </span>
            <span className="font-mono font-bold text-[#15803D] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5 text-[#15803D]" />
              Devanagari Spoken Parity
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
