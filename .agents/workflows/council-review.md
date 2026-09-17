---
description: Run a Diverse Multi-Agent Debate (DMAD) Council Review across 5 distinct advisor perspectives with Chairman synthesis.
---

# Council Review Workflow

Execute the **Council Review** skill on the specified subject (code, architecture, PR, or plan).

1. **Activate Skill:** Load and apply `council-review` principles.
2. **Phase 1 (Blind Evaluation):** Analyze the target independently from 5 angles:
   - **Architect:** Modular seams, scalability, long-term maintenance.
   - **Security:** Vulnerabilities, failure modes, data integrity, race conditions.
   - **Minimalist:** Complexity budget, standard library alternatives, YAGNI.
   - **DX / Ergonomics:** API clarity, testability, caller ergonomics.
   - **Contrarian:** Challenging core premises and identifying blind spots.
3. **Phase 2 (Deliberation):** Compare findings, highlight unanimous points, and surface tradeoff tensions.
4. **Phase 3 (Chairman Synthesis):** Deliver a synthesized verdict (`ACCEPT`, `REVISE WITH CONDITIONS`, `REJECT`) with prioritized action items.
