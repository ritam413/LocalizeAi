export interface SkillInfo {
  name: string;
  category: string;
  summary: string;
  whatItDoes: string;
  whenToUse: string;
  howToUse: string;
  whenToAvoid: string;
}

export const SKILLS: Record<string, SkillInfo> = {
  "javascript-mastery": {
    "name": "javascript-mastery",
    "category": "Development and Programming",
    "summary": "33+ essential JavaScript concepts every developer should know, inspired by 33-js-concepts.",
    "whatItDoes": "Deep dive into 33+ core JavaScript concepts including call stack, event loop, closures, prototypes, type coercion, this keyword, Promises, async/await, V8 engine internals, and design patterns.",
    "whenToUse": "Use when explaining JS concepts, debugging tricky JS behavior, learning language quirks, or writing high-performance JS/TS code.",
    "howToUse": "Invoke '/javascript-mastery' in chat or follow instructions in skills/javascript-mastery/SKILL.md.",
    "whenToAvoid": "Avoid when dealing with purely non-JavaScript tasks."
  },
  "javascript-mastery-pro": {
    "name": "javascript-mastery-pro",
    "category": "Development and Programming",
    "summary": "Mastery of 33+ essential and advanced JavaScript concepts, runtime internals, event loop, memory management, closures, async patterns, and modern ESNext features.",
    "whatItDoes": "Advanced JS mastery: runtime internals, microtask queues, memory leak profiling, V8 hidden classes, generator coroutines, WeakMaps, and concurrency patterns.",
    "whenToUse": "Use for advanced JS architecture, diagnosing event loop lag, memory leaks, and complex async flows.",
    "howToUse": "Invoke '/javascript-mastery-pro' in chat or follow instructions in skills/javascript-mastery-pro/SKILL.md.",
    "whenToAvoid": "Avoid for simple surface-level code reviews."
  },

  "addyosmani-perf": {
    "name": "addyosmani-perf",
    "category": "UI/UX & Motion Design",
    "summary": "Web performance, Core Web Vitals (LCP, INP, CLS), and GPU rendering optimizer based on Addy Osmani's performance principles and Chrome DevTools practices.",
    "whatItDoes": "Web performance, Core Web Vitals (LCP, INP, CLS), and GPU rendering optimizer based on Addy Osmani's performance principles and Chrome DevTools practices.",
    "whenToUse": "Use when executing tasks requiring specialized addyosmani-perf capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/addyosmani-perf' in chat or follow instructions in skills/addyosmani-perf/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "agentmemory": {
    "name": "agentmemory",
    "category": "Context, Search & Scraping",
    "summary": "Multi-agent shared episodic & semantic vector memory engine. Stores persistent cross-agent memories, past bug resolution traces, and domain invariants.",
    "whatItDoes": "Multi-agent shared episodic & semantic vector memory engine. Stores persistent cross-agent memories, past bug resolution traces, and domain invariants.",
    "whenToUse": "Use when executing tasks requiring specialized agentmemory capabilities in Context, Search & Scraping.",
    "howToUse": "Invoke '/agentmemory' in chat or follow instructions in skills/agentmemory/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Context, Search & Scraping where direct edits suffice."
  },
  "animate": {
    "name": "animate",
    "category": "UI/UX & Motion Design",
    "summary": "Build an animation from scratch, making the decisions in the order that determines whether it feels right — should it animate at all, what purpose, which tool, which properties, which curve and duration, how it interrupts, how it exits. Writes the implementation. Use when asked to animate something, add motion, make a component feel alive, or build a transition. For critiquing existing motion use review-animations; for auditing a whole codebase use improve-animations.",
    "whatItDoes": "Build an animation from scratch, making the decisions in the order that determines whether it feels right — should it animate at all, what purpose, which tool, which properties, which curve and duration, how it interrupts, how it exits. Writes the implementation. Use when asked to animate something, add motion, make a component feel alive, or build a transition. For critiquing existing motion use review-animations; for auditing a whole codebase use improve-animations.",
    "whenToUse": "Use when executing tasks requiring specialized animate capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/animate' in chat or follow instructions in skills/animate/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "animate-expo": {
    "name": "animate-expo",
    "category": "UI/UX & Motion Design",
    "summary": "Build animations in React Native and Expo, making the decisions in the order that determines whether they feel right — should it animate, which thread it runs on, which properties, spring or timing, how the gesture hands off, how it degrades. Writes the implementation with Reanimated, Gesture Handler, Expo Router and expo-haptics. Use when animating anything in an Expo app, adding gestures, sheets, screen transitions, press feedback or haptics, or fixing motion that stutters on device. For web animation use `animate`.",
    "whatItDoes": "Build animations in React Native and Expo, making the decisions in the order that determines whether they feel right — should it animate, which thread it runs on, which properties, spring or timing, how the gesture hands off, how it degrades. Writes the implementation with Reanimated, Gesture Handler, Expo Router and expo-haptics. Use when animating anything in an Expo app, adding gestures, sheets, screen transitions, press feedback or haptics, or fixing motion that stutters on device. For web animation use `animate`.",
    "whenToUse": "Use when executing tasks requiring specialized animate-expo capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/animate-expo' in chat or follow instructions in skills/animate-expo/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "animation-vocabulary": {
    "name": "animation-vocabulary",
    "category": "General Engineering",
    "summary": "Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term (\"the bouncy thing when a popover opens\" → Pop in; \"the iOS rubber-band scroll\" → Rubber-banding). Use when the user asks \"what's it called when…\", or describes a motion effect without knowing its name and wants the right word to prompt an AI or designer with. For naming an effect, not designing or building one.",
    "whatItDoes": "Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term (\"the bouncy thing when a popover opens\" → Pop in; \"the iOS rubber-band scroll\" → Rubber-banding). Use when the user asks \"what's it called when…\", or describes a motion effect without knowing its name and wants the right word to prompt an AI or designer with. For naming an effect, not designing or building one.",
    "whenToUse": "Use when executing tasks requiring specialized animation-vocabulary capabilities in General Engineering.",
    "howToUse": "Invoke '/animation-vocabulary' in chat or follow instructions in skills/animation-vocabulary/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside General Engineering where direct edits suffice."
  },
  "apple-design": {
    "name": "apple-design",
    "category": "UI/UX & Motion Design",
    "summary": "Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.",
    "whatItDoes": "Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.",
    "whenToUse": "Use when executing tasks requiring specialized apple-design capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/apple-design' in chat or follow instructions in skills/apple-design/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "ask-matt": {
    "name": "ask-matt",
    "category": "Orchestration & Routing",
    "summary": "Ask which skill or flow fits your situation. A router over the skills in this repo.",
    "whatItDoes": "Ask which skill or flow fits your situation. A router over the skills in this repo.",
    "whenToUse": "Use when executing tasks requiring specialized ask-matt capabilities in Orchestration & Routing.",
    "howToUse": "Invoke '/ask-matt' in chat or follow instructions in skills/ask-matt/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Orchestration & Routing where direct edits suffice."
  },
  "ask-sonner": {
    "name": "ask-sonner",
    "category": "UI/UX & Motion Design",
    "summary": "Guide to Sonner, the React toast library — install and wire up the Toaster, pick the right toast() call, promise and loading toasts, updating, dismissing and persisting toasts, styling, theming and icons, positioning and multiple toasters. Use when working with Sonner or troubleshooting it — toasts that don't appear, appear twice, lose their styles, ignore Tailwind classes, sit behind a modal, or don't follow dark mode.",
    "whatItDoes": "Guide to Sonner, the React toast library — install and wire up the Toaster, pick the right toast() call, promise and loading toasts, updating, dismissing and persisting toasts, styling, theming and icons, positioning and multiple toasters. Use when working with Sonner or troubleshooting it — toasts that don't appear, appear twice, lose their styles, ignore Tailwind classes, sit behind a modal, or don't follow dark mode.",
    "whenToUse": "Use when executing tasks requiring specialized ask-sonner capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/ask-sonner' in chat or follow instructions in skills/ask-sonner/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "awesome-claude-skills": {
    "name": "awesome-claude-skills",
    "category": "Context, Search & Scraping",
    "summary": "Curated registry and discovery catalog of production Claude Code skills, workflows, agent recipes, and tool configurations across the global AI engineering ecosystem.",
    "whatItDoes": "Curated registry and discovery catalog of production Claude Code skills, workflows, agent recipes, and tool configurations across the global AI engineering ecosystem.",
    "whenToUse": "Use when executing tasks requiring specialized awesome-claude-skills capabilities in Context, Search & Scraping.",
    "howToUse": "Invoke '/awesome-claude-skills' in chat or follow instructions in skills/awesome-claude-skills/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Context, Search & Scraping where direct edits suffice."
  },
  "awesome-mcp-servers": {
    "name": "awesome-mcp-servers",
    "category": "Context, Search & Scraping",
    "summary": "Master directory and configuration guide for production Model Context Protocol (MCP) servers (PostgreSQL, GitHub, Brave Search, Memory, Filesystem, Sentry, Redis, Docker).",
    "whatItDoes": "Master directory and configuration guide for production Model Context Protocol (MCP) servers (PostgreSQL, GitHub, Brave Search, Memory, Filesystem, Sentry, Redis, Docker).",
    "whenToUse": "Use when executing tasks requiring specialized awesome-mcp-servers capabilities in Context, Search & Scraping.",
    "howToUse": "Invoke '/awesome-mcp-servers' in chat or follow instructions in skills/awesome-mcp-servers/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Context, Search & Scraping where direct edits suffice."
  },
  "baseline-ui": {
    "name": "baseline-ui",
    "category": "UI/UX & Motion Design",
    "summary": "Quickly deslop UI code by fixing spacing, hierarchy, typography, and small layout issues. Use when the interface needs a fast cleanup or polish pass.",
    "whatItDoes": "Quickly deslop UI code by fixing spacing, hierarchy, typography, and small layout issues. Use when the interface needs a fast cleanup or polish pass.",
    "whenToUse": "Use when executing tasks requiring specialized baseline-ui capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/baseline-ui' in chat or follow instructions in skills/baseline-ui/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "beads": {
    "name": "beads",
    "category": "Deliberation & Strategy",
    "summary": "Behavior-Driven Agent Design System (BEADS). Scaffolds modular, testable, and contract-driven sub-agent pipelines with strict state machine boundaries and typed contracts.",
    "whatItDoes": "Behavior-Driven Agent Design System (BEADS). Scaffolds modular, testable, and contract-driven sub-agent pipelines with strict state machine boundaries and typed contracts.",
    "whenToUse": "Use when executing tasks requiring specialized beads capabilities in Deliberation & Strategy.",
    "howToUse": "Invoke '/beads' in chat or follow instructions in skills/beads/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Deliberation & Strategy where direct edits suffice."
  },
  "claude-code-route": {
    "name": "claude-code-route",
    "category": "Orchestration & Routing",
    "summary": "Dynamic intent-based model and skill chain router. Classifies incoming requests, calculates token budgets, and maps tasks to the most cost-effective model tier and execution pipeline.",
    "whatItDoes": "Dynamic intent-based model and skill chain router. Classifies incoming requests, calculates token budgets, and maps tasks to the most cost-effective model tier and execution pipeline.",
    "whenToUse": "Use when executing tasks requiring specialized claude-code-route capabilities in Orchestration & Routing.",
    "howToUse": "Invoke '/claude-code-route' in chat or follow instructions in skills/claude-code-route/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Orchestration & Routing where direct edits suffice."
  },
  "claude-handoff": {
    "name": "claude-handoff",
    "category": "Orchestration & Routing",
    "summary": "Hand the current conversation off to a fresh background agent that picks up the work immediately.",
    "whatItDoes": "Hand the current conversation off to a fresh background agent that picks up the work immediately.",
    "whenToUse": "Use when executing tasks requiring specialized claude-handoff capabilities in Orchestration & Routing.",
    "howToUse": "Invoke '/claude-handoff' in chat or follow instructions in skills/claude-handoff/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Orchestration & Routing where direct edits suffice."
  },
  "claude-mem": {
    "name": "claude-mem",
    "category": "Context, Search & Scraping",
    "summary": "Cross-session semantic memory and persistent entity store for preserving architectural decisions, domain models, and developer preferences across conversations.",
    "whatItDoes": "Cross-session semantic memory and persistent entity store for preserving architectural decisions, domain models, and developer preferences across conversations.",
    "whenToUse": "Use when executing tasks requiring specialized claude-mem capabilities in Context, Search & Scraping.",
    "howToUse": "Invoke '/claude-mem' in chat or follow instructions in skills/claude-mem/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Context, Search & Scraping where direct edits suffice."
  },
  "code-review": {
    "name": "code-review",
    "category": "Execution & Code Quality",
    "summary": "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \\\"review since X\\\".",
    "whatItDoes": "Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating issue/spec asked for?). Runs both reviews in parallel sub-agents and reports them side by side. Use when the user wants to review a branch, a PR, work-in-progress changes, or asks to \\\"review since X\\\".",
    "whenToUse": "Use when executing tasks requiring specialized code-review capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/code-review' in chat or follow instructions in skills/code-review/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "codebase-design": {
    "name": "codebase-design",
    "category": "Execution & Code Quality",
    "summary": "Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.",
    "whatItDoes": "Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when another skill needs the deep-module vocabulary.",
    "whenToUse": "Use when executing tasks requiring specialized codebase-design capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/codebase-design' in chat or follow instructions in skills/codebase-design/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "codegraph": {
    "name": "codegraph",
    "category": "Context, Search & Scraping",
    "summary": "AST-driven codebase dependency and call-graph analyzer. Use to trace function callers, blast radiuses, type hierarchies, and import graphs before making non-trivial refactors or fixing hard bugs.",
    "whatItDoes": "Analyzes Abstract Syntax Trees (AST), import graphs, caller-callee hierarchies, and interface blast radiuses.",
    "whenToUse": "Use before refactoring any shared function, type, or database schema to see every dependent module.",
    "howToUse": "Run /codegraph to trace upstream callers and downstream callee hierarchies.",
    "whenToAvoid": "Avoid for self-contained scripts or standalone components that have no upstream dependents."
  },
  "context7": {
    "name": "context7",
    "category": "Context, Search & Scraping",
    "summary": "High-density context window slicing, AST chunk retrieval, and semantic compression. Injects only the most relevant code slices to minimize prompt token consumption.",
    "whatItDoes": "High-density context window slicing, AST chunk retrieval, and semantic compression. Injects only the most relevant code slices to minimize prompt token consumption.",
    "whenToUse": "Use when executing tasks requiring specialized context7 capabilities in Context, Search & Scraping.",
    "howToUse": "Invoke '/context7' in chat or follow instructions in skills/context7/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Context, Search & Scraping where direct edits suffice."
  },
  "create-design-md": {
    "name": "create-design-md",
    "category": "UI/UX & Motion Design",
    "summary": "Create or update a DESIGN.md from an existing product repository or public website. Use when asked to document an interface's design language, reconstruct its visual system, extract design tokens and guidance from current evidence, or give coding agents persistent UI context. Do not modify product source or promote accidental implementation patterns into design decisions.",
    "whatItDoes": "Create or update a DESIGN.md from an existing product repository or public website. Use when asked to document an interface's design language, reconstruct its visual system, extract design tokens and guidance from current evidence, or give coding agents persistent UI context. Do not modify product source or promote accidental implementation patterns into design decisions.",
    "whenToUse": "Use when executing tasks requiring specialized create-design-md capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/create-design-md' in chat or follow instructions in skills/create-design-md/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "diagnosing-bugs": {
    "name": "diagnosing-bugs",
    "category": "Execution & Code Quality",
    "summary": "Diagnosis loop for hard bugs and performance regressions. Use when the user says \"diagnose\"/\"debug this\", or reports something broken/throwing/failing/slow.",
    "whatItDoes": "Constructs a scientific, hypothesis-driven diagnosis loop to isolate stubborn bugs and regressions.",
    "whenToUse": "Use whenever a test fails unexpectedly, runtime exceptions occur, or performance regresses.",
    "howToUse": "Invoke /diagnosing-bugs to establish a reproducible failing test, formulate testable hypotheses, and isolate the root cause.",
    "whenToAvoid": "Avoid when the error message already points to an obvious typo or missing import."
  },
  "domain-modeling": {
    "name": "domain-modeling",
    "category": "Context, Search & Scraping",
    "summary": "Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR.",
    "whatItDoes": "Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a CONTEXT.md, or recording or editing an ADR.",
    "whenToUse": "Use when executing tasks requiring specialized domain-modeling capabilities in Context, Search & Scraping.",
    "howToUse": "Invoke '/domain-modeling' in chat or follow instructions in skills/domain-modeling/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Context, Search & Scraping where direct edits suffice."
  },
  "emil-design-eng": {
    "name": "emil-design-eng",
    "category": "UI/UX & Motion Design",
    "summary": "This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great.",
    "whatItDoes": "This skill encodes Emil Kowalski's philosophy on UI polish, component design, animation decisions, and the invisible details that make software feel great.",
    "whenToUse": "Use when executing tasks requiring specialized emil-design-eng capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/emil-design-eng' in chat or follow instructions in skills/emil-design-eng/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "find-animation-opportunities": {
    "name": "find-animation-opportunities",
    "category": "UI/UX & Motion Design",
    "summary": "Search a codebase or UI for places that don't animate but should, and reject everything that shouldn't. Read-only; it proposes motion with exact values, it does not implement it. Use when the user asks \"what could be animated here?\" or wants to \"make this feel more alive\". For fixing existing animations, use improve-animations or review-animations instead.",
    "whatItDoes": "Search a codebase or UI for places that don't animate but should, and reject everything that shouldn't. Read-only; it proposes motion with exact values, it does not implement it. Use when the user asks \"what could be animated here?\" or wants to \"make this feel more alive\". For fixing existing animations, use improve-animations or review-animations instead.",
    "whenToUse": "Use when executing tasks requiring specialized find-animation-opportunities capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/find-animation-opportunities' in chat or follow instructions in skills/find-animation-opportunities/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "firecrawl": {
    "name": "firecrawl",
    "category": "Context, Search & Scraping",
    "summary": "Scrape, crawl, and convert dynamic web pages, documentation portals, and APIs into clean, LLM-ready Markdown and structured JSON.",
    "whatItDoes": "Scrapes JavaScript-rendered web documentation, API references, and RFCs, converting them to clean LLM-ready markdown.",
    "whenToUse": "Use when you need to ingest live third-party documentation, API specs, or GitHub repositories without advertising or navigation noise.",
    "howToUse": "Run /firecrawl with the target URL or query to extract clean markdown directly into docs/.",
    "whenToAvoid": "Avoid for simple static web pages where basic HTTP fetches are sufficient."
  },
  "fixing-accessibility": {
    "name": "fixing-accessibility",
    "category": "UI/UX & Motion Design",
    "summary": "Audit and fix HTML accessibility issues including ARIA labels, keyboard navigation, focus management, color contrast, and form errors. Use when adding interactive controls, forms, dialogs, or reviewing WCAG compliance.",
    "whatItDoes": "Audit and fix HTML accessibility issues including ARIA labels, keyboard navigation, focus management, color contrast, and form errors. Use when adding interactive controls, forms, dialogs, or reviewing WCAG compliance.",
    "whenToUse": "Use when executing tasks requiring specialized fixing-accessibility capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/fixing-accessibility' in chat or follow instructions in skills/fixing-accessibility/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "fixing-metadata": {
    "name": "fixing-metadata",
    "category": "UI/UX & Motion Design",
    "summary": ">",
    "whatItDoes": ">",
    "whenToUse": "Use when executing tasks requiring specialized fixing-metadata capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/fixing-metadata' in chat or follow instructions in skills/fixing-metadata/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "fixing-motion-performance": {
    "name": "fixing-motion-performance",
    "category": "UI/UX & Motion Design",
    "summary": "Audit and fix animation performance issues including layout thrashing, compositor properties, scroll-linked motion, and blur effects. Use when animations stutter, transitions jank, or reviewing CSS/JS animation performance.",
    "whatItDoes": "Audit and fix animation performance issues including layout thrashing, compositor properties, scroll-linked motion, and blur effects. Use when animations stutter, transitions jank, or reviewing CSS/JS animation performance.",
    "whenToUse": "Use when executing tasks requiring specialized fixing-motion-performance capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/fixing-motion-performance' in chat or follow instructions in skills/fixing-motion-performance/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "git-guardrails-claude-code": {
    "name": "git-guardrails-claude-code",
    "category": "Context, Search & Scraping",
    "summary": "Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute. Use when user wants to prevent destructive git operations, add git safety hooks, or block git push/reset in Claude Code.",
    "whatItDoes": "Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute. Use when user wants to prevent destructive git operations, add git safety hooks, or block git push/reset in Claude Code.",
    "whenToUse": "Use when executing tasks requiring specialized git-guardrails-claude-code capabilities in Context, Search & Scraping.",
    "howToUse": "Invoke '/git-guardrails-claude-code' in chat or follow instructions in skills/git-guardrails-claude-code/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Context, Search & Scraping where direct edits suffice."
  },
  "graphify": {
    "name": "graphify",
    "category": "Context, Search & Scraping",
    "summary": "Visual knowledge and architecture graph generator. Renders interactive node diagrams, dependency DAGs, and subsystem topologies from codebase ASTs.",
    "whatItDoes": "Transforms AST dependencies and API contract pipelines into clear, structured Mermaid and ASCII architecture DAG diagrams.",
    "whenToUse": "Use when documenting system architectures, multi-agent workflows, or subsystem boundaries in implementation_plan.md.",
    "howToUse": "Run /graphify to generate flowchart TD or sequenceDiagram blocks visualizing data flows.",
    "whenToAvoid": "Avoid for trivial linear scripts with no branching or modular interactions."
  },
  "grill-me": {
    "name": "grill-me",
    "category": "Deliberation & Strategy",
    "summary": "A relentless interview to sharpen a plan or design.",
    "whatItDoes": "A relentless interview to sharpen a plan or design.",
    "whenToUse": "Use when executing tasks requiring specialized grill-me capabilities in Deliberation & Strategy.",
    "howToUse": "Invoke '/grill-me' in chat or follow instructions in skills/grill-me/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Deliberation & Strategy where direct edits suffice."
  },
  "grill-with-docs": {
    "name": "grill-with-docs",
    "category": "Deliberation & Strategy",
    "summary": "A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.",
    "whatItDoes": "A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go.",
    "whenToUse": "Use when executing tasks requiring specialized grill-with-docs capabilities in Deliberation & Strategy.",
    "howToUse": "Invoke '/grill-with-docs' in chat or follow instructions in skills/grill-with-docs/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Deliberation & Strategy where direct edits suffice."
  },
  "grilling": {
    "name": "grilling",
    "category": "Deliberation & Strategy",
    "summary": "Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.",
    "whatItDoes": "Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases.",
    "whenToUse": "Use when executing tasks requiring specialized grilling capabilities in Deliberation & Strategy.",
    "howToUse": "Invoke '/grilling' in chat or follow instructions in skills/grilling/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Deliberation & Strategy where direct edits suffice."
  },
  "handoff": {
    "name": "handoff",
    "category": "General Engineering",
    "summary": "Compact the current conversation into a handoff document for another agent to pick up.",
    "whatItDoes": "Compact the current conversation into a handoff document for another agent to pick up.",
    "whenToUse": "Use when executing tasks requiring specialized handoff capabilities in General Engineering.",
    "howToUse": "Invoke '/handoff' in chat or follow instructions in skills/handoff/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside General Engineering where direct edits suffice."
  },
  "headroom": {
    "name": "headroom",
    "category": "Context, Search & Scraping",
    "summary": "Token budget watchdog that calculates token saturation and triggers automated compaction before the model degrades past the 150k Smart Zone.",
    "whatItDoes": "Monitors context window saturation and token saturation, alerting when approaching the ~150k token Smart Zone limit.",
    "whenToUse": "Use during long multi-turn sessions, large codebase reads, or before running heavy analysis tasks to ensure peak reasoning.",
    "howToUse": "Run /headroom to check active token budget, saturation percentage, and compaction recommendations.",
    "whenToAvoid": "No need to run during simple 1-2 turn quick queries."
  },
  "humanizer": {
    "name": "humanizer",
    "category": "Execution & Code Quality",
    "summary": "Rewrite AI-sounding text so it reads naturally without changing what it says.",
    "whatItDoes": "Rewrites AI-generated prose to remove chatbot residue, inflated claims, staged run-ups, and artificial cadence based on Wikipedia AI Cleanup standards.",
    "whenToUse": "Use when editing user-facing documentation, READMEs, PR descriptions, or release notes to sound natural and human.",
    "howToUse": "Pass draft text to /humanizer to strip corporate AI fluff and stock triads while preserving every technical claim.",
    "whenToAvoid": "Avoid on raw machine-readable JSON, YAML, code comments, or formal mathematical equations."
  },
  "impeccable": {
    "name": "impeccable",
    "category": "UI/UX & Motion Design",
    "summary": "Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, landing pages, dashboards, product UI, app shells, components, forms, settings, onboarding, and empty states. Handles UX review, visual hierarchy, information architecture, cognitive load, accessibility, performance, responsive behavior, theming, anti-patterns, typography, fonts, spacing, layout, alignment, color, motion, micro-interactions, UX copy, error states, edge cases, i18n, and reusable design systems or tokens. Also use for bland designs that need to become bolder or more delightful, loud designs that should become quieter, live browser iteration on UI elements, or ambitious visual effects that should feel technically extraordinary. Not for backend-only or non-UI tasks.",
    "whatItDoes": "Use when the user wants to design, redesign, shape, critique, audit, polish, clarify, distill, harden, optimize, adapt, animate, colorize, extract, or otherwise improve a frontend interface. Covers websites, landing pages, dashboards, product UI, app shells, components, forms, settings, onboarding, and empty states. Handles UX review, visual hierarchy, information architecture, cognitive load, accessibility, performance, responsive behavior, theming, anti-patterns, typography, fonts, spacing, layout, alignment, color, motion, micro-interactions, UX copy, error states, edge cases, i18n, and reusable design systems or tokens. Also use for bland designs that need to become bolder or more delightful, loud designs that should become quieter, live browser iteration on UI elements, or ambitious visual effects that should feel technically extraordinary. Not for backend-only or non-UI tasks.",
    "whenToUse": "Use when executing tasks requiring specialized impeccable capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/impeccable' in chat or follow instructions in skills/impeccable/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "implement": {
    "name": "implement",
    "category": "Execution & Code Quality",
    "summary": "Implement a piece of work based on a spec or set of tickets.",
    "whatItDoes": "Implement a piece of work based on a spec or set of tickets.",
    "whenToUse": "Use when executing tasks requiring specialized implement capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/implement' in chat or follow instructions in skills/implement/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "implement-spec": {
    "name": "implement-spec",
    "category": "Execution & Code Quality",
    "summary": "Implement a specification in code.",
    "whatItDoes": "Implement a specification in code.",
    "whenToUse": "Use when executing tasks requiring specialized implement-spec capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/implement-spec' in chat or follow instructions in skills/implement-spec/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "improve-animations": {
    "name": "improve-animations",
    "category": "UI/UX & Motion Design",
    "summary": "Survey a codebase's animation and motion code as a senior motion advisor, then produce a prioritized audit and self-contained implementation plans for other agents (or cheaper models) to execute. Read-only on source code — it plans improvements, it does not apply them. Use when the user asks to \"improve the animations\", \"audit the motion\", \"make this app feel better\", or wants a roadmap of animation fixes rather than a review of a single diff.",
    "whatItDoes": "Survey a codebase's animation and motion code as a senior motion advisor, then produce a prioritized audit and self-contained implementation plans for other agents (or cheaper models) to execute. Read-only on source code — it plans improvements, it does not apply them. Use when the user asks to \"improve the animations\", \"audit the motion\", \"make this app feel better\", or wants a roadmap of animation fixes rather than a review of a single diff.",
    "whenToUse": "Use when executing tasks requiring specialized improve-animations capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/improve-animations' in chat or follow instructions in skills/improve-animations/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "improve-codebase-architecture": {
    "name": "improve-codebase-architecture",
    "category": "UI/UX & Motion Design",
    "summary": "Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.",
    "whatItDoes": "Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick.",
    "whenToUse": "Use when executing tasks requiring specialized improve-codebase-architecture capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/improve-codebase-architecture' in chat or follow instructions in skills/improve-codebase-architecture/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "improve-ui": {
    "name": "improve-ui",
    "category": "UI/UX & Motion Design",
    "summary": "Audit an existing product surface against its own design evidence, identify verified UI problems, and write self-contained implementation plans for another agent. Strictly read-only on product source. Use when asked to review, refine, improve, or clean up an interface without replacing its identity; investigate design-system drift; or prepare a design handoff.",
    "whatItDoes": "Audit an existing product surface against its own design evidence, identify verified UI problems, and write self-contained implementation plans for another agent. Strictly read-only on product source. Use when asked to review, refine, improve, or clean up an interface without replacing its identity; investigate design-system drift; or prepare a design handoff.",
    "whenToUse": "Use when executing tasks requiring specialized improve-ui capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/improve-ui' in chat or follow instructions in skills/improve-ui/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "loop-me": {
    "name": "loop-me",
    "category": "Deliberation & Strategy",
    "summary": "Grill me about specs for the workflows I want to build, within this workspace.",
    "whatItDoes": "Grill me about specs for the workflows I want to build, within this workspace.",
    "whenToUse": "Use when executing tasks requiring specialized loop-me capabilities in Deliberation & Strategy.",
    "howToUse": "Invoke '/loop-me' in chat or follow instructions in skills/loop-me/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Deliberation & Strategy where direct edits suffice."
  },
  "migrate-to-shoehorn": {
    "name": "migrate-to-shoehorn",
    "category": "Execution & Code Quality",
    "summary": "Migrate test files from `as` type assertions to @total-typescript/shoehorn. Use when user mentions shoehorn, wants to replace `as` in tests, or needs partial test data.",
    "whatItDoes": "Migrate test files from `as` type assertions to @total-typescript/shoehorn. Use when user mentions shoehorn, wants to replace `as` in tests, or needs partial test data.",
    "whenToUse": "Use when executing tasks requiring specialized migrate-to-shoehorn capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/migrate-to-shoehorn' in chat or follow instructions in skills/migrate-to-shoehorn/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "multica": {
    "name": "multica",
    "category": "Deliberation & Strategy",
    "summary": "Multi-agent chat, consensus, and multimodal collaboration engine. Orchestrates parallel agent rooms, peer verification, structured debates, and synthesis across heterogeneous models.",
    "whatItDoes": "Multi-agent chat, consensus, and multimodal collaboration engine. Orchestrates parallel agent rooms, peer verification, structured debates, and synthesis across heterogeneous models.",
    "whenToUse": "Use when executing tasks requiring specialized multica capabilities in Deliberation & Strategy.",
    "howToUse": "Invoke '/multica' in chat or follow instructions in skills/multica/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Deliberation & Strategy where direct edits suffice."
  },
  "pick-ui-library": {
    "name": "pick-ui-library",
    "category": "UI/UX & Motion Design",
    "summary": "Pick the right library for a given frontend task from a curated, opinionated list — numbers, OTP inputs, charts, command menus, virtualization, drag and drop, toasts, state, styling, and more. Only runs when explicitly invoked; it does not trigger on its own.",
    "whatItDoes": "Pick the right library for a given frontend task from a curated, opinionated list — numbers, OTP inputs, charts, command menus, virtualization, drag and drop, toasts, state, styling, and more. Only runs when explicitly invoked; it does not trigger on its own.",
    "whenToUse": "Use when executing tasks requiring specialized pick-ui-library capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/pick-ui-library' in chat or follow instructions in skills/pick-ui-library/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "playwright-mcp": {
    "name": "playwright-mcp",
    "category": "UI/UX & Motion Design",
    "summary": "Headless browser automation for visual regression, DOM verification, and end-to-end integration testing.",
    "whatItDoes": "Headless browser automation for visual regression, DOM verification, and end-to-end integration testing.",
    "whenToUse": "Use when executing tasks requiring specialized playwright-mcp capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/playwright-mcp' in chat or follow instructions in skills/playwright-mcp/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "prototype": {
    "name": "prototype",
    "category": "UI/UX & Motion Design",
    "summary": "Build multiple genuinely different versions of a UI piece you describe, rendered behind a visual picker so you can flip through them live and promote the one that feels right. Only runs when explicitly invoked; it does not trigger on its own.",
    "whatItDoes": "Build multiple genuinely different versions of a UI piece you describe, rendered behind a visual picker so you can flip through them live and promote the one that feels right. Only runs when explicitly invoked; it does not trigger on its own.",
    "whenToUse": "Use when executing tasks requiring specialized prototype capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/prototype' in chat or follow instructions in skills/prototype/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "repomix": {
    "name": "repomix",
    "category": "Context, Search & Scraping",
    "summary": "Pack an entire repository or sub-directory into a single, AI-optimized, token-counted XML/Markdown file using Repomix. Use when preparing full repository context for LLMs, cross-service analysis, or external council reviews.",
    "whatItDoes": "Packs the repository into a single AI-optimized, token-counted XML or Markdown file ignoring binary noise and caches.",
    "whenToUse": "Use when preparing whole-repo context for external LLMs, multi-agent council review, or architectural audits.",
    "howToUse": "Run npx repomix --style xml --output repomix-output.xml in your workspace root, or invoke /repomix.",
    "whenToAvoid": "Avoid when performing a fast single-function fix where reading 1-2 files directly is much leaner."
  },
  "research": {
    "name": "research",
    "category": "Context, Search & Scraping",
    "summary": "Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to a background agent.",
    "whatItDoes": "Conducts rigorous investigation against primary authoritative sources (RFCs, official source code, first-party specs) with citations.",
    "whenToUse": "Use when you need a deep, trustworthy technical brief or when validating architectural decisions against industry standards.",
    "howToUse": "Invoke /research [topic/question] to generate an in-repo research brief markdown file citing primary sources.",
    "whenToAvoid": "Avoid when the answer is already documented in the repository context.md or README."
  },
  "resolving-merge-conflicts": {
    "name": "resolving-merge-conflicts",
    "category": "Execution & Code Quality",
    "summary": "Use when you need to resolve an in-progress git merge/rebase conflict.",
    "whatItDoes": "Use when you need to resolve an in-progress git merge/rebase conflict.",
    "whenToUse": "Use when executing tasks requiring specialized resolving-merge-conflicts capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/resolving-merge-conflicts' in chat or follow instructions in skills/resolving-merge-conflicts/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "retro": {
    "name": "retro",
    "category": "Execution & Code Quality",
    "summary": "Conduct a retrospective on a coding session.",
    "whatItDoes": "Conduct a retrospective on a coding session.",
    "whenToUse": "Use when executing tasks requiring specialized retro capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/retro' in chat or follow instructions in skills/retro/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "review-animations": {
    "name": "review-animations",
    "category": "UI/UX & Motion Design",
    "summary": "Reviews animation and motion code against a high craft bar derived from Emil Kowalski's design engineering philosophy. Default to flagging; approval is earned.",
    "whatItDoes": "Reviews animation and motion code against a high craft bar derived from Emil Kowalski's design engineering philosophy. Default to flagging; approval is earned.",
    "whenToUse": "Use when executing tasks requiring specialized review-animations capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/review-animations' in chat or follow instructions in skills/review-animations/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "scaffold-exercises": {
    "name": "scaffold-exercises",
    "category": "Execution & Code Quality",
    "summary": "Create exercise directory structures with sections, problems, solutions, and explainers that pass linting. Use when user wants to scaffold exercises, create exercise stubs, or set up a new course section.",
    "whatItDoes": "Create exercise directory structures with sections, problems, solutions, and explainers that pass linting. Use when user wants to scaffold exercises, create exercise stubs, or set up a new course section.",
    "whenToUse": "Use when executing tasks requiring specialized scaffold-exercises capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/scaffold-exercises' in chat or follow instructions in skills/scaffold-exercises/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "serena": {
    "name": "serena",
    "category": "Context, Search & Scraping",
    "summary": "Semantic codebase search, natural language symbol indexing, and cross-module code discovery engine. Locates non-obvious functional dependencies and shared patterns.",
    "whatItDoes": "Indexes semantic codebase symbols, function intent, and natural language concepts across modules and comments.",
    "whenToUse": "Use when you know what code does conceptually (e.g. \"where is audio ducking handled?\") but do not know exact variable or function names.",
    "howToUse": "Run /serena in chat or query conceptually to locate target files before making modifications.",
    "whenToAvoid": "Avoid when you already know the exact symbol name or file path (use literal grep or direct view_file instead)."
  },
  "setup-matt-pocock-skills": {
    "name": "setup-matt-pocock-skills",
    "category": "Execution & Code Quality",
    "summary": "Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.",
    "whatItDoes": "Configure this repo for the engineering skills: set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use of the other engineering skills.",
    "whenToUse": "Use when executing tasks requiring specialized setup-matt-pocock-skills capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/setup-matt-pocock-skills' in chat or follow instructions in skills/setup-matt-pocock-skills/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "setup-pre-commit": {
    "name": "setup-pre-commit",
    "category": "Execution & Code Quality",
    "summary": "Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. Use when user wants to add pre-commit hooks, set up Husky, configure lint-staged, or add commit-time formatting/typechecking/testing.",
    "whatItDoes": "Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. Use when user wants to add pre-commit hooks, set up Husky, configure lint-staged, or add commit-time formatting/typechecking/testing.",
    "whenToUse": "Use when executing tasks requiring specialized setup-pre-commit capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/setup-pre-commit' in chat or follow instructions in skills/setup-pre-commit/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "setup-ts-deep-modules": {
    "name": "setup-ts-deep-modules",
    "category": "Execution & Code Quality",
    "summary": "Wire dependency-cruiser into a TypeScript repo so each package is a deep module, with implementation hidden in subfolders and reachable only through its entry-point files. User-invoked.",
    "whatItDoes": "Wire dependency-cruiser into a TypeScript repo so each package is a deep module, with implementation hidden in subfolders and reachable only through its entry-point files. User-invoked.",
    "whenToUse": "Use when executing tasks requiring specialized setup-ts-deep-modules capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/setup-ts-deep-modules' in chat or follow instructions in skills/setup-ts-deep-modules/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "system-prompts-ai": {
    "name": "system-prompts-ai",
    "category": "Deliberation & Strategy",
    "summary": "Curated catalog of frontier LLM system prompts, metaprompts, and role-based personas. Enforces precise behavioral boundaries, structured outputs, and anti-hallucination guardrails.",
    "whatItDoes": "Curated catalog of frontier LLM system prompts, metaprompts, and role-based personas. Enforces precise behavioral boundaries, structured outputs, and anti-hallucination guardrails.",
    "whenToUse": "Use when executing tasks requiring specialized system-prompts-ai capabilities in Deliberation & Strategy.",
    "howToUse": "Invoke '/system-prompts-ai' in chat or follow instructions in skills/system-prompts-ai/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Deliberation & Strategy where direct edits suffice."
  },
  "tdd": {
    "name": "tdd",
    "category": "Execution & Code Quality",
    "summary": "Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions \"red-green-refactor\", or wants integration tests.",
    "whatItDoes": "Enforces strict Test-Driven Development (Red -> Green -> Refactor) before touching source code.",
    "whenToUse": "Use when building new features, adding API endpoints, or fixing bugs to prevent regressions.",
    "howToUse": "Author a failing test in tests/, verify it fails (Red), write the minimal source implementation (Green), then refactor.",
    "whenToAvoid": "Avoid for purely visual CSS styling adjustments or throwaway prototypes."
  },
  "teach": {
    "name": "teach",
    "category": "Execution & Code Quality",
    "summary": "Teach the user a new skill or concept, within this workspace.",
    "whatItDoes": "Teach the user a new skill or concept, within this workspace.",
    "whenToUse": "Use when executing tasks requiring specialized teach capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/teach' in chat or follow instructions in skills/teach/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "to-questionnaire": {
    "name": "to-questionnaire",
    "category": "Orchestration & Routing",
    "summary": "Turn a decision you can't fully answer into a questionnaire for someone else to fill in.",
    "whatItDoes": "Turn a decision you can't fully answer into a questionnaire for someone else to fill in.",
    "whenToUse": "Use when executing tasks requiring specialized to-questionnaire capabilities in Orchestration & Routing.",
    "howToUse": "Invoke '/to-questionnaire' in chat or follow instructions in skills/to-questionnaire/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Orchestration & Routing where direct edits suffice."
  },
  "to-spec": {
    "name": "to-spec",
    "category": "Orchestration & Routing",
    "summary": "Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed.",
    "whatItDoes": "Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed.",
    "whenToUse": "Use when executing tasks requiring specialized to-spec capabilities in Orchestration & Routing.",
    "howToUse": "Invoke '/to-spec' in chat or follow instructions in skills/to-spec/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Orchestration & Routing where direct edits suffice."
  },
  "to-tickets": {
    "name": "to-tickets",
    "category": "Orchestration & Routing",
    "summary": "Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).",
    "whatItDoes": "Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocking links on a real tracker).",
    "whenToUse": "Use when executing tasks requiring specialized to-tickets capabilities in Orchestration & Routing.",
    "howToUse": "Invoke '/to-tickets' in chat or follow instructions in skills/to-tickets/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Orchestration & Routing where direct edits suffice."
  },
  "triage": {
    "name": "triage",
    "category": "Orchestration & Routing",
    "summary": "Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs.",
    "whatItDoes": "Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs.",
    "whenToUse": "Use when executing tasks requiring specialized triage capabilities in Orchestration & Routing.",
    "howToUse": "Invoke '/triage' in chat or follow instructions in skills/triage/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Orchestration & Routing where direct edits suffice."
  },
  "ui-skills-root": {
    "name": "ui-skills-root",
    "category": "UI/UX & Motion Design",
    "summary": "Use before UI-related work to select the smallest useful UI Skills context through the ui-skills CLI.",
    "whatItDoes": "Use before UI-related work to select the smallest useful UI Skills context through the ui-skills CLI.",
    "whenToUse": "Use when executing tasks requiring specialized ui-skills-root capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/ui-skills-root' in chat or follow instructions in skills/ui-skills-root/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "ui-ux-pro-max": {
    "name": "ui-ux-pro-max",
    "category": "UI/UX & Motion Design",
    "summary": "Maximum-craft UI/UX component generation and styling director. Generates production-grade components, anti-slop guidelines, color harmonies, and responsive micro-interactions.",
    "whatItDoes": "Maximum-craft UI/UX component generation and styling director. Generates production-grade components, anti-slop guidelines, color harmonies, and responsive micro-interactions.",
    "whenToUse": "Use when executing tasks requiring specialized ui-ux-pro-max capabilities in UI/UX & Motion Design.",
    "howToUse": "Invoke '/ui-ux-pro-max' in chat or follow instructions in skills/ui-ux-pro-max/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside UI/UX & Motion Design where direct edits suffice."
  },
  "vibe-kanban": {
    "name": "vibe-kanban",
    "category": "Orchestration & Routing",
    "summary": "Visual task board and sprint tracker for coordinating multi-agent task execution and status transitions.",
    "whatItDoes": "Visual task board and sprint tracker for coordinating multi-agent task execution and status transitions.",
    "whenToUse": "Use when executing tasks requiring specialized vibe-kanban capabilities in Orchestration & Routing.",
    "howToUse": "Invoke '/vibe-kanban' in chat or follow instructions in skills/vibe-kanban/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Orchestration & Routing where direct edits suffice."
  },
  "wait-what": {
    "name": "wait-what",
    "category": "Orchestration & Routing",
    "summary": "Stop. That last message did not land: re-pitch it.",
    "whatItDoes": "Stop. That last message did not land: re-pitch it.",
    "whenToUse": "Use when executing tasks requiring specialized wait-what capabilities in Orchestration & Routing.",
    "howToUse": "Invoke '/wait-what' in chat or follow instructions in skills/wait-what/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Orchestration & Routing where direct edits suffice."
  },
  "wayfinder": {
    "name": "wayfinder",
    "category": "Orchestration & Routing",
    "summary": "Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear.",
    "whatItDoes": "Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear.",
    "whenToUse": "Use when executing tasks requiring specialized wayfinder capabilities in Orchestration & Routing.",
    "howToUse": "Invoke '/wayfinder' in chat or follow instructions in skills/wayfinder/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Orchestration & Routing where direct edits suffice."
  },
  "wizard": {
    "name": "wizard",
    "category": "Execution & Code Quality",
    "summary": "Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself.",
    "whatItDoes": "Generate an interactive bash wizard that walks a human through steps only they can perform. Use when provisioning infrastructure, setting up credentials or CI secrets, walking an unfamiliar third-party dashboard, or running a one-off migration or cutover. Don't invoke this for steps the agent can perform itself.",
    "whenToUse": "Use when executing tasks requiring specialized wizard capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/wizard' in chat or follow instructions in skills/wizard/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "write-swift": {
    "name": "write-swift",
    "category": "Execution & Code Quality",
    "summary": "How to write modern Swift well — modeling with value types, Swift 6 data-race safety and approachable concurrency (@concurrent, main-actor-by-default, actors, task groups), protocols and generics (some vs any), API design, performance and ARC, Swift Testing, macros, and the modern language features agents don't know about yet. Use when writing, reviewing, or migrating Swift, or when a concurrency error, a hang, a data race, a retain cycle, or a performance problem needs fixing.",
    "whatItDoes": "How to write modern Swift well — modeling with value types, Swift 6 data-race safety and approachable concurrency (@concurrent, main-actor-by-default, actors, task groups), protocols and generics (some vs any), API design, performance and ARC, Swift Testing, macros, and the modern language features agents don't know about yet. Use when writing, reviewing, or migrating Swift, or when a concurrency error, a hang, a data race, a retain cycle, or a performance problem needs fixing.",
    "whenToUse": "Use when executing tasks requiring specialized write-swift capabilities in Execution & Code Quality.",
    "howToUse": "Invoke '/write-swift' in chat or follow instructions in skills/write-swift/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Execution & Code Quality where direct edits suffice."
  },
  "writing-beats": {
    "name": "writing-beats",
    "category": "Technical Writing & Documentation",
    "summary": "Writing, exploit; assemble raw material into a journey of beats, grounding each term before a beat leans on it.",
    "whatItDoes": "Writing, exploit; assemble raw material into a journey of beats, grounding each term before a beat leans on it.",
    "whenToUse": "Use when executing tasks requiring specialized writing-beats capabilities in Technical Writing & Documentation.",
    "howToUse": "Invoke '/writing-beats' in chat or follow instructions in skills/writing-beats/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Technical Writing & Documentation where direct edits suffice."
  },
  "writing-for-agents": {
    "name": "writing-for-agents",
    "category": "Technical Writing & Documentation",
    "summary": "Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md or CLAUDE.md.",
    "whatItDoes": "Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md or CLAUDE.md.",
    "whenToUse": "Use when executing tasks requiring specialized writing-for-agents capabilities in Technical Writing & Documentation.",
    "howToUse": "Invoke '/writing-for-agents' in chat or follow instructions in skills/writing-for-agents/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Technical Writing & Documentation where direct edits suffice."
  },
  "writing-fragments": {
    "name": "writing-fragments",
    "category": "Technical Writing & Documentation",
    "summary": "Writing, explore: mine raw fragments, no structure yet.",
    "whatItDoes": "Writing, explore: mine raw fragments, no structure yet.",
    "whenToUse": "Use when executing tasks requiring specialized writing-fragments capabilities in Technical Writing & Documentation.",
    "howToUse": "Invoke '/writing-fragments' in chat or follow instructions in skills/writing-fragments/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Technical Writing & Documentation where direct edits suffice."
  },
  "writing-shape": {
    "name": "writing-shape",
    "category": "Technical Writing & Documentation",
    "summary": "Writing, exploit: shape raw material into an article, paragraph by paragraph.",
    "whatItDoes": "Writing, exploit: shape raw material into an article, paragraph by paragraph.",
    "whenToUse": "Use when executing tasks requiring specialized writing-shape capabilities in Technical Writing & Documentation.",
    "howToUse": "Invoke '/writing-shape' in chat or follow instructions in skills/writing-shape/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Technical Writing & Documentation where direct edits suffice."
  },
  "wshobson-agents": {
    "name": "wshobson-agents",
    "category": "Role Specialization",
    "summary": "Multi-agent role specialization suite (Architect, QA/Test Engineer, Security Lead, Staff Optimizer, Code Reviewer, UI Designer). Enforces strict separation of concerns and rigorous inter-agent handoff protocols.",
    "whatItDoes": "Multi-agent role specialization suite (Architect, QA/Test Engineer, Security Lead, Staff Optimizer, Code Reviewer, UI Designer). Enforces strict separation of concerns and rigorous inter-agent handoff protocols.",
    "whenToUse": "Use when executing tasks requiring specialized wshobson-agents capabilities in Role Specialization.",
    "howToUse": "Invoke '/wshobson-agents' in chat or follow instructions in skills/wshobson-agents/SKILL.md.",
    "whenToAvoid": "Avoid when performing simple tasks outside Role Specialization where direct edits suffice."
  }
};
