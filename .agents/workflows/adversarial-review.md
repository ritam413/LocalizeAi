---
description: Execute a red-team adversarial review to stress-test code, PRs, or architecture and expose critical failure modes.
---

# Adversarial Review Workflow

Execute the **Adversarial Review** (Red Team) skill on the specified subject.

1. **Activate Skill:** Load and apply `adversarial-review` principles.
2. **Execute Attacks:**
   - **Chaos & Hostile Inputs:** Malformed data, boundary checks, state mutations.
   - **Concurrency & Races:** Parallel requests, atomic safety, deadlock potential.
   - **Scaling & Leaks:** Resource exhaustion, O(n²) bottlenecks, memory retention.
   - **Hidden Assumptions:** Flawed environmental or runtime assumptions.
3. **Verdict & Hardening:** Deliver an unambiguous verdict (`BLOCK`, `FLAGGED RISK`, `CLEARED`) and concrete remediation diffs.
