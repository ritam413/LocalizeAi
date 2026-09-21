# Hindi TTS Localization & Stem Persistence Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ensure Hindi dialogue translations persist to disk (`transcript.json`), rehydrate synthesized and aligned audio stem metadata across pipeline stages and retries in `RunExecutor`, preserve segment timeline bounds in `VoiceDirectorAgent`, and fix preview streaming for deliverable file objects.

**Architecture:** 
1. `TranslationStage` will persist translated dialogue segments with `translated_text` and `target_language` to `transcript.json` and `transcript_{lang}.json`.
2. `TTSStage` and `VoiceDirectorAgent` will write `stems.json` and preserve `start_s` and `end_s` timeline positions.
3. `RunExecutor` will automatically rehydrate `synthesized_stems` and `aligned_stems` from disk manifests or scan directories on stage retries.
4. `mediaTrackHelpers.ts` will safely unwrap deliverable file objects (`{ relative_path: "..." }`) preventing `[object Object]` 404 streaming errors.

**Tech Stack:** Python 3.10+, FastAPI, PyTorch / Kokoro-82M, TypeScript, Next.js 16, Vitest, Pytest.

## Global Constraints
- Target Audio Standard: 24,000 Hz, 16-bit PCM mono WAV.
- Zero-Pill Geometry: All UI buttons/badges strictly 4px radius.
- Resumability Guarantee: Any pipeline stage must be safely retryable from disk artifacts without recalculating prior stages.

---

### Task 1: Translation Stage Disk Persistence (`transcript.json`)

**Files:**
- Modify: `backend/app/engine/stages/translation.py:280-310`
- Test: `backend/tests/test_translation_persistence.py`

**Interfaces:**
- Consumes: `raw_segments: List[Dict[str, Any]]`, `target_lang: str`
- Produces: `transcript.json` containing `translated_text` alongside `source_text`, and `subtitles_{target_lang}.srt/.vtt`

#### Existing Code Slice (`backend/app/engine/stages/translation.py:286-309`):
```python
        # Write output files
        srt_content = format_srt(qa_segments)
        vtt_content = format_vtt(qa_segments)

        srt_path = run_dir / f"subtitles_{target_lang}.srt"
        vtt_path = run_dir / f"subtitles_{target_lang}.vtt"

        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        with open(vtt_path, "w", encoding="utf-8") as f:
            f.write(vtt_content)

        await log_cb("INFO", f"Saved final subtitle files: {srt_path.name}, {vtt_path.name}")
        await progress_cb(100.0, "Translation & subtitle formatting complete")

        return {
            "status": "success",
            "segments": qa_segments,
            "artifacts": [
                {"type": "subtitle", "label": f"Subtitles ({target_lang.upper()} SRT)", "path": str(srt_path)},
                {"type": "subtitle", "label": f"Subtitles ({target_lang.upper()} VTT)", "path": str(vtt_path)}
            ]
        }
```

- [ ] **Step 1: Write the failing unit test**

Create `backend/tests/test_translation_persistence.py`:
```python
import json
import pytest
from pathlib import Path
from app.engine.stages.translation import TranslationStage

@pytest.mark.asyncio
async def test_translation_stage_persists_transcript_json_with_translated_text(tmp_path):
    stage = TranslationStage()
    input_artifacts = {
        "segments": [
            {"segment_id": 1, "start_s": 0.0, "end_s": 2.0, "source_text": "Hello world"}
        ]
    }
    config = {
        "run_dir": str(tmp_path),
        "target_language": "hi",
        "stub_mode": True
    }

    async def noop_progress(pct, msg): pass
    async def noop_log(lvl, msg): pass

    res = await stage.execute(input_artifacts, config, noop_progress, noop_log)
    assert res["status"] == "success"

    transcript_file = tmp_path / "transcript.json"
    assert transcript_file.exists(), "transcript.json must be written to run_dir"
    
    saved_data = json.loads(transcript_file.read_text(encoding="utf-8"))
    assert len(saved_data) == 1
    assert "translated_text" in saved_data[0]
    assert saved_data[0]["translated_text"] != ""
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_translation_persistence.py -v`
Expected: FAIL (`AssertionError: transcript.json must be written to run_dir`)

- [ ] **Step 3: Update `backend/app/engine/stages/translation.py`**

```python
        # Write output files
        srt_content = format_srt(qa_segments)
        vtt_content = format_vtt(qa_segments)

        srt_path = run_dir / f"subtitles_{target_lang}.srt"
        vtt_path = run_dir / f"subtitles_{target_lang}.vtt"
        transcript_path = run_dir / "transcript.json"
        lang_transcript_path = run_dir / f"transcript_{target_lang}.json"

        with open(srt_path, "w", encoding="utf-8") as f:
            f.write(srt_content)

        with open(vtt_path, "w", encoding="utf-8") as f:
            f.write(vtt_content)

        with open(transcript_path, "w", encoding="utf-8") as f:
            json.dump(qa_segments, f, indent=2, ensure_ascii=False)

        with open(lang_transcript_path, "w", encoding="utf-8") as f:
            json.dump(qa_segments, f, indent=2, ensure_ascii=False)

        await log_cb("INFO", f"Saved final subtitle and translated transcript files: {srt_path.name}, {vtt_path.name}, transcript.json")
        await progress_cb(100.0, "Translation & subtitle formatting complete")

        return {
            "status": "success",
            "segments": qa_segments,
            "artifacts": [
                {"type": "subtitle", "label": f"Subtitles ({target_lang.upper()} SRT)", "path": str(srt_path)},
                {"type": "subtitle", "label": f"Subtitles ({target_lang.upper()} VTT)", "path": str(vtt_path)},
                {"type": "json", "label": f"Translated Transcript ({target_lang.upper()})", "path": str(lang_transcript_path)},
            ]
        }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_translation_persistence.py -v`
Expected: PASS (100%)

---

### Task 2: Voice Director Timeline Preservation & TTS Stems Manifest

**Files:**
- Modify: `backend/app/agents/voice_director.py:305-316`
- Modify: `backend/app/engine/stages/tts.py:80-97`
- Test: `backend/tests/test_tts_stems_manifest.py`

**Interfaces:**
- Consumes: `localized_lines: List[Dict[str, Any]]`
- Produces: `stems.json` and `synthesized_stems` containing `segment_id`, `speaker_id`, `start_s`, `end_s`, `audio_path`, `synthesized_duration_s`, `target_duration_s`.

#### Existing Code Slice (`backend/app/agents/voice_director.py:307-314`):
```python
            synthesized_stems.append({
                "segment_id": seg_id,
                "speaker_id": speaker_id,
                "audio_path": str(stem_path),
                "synthesized_duration_s": synthesized_duration_s,
                "target_duration_s": round(target_duration_s, 3)
            })
```

#### Existing Code Slice (`backend/app/engine/stages/tts.py:83-96`):
```python
        stems = voice_result.get("synthesized_stems", [])
        stems_dir = run_dir / "stems"

        await log_cb("INFO", f"Successfully synthesized {len(stems)} dialogue stems.")
        await progress_cb(100.0, "TTS Speech Synthesis complete")

        return {
            "status": "success",
            "synthesized_stems": stems,
            "voice_cast": voice_result.get("voice_cast", []),
            "artifacts": [
                {"type": "audio", "label": "Dialogue Stems", "path": str(stems_dir)}
            ]
        }
```

- [ ] **Step 1: Write the failing unit test**

Create `backend/tests/test_tts_stems_manifest.py`:
```python
import json
import pytest
from pathlib import Path
from app.engine.stages.tts import TTSStage

@pytest.mark.asyncio
async def test_tts_stage_writes_stems_manifest_and_preserves_timings(tmp_path):
    stage = TTSStage(adapter_type="mock")
    input_artifacts = {
        "segments": [
            {
                "segment_id": 1,
                "start_s": 1.5,
                "end_s": 4.5,
                "translated_text": "नमस्ते दुनिया",
                "speaker_id": "speaker_1"
            }
        ]
    }
    config = {
        "run_dir": str(tmp_path),
        "target_language": "hi",
        "tts_adapter": "mock"
    }

    async def noop_progress(pct, msg): pass
    async def noop_log(lvl, msg): pass

    res = await stage.execute(input_artifacts, config, noop_progress, noop_log)
    assert res["status"] == "success"

    stems_manifest = tmp_path / "stems.json"
    assert stems_manifest.exists(), "stems.json manifest must be written to disk"
    data = json.loads(stems_manifest.read_text(encoding="utf-8"))
    assert len(data) == 1
    assert data[0]["start_s"] == 1.5
    assert data[0]["end_s"] == 4.5
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_tts_stems_manifest.py -v`
Expected: FAIL (`AssertionError: stems.json manifest must be written to disk`)

- [ ] **Step 3: Update `backend/app/agents/voice_director.py` and `backend/app/engine/stages/tts.py`**

In `backend/app/agents/voice_director.py`:
```python
            start_s = float(line.get("start_s", 0.0))
            end_s = float(line.get("end_s", start_s + target_duration_s))

            synthesized_stems.append({
                "segment_id": seg_id,
                "speaker_id": speaker_id,
                "start_s": start_s,
                "end_s": end_s,
                "audio_path": str(stem_path),
                "synthesized_duration_s": synthesized_duration_s,
                "target_duration_s": round(target_duration_s, 3)
            })
```

In `backend/app/engine/stages/tts.py`:
```python
        stems = voice_result.get("synthesized_stems", [])
        stems_dir = run_dir / "stems"

        # Persist stems metadata manifest
        stems_manifest_path = run_dir / "stems.json"
        with open(stems_manifest_path, "w", encoding="utf-8") as f:
            json.dump(stems, f, indent=2, ensure_ascii=False)

        await log_cb("INFO", f"Successfully synthesized {len(stems)} dialogue stems and saved stems.json.")
        await progress_cb(100.0, "TTS Speech Synthesis complete")

        return {
            "status": "success",
            "synthesized_stems": stems,
            "voice_cast": voice_result.get("voice_cast", []),
            "artifacts": [
                {"type": "audio", "label": "Dialogue Stems", "path": str(stems_dir)},
                {"type": "json", "label": "Dialogue Stems Manifest", "path": str(stems_manifest_path)}
            ]
        }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_tts_stems_manifest.py -v`
Expected: PASS (100%)

---

### Task 3: RunExecutor State Rehydration for Stems and Aligned Audio

**Files:**
- Modify: `backend/app/engine/executor.py:100-125`
- Test: `backend/tests/test_executor_rehydration.py`

**Interfaces:**
- Consumes: `run_dir` disk structure (`stems.json`, `stems/seg_*.wav`, `aligned.json`, `aligned/aligned_seg_*.wav`)
- Produces: `current_artifacts["synthesized_stems"]` and `current_artifacts["aligned_stems"]` for resumed stages (`duration_align`, `remix`, `remux`).

#### Existing Code Slice (`backend/app/engine/executor.py:102-120`):
```python
            # Pre-load existing artifacts from disk for previous completed stages
            if (run_dir / "vocals.wav").exists():
                current_artifacts["vocals_path"] = str(run_dir / "vocals.wav")
                current_artifacts["audio_path"] = str(run_dir / "vocals.wav")
            if (run_dir / "background.wav").exists():
                current_artifacts["background_path"] = str(run_dir / "background.wav")
            if (run_dir / "extracted_audio.wav").exists() and "audio_path" not in current_artifacts:
                current_artifacts["audio_path"] = str(run_dir / "extracted_audio.wav")
            if (run_dir / "transcript.json").exists():
                try:
                    with open(run_dir / "transcript.json", "r", encoding="utf-8") as fh:
                        current_artifacts["segments"] = json.load(fh)
                except Exception:
                    pass
            if (run_dir / "dialogue_bus.wav").exists():
                current_artifacts["dialogue_bus_path"] = str(run_dir / "dialogue_bus.wav")
            if (run_dir / "mastered_audio.wav").exists():
                current_artifacts["mastered_audio_path"] = str(run_dir / "mastered_audio.wav")
```

- [ ] **Step 1: Write the failing unit test**

Create `backend/tests/test_executor_rehydration.py`:
```python
import json
import pytest
from pathlib import Path
from app.engine.executor import RunExecutor

@pytest.mark.asyncio
async def test_rehydrate_artifacts_from_disk(tmp_path):
    run_dir = tmp_path
    stems_dir = run_dir / "stems"
    stems_dir.mkdir()
    (stems_dir / "seg_1.wav").write_bytes(b"RIFFmockwav")

    transcript_data = [
        {"segment_id": 1, "start_s": 0.0, "end_s": 3.0, "source_text": "hi", "translated_text": "नमस्ते"}
    ]
    (run_dir / "transcript.json").write_text(json.dumps(transcript_data), encoding="utf-8")

    stems_data = [
        {"segment_id": 1, "start_s": 0.0, "end_s": 3.0, "audio_path": str(stems_dir / "seg_1.wav"), "synthesized_duration_s": 3.0, "target_duration_s": 3.0}
    ]
    (run_dir / "stems.json").write_text(json.dumps(stems_data), encoding="utf-8")

    executor = RunExecutor()
    artifacts = {}
    
    # Test helper method to rehydrate artifacts
    executor._rehydrate_disk_artifacts(run_dir, artifacts)

    assert "synthesized_stems" in artifacts
    assert len(artifacts["synthesized_stems"]) == 1
    assert artifacts["synthesized_stems"][0]["segment_id"] == 1
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest backend/tests/test_executor_rehydration.py -v`
Expected: FAIL (`AttributeError: 'RunExecutor' object has no attribute '_rehydrate_disk_artifacts'`)

- [ ] **Step 3: Update `backend/app/engine/executor.py`**

Add `_rehydrate_disk_artifacts` method to `RunExecutor` and call it in `_run_pipeline`:
```python
    def _rehydrate_disk_artifacts(self, run_dir: Path, current_artifacts: Dict[str, Any]) -> None:
        """Loads or reconstructs prior stage artifacts from disk into current_artifacts."""
        if (run_dir / "vocals.wav").exists():
            current_artifacts["vocals_path"] = str(run_dir / "vocals.wav")
            current_artifacts["audio_path"] = str(run_dir / "vocals.wav")
        if (run_dir / "background.wav").exists():
            current_artifacts["background_path"] = str(run_dir / "background.wav")
        if (run_dir / "extracted_audio.wav").exists() and "audio_path" not in current_artifacts:
            current_artifacts["audio_path"] = str(run_dir / "extracted_audio.wav")
        if (run_dir / "transcript.json").exists():
            try:
                with open(run_dir / "transcript.json", "r", encoding="utf-8") as fh:
                    current_artifacts["segments"] = json.load(fh)
            except Exception:
                pass
        if (run_dir / "dialogue_bus.wav").exists():
            current_artifacts["dialogue_bus_path"] = str(run_dir / "dialogue_bus.wav")
        if (run_dir / "mastered_audio.wav").exists():
            current_artifacts["mastered_audio_path"] = str(run_dir / "mastered_audio.wav")

        # Rehydrate synthesized stems
        if (run_dir / "stems.json").exists():
            try:
                with open(run_dir / "stems.json", "r", encoding="utf-8") as fh:
                    current_artifacts["synthesized_stems"] = json.load(fh)
            except Exception:
                pass
        elif (run_dir / "stems").exists():
            stem_files = sorted(
                list((run_dir / "stems").glob("seg_*.wav")),
                key=lambda p: int(p.stem.split("_")[1]) if len(p.stem.split("_")) > 1 and p.stem.split("_")[1].isdigit() else 0
            )
            if stem_files and "segments" in current_artifacts:
                reconstructed = []
                segs = current_artifacts["segments"]
                for idx, sf in enumerate(stem_files):
                    seg = segs[idx] if idx < len(segs) else {}
                    start_s = float(seg.get("start_s", 0.0))
                    end_s = float(seg.get("end_s", start_s + 2.0))
                    reconstructed.append({
                        "segment_id": seg.get("segment_id", idx + 1),
                        "speaker_id": seg.get("speaker_id", "speaker_1"),
                        "start_s": start_s,
                        "end_s": end_s,
                        "audio_path": str(sf),
                        "synthesized_duration_s": round(end_s - start_s, 3),
                        "target_duration_s": round(end_s - start_s, 3),
                    })
                current_artifacts["synthesized_stems"] = reconstructed

        # Rehydrate aligned stems
        if (run_dir / "aligned.json").exists():
            try:
                with open(run_dir / "aligned.json", "r", encoding="utf-8") as fh:
                    current_artifacts["aligned_stems"] = json.load(fh)
            except Exception:
                pass
        elif (run_dir / "aligned").exists():
            aligned_files = sorted(
                list((run_dir / "aligned").glob("aligned_seg_*.wav")),
                key=lambda p: int(p.stem.split("_")[2]) if len(p.stem.split("_")) > 2 and p.stem.split("_")[2].isdigit() else 0
            )
            if aligned_files and "synthesized_stems" in current_artifacts:
                reconstructed_aligned = []
                for idx, af in enumerate(aligned_files):
                    base_stem = current_artifacts["synthesized_stems"][idx] if idx < len(current_artifacts["synthesized_stems"]) else {}
                    reconstructed_aligned.append({
                        **base_stem,
                        "audio_path": str(af),
                        "aligned_path": str(af),
                    })
                current_artifacts["aligned_stems"] = reconstructed_aligned
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pytest backend/tests/test_executor_rehydration.py -v`
Expected: PASS (100%)

---

### Task 4: Frontend Preview Stream File Object Handling

**Files:**
- Modify: `frontend/lib/mediaTrackHelpers.ts:28-35`
- Test: `frontend/__tests__/mediaTrackHelpers.test.ts`

**Interfaces:**
- Consumes: `filePath?: string | { relative_path?: string; path?: string } | null`
- Produces: Sanitized URL string or `undefined`

#### Existing Code Slice (`frontend/lib/mediaTrackHelpers.ts:30-33`):
```typescript
export function getPreviewStreamUrl(filePath?: string | null): string | undefined {
  if (!filePath) return undefined;
  return `/api/v1/clips/preview-stream?path=${encodeURIComponent(filePath)}`;
}
```

- [ ] **Step 1: Write the failing unit test**

Update `frontend/__tests__/mediaTrackHelpers.test.ts`:
```typescript
it('safely extracts relative_path or path when an object is passed', () => {
  const fileObj = {
    filename: 'mastered_soundtrack.wav',
    relative_path: './deliverables/mastered_soundtrack.wav',
    size_bytes: 3304758,
  };
  const url = getPreviewStreamUrl(fileObj as any);
  expect(url).toBe('/api/v1/clips/preview-stream?path=.%2Fdeliverables%2Fmastered_soundtrack.wav');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- mediaTrackHelpers.test.ts`
Expected: FAIL (`expected '...path=%5Bobject%20Object%5D' to be '...path=.%2Fdeliverables...'`)

- [ ] **Step 3: Update `frontend/lib/mediaTrackHelpers.ts`**

```typescript
export function getPreviewStreamUrl(
  filePath?: string | { relative_path?: string; path?: string; filename?: string } | null
): string | undefined {
  if (!filePath) return undefined;
  const rawPath = typeof filePath === 'object' ? (filePath.relative_path || filePath.path || filePath.filename) : filePath;
  if (!rawPath || typeof rawPath !== 'string') return undefined;
  return `/api/v1/clips/preview-stream?path=${encodeURIComponent(rawPath)}`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- mediaTrackHelpers.test.ts`
Expected: PASS (100%)

---

### Task 5: Full Integration & Run Execution Verification

- [ ] **Step 1: Run Full Pytest Regression Suite**
Run: `pytest backend/tests -v`
Expected: All tests pass (100% green).

- [ ] **Step 2: Run Frontend Vitest Suite**
Run: `npm test -- --run`
Expected: All tests pass (100% green).

- [ ] **Step 3: Update Active Run `cb8ff0c2-d990-4a4e-bc8a-79e1e91e042a_dub_hi_01`**
Populate `transcript.json` with Hindi `translated_text` and execute downstream stages (`duration_align`, `remix`, `remux`) to generate the final Hindi mastered broadcast MP4 and audio stems.
