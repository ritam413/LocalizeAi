# TICKET-14: Perceptual Acoustic QA & Quantitative Self-Repair Exercises

Welcome to the **Perceptual Acoustic QA & Quantitative Self-Repair** exercise set. These exercises guide you through implementing digital audio signal inspection (0 dBFS clipping detection), exact syllable delta calculation ($\Delta S = \lceil \Delta t \times 3.2 \rceil$), and closed-loop targeted retry dispatching across the multi-agent crew.

---

## Exercise 14.01: Digital Audio Clipping Detection (`check_audio_clipping`)

### Background
Shallow duration subtraction alone misses acoustic defects like digital distortion or amplitude clipping occurring at $0\text{ dBFS}$ ($|x| \ge 0.999$). In production, dialogue stems rendered with excessive synthesis gain or inadequate mastering must be automatically flagged.

### Goal
Implement `check_audio_clipping(audio_path: Union[str, Path]) -> Tuple[bool, int, float]` in `backend/app/agents/qa_agent.py`.

### Requirements
1. Read the audio WAV file using `wave` and convert samples to floating-point values in $[-1.0, 1.0]$.
2. Measure peak amplitude: $\max(|x|)$.
3. Count samples where $|x| \ge 0.999$.
4. Return `(is_clipped: bool, clipped_samples: int, peak_amplitude: float)`.
5. Gracefully return `(False, 0, 0.0)` for missing files or invalid headers.

---

## Exercise 14.02: Quantitative Syllable Delta Calculation

### Background
When dialogue overflows its allocated visual time window by $\Delta t > 0.3s$, simply telling an upstream agent "make it shorter" causes vague or repeated trial-and-error retries. Calculating the exact syllable deficit gives `LocalizationDirectorAgent` a deterministic reduction quota.

### Goal
Calculate the exact integer syllable reduction deficit:
$$\Delta S = \lceil \Delta t \times 3.2 \rceil$$
where $3.2\text{ syllables/second}$ is standard conversational speech rate.

### Requirements
1. When $\Delta t > 0.3s$, compute $\Delta S = \text{math.ceil}(\Delta t \times 3.2)$.
2. If $\Delta t > 0.5s$ (severe overflow beyond comfortable atempo limits), set target agent to `"localization_director"` with specific syllable reduction directive.
3. If $0.3s < \Delta t \le 0.5s$, set target agent to `"sync_engineer"` with atempo speed factor advice.

---

## Exercise 14.03: Signal-Aware Stem Inspection (`inspect_stems_with_signal`)

### Background
A release candidate cut contains synthesized audio stems and subtitles. `QAContinuityAgent` inspects all stems in parallel for both acoustic signal defects and timing constraints.

### Goal
Implement `inspect_stems_with_signal` in `QAContinuityAgent`.

### Requirements
1. Check each stem for `AUDIO_CLIPPING` via `check_audio_clipping`.
2. Check each stem for `TIMING_OVERFLOW` and calculate $\Delta S$.
3. Check subtitles for `SUBTITLE_DRIFT`.
4. Calculate `release_readiness_score` (0–100) and `verdict` (`"pass"` if score $\ge 85.0$ and 0 defects, else `"rework_required"`).
5. Output structured findings including `defect_type`, `target_segment_id`, `syllables_to_reduce`, `fix_proposal`, `recommended_fix`, `target_agent`, and `severity`.

---

## Exercise 14.04: Multi-Agent Targeted Self-Repair Routing in `DirectorAgent`

### Background
When QA flags defects, `DirectorAgent` intercepts the report and selectively dispatches targeted retries upstream:
- `TIMING_OVERFLOW` with $\Delta S > 0$ $\rightarrow$ `LocalizationDirectorAgent` with `rework_instructions={"segment_id": id, "delta_syllables": dS}`
- `AUDIO_CLIPPING` $\rightarrow$ `VoiceDirectorAgent` with gain remediation
- `TIMING_OVERFLOW` (mild) / `SUBTITLE_DRIFT` $\rightarrow$ `SyncEngineerAgent` / `SubtitleDirectorAgent`

### Goal
Upgrade `DirectorAgent._execute` to route quantitative fix directives directly to the target agent, re-run downstream dependent stages, and verify QA readiness score $\ge 85.0$.

---

## Verification Checklist
- [ ] `check_audio_clipping` flags audio with sample amplitudes $\ge 0.999$.
- [ ] $\Delta S = \lceil \Delta t \times 3.2 \rceil$ computed correctly.
- [ ] `LocalizationDirectorAgent` receives quantitative rework instructions and adapts to compact translations.
- [ ] `DirectorAgent` runs targeted self-repair loop and converges to `status: completed` and score $\ge 85.0$.
- [ ] All Pytest and Vitest test suites pass 100%.
