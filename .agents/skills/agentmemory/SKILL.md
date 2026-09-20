---
name: agentmemory
description: "Multi-agent shared episodic & semantic vector memory engine. Stores persistent cross-agent memories, past bug resolution traces, and domain invariants."
repository: "https://github.com/agentops-ai/agentmemory"
---

# AgentMemory: Multi-Agent Episodic & Semantic Memory Store

## Overview
`agentmemory` provides persistent cross-agent memory across sessions and independent agent runs. It records architectural invariants, historical bug resolution traces, clean code heuristics, and hardware boundaries for **LOCALIZE** (Autonomous AI Post-Production Crew for Film & Video Localization).

## Memory System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       LOCALIZE Memory                       │
├──────────────────────────────┬──────────────────────────────┤
│      Domain Invariants       │    Bug Resolution Traces     │
│   (ADRs, VRAM limits, audio  │ (Symptoms, root causes, fixes│
│   standards, playhead sync)  │    and verification suites)  │
├──────────────────────────────┴──────────────────────────────┤
│                     Clean Code Patterns                     │
│        (Single responsibility, defensive duration clamps,   │
│              centralized registries, atomic IO)             │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────▼───────────────┐
               │ .agents/memory/query_memory.py│
               │   Fast Zero-Dependency CLI    │
               └───────────────────────────────┘
```

## Quick CLI Memory Search

Search the repository's cross-agent memory store instantly:

```bash
# Search all categories
python .agents/memory/query_memory.py "kokoro"

# Search specific category
python .agents/memory/query_memory.py "temporal" domain_invariants
python .agents/memory/query_memory.py "truncation" bug_resolution_traces
python .agents/memory/query_memory.py "clamp" clean_code_patterns
```

## Python Client API

To interact with memory programmatically in backend scripts:

```python
import json
from pathlib import Path

MEMORY_PATH = Path(".agents/memory/agent_memory.json")

def load_memories(category: str = None):
    with open(MEMORY_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    categories = data.get("categories", {})
    if category:
        return categories.get(category, [])
    return categories

# Example: Read domain invariants
invariants = load_memories("domain_invariants")
for inv in invariants:
    print(f"[{inv['id']}] {inv['title']}: {inv['text']}")
```

## Directives for Coding Agents
1. **Episodic Logging:** When discovering a non-obvious bug root-cause, file locking issue, or critical timing invariant, record it in `.agents/memory/agent_memory.json`.
2. **Deterministic Retrieval:** Before modifying audio pipelines, player synchronization, or GPU scheduling, search `query_memory.py` to verify domain invariants.
3. **Repository Sync:** Ensure high-impact invariants are mirrored in [`context.md`](file:///d:/Games/Hckthons/Side%20Projects/LocalizeAi/context.md) and [`tracker.md`](file:///d:/Games/Hckthons/Side%20Projects/LocalizeAi/TRACKER.md).
