'use client';

import React, { useState, useId } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Check,
  Copy,
  RotateCcw,
  Film,
  Terminal,
  ExternalLink,
  X,
  ServerOff,
  HelpCircle,
  KeyRound,
  Cpu,
  ShieldAlert,
} from 'lucide-react';

export type ErrorCategory =
  | 'BACKEND_OFFLINE'
  | 'FILE_NOT_FOUND'
  | 'AUTH_API_KEY'
  | 'GPU_FFMPEG_ENGINE'
  | 'MEDIA_DECODE'
  | 'STAGE_FAILURE'
  | 'VALIDATION_ERROR'
  | 'GENERIC_ERROR';

export interface ActionableErrorDiagnostic {
  category: ErrorCategory;
  title: string;
  rootCause: string;
  technicalDetails?: string;
  statusCode?: number;
  remediationSteps: string[];
  suggestedActionLabel?: string;
  onSuggestedAction?: () => void;
  canRetry?: boolean;
  canUseSample?: boolean;
  suggestedCommand?: string;
}

export interface AccessibleErrorReportProps {
  error: string | Error | ActionableErrorDiagnostic | null;
  context?: 'ingestion' | 'dispatch' | 'stage' | 'settings' | 'video_preview' | 'general';
  onRetry?: () => void;
  onUseSample?: () => void;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Intelligent error diagnostician that translates raw errors, HTTP response codes,
 * and exceptions into clear, WCAG 2.2-compliant actionable error reports with step-by-step remedies.
 */
export function diagnoseError(
  rawError: string | Error | ActionableErrorDiagnostic | null,
  context: 'ingestion' | 'dispatch' | 'stage' | 'settings' | 'video_preview' | 'general' = 'general'
): ActionableErrorDiagnostic | null {
  if (!rawError) return null;

  // If already diagnosed
  if (typeof rawError === 'object' && 'category' in rawError && 'remediationSteps' in rawError) {
    return rawError as ActionableErrorDiagnostic;
  }

  const rawMsg = typeof rawError === 'string' ? rawError : rawError.message || String(rawError);
  const lowerMsg = rawMsg.toLowerCase();

  // 1. Backend Server Offline / Network Connection Drop
  if (
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('networkerror') ||
    lowerMsg.includes('connection refused') ||
    lowerMsg.includes('500') ||
    lowerMsg.includes('backend server error') ||
    lowerMsg.includes('port 8000') ||
    lowerMsg.includes('econnrefused') ||
    lowerMsg.includes('internal server error')
  ) {
    return {
      category: 'BACKEND_OFFLINE',
      title: 'Backend Service Unreachable (FastAPI Port 8000)',
      rootCause: 'The LOCALIZE frontend was unable to establish an HTTP connection with the Python FastAPI backend on port 8000.',
      technicalDetails: rawMsg,
      statusCode: 500,
      remediationSteps: [
        'Open a terminal and start the backend: cd backend && .venv\\Scripts\\python.exe -m uvicorn app.main:app --port 8000',
        'Verify the backend health check endpoint is active at http://localhost:8000/health',
        'Ensure no firewall or conflicting application is occupying port 8000',
      ],
      suggestedActionLabel: 'Test Connection & Retry',
      canRetry: true,
      suggestedCommand: 'cd backend && .venv\\Scripts\\python.exe -m uvicorn app.main:app --port 8000',
    };
  }

  // 2. Video Footage File Missing / Path Unresolved
  if (
    lowerMsg.includes('file not found') ||
    lowerMsg.includes('404') ||
    lowerMsg.includes('no such file') ||
    lowerMsg.includes('path does not exist') ||
    lowerMsg.includes('import video file') ||
    lowerMsg.includes('specify a valid movie file path') ||
    lowerMsg.includes('invalid movie path')
  ) {
    return {
      category: 'FILE_NOT_FOUND',
      title: 'Cinema Footage Not Found or Unresolved',
      rootCause: 'The specified video path could not be located on the local disk or storage directory.',
      technicalDetails: rawMsg,
      statusCode: 404,
      remediationSteps: [
        'Verify the target video path on disk (e.g. storage/sample_movie.mp4 or absolute path C:\\footage\\clip.mp4)',
        'Ensure read permissions are granted on the target file',
        'Alternatively, click "Load Studio Sample Reel" to use verified demo footage',
      ],
      suggestedActionLabel: 'Load Studio 4K Sample Reel',
      canRetry: true,
      canUseSample: true,
    };
  }

  // 3. Gemini / Google Cloud AI Auth & API Key
  if (
    lowerMsg.includes('gemini') ||
    lowerMsg.includes('api_key') ||
    lowerMsg.includes('401') ||
    lowerMsg.includes('403') ||
    lowerMsg.includes('unauthorized') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('resource_exhausted')
  ) {
    return {
      category: 'AUTH_API_KEY',
      title: 'Google Cloud AI (Gemini) Configuration Required',
      rootCause: 'Gemini API authentication failed or quota limit exceeded for agent reasoning.',
      technicalDetails: rawMsg,
      statusCode: 401,
      remediationSteps: [
        'Open backend/.env and verify GEMINI_API_KEY=AIzaSy... is present and active',
        'Check your quota and project settings at https://aistudio.google.com',
        'The system will fall back to local heuristic reasoning if no API key is set',
      ],
      suggestedActionLabel: 'Retry Pipeline Dispatch',
      canRetry: true,
    };
  }

  // 4. GPU / Demucs / FFmpeg Audio Scaffolding
  if (
    lowerMsg.includes('ffmpeg') ||
    lowerMsg.includes('demucs') ||
    lowerMsg.includes('cuda') ||
    lowerMsg.includes('vram') ||
    lowerMsg.includes('out of memory') ||
    lowerMsg.includes('torch')
  ) {
    return {
      category: 'GPU_FFMPEG_ENGINE',
      title: 'Audio Processing & Separation Scaffolding Alert',
      rootCause: 'FFmpeg or Demucs neural stem separation encountered a hardware or binary dependency constraint.',
      technicalDetails: rawMsg,
      remediationSteps: [
        'Ensure ffmpeg is installed and present in your system PATH (run: ffmpeg -version)',
        'Switch Project Preset to Mode B (Broadcast Streaming Dub) or Mode C (Subtitle Master) to bypass heavy stem separation',
        'Adjust GPU VRAM allocations in Studio Settings (/settings)',
      ],
      suggestedActionLabel: 'Adjust Studio Settings',
      canRetry: true,
    };
  }

  // 5. Media Decoding & Browser Codec
  if (
    context === 'video_preview' ||
    lowerMsg.includes('media_err') ||
    lowerMsg.includes('decode') ||
    lowerMsg.includes('not supported') ||
    lowerMsg.includes('h.264')
  ) {
    return {
      category: 'MEDIA_DECODE',
      title: 'Browser HTML5 Cinema Codec Incompatibility',
      rootCause: 'The browser cannot natively decode this video stream (e.g. ProRes 4444 or uncompressed container).',
      technicalDetails: rawMsg,
      remediationSteps: [
        'Web video preview requires standard H.264 (AVC) or WebM VP9 video with AAC audio',
        'Transcode for preview using FFmpeg: ffmpeg -i input.mov -c:v libx264 -c:a aac preview.mp4',
        'Note: The backend multi-agent pipeline can still process all raw master audio stems directly',
      ],
      suggestedActionLabel: 'Load Studio Sample Reel',
      canRetry: true,
      canUseSample: true,
      suggestedCommand: 'ffmpeg -i input.mov -c:v libx264 -c:a aac preview.mp4',
    };
  }

  // 6. Stage Failure during active run
  if (context === 'stage' || lowerMsg.includes('stage') || lowerMsg.includes('pipeline failed')) {
    return {
      category: 'STAGE_FAILURE',
      title: 'Post-Production Pipeline Stage Fault',
      rootCause: 'An error occurred during execution of this pipeline stage.',
      technicalDetails: rawMsg,
      remediationSteps: [
        'Inspect the Stage Terminal logs below for the exact Python traceback and line number',
        'Click "Rerun Stage" to retry with checkpointed stage inputs',
        'Verify the source audio contains audible speech segments within the expected range',
      ],
      suggestedActionLabel: 'Rerun Stage',
      canRetry: true,
    };
  }

  // 7. Generic Fallback Error
  return {
    category: 'GENERIC_ERROR',
    title: context === 'dispatch' ? 'Pipeline Dispatch Fault' : 'Post-Production Operation Failed',
    rootCause: rawMsg,
    technicalDetails: rawMsg,
    remediationSteps: [
      'Review the diagnostic message above for specific failure details',
      'Verify that all required form parameters and input files are present',
      'Retry the operation or inspect the server logs in your backend terminal',
    ],
    suggestedActionLabel: 'Retry Operation',
    canRetry: true,
  };
}

export function AccessibleErrorReport({
  error,
  context = 'general',
  onRetry,
  onUseSample,
  onDismiss,
  className = '',
}: AccessibleErrorReportProps) {
  const [copied, setCopied] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const reportId = useId();

  const diagnostic = diagnoseError(error, context);
  if (!diagnostic) return null;

  const handleCopyDiagnostics = async () => {
    const payload = JSON.stringify(
      {
        timestamp: new Date().toISOString(),
        category: diagnostic.category,
        title: diagnostic.title,
        rootCause: diagnostic.rootCause,
        technicalDetails: diagnostic.technicalDetails,
        statusCode: diagnostic.statusCode,
        remediationSteps: diagnostic.remediationSteps,
        context,
      },
      null,
      2
    );

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(payload);
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
      }
    } catch (err) {
      console.error('Failed to copy error diagnostics:', err);
    }
  };

  const getCategoryBadge = (cat: ErrorCategory) => {
    switch (cat) {
      case 'BACKEND_OFFLINE':
        return {
          label: 'BACKEND OFFLINE (PORT 8000)',
          icon: <ServerOff className="w-3.5 h-3.5" aria-hidden="true" />,
          bgColor: 'bg-[#f2eeff] text-[#7248ea] border-[#dbd8e8]',
        };
      case 'FILE_NOT_FOUND':
        return {
          label: 'MEDIA PATH RESOLUTION',
          icon: <Film className="w-3.5 h-3.5" aria-hidden="true" />,
          bgColor: 'bg-[#f2eeff] text-[#7248ea] border-[#dbd8e8]',
        };
      case 'AUTH_API_KEY':
        return {
          label: 'GOOGLE AI CONFIGURATION',
          icon: <KeyRound className="w-3.5 h-3.5" aria-hidden="true" />,
          bgColor: 'bg-[#f8f9fa] text-[#1a1a1a] border-[#dbd8e8]',
        };
      case 'GPU_FFMPEG_ENGINE':
        return {
          label: 'AUDIO ENGINE & GPU',
          icon: <Cpu className="w-3.5 h-3.5" aria-hidden="true" />,
          bgColor: 'bg-[#f8f9fa] text-[#1a1a1a] border-[#dbd8e8]',
        };
      case 'MEDIA_DECODE':
        return {
          label: 'BROWSER CODEC NOTICE',
          icon: <Film className="w-3.5 h-3.5" aria-hidden="true" />,
          bgColor: 'bg-[#f8f9fa] text-[#1a1a1a] border-[#dbd8e8]',
        };
      case 'STAGE_FAILURE':
        return {
          label: 'STAGE EXECUTION DEFECT',
          icon: <AlertOctagon className="w-3.5 h-3.5 text-[#7248ea]" aria-hidden="true" />,
          bgColor: 'bg-[#fdf3fe] text-[#7248ea] border-[#e261e5]',
        };
      default:
        return {
          label: 'OPERATION ALERT',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-[#7248ea]" aria-hidden="true" />,
          bgColor: 'bg-[#fdf3fe] text-[#1a1a1a] border-[#e261e5]',
        };
    }
  };

  const badge = getCategoryBadge(diagnostic.category);

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      aria-labelledby={`error-title-${reportId}`}
      aria-describedby={`error-cause-${reportId}`}
      className={`rounded-[16px] bg-[#fdf3fe] border-[2px] border-[#e261e5] p-5 sm:p-6 text-[#1a1a1a] shadow-[0_8px_30px_rgba(226,97,229,0.12)] space-y-4 font-sans transition-all ${className}`}
    >
      {/* Top Header Bar */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-[#7248ea] text-white flex items-center justify-center flex-shrink-0 shadow-sm mt-0.5">
            <AlertOctagon className="w-5 h-5" aria-hidden="true" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider border ${badge.bgColor}`}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </span>

              {diagnostic.statusCode && (
                <span className="text-[10.5px] font-mono font-bold px-2 py-0.5 rounded-full bg-[#130e30]/10 text-[#1a1a1a]">
                  HTTP {diagnostic.statusCode}
                </span>
              )}
            </div>

            <h2
              id={`error-title-${reportId}`}
              className="text-base sm:text-lg font-black uppercase tracking-tight text-[#1a1a1a]"
            >
              {diagnostic.title}
            </h2>
          </div>
        </div>

        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss error report"
            className="p-1.5 rounded-full text-[#575268] hover:text-[#1a1a1a] hover:bg-[#130e30]/10 transition-all focus-visible:ring-2 focus-visible:ring-[#7248ea] focus-visible:outline-hidden"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Root Cause Explanation */}
      <div className="bg-[#fbfbfd] border border-[#dbd8e8] rounded-2xl p-4 space-y-2">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-mono font-black uppercase tracking-wider text-[#7248ea]">
            ● What Happened:
          </span>
        </div>
        <p id={`error-cause-${reportId}`} className="text-xs sm:text-sm font-semibold text-[#1a1a1a] leading-relaxed">
          {diagnostic.rootCause}
        </p>
      </div>

      {/* Remediation Action Plan (What users can do to fix it) */}
      <div className="bg-[#f8f9fa] border border-[#dbd8e8] rounded-2xl p-4 space-y-2.5">
        <div className="flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-[#1a1a1a]" aria-hidden="true" />
          <h3 className="text-xs font-black uppercase tracking-wider text-[#1a1a1a]">
            Recommended Fixes &amp; Next Steps:
          </h3>
        </div>

        <ol className="space-y-2 text-xs text-[#1a1a1a] font-medium list-none">
          {diagnostic.remediationSteps.map((step, idx) => (
            <li key={idx} className="flex items-start space-x-2.5">
              <span className="w-5 h-5 rounded-full bg-[#130e30] text-[#7248ea] text-[10px] font-mono font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>

        {diagnostic.suggestedCommand && (
          <div className="mt-3 pt-2.5 border-t border-[#dbd8e8] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#130e30] text-[#14804a] p-3 rounded-xl font-mono text-[11px]">
            <div className="flex items-center space-x-2 overflow-x-auto">
              <Terminal className="w-4 h-4 text-[#7248ea] flex-shrink-0" aria-hidden="true" />
              <code>{diagnostic.suggestedCommand}</code>
            </div>
            <button
              type="button"
              onClick={handleCopyDiagnostics}
              className="px-3 py-1 bg-[#7248ea] hover:bg-[#6847ff] text-white rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center space-x-1 self-start sm:self-auto transition-all active:scale-[0.97]"
            >
              {copied ? <Check className="w-3 h-3 text-[#1a1a1a]" /> : <Copy className="w-3 h-3 text-[#1a1a1a]" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Technical Diagnostics Collapsible (Optional) */}
      {diagnostic.technicalDetails && (
        <div>
          <button
            type="button"
            onClick={() => setShowTechDetails(!showTechDetails)}
            aria-expanded={showTechDetails}
            aria-controls={`tech-details-${reportId}`}
            className="text-[11px] font-mono font-bold text-[#575268] hover:text-[#1a1a1a] underline flex items-center space-x-1.5 focus-visible:ring-2 focus-visible:ring-[#7248ea] rounded px-1"
          >
            <span>{showTechDetails ? 'Hide technical trace' : 'View raw technical trace / status code'}</span>
          </button>

          {showTechDetails && (
            <div
              id={`tech-details-${reportId}`}
              className="mt-2 bg-[#130e30] text-[#f9fbf2] p-3 rounded-xl text-[11px] font-mono overflow-x-auto border border-white/10"
            >
              <pre className="whitespace-pre-wrap">{diagnostic.technicalDetails}</pre>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons Bar */}
      <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap">
          {(onRetry || diagnostic.canRetry) && (
            <button
              type="button"
              onClick={() => (onRetry ? onRetry() : diagnostic.onSuggestedAction?.())}
              className="px-4 py-2.5 rounded-full bg-[#7248ea] hover:bg-[#6847ff] text-white border border-[#dbd8e8] text-xs font-black uppercase tracking-wider flex items-center space-x-2 transition-all active:scale-[0.97] shadow-xs cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7248ea] focus-visible:outline-hidden"
            >
              <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" aria-hidden="true" />
              <span>{diagnostic.suggestedActionLabel || 'Retry Operation'}</span>
            </button>
          )}

          {(onUseSample || diagnostic.canUseSample) && (
            <button
              type="button"
              onClick={onUseSample}
              className="px-4 py-2.5 rounded-full bg-[#f8f9fa] hover:bg-[#e2e8d4] text-[#1a1a1a] border border-[#dbd8e8] text-xs font-bold flex items-center space-x-2 transition-all active:scale-[0.97] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7248ea] focus-visible:outline-hidden"
            >
              <Film className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Use Studio Sample Reel</span>
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopyDiagnostics}
          aria-label="Copy sanitized diagnostic report to clipboard"
          className="px-3.5 py-2 rounded-full bg-[#fbfbfd] hover:bg-[#f8f9fa] text-[#1a1a1a] border border-[#dbd8e8] text-xs font-bold flex items-center space-x-1.5 transition-all active:scale-[0.97] cursor-pointer focus-visible:ring-2 focus-visible:ring-[#7248ea] focus-visible:outline-hidden ml-auto"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-[#14804a]" aria-hidden="true" />
              <span className="text-[#1a1a1a]">Diagnostic Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Copy Diagnostic Report</span>
            </>
          )}
        </button>
      </div>

      {/* Screen reader status for copy */}
      <div role="status" aria-live="polite" className="sr-only">
        {copied ? 'Diagnostic error report copied to clipboard' : ''}
      </div>
    </div>
  );
}
