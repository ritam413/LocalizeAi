export interface WorkflowStep {
  step: number;
  skill: string;
  role: string;
  directive: string;
}

export interface WorkflowPipeline {
  id: number;
  name: string;
  tag: string;
  description: string;
  steps: WorkflowStep[];
}

export const WORKFLOWS: WorkflowPipeline[] = [
  {
    id: 1,
    name: "Strategic Planning & Architecture (Epic Flow)",
    tag: "PLANNING & ARCHITECTURE",
    description: "Decomposes complex epics, explores system boundaries, deliberates trade-offs, and graphs contracts.",
    steps: [
      { step: 1, skill: "claude-code-route", role: "Dynamic Intent & Model Tier Router", directive: "Classify incoming task, estimate token saturation, and select model tier." },
      { step: 2, skill: "beads", role: "BEADS Contract-Driven Sub-Agent Scaffolder", directive: "Decompose requirements into contract-isolated, testable sub-agent beads with clear state boundaries." },
      { step: 3, skill: "multica", role: "Multi-Agent Collaboration & Consensus Engine", directive: "Orchestrate parallel agent rooms, peer verification, structured debates, and synthesis." },
      { step: 4, skill: "wayfinder", role: "High-Density Decision Ticket Map", directive: "Structure work into decision tickets declaring blocking edges before execution begins." },
      { step: 5, skill: "council-review", role: "5-Advisor DMAD Council Deliberation", directive: "Run Diverse Multi-Agent Debate with 5 specialized advisors and synthesized Chairman verdict." },
      { step: 6, skill: "graphify", role: "Mermaid Architecture Knowledge Visualizer", directive: "Render interactive node diagrams, dependency DAGs, and subsystem topology into implementation_plan.md." }
    ]
  },
  {
    id: 2,
    name: "Test-Driven Feature Delivery (Builder Flow)",
    tag: "TDD & FEATURE BUILDING",
    description: "Rigorous contract-first implementation pipeline enforcing interface seams, failing tests, and minimal diffs.",
    steps: [
      { step: 1, skill: "wshobson-agents", role: "Role Specialization [Architect]", directive: "Define TypeScript/Pydantic interface seams in src/types/apiContracts.ts." },
      { step: 2, skill: "codegraph", role: "AST Call-Graph & Blast Radius Analyzer", directive: "Trace function callers, blast radiuses, type hierarchies, and import graphs before changing code." },
      { step: 3, skill: "context7", role: "High-Density AST Context Slicing", directive: "Inject only targeted function slices and line bounds to keep context lean." },
      { step: 4, skill: "tdd", role: "Role Specialization [QA Engineer]", directive: "Write failing red unit/integration tests before any source implementation code is written." },
      { step: 5, skill: "ponytail", role: "Role Specialization [Developer]", directive: "Write green minimal implementation using stdlib/native primitives with zero bloat." },
      { step: 6, skill: "clean-code", role: "Clean Code Refactoring & Heuristics", directive: "Enforce single responsibility, readable naming, small functions, and clear abstractions." },
      { step: 7, skill: "playwright-mcp", role: "Headless E2E Browser Verification", directive: "Execute browser visual regression, DOM verification, and integration validation." }
    ]
  },
  {
    id: 3,
    name: "Deep Codebase Research & Knowledge Packaging (Research Flow)",
    tag: "RESEARCH & KNOWLEDGE",
    description: "Extracts primary sources, indexes codebase semantics, and produces zero-slop technical documentation.",
    steps: [
      { step: 1, skill: "repomix", role: "Codebase Packager & Token Counter", directive: "Pack entire codebase with token counting and file tree metrics into AI-ready context." },
      { step: 2, skill: "serena", role: "Semantic & Natural Language Discovery", directive: "Search codebase by meaning, intent, and concept across functions and comments." },
      { step: 3, skill: "firecrawl", role: "Web Scraper & Markdown Converter", directive: "Crawl live web docs/RFCs, strip web noise, and output clean LLM-ready markdown." },
      { step: 4, skill: "research", role: "Primary Source Investigator", directive: "Investigate against authoritative primary sources with explicit line-level citations." },
      { step: 5, skill: "headroom", role: "Context Budget Watchdog", directive: "Monitor token consumption against ~150k Smart Zone ceiling before context degrades." },
      { step: 6, skill: "humanizer", role: "AI Jargon Removal Standard", directive: "Eliminate AI tells, inflated claims, and stock prose to produce publication-ready documentation." }
    ]
  },
  {
    id: 4,
    name: "World-Class Frontend, UI & Motion Engineering (Design Flow)",
    tag: "UI/UX & MOTION",
    description: "High-craft frontend creation following modern design systems, anti-slop guidelines, and 60fps GPU motion.",
    steps: [
      { step: 1, skill: "taste-skill", role: "Frontend Taste & Density Calibrator", directive: "Calibrate design dials (VARIANCE, MOTION, DENSITY) and enforce unique product identity." },
      { step: 2, skill: "awesome-design", role: "Design Tokens & Anti-Slop Geometry", directive: "Inject brand tokens, curated color palettes, typography scales, and zero-pill geometry." },
      { step: 3, skill: "ui-ux-pro-max", role: "UI/UX Component & Layout Director", directive: "Structure component states, responsive grids, dark modes, and accessibility standards." },
      { step: 4, skill: "impeccable", role: "Visual Hierarchy & Micro-Interaction Polish", directive: "Refine layout alignment, reduce cognitive load, and craft responsive interactive elements." },
      { step: 5, skill: "animate", role: "60fps GPU Compositor Motion Engine", directive: "Implement hardware-accelerated spring physics and interruptible layout animations." },
      { step: 6, skill: "addyosmani-perf", role: "Web Vitals & Performance Optimizer", directive: "Audit Core Web Vitals (LCP, INP, CLS) and eliminate DOM layout thrashing." },
      { step: 7, skill: "playwright-mcp", role: "Visual Snapshot & Viewport Testing", directive: "Capture multi-viewport visual screenshots across desktop and mobile devices." }
    ]
  },
  {
    id: 5,
    name: "Hard Bug Diagnosis & Regression Hunting (Debug Flow)",
    tag: "DEBUGGING & RESILIENCE",
    description: "Scientific debugging loop for resolving stubborn regressions, state leaks, and race conditions.",
    steps: [
      { step: 1, skill: "diagnosing-bugs", role: "Scientific Diagnosis Loop", directive: "Formulate root-cause hypotheses and construct a tight, failing reproduction loop." },
      { step: 2, skill: "serena", role: "Semantic Error Handling Locator", directive: "Discover related error handling, state mutations, and unhandled exception sites." },
      { step: 3, skill: "codegraph", role: "Caller Hierarchy & Blast Radius Tracer", directive: "Trace full call chain to identify the single upstream defect location." },
      { step: 4, skill: "tdd", role: "Automated Regression Test Lock", directive: "Author failing automated test proving the defect before touching any source code." },
      { step: 5, skill: "clean-code", role: "Surgical Refactor & Verification", directive: "Apply minimal, clean patch and verify that all test suites pass 100% green." },
      { step: 6, skill: "code-review", role: "Parallel Standards & Spec Review", directive: "Run parallel sub-agent audits for coding standards and specification conformance." }
    ]
  },
  {
    id: 6,
    name: "Security Hardening & Adversarial Stress Testing (Defender Flow)",
    tag: "SECURITY & AUDIT",
    description: "Hostile red-team evaluation attacking logic, permissions, input boundaries, and scale limits.",
    steps: [
      { step: 1, skill: "wshobson-agents", role: "Role Specialization [Security Lead]", directive: "Inspect trust boundaries, authentication seams, and authorization policies." },
      { step: 2, skill: "adversarial-review", role: "Red-Team Multi-Vector Attack", directive: "Attack code across --security, --logic, --user, and --scale vectors." },
      { step: 3, skill: "awesome-mcp-servers", role: "Live Database & Telemetry Probing", directive: "Query live database constraints, Sentry logs, and runtime telemetry via on-demand MCP." },
      { step: 4, skill: "rigorous-review", role: "Multi-Vector Confidence Scoring", directive: "Score findings by severity/confidence and deliver unambiguous remediation diffs." },
      { step: 5, skill: "playwright-mcp", role: "Hostile Payload Verification", directive: "Verify patch resistance against malicious input injections in a headless browser." }
    ]
  },
  {
    id: 7,
    name: "Session Handoff & Persistent Vector Memory (Memory Flow)",
    tag: "MEMORY & PERSISTENCE",
    description: "Seamless cross-agent session continuity preserving architecture decisions and bug resolution traces.",
    steps: [
      { step: 1, skill: "headroom", role: "Token Budget Saturation Monitor", directive: "Detect token budget saturation approaching the 150k Smart Zone threshold." },
      { step: 2, skill: "claude-handoff", role: "Structured Handoff Compactor", directive: "Compact active conversation into a structured tracker.md handoff record." },
      { step: 3, skill: "domain-modeling", role: "Domain Invariants & ADR Updater", directive: "Update context.md with new domain models, entity definitions, and architecture decisions." },
      { step: 4, skill: "agentmemory", role: "Episodic Vector Memory Engine", directive: "Store persistent cross-agent memories and bug resolution traces in vector storage." },
      { step: 5, skill: "claude-mem", role: "Cross-Session Semantic Memory Store", directive: "Preserve developer preferences and entity models across subsequent conversations." }
    ]
  }
];
