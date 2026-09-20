# Codebase Memory Index & Gated Inspection Rule

This rule governs how agents inspect and answer questions regarding the codebase. It enforces deterministic memory recall, prevents token-wasteful repository crawls, and gates tools based on query intent.

---

## 1. Zero-Tool Fast Bypass (Non-Codebase Queries)

When the user asks a question that is **general, conceptual, syntax-focused, or unrelated to this repository**:
- Examples: *"Explain how QuickSort works"*, *"What is the difference between Promise.all and Promise.allSettled?"*, *"Write a Python script to scrape HTML tables"*, *"How does CSS grid work?"*
- **INVARIANT**: The agent MUST answer immediately from internal model weights with **ZERO tool calls**.
- **HARD PROHIBITION**: Do NOT call `agentmemory`, `serena`, `codegraph`, `list_dir`, or `view_file`.

---

## 2. Codebase Query Inspection Hierarchy (Tiered Search)

When the user asks a question **about this repository, its architecture, functions, components, or bugs**:

```
[Incoming Codebase Query]
           │
           ▼
[Step 1: O(1) Symbol Manifest] ──(Match found)──► Answer directly with file, line & signature
           │
      (No match)
           ▼
[Step 2: agentmemory / ChromaDB] ──(Found)──────► Answer using vector memory context
           │
     (Unresolved)
           ▼
[Step 3: Targeted AST Search] ──(Found)─────────► Use serena or codegraph
           │
     (Unresolved)
           ▼
[Step 4: Targeted Grep Search] ─────────────────► Use grep_search with tight includes
           │
           ▼
[Step 5: Context7 Sliced Reading] ──────────────► Targeted view_file (StartLine/EndLine, ≤50 lines)
```

### Prohibitions during Q&A:
1. **NO BLIND DIRECTORY CRAWLING**: Never invoke `list_dir` on root or subdirectories simply to "see what files exist".
2. **NO WHOLE-FILE DUMPING**: Never invoke `view_file` on entire files (>50 lines) when answering questions. Use `StartLine` and `EndLine` slices targeted at specific function boundaries.

---

## 3. Repomix Detection & Ingestion Lifecycle

### A. Repomix Generation Hook
When `/repomix` is run or `repomix-output.xml` is generated:
1. Check if `.agents/memory/symbols_manifest.json` and `.agents/memory/.indexed_hash` exist and match the XML hash.
2. If stale or missing, recommend running the ingestion script:
   ```bash
   python .agents/scripts/ingest_repomix.py
   ```
3. Highlight that `symbols_manifest.json` provides instant $O(1)$ zero-token symbol lookup without loading large files into context.

### B. Repositories Without Repomix
If `repomix-output.xml` is not present in the workspace:
- Do NOT attempt to load `agentmemory` or `claude-mem`.
- Silently fall back to standard targeted `grep_search` and `context.md`.
- Append a gentle, non-blocking tip:
  > 💡 *Tip: Run `npx repomix --style xml --output repomix-output.xml` and `python .agents/scripts/ingest_repomix.py` to enable instant O(1) symbol memory.*

---

## 4. Freshness & Invalidation Guardrails
- Before relying on cached symbol signatures, verify that the target file has not been heavily edited since the index timestamp in `.agents/memory/.indexed_hash`.
- If a target file was modified during the active session, verify the local file lines via `context7` sliced reading before finalizing edits.
