# LOCALIZE — Agent Build Brief
**Autonomous AI Post-Production Crew for Film/Video Localization**

> **Kickoff prompt (paste this to your coding agent first):**
> "Read `LOCALIZE_AGENT_BUILD_BRIEF.md` in full. Follow the Bootstrap Protocol in Section 1 before writing any code — do not skip the audit, tracker, context, and docs steps. Then pick the next unchecked item in `TRACKER.md` and implement it. Report what you changed and update the tracker before ending your turn."

**Assumption stated up front:** this brief defaults to **Grafana as the primary partner track**, since it was the strongest fit for this architecture (observability over a multi-agent pipeline). Parallel (web research) and ClickHouse (analytics) are included as optional stretch integrations you can layer on if time allows — swap the "Primary Track" in Section 5 if you decide differently.

**Deadline:** Sept 9, 2026, 2:00 PM PDT → Sept 10, 2026, 2:30 AM IST. From today (Sept 6) that's **~3 working days**.

---

## 0. Why this document is structured this way

Every agent session (fresh context window, new terminal, new day) tends to re-discover the codebase from scratch, forget what's already built, and duplicate or conflict with prior work. This brief forces a fixed **audit → tracker → context → docs → build** sequence at the start of every session, so state persists across agent runs even though the agents themselves have no memory of each other.

---

## 1. Bootstrap Protocol (run this before any new implementation work)

This is not optional and not a one-time step — run it **at the start of every agent session**, even the tenth one.

### Step 1.1 — Scan what already exists
```
find . -type f \( -name "*.py" -o -name "*.ts" -o -name "*.tsx" -o -name "*.js" \) \
  -not -path "*/node_modules/*" -not -path "*/.git/*"
cat package.json pyproject.toml requirements.txt 2>/dev/null
ls -R src/ app/ agents/ pipeline/ 2>/dev/null
```
Read every existing agent/module file fully (not just filenames) before deciding what's "done." Specifically check:
- What stages of the pipeline already run end-to-end (e.g., transcription → translation → TTS → mux)?
- What's stubbed vs. actually functional?
- What external APIs/keys are already wired in (`.env`, config files)?
- Is there existing test/sample media that proves the pipeline runs?

### Step 1.2 — Update `TRACKER.md`
If it doesn't exist, create it using the template in Section 7.1. If it exists, reconcile it against what Step 1.1 actually found — code is ground truth, not the old tracker. Mark stale entries, add newly discovered components, and never leave a component "in progress" without a note on what's blocking it.

### Step 1.3 — Update `CONTEXT.md`
Rewrite the "Current State" section (template in Section 7.2) in your own words based on the real audit — one paragraph on what works, one on what's broken, one on what's next. This is the file a brand-new agent session should read first to get oriented in under a minute.

### Step 1.4 — Update `/docs`
Ensure `/docs/ARCHITECTURE.md`, `/docs/AGENTS.md`, and `/docs/DECISIONS.md` exist and reflect reality (templates in Section 7.3–7.5). If you made an architectural choice that isn't documented, document it now, before writing more code on top of it.

### Step 1.5 — Gate check
Only after 1.1–1.4 are done: pick the highest-priority unchecked item from `TRACKER.md` (Section 10 has the seed backlog) and start building. If two agents are working in parallel, claim the task in the tracker (add your agent name) before starting, to avoid collisions.

---

## 2. Project Identity

- **Name:** LOCALIZE (working title — "DubPilot" is a fine alt)
- **One-liner:** Give it a finished video and a target language/audience; an agent crew analyzes, translates, re-voices, syncs, subtitles, and self-QAs a release-ready localized cut — and repairs its own failures instead of shipping them.
- **What you already have:** a working dubbing scaffold (audio extraction → translation → TTS → subtitle/video mux). That is the **execution layer**. This brief turns it into the **decision-making layer** on top.
- **What changes the pitch:** you are not demoing "AI generated a dub." You are demoing "AI operated a post-production workflow, caught its own defect, and fixed it live."

---

## 3. System Architecture

```
                         ┌───────────────────┐
                         │   DIRECTOR AGENT   │  (orchestrator, holds job state)
                         └─────────┬──────────┘
           ┌───────────┬───────────┼───────────┬────────────┬─────────────┐
           ▼           ▼           ▼            ▼            ▼             ▼
     Story Analyst  Localization  Voice      Sync         Subtitle      QA / Continuity
                     Director     Director   Engineer     Director      Agent
           │           │           │            │            │             │
           └───────────┴───────────┴────────────┴────────────┴──────┬──────┘
                                                                      ▼
                                                          release candidate + score
                                                                      │
                                                        score < threshold? ── yes ──► back to relevant agent (targeted retry)
                                                                      │
                                                                     no
                                                                      ▼
                                                              FINAL CUT + report
```

Two things make this "agentic" rather than "a pipeline with AI steps in it," which is the distinction the judges are explicitly scoring for:
1. **The Director holds state and re-routes** — it doesn't just run stage 1→2→3→4→5→6 once; it can send a specific scene back to a specific agent with a specific instruction.
2. **The QA agent's findings are structured decisions, not pass/fail** — it names the failure, proposes a fix strategy, and hands that strategy to the right upstream agent.

---

## 4. Agent Specifications

| Agent | Input | Output | Core job | Must handle |
|---|---|---|---|---|
| **Director** | job request (video + target language + audience + constraints) | task graph, final assembly | Orchestrates all agents, owns retry logic and job state | Partial failures, targeted re-runs (not full pipeline restarts) |
| **Story Analyst** | source video/audio | speaker map, scene list, transcript, tone tags, idiom/cultural-reference flags | Understands *what* is being said and by whom before anything gets translated | Overlapping speech, background noise, multiple speakers per scene |
| **Localization Director** | transcript + tone tags + target locale | localized script, translation rationale per line | Produces natural, in-character translation — not literal | Idioms, jokes, name/terminology consistency across scenes |
| **Voice Director** | localized script + speaker map | voice assignment, synthesized audio per line | Chooses/generates voices consistent with character across the whole film | Gender/tone consistency, pacing, mispronunciation of names |
| **Sync Engineer** | synthesized audio + original timing windows | timing-adjusted audio, edit decisions | Reconciles the fact that translated speech is rarely the same length as the original | Decides between: speed adjustment, line rewrite, timing shift, regeneration — and logs *why* |
| **Subtitle Director** | localized script + final audio timing | synced subtitle file (.srt/.vtt) | Keeps audio ↔ transcript ↔ subtitle ↔ scene consistent | Subtitle drift after Sync Engineer changes a line |
| **QA / Continuity Agent** | full assembled cut | release-readiness score, itemized findings, fix proposals | Watches the result like a human post-production reviewer would | Must be specific: which scene, which timestamp, which failure type, what fix to try — this is your hero feature |

**Model call pattern (Gemini):** each agent should be a distinct system-prompted call (or distinct tool-using turn) with a **strict output schema** (JSON) so the Director can programmatically route results — don't let agents return free text that another agent then has to re-parse with regex.

---

## 5. Tech Stack & Partner Integration

**Runtime AI constraint (eligibility-critical):** only Google Cloud AI tooling (Gemini, Vertex AI, etc.) plus your chosen partner's built-in AI/runtime features may be used *at runtime*. Using other AI coding agents to *build* the project is fine; the shipped app's own reasoning must run on Gemini/Google Cloud + the partner stack. Don't let a stray OpenAI/Anthropic API call sneak into the runtime path.

### 5.1 Core: Gemini / Google Cloud
Every agent in Section 4 is a Gemini call (function-calling / structured-output mode). Use Vertex AI if you want managed infra + easy Cloud Storage integration for video files.

### 5.2 Primary track: Grafana — "the control tower"
Every agent stage should emit structured events (see schema in 6): latency, retries, decisions, quality scores, failures. Grafana becomes the observability layer over your agent crew — and, if you wire the **Grafana MCP server** into your Director/Ops logic, an agent can *query its own telemetry* and reason about failures.

Two integration options:
- **Local/OSS MCP server (`mcp-grafana`)** — fastest to stand up for a hackathon. Requires a Grafana instance (Cloud or self-hosted) and a service account token:
  ```json
  {
    "mcpServers": {
      "grafana": {
        "command": "uvx",
        "args": ["mcp-grafana"],
        "env": {
          "GRAFANA_URL": "https://<your-instance>.grafana.net",
          "GRAFANA_SERVICE_ACCOUNT_TOKEN": "<token>"
        }
      }
    }
  }
  ```
  It exposes tools across dashboards, datasources (Prometheus, Loki, and notably **ClickHouse** — so you can point Grafana's datasource *at* ClickHouse and get both tracks through one MCP surface if you want to stretch into 5.4), and alerting.
- **Grafana Cloud MCP server (hosted)** — zero local install, OAuth 2.1 login instead of a token, but scoped to Grafana Cloud only and to your user's RBAC permissions. Pick this if you want a cleaner live demo without exposing a token on screen.

**Demo-relevant flow:** push agent events → Grafana dashboard (visible, live, on screen) → an "Ops" step (can be the Director itself) calls Grafana MCP tools to query the dashboard/alerts → finds the anomalous stage → triggers a targeted retry. This is what makes Grafana *active at runtime*, not just a dashboard you screenshot at the end.

### 5.3 Optional stretch: Parallel — "cultural context research"
Hosted Search MCP endpoint (needs a Parallel API key): `https://search-mcp.parallel.ai/mcp` (proxies to Parallel's `mcp.parallel.ai` backend). Exposes `web_search` (natural-language objective or explicit queries, returns dense LLM-ready snippets with citations) and `web_fetch`. Wire this into the Localization Director as an optional pre-step: before finalizing an idiom/reference translation, it can look up how that reference is normally localized/understood for the target audience.

### 5.4 Optional stretch: ClickHouse — "post-production intelligence"
Official ClickHouse MCP server exposes exactly three tools: `list_databases`, `list_tables`, `run_select_query` (read-only). Log every scene/agent/decision event (schema below) into a ClickHouse table, and let the QA or Director agent run analytical queries like "which character causes the most sync failures" or "which language needs the largest average timing adjustment" as part of its reasoning — this is what turns the QA step from "pass/fail" into "post-production intelligence."

### 5.5 What NOT to build
Full text-to-video, avatar generation, a generic "AI filmmaker" chatbot, a recommendation engine, or a large unrelated agent roster. Depth on the localization/QA loop beats breadth of features.

---

## 6. Event/Log Schema

Emit this shape from every agent, whether it lands in Grafana (via Loki/Prometheus) and/or ClickHouse:

```json
{
  "job_id": "string",
  "scene_id": "string",
  "agent": "story_analyst | localization_director | voice_director | sync_engineer | subtitle_director | qa_agent | director",
  "action": "string (e.g. 'translate_line', 'sync_check', 'regenerate_audio')",
  "decision": "string — human-readable reasoning, not just a code",
  "latency_ms": 0,
  "retry_count": 0,
  "quality_score": 0.0,
  "status": "ok | warning | failed | fixed",
  "timestamp": "ISO8601"
}
```
This single schema is what makes the Grafana dashboards, the ClickHouse queries, and the on-screen "agent reasoning" UI all possible from one source of truth — build it early, in Phase 0, before individual agents.

---

## 7. File Templates

### 7.1 `TRACKER.md`
```markdown
# LOCALIZE Tracker
Last updated: <date> by <agent/session>

| Component | Status | Owner/Session | Blocking? | Notes |
|---|---|---|---|---|
| Audio extraction | done | existing scaffold | no | verified on sample.mp4 |
| Story Analyst agent | not started | — | no | |
| Localization Director | not started | — | no | |
| Voice Director | in progress | session-2 | yes — TTS voice mapping unresolved | |
| Sync Engineer | not started | — | no | |
| Subtitle Director | not started | — | no | |
| QA/Continuity Agent | not started | — | no | hero feature — prioritize once pipeline runs end-to-end once |
| Event schema + logging | not started | — | no | build before agents 2–6 |
| Grafana dashboard | not started | — | no | |
| Demo UI | not started | — | no | |
```

### 7.2 `CONTEXT.md`
```markdown
# LOCALIZE — Current State
Last updated: <date>

## What works right now
<one paragraph, plain language, based on actually running the code>

## What's broken or stubbed
<one paragraph>

## What to do next
<one paragraph — should match the top of TRACKER.md>

## Key decisions already made
<bullet list, or "see docs/DECISIONS.md">
```

### 7.3 `docs/ARCHITECTURE.md`
Keep the diagram from Section 3, plus a short "why" for each agent boundary (why Sync Engineer is separate from Voice Director, etc.).

### 7.4 `docs/AGENTS.md`
Copy Section 4's table, but expand each row with the actual Gemini prompt/schema you land on, once implemented — this becomes the real spec, not just the plan.

### 7.5 `docs/DECISIONS.md` (lightweight ADR log)
```markdown
## <date> — Chose Grafana OSS MCP over Cloud MCP
Reason: needed local dev speed over hackathon weekend; revisit if demo needs zero-token-on-screen.
```

---

## 8. Roadmap (3 days to deadline)

**Day 1 (today – Sept 7): Foundation**
- [ ] Run Bootstrap Protocol (Section 1) on existing scaffold
- [ ] Build the event schema + logging shim (Section 6) — everything downstream depends on this
- [ ] Implement Story Analyst + Localization Director on top of existing scaffolding
- [ ] Get one scene fully round-tripping: video in → localized script out

**Day 2 (Sept 7–8): Full pipeline + observability**
- [ ] Voice Director, Sync Engineer, Subtitle Director
- [ ] Wire event logs into Grafana; build 1–2 dashboards (latency per stage, quality score over time, failure count)
- [ ] Get one full short clip fully dubbed end-to-end, subtitles included

**Day 3 (Sept 8–9): The hero feature + polish**
- [ ] QA/Continuity Agent: detect at least 2–3 real defect classes (timing overflow, subtitle drift, voice inconsistency)
- [ ] Wire the fix loop: QA finding → targeted retry → re-check
- [ ] Grafana-driven anomaly → agent investigates → repairs (the "3 AM" story from the architecture)
- [ ] Build the demo UI (Section 9 layout) — before/after audio toggle, live agent status, QA finding cards
- [ ] Rehearse and record the 3-minute demo; submit with buffer before the deadline

---

## 9. Demo Script (3 minutes)

| Time | Beat |
|---|---|
| 0:00–0:20 | Show the raw English scene. "How long would a real localization team take to prep this?" |
| 0:20–0:35 | Type one instruction: "Dub for Hindi audiences. Preserve character personality. Keep runtime unchanged." Click Direct. |
| 0:35–1:10 | Live agent execution feed: story analyzed → speakers detected → segments found → voices assigned → translation generated |
| 1:10–1:35 | Play before/after audio side by side |
| 1:35–2:10 | Reveal a QA failure live: "Scene 7 exceeds speech window by 1.4s" → agent reasoning shown → fix applied → re-passes |
| 2:10–2:35 | Show the Grafana dashboard catching the same anomaly and the agent querying it to decide the fix |
| 2:35–3:00 | Close: "One video → one autonomous production crew → one release-ready localized film." |

UI note: build it to look like a post-production studio console, not a generic SaaS dashboard — agent crew list with live checkmarks, a QA finding panel, a release-readiness score.

---

## 10. Seed Task Backlog

Copy these into `TRACKER.md` as your first pass; add/remove as the audit in Section 1 reveals actual state:

- [ ] Event schema + structured logging shim
- [ ] Story Analyst agent (speaker/scene/transcript extraction)
- [ ] Localization Director agent (natural translation + rationale)
- [ ] Voice Director agent (voice selection/generation)
- [ ] Sync Engineer agent (timing reconciliation logic)
- [ ] Subtitle Director agent (sync + consistency checks)
- [ ] QA/Continuity agent (defect detection + fix proposals)
- [ ] Director orchestration + targeted-retry routing
- [ ] Grafana datasource + dashboard wiring
- [ ] Grafana MCP tool call from Director/Ops path (must be active at runtime, not just a dashboard)
- [ ] (stretch) Parallel MCP call from Localization Director for cultural-reference lookup
- [ ] (stretch) ClickHouse event table + analytical query from QA agent
- [ ] Demo UI (studio console layout, before/after toggle, live agent status, QA cards)
- [ ] 3-minute demo recording
- [ ] Submission packaging (repo, hosted deploy, demo video)

---

## 11. Eligibility Checklist (re-check before submitting)

- [ ] All runtime reasoning uses Gemini/Google Cloud AI, not another provider
- [ ] Chosen partner (Grafana, and optionally Parallel/ClickHouse) is actually called during a live run, not just referenced in the README
- [ ] Repo + hosted demo + 3-minute video are all ready ahead of Sept 9, 2:00 PM PDT / Sept 10, 2:30 AM IST

---

## References (for the agents to fetch during implementation)
- Grafana MCP servers overview: https://grafana.com/docs/grafana-cloud/ai-tools/mcp-servers.md
- Grafana OSS MCP quick start: https://grafana.com/docs/grafana-cloud/machine-learning/mcp.md
- Grafana Cloud MCP (hosted/OAuth): https://grafana.com/docs/grafana-cloud/ai-tools/mcp-servers/cloud-mcp/
- Parallel Search MCP: https://docs.parallel.ai/features/remote-mcp
- ClickHouse official MCP server: https://hub.docker.com/mcp/server/clickhouse
