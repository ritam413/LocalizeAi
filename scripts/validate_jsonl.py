#!/usr/bin/env python3
"""
scripts/validate_jsonl.py
-------------------------
Validates and inspects a ChatML JSONL dataset before fine-tuning with Unsloth.

Checks:
1. Valid JSON on every line.
2. Correct ChatML schema (role: system/user/assistant, non-empty content).
3. Token count estimation and distribution (flags items > 2048 tokens).
4. Extracted characters and dialogue frequency breakdown.
5. Overall dataset readiness verdict (GO / WARN / STOP).
"""

import argparse
import json
import re
import sys
from collections import Counter
from pathlib import Path


def estimate_tokens(text: str) -> int:
    """Fast rule-of-thumb token estimator (approx. 3.8 characters per token for English dialogue)."""
    return max(1, int(len(text) / 3.8))


def main():
    parser = argparse.ArgumentParser(
        description="Validate and analyze a ChatML JSONL dataset for Qwen2.5-3B fine-tuning."
    )
    parser.add_argument(
        "jsonl_path",
        type=str,
        nargs="?",
        default="data/subtitles_train.jsonl",
        help="Path to the .jsonl file (default: data/subtitles_train.jsonl)",
    )
    parser.add_argument(
        "--max-seq-length",
        type=int,
        default=2048,
        help="Maximum allowed sequence length (default: 2048)",
    )

    args = parser.parse_args()
    path = Path(args.jsonl_path)

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    if not path.exists():
        print(f"[ERROR] File not found: {path.resolve()}")
        sys.exit(1)

    print("=" * 65)
    print(f"INSPECTING DATASET: {path.name}")
    print("=" * 65)

    total_rows = 0
    errors = 0
    token_lengths = []
    source_files = Counter()
    characters = Counter()
    over_limit_count = 0

    with open(path, "r", encoding="utf-8") as f:
        for line_num, line in enumerate(f, 1):
            line = line.strip()
            if not line:
                continue
            total_rows += 1

            # 1. Check JSON validity
            try:
                record = json.loads(line)
            except json.JSONDecodeError as err:
                print(f"  Line {line_num}: Invalid JSON ({err})")
                errors += 1
                continue

            # 2. Check Schema
            if "messages" not in record or not isinstance(record["messages"], list):
                print(f"  Line {line_num}: Missing 'messages' list")
                errors += 1
                continue

            messages = record["messages"]
            roles = [m.get("role") for m in messages if isinstance(m, dict)]

            if roles != ["system", "user", "assistant"]:
                print(f"  Line {line_num}: Non-standard role sequence {roles}")
                errors += 1

            # 3. Source & Character extraction
            chunk_id = record.get("id", "unknown")
            source_file = chunk_id.split("/")[0] if "/" in chunk_id else "default"
            source_files[source_file] += 1

            assistant_msg = messages[-1].get("content", "") if len(messages) >= 3 else ""
            for line_content in assistant_msg.split("\n"):
                match = re.match(r"^([A-Za-z][A-Za-z0-9_\s]{1,20}):", line_content.strip())
                if match:
                    characters[match.group(1).strip()] += 1

            # 4. Token Estimation
            full_text = " ".join(m.get("content", "") for m in messages if isinstance(m, dict))
            approx_tokens = estimate_tokens(full_text)
            token_lengths.append(approx_tokens)

            if approx_tokens > args.max_seq_length:
                over_limit_count += 1

    if total_rows == 0:
        print("[ERROR] Dataset is empty!")
        sys.exit(1)

    avg_tokens = sum(token_lengths) / len(token_lengths) if token_lengths else 0
    min_tokens = min(token_lengths) if token_lengths else 0
    max_tokens = max(token_lengths) if token_lengths else 0

    # Verdict
    if errors > 0:
        verdict = "[STOP] Schema/JSON errors found. Fix before training."
    elif total_rows < 100:
        verdict = f"[WARN] Dataset is small ({total_rows} rows). Unsloth recommends >= 100 rows."
    elif total_rows < 1000:
        verdict = f"[GO] Dataset is ready ({total_rows} rows). Good for lightweight LoRA fine-tuning."
    else:
        verdict = f"[EXCELLENT] Robust dataset ({total_rows} rows) for high-quality fine-tuning."

    print("DATASET STATISTICS & METRICS:")
    print(f"  Total Valid Examples:       {total_rows}")
    print(f"  Syntax / Schema Errors:     {errors}")
    print(f"  Unique Source Subtitles:    {len(source_files)}")
    print(f"  Unique Characters Detected: {len(characters)}")
    print(f"  Avg Tokens per Example:     ~{avg_tokens:.0f}")
    print(f"  Min / Max Tokens:           ~{min_tokens} / ~{max_tokens}")
    print(f"  Over {args.max_seq_length} Token Limit:        {over_limit_count}")
    print("-" * 65)

    if characters:
        print("TOP DETECTED CHARACTERS:")
        for char, count in characters.most_common(8):
            print(f"    • {char:20} : {count:4} dialogue lines")
        print("-" * 65)

    print(f"  READINESS: {verdict}")
    print("=" * 65)


if __name__ == "__main__":
    main()
