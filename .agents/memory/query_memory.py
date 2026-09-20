#!/usr/bin/env python3
"""
Cross-Agent Memory Query Engine (/agentmemory)
Zero-dependency CLI tool to search persistent cross-agent memories,
domain invariants, bug resolution traces, clean code patterns, and runbooks.
"""

import sys
import json
from pathlib import Path

MEMORY_FILE = Path(__file__).parent / "agent_memory.json"

def search_memory(query: str, category: str = None):
    if not MEMORY_FILE.exists():
        print(f"[ERROR] Memory file not found: {MEMORY_FILE}")
        return

    with open(MEMORY_FILE, "r", encoding="utf-8") as f:
        data = json.load(f)

    categories = data.get("categories", {})
    query_lower = query.lower()
    matches = []

    STOPWORDS = {"how", "to", "the", "a", "an", "is", "in", "for", "and", "or", "of", "what", "which", "me", "my", "do", "i", "can"}
    tokens = [t for t in query_lower.split() if len(t) > 1 and t not in STOPWORDS]
    if not tokens:
        tokens = [query_lower]

    for cat_name, entries in categories.items():
        if category and category.lower() != cat_name.lower():
            continue

        for entry in entries:
            serialized = json.dumps(entry, ensure_ascii=False).lower()
            # Exact substring match or token overlap
            if query_lower in serialized or all(token in serialized for token in tokens) or (len(tokens) > 1 and sum(1 for token in tokens if token in serialized) >= len(tokens) - 1):
                matches.append((cat_name, entry))

    print(f"\n[AGENT-MEMORY] Search Results for '{query}' (Found: {len(matches)})")
    print("=" * 70)
    for cat_name, entry in matches:
        print(f"\n[CATEGORY] {cat_name.upper()}")
        print(f"  ID: {entry.get('id', 'N/A')}")
        if "title" in entry:
            print(f"  Title: {entry['title']}")
        if "text" in entry:
            print(f"  Text: {entry['text']}")
        if "command_native_lan" in entry:
            print(f"  Command (LAN / External): {entry['command_native_lan']}")
        if "command_native_local" in entry:
            print(f"  Command (Local Only):     {entry['command_native_local']}")
        if "command_run_model" in entry:
            print(f"  Command (Run Model):      {entry['command_run_model']}")
        if "command_from_root" in entry:
            print(f"  Command (from root):    {entry['command_from_root']}")
        if "command_from_backend" in entry:
            print(f"  Command (from backend): {entry['command_from_backend']}")
        if "command" in entry:
            print(f"  Command:    {entry['command']}")
        if "description" in entry:
            print(f"  Details:    {entry['description']}")
        if "symptom" in entry:
            print(f"  Symptom:    {entry['symptom']}")
            print(f"  Root Cause: {entry['root_cause']}")
            print(f"  Resolution: {entry['resolution']}")
        if "metadata" in entry:
            print(f"  Metadata:   {json.dumps(entry['metadata'])}")
    print("\n" + "=" * 70)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python query_memory.py <search_query> [optional_category]")
        sys.exit(1)

    search_query = sys.argv[1]
    cat = sys.argv[2] if len(sys.argv) > 2 else None
    search_memory(search_query, cat)
