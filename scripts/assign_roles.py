#!/usr/bin/env python3
"""
scripts/assign_roles.py
-----------------------
Interactive and template-based Character Role Assigner.

Allows you to easily map generic SPEAKER_A / SPEAKER_B tags to real character
names (e.g., JAZMINE, DEREK, WIFE, HUSBAND, COMMANDER) across your SRT files.

Modes:
1. --template: Generates 'data/subtitles/character_config.json' pre-populated
   with all your subtitle filenames so you can edit names in your code editor.
2. Interactive (default): Steps through each subtitle file, prints 2-3 dialogue
   samples for SPEAKER_A and SPEAKER_B, and prompts you to type their character names.
"""

import argparse
import json
import sys
from pathlib import Path
from typing import Dict

# Import parsing & heuristic from srt_to_jsonl
from srt_to_jsonl import CharacterAssigner, HumanizerCleaner, parse_srt_file


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(
        description="Assign character names/roles to subtitle dialogue files."
    )
    parser.add_argument(
        "--input",
        "-i",
        type=str,
        default="data/subtitles",
        help="Path to folder containing .srt files (default: data/subtitles)",
    )
    parser.add_argument(
        "--config",
        "-c",
        type=str,
        default="data/subtitles/character_config.json",
        help="Path to output character_config.json (default: data/subtitles/character_config.json)",
    )
    parser.add_argument(
        "--template",
        action="store_true",
        help="Generate a template JSON with all filenames instead of interactive prompting.",
    )

    args = parser.parse_args()
    input_dir = Path(args.input)
    config_path = Path(args.config)

    if not input_dir.exists():
        print(f"[ERROR] Directory '{input_dir}' does not exist.")
        return

    srt_files = sorted(list(input_dir.glob("*.srt")))
    if not srt_files:
        print(f"[ERROR] No .srt files found in '{input_dir}'.")
        return

    # Load existing config if available
    current_config: Dict[str, Dict[str, str]] = {}
    if config_path.exists():
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                current_config = json.load(f)
            print(f"Loaded existing config with {len(current_config)} entries from '{config_path}'.")
        except Exception:
            current_config = {}

    if args.template:
        # Generate JSON template for all files
        for srt in srt_files:
            stem = srt.stem
            if stem not in current_config:
                current_config[stem] = {
                    "SPEAKER_A": "CHARACTER_A",
                    "SPEAKER_B": "CHARACTER_B",
                }

        config_path.parent.mkdir(parents=True, exist_ok=True)
        with open(config_path, "w", encoding="utf-8") as f:
            json.dump(current_config, f, indent=2, ensure_ascii=False)

        print("=" * 65)
        print("CHARACTER CONFIG TEMPLATE CREATED")
        print("=" * 65)
        print(f"Generated template for {len(srt_files)} subtitle files:")
        print(f"File: {config_path.resolve()}")
        print("\nYou can open this file in VS Code and replace 'CHARACTER_A' / 'CHARACTER_B'")
        print("with real character names (e.g. 'JAZMINE', 'DEREK', 'WIFE', 'HUSBAND').")
        print("Then re-run: python scripts/srt_to_jsonl.py")
        return

    # Interactive Wizard Mode
    print("=" * 65)
    print("INTERACTIVE CHARACTER ROLE ASSIGNER")
    print("=" * 65)
    print(f"Scanning {len(srt_files)} subtitle files in '{input_dir}'.")
    print("Press Enter to keep current name, or type a new role/character name.")
    print("Type 'q' or 'exit' at any prompt to save progress and quit.\n")

    assigner = CharacterAssigner()

    for idx, srt in enumerate(srt_files, 1):
        stem = srt.stem
        lines = parse_srt_file(srt)
        if not lines:
            continue

        for l in lines:
            l.cleaned_text = HumanizerCleaner.clean(l.raw_text)
        assigner.assign(lines, stem)

        # Collect sample lines for each speaker
        spk_a_samples = [
            l.cleaned_text for l in lines if l.character == "SPEAKER_A" and len(l.cleaned_text) > 10
        ][:3]
        spk_b_samples = [
            l.cleaned_text for l in lines if l.character == "SPEAKER_B" and len(l.cleaned_text) > 10
        ][:3]

        existing = current_config.get(stem, {})
        curr_a = existing.get("SPEAKER_A", "SPEAKER_A")
        curr_b = existing.get("SPEAKER_B", "SPEAKER_B")

        print("-" * 65)
        print(f"[{idx}/{len(srt_files)}] File: {srt.name}")
        print("  Sample dialogue for SPEAKER_A:")
        for s in spk_a_samples:
            print(f'    • "{s}"')
        print("  Sample dialogue for SPEAKER_B:")
        for s in spk_b_samples:
            print(f'    • "{s}"')
        print()

        try:
            val_a = input(f"  Role/Name for SPEAKER_A [Current: {curr_a}]: ").strip()
            if val_a.lower() in ("q", "exit"):
                break
            name_a = val_a.upper() if val_a else curr_a

            val_b = input(f"  Role/Name for SPEAKER_B [Current: {curr_b}]: ").strip()
            if val_b.lower() in ("q", "exit"):
                break
            name_b = val_b.upper() if val_b else curr_b

            current_config[stem] = {
                "SPEAKER_A": name_a,
                "SPEAKER_B": name_b,
            }

            # Save after each step so progress is never lost
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(current_config, f, indent=2, ensure_ascii=False)

        except (KeyboardInterrupt, EOFError):
            print("\nExiting and saving current progress...")
            break

    # Final save
    config_path.parent.mkdir(parents=True, exist_ok=True)
    with open(config_path, "w", encoding="utf-8") as f:
        json.dump(current_config, f, indent=2, ensure_ascii=False)

    print("\n" + "=" * 65)
    print(f"Saved {len(current_config)} role configurations to '{config_path}'.")
    print("Re-run srt_to_jsonl.py to apply your assigned roles:")
    print("  python scripts/srt_to_jsonl.py")
    print("  python scripts/validate_jsonl.py data/subtitles_train.jsonl")
    print("=" * 65)


if __name__ == "__main__":
    main()
