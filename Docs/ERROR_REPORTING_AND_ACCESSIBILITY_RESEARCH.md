# Error Reporting & Accessibility (WCAG 2.2 / WAI-ARIA) Research

**Date**: 2026-09-09  
**Author**: Antigravity Agent  
**Status**: Authoritative Architectural & Accessibility Specification  
**Primary Standards & Specs Cited**:
- W3C Web Content Accessibility Guidelines (WCAG) 2.2 (W3C Recommendation, Oct 2023)
  - *SC 3.3.1 Error Identification (Level A)*
  - *SC 3.3.2 Labels or Instructions (Level A)*
  - *SC 3.3.3 Error Suggestion (Level AA)*
  - *SC 3.3.4 Error Prevention (Legal, Financial, Data) (Level AA)*
  - *SC 4.1.3 Status Messages (Level AA)*
  - *SC 1.4.3 Contrast (Minimum) (Level AA)*
  - *SC 2.4.7 Focus Visible (Level AA)*
- W3C WAI-ARIA 1.2 Authoring Practices Guide (APG)
  - *Alert Pattern (`role="alert"`, `aria-live="assertive"`, `aria-atomic="true"`)*
  - *Form Validation & Error Notification (`aria-invalid="true"`, `aria-describedby="[id]"`, `aria-errormessage="[id]"`, `aria-required="true"`)*
  - *Status Message Pattern (`role="status"`, `aria-live="polite"`)*
- Google Material Design 3 & Apple Human Interface Guidelines on Actionable Error Feedback

---

## 1. Problem Statement & Audit Findings

### 1.1 The Problem in LOCALIZE AI Studio
When complex AI post-production pipelines fail (e.g. backend offline, GPU OOM, missing FFmpeg binary, unreadable movie file path, missing `GEMINI_API_KEY`, or audio stem sync overflow), users were receiving:
1. **Opaque single-line strings** (e.g., `"Failed to launch autonomous dubbing run (Status 500)"` or `"Failed to import video file"`).
2. **Zero actionable guidance**: Users were left wondering:
   - *Did the backend crash?*
   - *Is my video codec unsupported?*
   - *Did Demucs run out of VRAM?*
   - *What exact CLI command or setting fixes this right now?*
3. **Accessibility (a11y) Violations**:
   - Error banners lacked `role="alert"` and `aria-live="assertive"`, so screen reader users were not alerted to dispatch failures.
   - Form input fields (e.g., file path inputs, language selectors, VRAM inputs) did not set `aria-invalid="true"` or link to error descriptions with `aria-describedby`.
   - Action buttons in error states lacked keyboard-accessible remedies (e.g., one-click "Retry", "Load Sample Video Fallback", or "Copy Diagnostics").
   - Video player decode errors failed silently without user recovery paths.

---

## 2. WCAG 2.2 & WAI-ARIA Error Reporting Requirements

### 2.1 WCAG Success Criteria Breakdown

| WCAG SC | Name | Requirement | LOCALIZE Implementation |
|---|---|---|---|
| **3.3.1 (A)** | Error Identification | Item in error is identified and described in text. | Explicitly pinpoint failing subsystem (Ingestion, Whisper ASR, Demucs Stem Split, Gemini API, or FFmpeg) with human-readable error titles. |
| **3.3.2 (A)** | Labels or Instructions | Labels or instructions provided when content requires input. | Every file input, dropdown, path field, and checkbox has an associated `<label htmlFor="...">`, `aria-label`, and helper subtext. |
| **3.3.3 (AA)** | Error Suggestion | Provide suggestions for correction if known. | Multi-tier remediation card providing step-by-step corrective instructions and automated one-click fix buttons. |
| **4.1.3 (AA)** | Status Messages | Status updates can be programmatically determined by assistive technologies without receiving focus. | Use `aria-live="assertive"` + `role="alert"` for blocking dispatch errors; use `aria-live="polite"` + `role="status"` for progress updates. |
| **1.4.3 (AA)** | Contrast (Minimum) | Visual text has at least 4.5:1 contrast against background. | Deep ink text (`#130e30`) on fuchsia/warning tinted background (`#fdf3fe` / `#ffe228`) with high-contrast borders (`#e261e5` / `#130e30`). |
| **2.4.7 (AA)** | Focus Visible | Keyboard focus is clearly visible. | `focus-visible:ring-2 focus-visible:ring-[#130e30] focus-visible:outline-hidden` on all action buttons and links. |

---

## 3. Intelligent Error Diagnostic Taxonomy for LOCALIZE

Errors encountered during video localization fall into 6 discrete operational categories with specific diagnoses and immediate remedies:

### Category 1: Backend Server Offline / Network Disconnect
- **Symptom**: `Failed to fetch`, `Status 502/503/504`, or `Failed to connect to backend on port 8000`.
- **Root Cause**: FastAPI server (`uvicorn`) is not running or blocked by firewall.
- **Actionable Steps**:
  1. Open terminal and run: `cd backend && .venv\Scripts\python.exe -m uvicorn app.main:app --port 8000`
  2. Verify backend health endpoint at `http://localhost:8000/health`.
  3. Click **"Test Connection & Retry"**.

### Category 2: Missing or Invalid Video File / Path
- **Symptom**: `404 Not Found`, `File does not exist`, or `Import path cannot be resolved`.
- **Root Cause**: Local storage path is mistyped or file was moved.
- **Actionable Steps**:
  1. Verify the exact path on disk (e.g. `storage/sample_movie.mp4` or absolute path `C:\...\clip.mp4`).
  2. Ensure file permissions allow read access.
  3. Click **"Load Verified Studio Sample Reel"** as a fallback.

### Category 3: Google Cloud AI / Gemini API Authentication
- **Symptom**: `401 Unauthorized`, `GEMINI_API_KEY missing`, `RESOURCE_EXHAUSTED`.
- **Root Cause**: Missing or quota-limited Gemini API key in backend `.env`.
- **Actionable Steps**:
  1. Check `backend/.env` and ensure `GEMINI_API_KEY=AIzaSy...` is configured.
  2. Verify quota on Google AI Studio console (`aistudio.google.com`).
  3. The system will automatically use deterministic fallback heuristics if offline.

### Category 4: Audio Engine / FFmpeg / Demucs Dependency
- **Symptom**: `ffmpeg executable not found`, `Demucs CUDA out of memory`.
- **Root Cause**: Missing system FFmpeg in PATH or VRAM exceeded.
- **Actionable Steps**:
  1. Ensure `ffmpeg.exe` is available in PATH or root workspace.
  2. Switch Project Preset to **Mode B (Broadcast Streaming Dub)** or **Mode C (Subtitle Master)** to bypass heavy stem separation.
  3. Lower GPU VRAM allocation in **Studio Settings** (`/settings`).

### Category 5: Video Codec & Media Decode Errors
- **Symptom**: `HTML5 Video Element decode error (Code 4 / MEDIA_ERR_SRC_NOT_SUPPORTED)`.
- **Root Cause**: Video container uses ProRes 4444 or unsupported browser codec without H.264/AAC transcode.
- **Actionable Steps**:
  1. Video preview in browser requires standard H.264 (AVC) or WebM VP9.
  2. Re-encode using FFmpeg: `ffmpeg -i input.mov -c:v libx264 -c:a aac output.mp4`
  3. Pipeline will still process raw multi-format stems in backend.

### Category 6: Pipeline Stage QA Defect & Continuity Fault
- **Symptom**: `TIMING_OVERFLOW`, `SUBTITLE_DRIFT`, `AUDIO_CLIPPING`.
- **Root Cause**: Translated speech exceeds dialogue time window.
- **Actionable Steps**:
  1. Inspect QA Repair card on Studio Console.
  2. Director automatically triggers targeted retry with `atempo 1.25x` or line shortening.
  3. Review Subtitle editor at `/runs/[id]/subtitles` for manual adjustments.

---

## 4. UI/UX Component Architecture: `AccessibleErrorReport`

The reusable `AccessibleErrorReport` component will provide:
1. **Semantic HTML5 & ARIA Wrapper**:
   - `role="alert"`
   - `aria-live="assertive"`
   - `aria-atomic="true"`
   - Unique generated IDs for `aria-labelledby` and `aria-describedby` linkage.
2. **Diagnostic Structure**:
   - **Header**: Category Badge (e.g. `[BACKEND CONNECTIVITY]`, `[MEDIA INGESTION]`, `[API CONFIGURATION]`), Error Title, and Timestamp.
   - **Diagnostic Root Cause**: Clear explanation of what failed and status/code details.
   - **Remediation Action Plan**: Numbered step-by-step guide with copyable terminal commands.
   - **Interactive Action Bar**:
     - `[ ⟳ Retry Action ]` (Primary Hi-Yellow button)
     - `[ 🎬 Load Sample Fallback ]` (If ingestion error)
     - `[ 📋 Copy Diagnostic Report ]` (Copies sanitized diagnostic JSON/text to clipboard with screen reader announcement)
     - `[ ✕ Dismiss ]` (Accessible dismiss button)
3. **Form Field Level Integration**:
   - Inputs with errors get `aria-invalid="true"` and `aria-describedby="[field]-error"`.
   - Inline field error messages with `role="alert"`.

---

## 5. Verification & Testing Strategy

- **Vitest Unit Tests**:
  - Verify `AccessibleErrorReport` renders all ARIA attributes correctly (`role="alert"`, `aria-live="assertive"`).
  - Verify intelligent categorization logic converts raw status codes (500, 404, 401, network failure) into actionable remediation steps.
  - Verify "Copy Diagnostic Report" clipboard trigger and callback firing.
  - Verify keyboard accessibility and focus management.
- **Form Validation Tests**:
  - Test `/runs/new` and `/settings` form validation with invalid inputs and screen reader attributes.
- **Full-Stack Regression Tests**:
  - Run `npm test` across frontend Vitest suites.
  - Run `pytest` across backend Pytest suites.
  - Run `npx tsc --noEmit` to verify type safety.
