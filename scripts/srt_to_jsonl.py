#!/usr/bin/env python3
"""
scripts/srt_to_jsonl.py
-----------------------
Local Subtitle Dataset Preparation Pipeline for Fine-Tuning Qwen2.5-3B.

Features:
1. Discovers and parses all .srt files in a folder sequentially.
2. Applies Humanizer cleaning rules (removes filler words, collapses stutters,
   fixes punctuation, strips sound effects and HTML formatting).
3. Hybrid character assignment:
   - Priority 1: Manual CSV mapping (data/subtitles/character_maps/<filename>.csv)
   - Priority 2: Heuristic speaker diarization based on silence gaps & conversational cues.
4. Generates sliding-window context chunks with sequential file ordering
   (sub1/chunk_0, sub1/chunk_1 ... sub2/chunk_0 ...).
5. Emits ChatML-formatted JSONL ready for Unsloth SFT training.
"""

import argparse
import csv
import json
import os
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple


@dataclass
class SubtitleLine:
    index: int
    start_ms: int
    end_ms: int
    start_str: str
    end_str: str
    raw_text: str
    cleaned_text: str = ""
    character: str = ""


# ==============================================================================
# 1. TIME PARSING UTILITIES
# ==============================================================================

def srt_time_to_ms(time_str: str) -> int:
    """Converts '00:01:23,456' or '00:01:23.456' to milliseconds."""
    time_str = time_str.strip().replace(",", ".")
    parts = time_str.split(":")
    if len(parts) == 3:
        hours = float(parts[0])
        minutes = float(parts[1])
        seconds = float(parts[2])
        return int((hours * 3600 + minutes * 60 + seconds) * 1000)
    return 0


def format_timestamp(time_str: str) -> str:
    """Standardizes timestamp to HH:MM:SS format for compact prompting."""
    clean = time_str.replace(",", ".").split(".")[0].strip()
    return clean


# ==============================================================================
# 2. ROBUST SRT PARSER (ZERO-DEPENDENCY WITH FALLBACK)
# ==============================================================================

def parse_srt_file(filepath: Path) -> List[SubtitleLine]:
    """Parses an SRT file into a list of SubtitleLine objects."""
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    content = ""
    for enc in encodings:
        try:
            with open(filepath, "r", encoding=enc) as f:
                content = f.read()
            break
        except (UnicodeDecodeError, FileNotFoundError):
            continue

    if not content:
        return []

    # Regex for standard SRT subtitle block
    pattern = re.compile(
        r"(?:(\d+)\s*\r?\n)?"  # Optional subtitle index number
        r"(\d{1,2}:\d{2}:\d{2}[,\.]\d{1,3})\s*-->\s*(\d{1,2}:\d{2}:\d{2}[,\.]\d{1,3})\s*\r?\n"
        r"([\s\S]*?)(?=\r?\n\r?\n|\Z)",
        re.MULTILINE,
    )

    lines: List[SubtitleLine] = []
    idx = 1
    for match in pattern.finditer(content):
        _, start_str, end_str, text = match.groups()
        cleaned_raw = " ".join(text.strip().splitlines())
        if not cleaned_raw:
            continue

        start_ms = srt_time_to_ms(start_str)
        end_ms = srt_time_to_ms(end_str)

        lines.append(
            SubtitleLine(
                index=idx,
                start_ms=start_ms,
                end_ms=end_ms,
                start_str=format_timestamp(start_str),
                end_str=format_timestamp(end_str),
                raw_text=cleaned_raw,
            )
        )
        idx += 1

    return lines


# ==============================================================================
# 3. HUMANIZER CLEANING ENGINE
# ==============================================================================

class HumanizerCleaner:
    """
    Cleans raw dialogue using /humanizer and speech disfluency rules:
    - Strips HTML tags, musical notes, and sound effects
    - Strips conversational filler words ('um', 'uh', 'er', 'ah', etc.)
    - Collapses stutters & duplicate words ('the the', 'I I')
    - Fixes run-on sentences & normalizes punctuation
    - Preserves domain terminology & proper nouns
    """

    # Non-speech sound cues: [Applause], (Laughter), *sigh*, ♪ music ♪
    SFX_REGEX = re.compile(r"(\[.*?\]|\(.*?\)|[\*#♪♫].*?[\*#♪♫])", re.IGNORECASE)

    # HTML tags
    HTML_REGEX = re.compile(r"<[^>]+>")

    # Filler disfluencies at start or word boundaries
    FILLER_REGEX = re.compile(
        r"\b(?:um+|uh+|erm?|ahh?|like,\s*you\s*know|you\s*know,\s*like)\b",
        re.IGNORECASE,
    )

    # Repeated words / stutters (e.g. "we we", "the the", "I I")
    STUTTER_REGEX = re.compile(r"\b([a-zA-Z]+)\s+\1\b", re.IGNORECASE)

    @classmethod
    def clean(cls, text: str) -> str:
        if not text:
            return ""

        # 1. Strip HTML tags and subtitle markup
        res = cls.HTML_REGEX.sub("", text)

        # 2. Strip non-dialogue audio annotations [Music], (Laughter)
        res = cls.SFX_REGEX.sub("", res)

        # 3. Remove leading dialogue dashes or bullet symbols (e.g. "- Hello", ">> Next")
        res = re.sub(r"^[\s\-\–\—\>]+", "", res)

        # 4. Remove filler words
        res = cls.FILLER_REGEX.sub("", res)

        # 5. Collapse duplicate stutters (repeat twice to catch triplicates)
        res = cls.STUTTER_REGEX.sub(r"\1", res)
        res = cls.STUTTER_REGEX.sub(r"\1", res)

        # 6. Normalize whitespace
        res = re.sub(r"\s+", " ", res).strip()

        # 7. Normalize punctuation spacing (e.g., "word , another" -> "word, another")
        res = re.sub(r"\s+([,\.!\?;:])", r"\1", res)

        # 7b. Fix punctuation collisions caused by stripping filler words (e.g. ".,", ",,", ".,")
        res = re.sub(r"[\.,;:!\?]\s*,", ",", res)
        res = re.sub(r",\s*\.", ".", res)
        res = re.sub(r",\s*,+", ",", res)
        res = re.sub(r"\.\s*\.+", ".", res)

        # 8. Ensure sentence starts with a capital letter
        if res and len(res) > 1:
            res = res[0].upper() + res[1:]

        # 9. Ensure sentence ends with valid punctuation if complete
        if res and res[-1] not in ".!?\",'":
            res = res + "."

        return res


# ==============================================================================
# 4. HYBRID CHARACTER ASSIGNMENT ENGINE
# ==============================================================================

class CharacterAssigner:
    """
    Assigns characters using a hybrid approach:
    1. CSV file override (line-range mapping)
    2. Heuristic speaker diarization (silence gaps + turn-taking cues)
    """

    def __init__(
        self,
        maps_dir: Optional[Path] = None,
        config_path: Optional[Path] = None,
        pause_threshold_ms: int = 1800,
    ):
        self.maps_dir = maps_dir
        self.config_path = config_path
        self.pause_threshold_ms = pause_threshold_ms
        self.alias_config: Dict[str, Dict[str, str]] = self._load_config()

    def _load_config(self) -> Dict[str, Dict[str, str]]:
        """Loads optional character_config.json mapping filenames to speaker aliases."""
        if not self.config_path or not self.config_path.exists():
            return {}
        try:
            with open(self.config_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"  [Warning] Could not load alias config {self.config_path}: {e}")
            return {}

    def load_csv_map(self, srt_name: str) -> Dict[int, str]:
        """Loads optional manual CSV map (format: start_line,end_line,character_name)."""
        mapping: Dict[int, str] = {}
        if not self.maps_dir:
            return mapping

        csv_path = self.maps_dir / f"{srt_name}.csv"
        if not csv_path.exists():
            return mapping

        try:
            with open(csv_path, "r", encoding="utf-8") as f:
                reader = csv.reader(f)
                for row in reader:
                    if len(row) >= 3 and not row[0].startswith("#"):
                        try:
                            s = int(row[0].strip())
                            e = int(row[1].strip())
                            char = row[2].strip().upper()
                            for line_num in range(s, e + 1):
                                mapping[line_num] = char
                        except ValueError:
                            continue
        except Exception as e:
            print(f"  [Warning] Could not load character map {csv_path}: {e}")

        return mapping

    def assign(self, lines: List[SubtitleLine], srt_name: str) -> None:
        csv_map = self.load_csv_map(srt_name)
        aliases = self.alias_config.get(srt_name, self.alias_config.get("default", {}))

        current_speaker_idx = 0
        speakers = ["SPEAKER_A", "SPEAKER_B", "SPEAKER_C"]

        for i, line in enumerate(lines):
            # Check manual CSV override first
            if line.index in csv_map:
                line.character = csv_map[line.index]
                continue

            # Check if line already has an explicit speaker prefix (e.g. "JOHN: hello")
            match = re.match(r"^([A-Za-z][A-Za-z0-9_\s]{1,15}):\s*(.*)$", line.raw_text)
            if match and not re.match(r"^\d+:\d+", line.raw_text):
                line.character = match.group(1).strip().upper()
                line.raw_text = match.group(2).strip()
                continue

            # Heuristic Diarization
            if i == 0:
                line.character = speakers[current_speaker_idx]
            else:
                prev_line = lines[i - 1]
                gap = line.start_ms - prev_line.end_ms

                # Significant pause detected between lines -> likely speaker transition
                if gap >= self.pause_threshold_ms:
                    current_speaker_idx = (current_speaker_idx + 1) % 2
                elif prev_line.cleaned_text.endswith("?") and not line.cleaned_text.endswith("?"):
                    current_speaker_idx = (current_speaker_idx + 1) % 2

                line.character = speakers[current_speaker_idx]

            # Apply alias override if available (e.g. SPEAKER_A -> JAZMINE)
            if line.character in aliases:
                line.character = aliases[line.character].strip().upper()


# ==============================================================================
# 5. CHUNK GENERATION & CHATML FORMATTING
# ==============================================================================

SYSTEM_PROMPT = (
    "You are a cinematic script writer. Given raw subtitle dialogue with timestamps "
    "and character tags from a video scene, rewrite it as clean, natural, movie-grade "
    "script dialogue. Fix punctuation, remove speech disfluencies, maintain character "
    "voice consistency, preserve emotional tone, and output dialogue that reads like a "
    "professional screenplay."
)


def create_chunks(
    lines: List[SubtitleLine],
    srt_stem: str,
    chunk_size: int = 6,
    overlap: int = 2,
) -> List[dict]:
    """
    Creates overlapping sliding-window dialogue chunks and formats them into
    ChatML messages compatible with Unsloth / Hugging Face SFTTrainer.
    """
    chunks = []
    step = max(1, chunk_size - overlap)
    total_lines = len(lines)

    for start_idx in range(0, total_lines, step):
        chunk_slice = lines[start_idx : start_idx + chunk_size]
        if len(chunk_slice) < 2:
            continue

        # Format User Input (raw subtitle stream with timestamps & speaker tags)
        user_lines = [f"[Source: {srt_stem}]"]
        for line in chunk_slice:
            raw = line.raw_text.strip()
            user_lines.append(
                f"[{line.character}] [{line.start_str} --> {line.end_str}] {raw}"
            )
        user_content = "\n".join(user_lines)

        # Format Assistant Target (clean screenplay dialogue)
        assistant_dialogues = []
        last_speaker = None
        current_speech = []

        for line in chunk_slice:
            clean = line.cleaned_text.strip()
            if not clean:
                continue

            if line.character != last_speaker:
                if last_speaker and current_speech:
                    assistant_dialogues.append(
                        f"{last_speaker}: {' '.join(current_speech)}"
                    )
                    current_speech = []
                last_speaker = line.character

            current_speech.append(clean)

        if last_speaker and current_speech:
            assistant_dialogues.append(f"{last_speaker}: {' '.join(current_speech)}")

        assistant_content = "\n\n".join(assistant_dialogues)

        # Build ChatML record
        chunk_id = f"{srt_stem}/chunk_{len(chunks)}"
        record = {
            "id": chunk_id,
            "messages": [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_content},
                {"role": "assistant", "content": assistant_content},
            ],
        }
        chunks.append(record)

    return chunks


# ==============================================================================
# 6. MAIN PIPELINE EXECUTION
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Convert SRT subtitle folder to Unsloth ChatML JSONL dataset."
    )
    parser.add_argument(
        "--input",
        "-i",
        type=str,
        default="data/subtitles",
        help="Input folder containing .srt files (default: data/subtitles)",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=str,
        default="data/subtitles_train.jsonl",
        help="Output .jsonl path (default: data/subtitles_train.jsonl)",
    )
    parser.add_argument(
        "--chunk-size",
        type=int,
        default=6,
        help="Number of subtitle lines per context chunk (default: 6)",
    )
    parser.add_argument(
        "--overlap",
        type=int,
        default=2,
        help="Number of overlapping lines between consecutive chunks (default: 2)",
    )
    parser.add_argument(
        "--pause-threshold",
        type=int,
        default=1800,
        help="Silence gap in ms for heuristic speaker change (default: 1800ms)",
    )
    parser.add_argument(
        "--config",
        "-c",
        type=str,
        default=None,
        help="Optional JSON config file mapping filenames to character aliases (default: <input>/character_config.json)",
    )

    args = parser.parse_args()

    input_dir = Path(args.input)
    output_path = Path(args.output)
    maps_dir = input_dir / "character_maps"
    config_path = Path(args.config) if args.config else (input_dir / "character_config.json")

    if not input_dir.exists():
        input_dir.mkdir(parents=True, exist_ok=True)
        print(f"Created input directory: {input_dir}")
        print(f"Please place your .srt files in '{input_dir}' and re-run.")
        return

    srt_files = sorted(list(input_dir.glob("*.srt")))
    if not srt_files:
        print(f"No .srt files found in '{input_dir}'.")
        print("Tip: Add subtitle files to start dataset generation.")
        return

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")

    print("=" * 65)
    print("LOCAL SUBTITLE DATASET PREPARATION PIPELINE")
    print("=" * 65)
    print(f"Found {len(srt_files)} SRT files in '{input_dir}'")
    print(f"Output target: '{output_path}'")
    print(f"Chunk size: {args.chunk_size} lines (Overlap: {args.overlap} lines)")
    if config_path.exists():
        print(f"Character Aliases: Loaded from '{config_path}'")
    print("-" * 65)

    assigner = CharacterAssigner(
        maps_dir=maps_dir if maps_dir.exists() else None,
        config_path=config_path if config_path.exists() else None,
        pause_threshold_ms=args.pause_threshold,
    )

    output_path.parent.mkdir(parents=True, exist_ok=True)
    all_chunks = []
    total_raw_lines = 0

    for srt_path in srt_files:
        stem = srt_path.stem
        lines = parse_srt_file(srt_path)
        if not lines:
            print(f"  [SKIP] Skipping empty or unparseable: {srt_path.name}")
            continue

        total_raw_lines += len(lines)

        # 1. Humanize & clean dialogue
        for line in lines:
            line.cleaned_text = HumanizerCleaner.clean(line.raw_text)

        # 2. Assign characters (Hybrid: CSV + Heuristics)
        assigner.assign(lines, stem)

        # 3. Form sliding-window context chunks
        chunks = create_chunks(
            lines,
            stem,
            chunk_size=args.chunk_size,
            overlap=args.overlap,
        )
        all_chunks.extend(chunks)

        print(f"  [OK] {srt_path.name:32} -> {len(lines):4} lines -> {len(chunks):3} chunks")

    # Write out JSONL file
    with open(output_path, "w", encoding="utf-8") as f:
        for chunk in all_chunks:
            f.write(json.dumps(chunk, ensure_ascii=False) + "\n")

    print("-" * 65)
    print("DATASET GENERATION COMPLETE")
    print(f"  Total SRT files processed:   {len(srt_files)}")
    print(f"  Total raw subtitle lines:    {total_raw_lines}")
    print(f"  Total ChatML training chunks: {len(all_chunks)}")
    print(f"  Saved to:                    {output_path.resolve()}")
    print("=" * 65)
    print(f"Next step: Run 'python scripts/validate_jsonl.py {output_path}'")


if __name__ == "__main__":
    main()
