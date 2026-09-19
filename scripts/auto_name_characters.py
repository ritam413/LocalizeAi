#!/usr/bin/env python3
"""
scripts/auto_name_characters.py
-------------------------------
Automatically assigns distinct character names to each subtitle file.

Supports:
1. Sequential Mode (--mode sequential):
   Assigns unique sequential speakers across every file:
   - Subtitle 1: [SPEAKER_A, SPEAKER_B]
   - Subtitle 2: [SPEAKER_C, SPEAKER_D]
   - Subtitle 3: [SPEAKER_E, SPEAKER_F]
   - Subtitle 4: [SPEAKER_G, SPEAKER_H] ...
   Ensures no two files share the same generic speaker names!

2. Filename Extraction Mode (--mode filename):
   Parses actor and character names directly from the subtitle filename
   (e.g., "Cassie and Christian" -> CASSIE, CHRISTIAN; "Jazmine Cruz" -> JAZMINE, PARTNER).

3. Hybrid Mode (--mode hybrid, default):
   Extracts real names from the filename if found; otherwise falls back to unique
   sequential letters (SPEAKER_A, SPEAKER_B, etc.).

Saves output directly to 'data/subtitles/character_config.json' and can optionally
re-run srt_to_jsonl.py automatically!
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Tuple


def get_letter_tag(n: int) -> str:
    """Converts 0 -> A, 1 -> B, 25 -> Z, 26 -> AA, 27 -> AB, etc."""
    result = []
    div = n
    while div >= 0:
        result.append(chr(65 + (div % 26)))
        div = (div // 26) - 1
    return "".join(reversed(result))


# Common noise words found in torrent/video subtitle filenames to ignore
NOISE_WORDS = {
    "cuck4k", "wifey", "puretaboo", "pure", "taboo", "eporner", "com", "xxx", "1080p",
    "720p", "hevc", "x265", "x264", "en", "srt", "rq", "fullporn", "to", "ex", "bbc",
    "hd", "free", "porn", "videos", "sex", "movies", "hot", "tube", "youperv", "stunning",
    "blonde", "hotwife", "gets", "fucked", "by", "another", "man", "while", "hubby", "watches",
    "loses", "her", "mind", "for", "two", "cocks", "in", "front", "of", "gorgeous", "cowgirl",
    "reveals", "face", "first", "time", "perfect", "wife", "takes", "12", "inches", "confident",
    "performs", "married", "massive", "black", "cock", "reunion", "hotwives", "return", "ultimate",
    "orgy", "what", "she", "would", "have", "wanted", "arabic", "subtitles", "god", "help", "me",
    "nothing", "wont", "stoop", "under", "bed", "manhood", "funky", "town", "knock", "at", "cabinet",
    "eat", "pray", "fuck", "swinging", "misery", "comrades", "czech", "confesses", "lustfu",
    "interracial", "stepfamily", "prt", "zh", "zh_zh", "mp4", "mkv", "hungry", "creampied",
    "720", "xfans", "my", "the"
}


def clean_token(token: str) -> str:
    return re.sub(r"[^a-zA-Z]", "", token).strip()


def extract_names_from_filename(filename: str) -> List[str]:
    """Extracts candidate character/actor names from subtitle filename."""
    stem = Path(filename).stem

    # Pattern 1: Check for explicit "X and Y" or "X & Y"
    and_match = re.search(r"([A-Za-z]+)\s+(?:and|&)\s+([A-Za-z]+)", stem, re.IGNORECASE)
    if and_match:
        cand1 = clean_token(and_match.group(1)).upper()
        cand2 = clean_token(and_match.group(2)).upper()
        if cand1.lower() not in NOISE_WORDS and cand2.lower() not in NOISE_WORDS:
            return [cand1, cand2]

    # Pattern 2: Tokenize and filter out noise
    raw_tokens = re.split(r"[-_\.\s\(\)\[\],]+", stem)
    clean_tokens = [clean_token(t) for t in raw_tokens if clean_token(t)]
    meaningful = [
        t for t in clean_tokens if t.lower() not in NOISE_WORDS and len(t) > 2 and not t.isdigit()
    ]

    names = []
    i = 0
    while i < len(meaningful):
        if i + 1 < len(meaningful):
            # Form First_Last name if consecutive
            names.append(f"{meaningful[i]}_{meaningful[i+1]}".upper())
            i += 2
        else:
            names.append(meaningful[i].upper())
            i += 1

    return names


def main():
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(
        description="Auto-assign distinct character roles based on filename or sequential letters."
    )
    parser.add_argument(
        "--input",
        "-i",
        type=str,
        default="data/subtitles",
        help="Folder containing .srt files (default: data/subtitles)",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="data/subtitles/character_config.json",
        help="Output character config JSON path (default: data/subtitles/character_config.json)",
    )
    parser.add_argument(
        "--mode",
        "-m",
        choices=["sequential", "filename", "hybrid"],
        default="sequential",
        help=(
            "Naming mode: "
            "'sequential' (sub1 -> [SPEAKER_A, SPEAKER_B], sub2 -> [SPEAKER_C, SPEAKER_D]), "
            "'filename' (extracts real names from title), "
            "'hybrid' (real names when found, sequential fallback). Default: sequential."
        ),
    )
    parser.add_argument(
        "--apply",
        "-a",
        action="store_true",
        help="Automatically re-run srt_to_jsonl.py and validate_jsonl.py after updating config.",
    )

    args = parser.parse_args()
    input_dir = Path(args.input)
    output_path = Path(args.output)

    if not input_dir.exists():
        print(f"[ERROR] Directory '{input_dir}' does not exist.")
        return

    srt_files = sorted(list(input_dir.glob("*.srt")))
    if not srt_files:
        print(f"[ERROR] No .srt files found in '{input_dir}'.")
        return

    print("=" * 65)
    print("AUTOMATIC CHARACTER ROLE ASSIGNER")
    print("=" * 65)
    print(f"Found:        {len(srt_files)} SRT files in '{input_dir}'")
    print(f"Mode:         {args.mode.upper()}")
    print(f"Output File:  '{output_path}'")
    print("-" * 65)

    config_data: Dict[str, Dict[str, str]] = {}
    speaker_letter_counter = 0

    for idx, srt in enumerate(srt_files):
        stem = srt.stem

        if args.mode == "sequential":
            # Exactly user's rule: sub1 -> A,B; sub2 -> C,D; sub3 -> E,F
            tag_a = f"SPEAKER_{get_letter_tag(speaker_letter_counter)}"
            tag_b = f"SPEAKER_{get_letter_tag(speaker_letter_counter + 1)}"
            speaker_letter_counter += 2

        elif args.mode == "filename":
            # Extract names from filename
            names = extract_names_from_filename(srt.name)
            if len(names) >= 2:
                tag_a, tag_b = names[0], names[1]
            elif len(names) == 1:
                tag_a = names[0]
                tag_b = f"{names[0]}_PARTNER"
            else:
                tag_a = f"SPEAKER_{get_letter_tag(speaker_letter_counter)}"
                tag_b = f"SPEAKER_{get_letter_tag(speaker_letter_counter + 1)}"
                speaker_letter_counter += 2

        elif args.mode == "hybrid":
            # Try filename extraction first; fallback to sequential
            names = extract_names_from_filename(srt.name)
            if len(names) >= 2:
                tag_a, tag_b = names[0], names[1]
            elif len(names) == 1:
                tag_a = names[0]
                tag_b = f"SPEAKER_{get_letter_tag(speaker_letter_counter + 1)}"
                speaker_letter_counter += 2
            else:
                tag_a = f"SPEAKER_{get_letter_tag(speaker_letter_counter)}"
                tag_b = f"SPEAKER_{get_letter_tag(speaker_letter_counter + 1)}"
                speaker_letter_counter += 2

        config_data[stem] = {
            "SPEAKER_A": tag_a,
            "SPEAKER_B": tag_b,
        }

        print(f"  [{idx+1:2d}/{len(srt_files)}] {srt.name[:35]:35} -> [{tag_a}, {tag_b}]")

    # Save out the config
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(config_data, f, indent=2, ensure_ascii=False)

    print("-" * 65)
    print(f"Saved {len(config_data)} character configurations to '{output_path}'.")
    print("=" * 65)

    if args.apply:
        print("\nRe-generating dataset with updated character assignments...")
        import subprocess

        cmd_gen = [
            sys.executable,
            "scripts/srt_to_jsonl.py",
            "--input",
            str(input_dir),
            "--output",
            "data/subtitles_train.jsonl",
            "--config",
            str(output_path),
        ]
        res = subprocess.run(cmd_gen)

        cmd_val = [
            sys.executable,
            "scripts/validate_jsonl.py",
            "data/subtitles_train.jsonl",
        ]
        subprocess.run(cmd_val)
    else:
        print("\nNext: Re-generate and validate your dataset:")
        print("  python scripts/srt_to_jsonl.py")
        print("  python scripts/validate_jsonl.py data/subtitles_train.jsonl")


if __name__ == "__main__":
    main()
