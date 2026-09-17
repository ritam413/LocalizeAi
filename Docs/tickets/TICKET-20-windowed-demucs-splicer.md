# TICKET-20: Windowed Demucs Splicer & Equal-Power Crossfade DSP Engine

**Status:** Planned  
**Parent Epic:** Selective Windowed Demucs Vocal Separation  
**Primary Seam:** `backend/app/engine/stages/chunked_demucs.py`  
**Test Suite:** `backend/tests/test_chunked_demucs.py`  
**Dependencies:** None  

---

## 1. Context & Motivation
Running Demucs (4-stem vocal separation) across a full 50-minute video audio stream takes 18–35+ minutes on local GPUs. In real media, only 10–18 minutes contain overlapping dialogue and score. Slicing targeted audio windows, running Demucs only on those windows, and re-stitching the stems into a master 50-minute canvas reduces separation compute time by 70–80%.

## 2. Specification & Requirements

1. **Chunk Isolation (`slice_window`)**:
   - Given a source WAV/audio tensor of length $T$ and a list of time ranges $[(t_{1,\text{start}}, t_{1,\text{end}}), \dots]$, slice sub-waveforms with exact sample indexing.
   - Add default 1.5s padding (`padding_sec=1.5`) clamped to `[0, T]`.

2. **Equal-Power Cosine Crossfade Splicing (`splice_stems_with_crossfade`)**:
   - Address Contrarian audio-jump critique: Apply a Hann/cosine equal-power crossfade window ($150\text{ms}$, ~6615 samples @ 44.1kHz) at both the leading (fade-in) and trailing (fade-out) edges of each Demucs chunk:
     $$S(t) = \cos^2\left(\frac{\pi t}{2 L}\right) \cdot \text{MasterAudio}(t) + \sin^2\left(\frac{\pi t}{2 L}\right) \cdot \text{DemucsStem}(t)$$
   - Outside of the Demucs ranges, the `no_vocals` (M&E) track is filled with the untouched master original audio (100% pristine acoustic fidelity).
   - In Demucs ranges, the `no_vocals` track is filled with the separated background (Drums + Bass + Other).

3. **Phase & Sample Rate Invariant**:
   - Enforce uniform sample rate (`sr=44100` standard for Demucs HTDemucs).
   - Guard against DC offset and boundary clipping pops.

## 3. Verification Criteria
- [ ] Pytest verifying slice math, boundary padding clamping, and crossfade power sum $\approx 1.0$.
- [ ] No audible clicks or pops at chunk transition boundaries.
- [ ] Master canvas length matches original input audio down to the exact sample.
