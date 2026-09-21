"""
Production Story Dataset Formatter for Qwen 2.5 Fine-Tuning (ShareGPT / ChatML)
Fixes all 4 critical edge cases discovered in Adversarial Review:
1. Natural Alphanumeric Sorting (Page 10 after Page 9, not Page 1)
2. Unicode NFKC Normalization (Full-width Japanese OCR cleaning)
3. Empty/Corrupted Bubble Filtering
4. Standard ShareGPT Multi-turn Conversation Format for Qwen SFT
"""

import json
import re
import unicodedata
from collections import defaultdict

INPUT_PATH = r"D:\Games\Hckthons\Side Projects\LocalizeAi\notebooks\dataset_v2.jsonl"
OUTPUT_PATH = r"D:\Games\Hckthons\Side Projects\LocalizeAi\notebooks\qwen_story_sharegpt.json"

def natural_sort_key(s: str):
    """Sort strings with numbers naturally: ['1', '2', '10'] instead of ['1', '10', '2']."""
    return [int(text) if text.isdigit() else text.lower() for text in re.split(r"(\d+)", str(s))]

def normalize_ocr(text: str) -> str:
    """Normalize fullwidth OCR characters, strip junk glyphs, and collapse whitespace."""
    if not text:
        return ""
    # Unicode NFKC: Converts full-width numbers/letters to standard half-width
    text = unicodedata.normalize("NFKC", str(text))
    # Replace unicode replacement characters and tabs
    text = text.replace("\ufffd", "").replace("\t", " ")
    # Collapse multiple whitespace/newlines
    text = re.sub(r"\s+", " ", text)
    return text.strip()

def process_dataset():
    scenes = defaultdict(list)
    total_lines = 0
    valid_bubbles = 0

    print(f"Reading: {INPUT_PATH}")
    with open(INPUT_PATH, "r", encoding="utf-8", errors="replace") as f:
        for line in f:
            total_lines += 1
            line = line.strip()
            if not line:
                continue
            try:
                item = json.loads(line)
            except Exception:
                continue

            manga_id = item.get("manga_id", "Unknown_Manga")
            raw_page = item.get("page_number") if item.get("page_number") is not None else item.get("page", 0)
            
            try:
                region_idx = int(item.get("region_index", 0))
            except (ValueError, TypeError):
                region_idx = 0

            en_text = normalize_ocr(item.get("en_text_detected", ""))
            jp_text = normalize_ocr(item.get("jp_ocr_text") or item.get("jp_text_detected", ""))

            # Filter out empty bubbles, single digit page numbers, or noise
            if not en_text or len(en_text) <= 1 and en_text.isdigit():
                continue

            valid_bubbles += 1
            key = (str(manga_id), str(raw_page))
            scenes[key].append({
                "region": region_idx,
                "en": en_text,
                "jp": jp_text
            })

    # Sort mangas and pages naturally
    sorted_scene_keys = sorted(scenes.keys(), key=lambda k: (k[0], natural_sort_key(k[1])))
    
    dataset_records = []

    for manga_id, page_id in sorted_scene_keys:
        bubbles = scenes[(manga_id, page_id)]
        # Sort bubbles inside the page by region reading order
        bubbles.sort(key=lambda b: b["region"])

        # Require at least 2 dialogue exchanges for a meaningful narrative scene
        if len(bubbles) < 2:
            continue

        # Build multi-turn ShareGPT conversation for Qwen
        dialogue_turns = []
        dialogue_text = "\n".join([f"Speaker {i+1}: \"{b['en']}\"" for i, b in enumerate(bubbles)])
        
        # Turn 1: Scene presentation and story analysis
        dialogue_turns.append({
            "from": "human",
            "value": f"Analyze the story beat and character dialogue for Manga: {manga_id}, Page {page_id}.\n\nDialogue:\n{dialogue_text}"
        })
        dialogue_turns.append({
            "from": "gpt",
            "value": f"In Page {page_id} of {manga_id}, the dialogue unfolds across {len(bubbles)} exchanges:\n{dialogue_text}\n\nThe characters establish scene progression through sequential dialogue."
        })

        dataset_records.append({
            "system": "You are a professional manga narrative and dialogue understanding AI.",
            "conversations": dialogue_turns,
            "metadata": {
                "manga_id": manga_id,
                "page": page_id,
                "bubble_count": len(bubbles)
            }
        })

    with open(OUTPUT_PATH, "w", encoding="utf-8") as out:
        json.dump(dataset_records, out, ensure_ascii=False, indent=2)

    print(f"Total raw lines: {total_lines}")
    print(f"Valid bubbles kept: {valid_bubbles}")
    print(f"Generated {len(dataset_records)} multi-turn story training samples in {OUTPUT_PATH}")

if __name__ == "__main__":
    process_dataset()
