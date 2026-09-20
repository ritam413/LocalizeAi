# Codebase Indexing Request Workflow Rule

This rule triggers whenever the user asks to "index the codebase", "index this repo", "index repository", "build memory index", "generate code index", or similar phrases.

---

## Direct User Response Workflow

When this intent is detected, the agent MUST present the standard 2-step indexing procedure:

```markdown
To index this codebase into memory for instant, zero-token symbol lookups and semantic recall:

### Step 1: Generate the Repomix Bundle
In the root of any repository, run:
```bash
npx repomix --style xml --output repomix-output.xml
```

### Step 2: Ingest into Memory
Run the global script from the root of that repo:
```bash
python "C:\Users\ritam\.gemini\scripts\ingest_repomix.py"
```
```

---

## Proactive Autonomous Execution

If the user is in an active chat session and asks the agent to "index this repo now" or "build the index for me":
1. Check if `repomix-output.xml` exists.
   - If not present or stale, execute Step 1 via terminal: `npx repomix --style xml --output repomix-output.xml`
2. Once the XML is ready, execute Step 2 via terminal: `python "C:\Users\ritam\.gemini\scripts\ingest_repomix.py"`
3. Confirm completion and report the number of files and symbols indexed into `.agents/memory/symbols_manifest.json` (or `~/.agentmemory/stores/<repo_id>/`).
