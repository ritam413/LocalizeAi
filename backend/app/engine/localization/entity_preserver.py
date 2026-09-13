import re
from typing import List, Dict, Tuple, Optional, Set

# Curated catalog of tech frameworks, platforms, brands, and domain names
KNOWN_TECH_AND_BRAND_ENTITIES = {
    "Claude Code",
    "Claude",
    "Anthropic",
    "OpenAI",
    "ChatGPT",
    "GitHub",
    "Supabase",
    "Zenith Chat",
    "Afan Mustafa",
    "Playwright",
    "Vitest",
    "Pytest",
    "FFmpeg",
    "Demucs",
    "Faster-Whisper",
    "Whisper",
    "Silero",
    "Grafana",
    "Docker",
    "Next.js",
    "React",
    "TypeScript",
    "Python",
    "FastAPI",
    "SQLite",
    "PostgreSQL",
    "Google Cloud",
    "Gemini",
    "YouTube",
    "Netflix",
    "Localize",
}

# Common English sentence starters and grammatical words to exclude from generic capitalized noun extraction
COMMON_STOPWORDS = {
    "The", "A", "An", "And", "Or", "But", "If", "When", "Why", "How", "What", "Who", "Where",
    "We", "You", "He", "She", "They", "It", "I", "My", "Your", "Our", "Their", "His", "Her",
    "This", "That", "These", "Those", "There", "Here", "Is", "Are", "Was", "Were", "Be", "Been",
    "Do", "Does", "Did", "Have", "Has", "Had", "Don't", "Doesn't", "Didn't", "Won't", "Can't",
    "Will", "Would", "Shall", "Should", "Can", "Could", "May", "Might", "Must", "Let", "Let's",
    "No", "Not", "Yes", "So", "Just", "Also", "Now", "Then", "After", "Before", "While", "In", "On", "At"
}

def extract_proper_nouns(text: str, custom_entities: Optional[List[str]] = None) -> List[str]:
    """
    Extracts proper nouns, tech brand names, product titles, and developer tools from source text.
    Prioritizes explicit glossary locks and multi-word names.
    """
    if not text or not text.strip():
        return []

    found_entities: List[str] = []
    seen_lower: Set[str] = set()

    # 1. Check custom entities & glossary locks first
    if custom_entities:
        for ent in sorted(custom_entities, key=len, reverse=True):
            if ent and ent.strip():
                clean_ent = ent.strip()
                pattern = re.compile(rf'\b{re.escape(clean_ent)}\b', re.IGNORECASE)
                if pattern.search(text) and clean_ent.lower() not in seen_lower:
                    found_entities.append(clean_ent)
                    seen_lower.add(clean_ent.lower())

    # 2. Check curated domain catalog (sorted by length descending so "Claude Code" matches before "Claude")
    for ent in sorted(KNOWN_TECH_AND_BRAND_ENTITIES, key=len, reverse=True):
        pattern = re.compile(rf'\b{re.escape(ent)}\b', re.IGNORECASE)
        match = pattern.search(text)
        if match and ent.lower() not in seen_lower:
            # Check that it is not a substring of an already matched longer entity
            matched_text = match.group(0)
            if not any(matched_text.lower() in existing.lower() for existing in found_entities):
                found_entities.append(ent)
                seen_lower.add(ent.lower())

    # 3. Detect capitalized multi-word sequences or CamelCase words (e.g. "Afan Mustafa", "DubForge")
    # Matches words starting with an uppercase letter
    title_matches = re.finditer(r'\b[A-Z][a-zA-Z0-9_.-]+(?:\s+[A-Z][a-zA-Z0-9_.-]+)*\b', text)
    for m in title_matches:
        candidate = m.group(0).strip()
        words = candidate.split()
        # If single word is a common stopword, skip
        if len(words) == 1 and candidate in COMMON_STOPWORDS:
            continue
        # If multi-word starts with a stopword (e.g. "The Guardian" -> "Guardian" or skip "We shipped")
        if candidate.lower() not in seen_lower:
            # Verify it's not already covered
            if not any(candidate.lower() in existing.lower() for existing in found_entities):
                found_entities.append(candidate)
                seen_lower.add(candidate.lower())

    return found_entities

def protect_entities(text: str, entities: List[str]) -> Tuple[str, Dict[str, str]]:
    """
    Masks proper nouns in source text with temporary placeholders (__ENT_0__, __ENT_1__)
    to protect them during translation passes.
    """
    if not text or not entities:
        return text, {}

    entity_map: Dict[str, str] = {}
    masked_text = text

    # Sort entities by length descending to replace longest matches first
    sorted_entities = sorted(entities, key=len, reverse=True)

    for idx, ent in enumerate(sorted_entities):
        placeholder = f"__ENT_{idx}__"
        entity_map[placeholder] = ent
        pattern = re.compile(rf'\b{re.escape(ent)}\b', re.IGNORECASE)
        masked_text = pattern.sub(placeholder, masked_text)

    return masked_text, entity_map

def restore_entities(text: str, entity_map: Dict[str, str]) -> str:
    """
    Restores original proper noun entities from placeholders in the translated text.
    """
    if not text or not entity_map:
        return text

    restored_text = text
    for placeholder, original_entity in entity_map.items():
        restored_text = restored_text.replace(placeholder, original_entity)

    return restored_text
