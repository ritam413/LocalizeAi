# Exercise 03.02: Director Targeted Retry Loop

## Concept
Instead of restarting the full pipeline on defects, the Director orchestrator holds the job graph and dispatches a targeted retry to the responsible agent (e.g. Sync Engineer or Localization Director) with QA findings, achieving self-repair.
