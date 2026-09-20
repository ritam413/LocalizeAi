# TICKET-26: TTS Stage, Executor Seam & GPU Mutex Wiring

## Status
- **State**: Completed
- **Primary Seams**: 
  - `backend/app/engine/stages/tts.py` (`TTSStage`, `sanitize_tts_adapter`)
  - `backend/app/engine/executor.py` (`RunExecutor._run_pipeline`)
  - `backend/app/api/runs.py` (`POST /api/v1/runs`)
- **Verification**: Pytest (`backend/tests/test_dubbing_stages_chain.py` - 16/16 Passed, Full suite 101/101 Passed)
- **Blocking Dependencies**: TICKET-24, TICKET-25
- **Downstream Blocked**: TICKET-27, TICKET-28

## Objective
Wire `tts_adapter="kokoro"` through the end-to-end execution pipeline. Fix the critical seam in `RunExecutor` where `stage_config_override` omitted `tts_adapter`, coordinate Pascal 4GB GPU Mutex locking (`gpu_lock`), and default run generation to Kokoro across REST endpoints.

## Seams & Interfaces
- Python: `backend/app/engine/executor.py`:
  - Update `stage_config_override` (lines 214–222):
    ```python
    "tts_adapter": stage_config.get("tts_adapter", "kokoro"),
    ```
- Python: `backend/app/engine/stages/tts.py`:
  - `TTSStage.__init__()`: dynamically evaluate `gpu_required`:
    ```python
    def __init__(self, adapter_type: str = "kokoro"):
        import torch
        gpu_active = (adapter_type == "kokoro" and torch.cuda.is_available())
        super().__init__("tts", gpu_required=gpu_active)
    ```
  - `TTSStage.execute()`: Read `adapter_type = config.get("tts_adapter", "kokoro")`.
- Python: `backend/app/api/runs.py`:
  - In `create_run()`, set default:
    ```python
    "tts_adapter": payload.get("tts_adapter", "kokoro"),
    ```

## TDD Test Specification (Red -> Green)
Test Seam: `backend/tests/test_dubbing_stages_chain.py`
```python
import pytest
from app.engine.stages.tts import TTSStage

@pytest.mark.asyncio
async def test_tts_stage_uses_configured_adapter(tmp_path):
    stage = TTSStage()
    config = {
        "run_dir": str(tmp_path),
        "target_language": "hi",
        "tts_adapter": "mock"
    }
    input_artifacts = {
        "segments": [{"segment_id": 1, "speaker_id": "spk_1", "start_s": 0.0, "end_s": 2.5, "translated_text": "परीक्षण"}]
    }
    
    res = await stage.execute(input_artifacts, config, lambda p, m: None, lambda l, m: None)
    assert res["status"] == "success"
    assert len(res["synthesized_stems"]) == 1
    assert (tmp_path / "stems" / "seg_1.wav").exists()
```

## Acceptance Criteria
1. `RunExecutor` forwards `"tts_adapter"` into `stage_config_override` without drop-off.
2. `TTSStage` defaults to `"kokoro"` when not explicitly specified in config.
3. When `adapter_type == "kokoro"` and CUDA is available, `gpu_required` is `True`, ensuring Pascal GPU Mutex serializes against Faster-Whisper.
4. `POST /api/v1/runs` preserves `"tts_adapter"` in `frozen_stage_config`.
