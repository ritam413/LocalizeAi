# TICKET-23: Studio Console Advanced Timeline Marker & Compute Savings HUD

**Status:** Planned  
**Parent Epic:** Selective Windowed Demucs Vocal Separation  
**Primary Seam:** `frontend/components/studio/WorkbenchCard.tsx`, `frontend/components/studio/DemucsTimelineSelector.tsx`  
**Test Suite:** `frontend/__tests__/demucs_timeline_selector.test.tsx`  
**Dependencies:** TICKET-22  

---

## 1. Context & Motivation
Empower advanced users to optionally mark custom separation windows via a collapsible "Advanced Dubbing Settings" accordion on the Studio Console hero workbench card, while displaying dynamic compute time savings (`Demucs: 12m / 50m — 76% Compute Saved (~20m)`) in the live execution terminal and progress gauges.

## 2. Specification & Requirements

1. **Workbench Advanced Settings Accordion (`WorkbenchCard.tsx`)**:
   - Add an expandable "Advanced Stem & Demucs Settings" toggle.
   - Include a segmented control: `Auto (AI-Detected Speech Windows)` vs `Custom Time Ranges`.
   - In custom mode, render a clean, Emil Kowalski-styled range input with quick preset buttons (`All Video`, `First 10 mins`, `Clear`) and live syntax validator.

2. **Compute Savings Badge & HUD**:
   - In `AgentSequenceTrack.tsx` and `DecisionFeed.tsx`, when the Vocal Separation step executes, render an Electric Violet / Mint pill:
     `⚡ Selective Separation: 13m 40s / 50m (Saved ~22m)`.

## 3. Verification Criteria
- [ ] Vitest verifying timeline input, range validation, preset buttons, and payload binding.
- [ ] Responsive design & WCAG 2.1 contrast compliance.
