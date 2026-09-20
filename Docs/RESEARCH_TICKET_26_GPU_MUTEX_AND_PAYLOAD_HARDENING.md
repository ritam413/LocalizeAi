# Research & Primary Source Grounding: TICKET-26 GPU Mutex, Concurrency & Defensive Sanitization

**Document ID:** `RESEARCH-TICKET-26`  
**Related Ticket:** [TICKET-26](../Docs/tickets/TICKET-26-tts-stage-executor-gpu-lock-wiring.md)  
**Authors:** Wshobson Agents (Security Lead, QA Lead, Architect)  
**Date:** 2026-09-20  

---

## 1. Executive Summary

This research document formally grounds the technical solutions for **TICKET-26** (TTS Stage, RunExecutor Seam & GPU Mutex Wiring) against primary sources: official PyTorch CUDA memory management documentation, Kokoro-82M / StyleTTS 2 architecture, FastAPI/Pydantic V2 payload handling specifications, and async concurrency invariants.

---

## 2. Primary Source Findings & Grounding

### 2.1 PyTorch CUDA Allocator & Pascal 4GB VRAM Mutex Serialization
* **Primary Source:** [PyTorch CUDA Semantics & Memory Management Documentation](https://pytorch.org/docs/stable/notes/cuda.html)
* **Problem Dynamics on Low-VRAM Hardware:**
  - On 4GB GPUs (NVIDIA GTX 1050 Ti / GTX 1650, Pascal architecture with compute capability 6.1), VRAM is strictly bounded at 4,096 MB.
  - VRAM Consumption Matrix in LOCALIZE Pipeline:
    - **Faster-Whisper `medium` (CTranslate2 fp16):** ~1,500 MB – 2,100 MB VRAM
    - **Demucs HTDemucs (PyTorch fp32/fp16):** ~1,800 MB – 2,200 MB VRAM
    - **Kokoro-82M (StyleTTS 2 + ISTFTNet vocoder):** ~350 MB – 600 MB VRAM
  - If Kokoro executes on CUDA concurrently with Whisper or Demucs without synchronization, combined VRAM demand ($2,100\text{MB} + 2,200\text{MB} + 600\text{MB} = 4,900\text{MB}$) exceeds physical capacity, resulting in an unrecoverable `torch.cuda.OutOfMemoryError` or `CUDA error: out of memory`.
* **Grounded Solution:**
  - An application-level asynchronous mutex (`app.engine.gpu_lock.gpu_lock`) must guard all GPU-bound stages.
  - When `adapter_type == "kokoro"` and `torch.cuda.is_available() == True`, `TTSStage` declares `gpu_required = True`.
  - When `adapter_type` is `"edge_tts"` (network I/O) or `"mock"` (CPU synthetic audio), `gpu_required = False`.
  - The `RunExecutor` must inspect the active `stage_config` at instantiation time to ensure `gpu_required` matches the actual adapter requested, avoiding both unnecessary GPU queue stalls and concurrent OOM crashes.
  - Context manager pattern (`async with gpu_lock.acquire(...)`) guarantees release during exceptions or task cancellation via Python's `__aexit__` protocol.

---

### 2.2 Kokoro-82M & KPipeline Device Allocation
* **Primary Source:** [`hexgrad/Kokoro-82M` Official Repository](https://github.com/hexgrad/Kokoro-82M) & HuggingFace Model Hub
* **Architecture:**
  - Kokoro-82M is built on StyleTTS 2 with a lightweight ISTFTNet vocoder.
  - Model weights total ~82M parameters (~328MB in float32, ~164MB in fp16).
  - Initialization via `kokoro.KPipeline(lang_code=..., device=...)`:
    - When `device="cuda"`, inference takes ~30–80ms per sentence.
    - When `device="cpu"`, inference takes ~150–350ms per sentence (fully functional without GPU).
  - Both modes emit 24kHz float32 audio tensors (`[-1.0, 1.0]`), which `KokoroTTSAdapter` packages into 16-bit PCM WAV standard format via `soundfile.write(..., subtype="PCM_16")`.
* **Grounded Solution:**
  - `TTSStage` and `KokoroTTSAdapter` must dynamically probe `torch.cuda.is_available()` wrapped in a `try/except Exception` block, allowing graceful degradation to CPU if PyTorch CUDA extensions are not installed or hardware lacks CUDA capability.

---

### 2.3 Defensive REST Payload Deserialization & Null Normalization
* **Primary Source:** [Pydantic V2 Field Validator Specification](https://docs.pydantic.dev/latest/concepts/validators/) & [FastAPI Request Body Handling](https://fastapi.tiangolo.com/tutorial/body/)
* **Vulnerability Analysis:**
  - Standard dictionary lookups `dict.get("tts_adapter", "kokoro")` only return the default when the key is *missing*.
  - When a client sends JSON `{"tts_adapter": null}`, Python parses it as `{"tts_adapter": None}`.
  - `dict.get("tts_adapter", "kokoro")` evaluates to `None`, bypassing the default.
  - When propagated into `VoiceDirectorAgent(adapter_type=None)`, it drops to `MockAudioAdapter`, generating 440Hz test sine waves instead of speech.
* **Grounded Solution:**
  - Implement a dedicated sanitization function (`sanitize_tts_adapter`) with a strict whitelist `{"kokoro", "edge_tts", "mock"}`:
    ```python
    ALLOWED_TTS_ADAPTERS = {"kokoro", "edge_tts", "mock"}

    def sanitize_tts_adapter(adapter: Any) -> str:
        if not adapter or not isinstance(adapter, str):
            return "kokoro"
        cleaned = adapter.strip().lower()
        return cleaned if cleaned in ALLOWED_TTS_ADAPTERS else "kokoro"
    ```
  - Use `sanitize_tts_adapter` across `POST /api/v1/runs`, `RunExecutor._run_pipeline`, and `TTSStage.execute`.

---

### 2.4 Deterministic CI Testing Across Heterogeneous Environments
* **Primary Source:** [Pytest Monkeypatching & Parameterization Guidelines](https://docs.pytest.org/en/stable/how-to/monkeypatch.html)
* **Testing Strategy:**
  - Test suites run on varied environments: GitHub Actions CI (CPU only, no CUDA), developer laptops (macOS/Linux/Windows with/without GPU), and production servers (Pascal/Turing CUDA).
  - Tests asserting `gpu_required` must never rely on physical hardware presence; they must monkeypatch `torch.cuda.is_available` to assert both `True` and `False` code paths deterministically.

---

## 3. Implementation Blueprint Matrix

| Component | Target File | Grounded Fix |
|---|---|---|
| **TTS Stage** | `backend/app/engine/stages/tts.py` | Add `sanitize_tts_adapter()`, dynamic `gpu_required` in `__init__`, and default `"kokoro"` in `execute()`. |
| **Executor** | `backend/app/engine/executor.py` | Pass `adapter_type` into `TTSStage(adapter_type=...)`, wire `"tts_adapter"` in `stage_config_override`. |
| **API Layer** | `backend/app/api/runs.py` | Sanitize `payload.get("tts_adapter")` defaulting to `"kokoro"`. |
| **Test Suite** | `backend/tests/test_dubbing_stages_chain.py` | Add GPU Lock Matrix parametrized tests, payload sanitization tests, and override pass-through tests. |

---

## 4. Verification Directives
1. Execute `pytest backend/tests/test_dubbing_stages_chain.py backend/tests/test_voice_director.py -v`.
2. Verify all 8 dubbing pipeline stages chain cleanly in succession without dropped configuration keys.
3. Assert full compliance with INV-001 through INV-005.
