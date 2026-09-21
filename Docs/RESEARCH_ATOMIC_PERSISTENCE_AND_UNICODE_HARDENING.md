# Grounded Technical Research: Atomic Persistence, Unicode Safety & Segment Sanitization

**Date:** 2026-09-21  
**Skills:** `/research`, `/ponytail`, `/adversarial-review`  
**Primary References:** Python Standard Library (`json`, `pathlib`, `os`), Microsoft Win32 File Management (`MoveFileExW`), Unicode Consortium Standard.

---

## 1. UTF-8 & Non-ASCII Unicode Serialization
- **Primary Source:** Python `json.dumps()` Specification.
- **The Finding:** `json.dumps(..., ensure_ascii=True)` (Python default) escapes all non-ASCII code points into surrogate pairs/ASCII hex (`\u0928\u092e\u0938\u094d\u0924\u0947`).
- **The Failure Mode:** When `KokoroTTSAdapter` reads the escaped ASCII string, the StyleTTS2 phonemizer processes backslashes and hex characters literally rather than parsing the Hindi Devanagari syllables.
- **The Grounded Fix:** Pass `ensure_ascii=False` explicitly to `json.dumps()` and write to disk with `encoding="utf-8"`.

```python
json_bytes = json.dumps(data, indent=2, ensure_ascii=False)
path.write_text(json_bytes, encoding="utf-8")
```

---

## 2. Directory Guard
- **Primary Source:** Python `pathlib.Path.mkdir(parents=True, exist_ok=True)`.
- **The Finding:** In standalone test environments, single-stage retries, or fresh job workers, the directory structure (`run_dir`) may not have been instantiated prior to stage execution.
- **The Grounded Fix:** Execute `run_dir.mkdir(parents=True, exist_ok=True)` at the entry point of `TranslationStage.execute()`.

---

## 3. Atomic Replacement on Windows NTFS (`MoveFileExW`)
- **Primary Source:** Microsoft Win32 API `MoveFileExW` with `MOVEFILE_REPLACE_EXISTING` & Python `os.replace`.
- **The Finding:** 
  1. `os.replace(src, dst)` on Windows executes `MoveFileExW` which guarantees an atomic directory entry swap if and only if `src` and `dst` reside on the same drive/volume.
  2. Standard `open("file.json", "w")` locks the file during buffer flush. If a client reads the file simultaneously (via `/api/v1/runs/{id}` or `preview-stream`), Windows raises `PermissionError: [WinError 32]`.
- **The Grounded Fix:** Create `.tmp.json` in the *same* `run_dir` directory, close the file handle completely, then call `os.replace()`.

```python
def _atomic_write_json(path: Path, data: Any) -> None:
    tmp = path.with_suffix(".tmp.json")
    tmp.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    os.replace(tmp, path)
```

---

## 4. Segment Schema Sanitization & Invariants
- **Primary Source:** `backend/app/engine/stages/tts.py` (`_build_localized_lines`) and `context.md`.
- **The Finding:** Downstream stages (`TTSStage`, `SyncEngineer`, `AcousticMasteringEngine`) require consistent numeric timestamps (`start_s`, `end_s`), integer `segment_id`, and guaranteed `translated_text`.
- **The Grounded Fix:** Before disk persistence, sanitize each segment in `qa_segments`:
  - `segment_id`: `int(seg.get("segment_id", idx + 1))`
  - `start_s`: `float(seg.get("start_s", 0.0))`
  - `end_s`: `float(seg.get("end_s", 0.0))`
  - `source_text`: `str(seg.get("source_text", ""))`
  - `translated_text`: `str(seg.get("translated_text") or seg.get("source_text", ""))`
  - `target_language`: `str(target_lang)`

---

## 5. Multi-Language Isolation vs Active State
- **Primary Source:** LOCALIZE Architecture Invariant `inv_010_translation_transcript_persistence`.
- **The Finding:** 
  - `transcript.json` is the active, hot state consumed by single-stage retries.
  - `transcript_{target_lang}.json` is the permanent, language-namespaced deliverable for multi-language export.
- **The Grounded Fix:** Atomically persist to both files.
