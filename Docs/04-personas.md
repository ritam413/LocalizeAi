# User Personas — DubForge Studio

v1 is single-user, but modeling distinct *usage modes* of that one user clarifies which screens/flows matter most.

## Persona 1 — "The Archivist" (primary, Project A)
**Who:** Yu, running occasional high-value dubs of specific clips into Hindi/Bengali for family/personal-quality reasons.
**Volume:** Low — a handful of clips per month.
**Priorities:** Output quality over speed. Wants to review transcript, translation, and voice-clone reference before committing GPU time. Comfortable waiting 1.5–2.5 hours per clip/language.
**Pain today:** No visibility into whether Stage 4 (translation) is even correct before Stage 6 (expensive TTS) burns 30–70 minutes on a bad translation.
**What they need from the product:** Review gates before expensive stages, per-speaker reference clip auditioning, Bengali-specific fallback guidance (since it's the known weak link).

## Persona 2 — "The Batcher" (Project B)
**Who:** Same user, different mode — processing a backlog of Spanish/Portuguese/Russian clips into English/Russian/French.
**Volume:** High — many clips queued at once.
**Priorities:** Throughput and not babysitting the pipeline. Wants to queue 10 clips before bed and check results in the morning.
**Pain today:** No batch queue, no resumability — a crash on clip 7 of 10 loses all progress on that clip.
**What they need from the product:** Batch queueing, resumable runs, run history with clear pass/fail state, minimal manual review (this language set is described as "low quality risk" in the research).

## Persona 3 — "The Fast Captioner" (Project C, subtitle-only)
**Who:** Same user, needs a quick, good English subtitle track from an arbitrary-language clip, no dubbing.
**Volume:** Frequent, fast turnaround expected (under an hour).
**Priorities:** Speed and subtitle *formatting* quality (gaps, CPS, line length) — explicitly the two quality bars named in the research report.
**What they need from the product:** A one-click subtitle-only mode that skips TTS entirely, with an editor that visually flags CPS/gap violations before export.

## Shared traits across all three
- Technical enough to understand pipeline stages and model names, so the UI can expose real model choices rather than hiding them
- Runs on constrained/split hardware (4GB GPU + CPU laptop) — cares about *where* a job runs, not just *that* it runs
- Values inspectability: wants to see and, when needed, override what each stage produced before the next stage consumes it
