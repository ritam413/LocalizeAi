# TICKET-13: Deep Acoustic Mastering Engine — Scaffolding & Exercises

This document provides the structured exercise breakdown, conceptual explainers, problem specifications, and TDD verification steps for implementing **TICKET-13: Acoustic Mastering Engine (Multitrack Sidechain Ducking & EBU R128)** in [backend/app/engine/stages/mixer.py](file:///c:/CCodes_WebDevelopment/hckthon/localize_movie_dub/backend/app/engine/stages/mixer.py).

---

## Exercise 13.01: Dialogue Bus Compositing (`composite_dialogue_bus`)

### 🧠 Explainer
In localized dubbing, individual dialogue lines are synthesized as standalone audio stems (e.g. `line_0.wav`, `line_1.wav`). Each segment has a target timeline start time `start_s` and end time `end_s`. 

To mix these into a continuous dialogue bus:
1. Every segment stem is offset to its timeline position using FFmpeg's `adelay` filter (`adelay=start_ms|start_ms` for stereo or `start_ms` for mono).
2. All delayed streams are mixed into a single composite bus using `amix=inputs=N:dropout_transition=0:normalize=0`.
3. If no dialogue segments exist, an empty/silent stem or silence track is returned gracefully.

### 🎯 Problem Specification
Implement `composite_dialogue_bus(dialogue_segments: List[Dict[str, Any]], output_path: Union[str, Path]) -> Path`:
- Input: `dialogue_segments` where each element has `audio_path`, `start_s`, `end_s`, `duration_s`.
- Delay each stem by `int(segment["start_s"] * 1000)` milliseconds.
- Execute FFmpeg subprocess (or mock audio generator when in test mode) to render `output_path`.
- Return the resolved `Path(output_path)`.

---

## Exercise 13.02: Dynamic Sidechain Compression & Ducking (`apply_sidechain_ducking`)

### 🧠 Explainer
When the dub actor speaks, the background M&E (Music & Effects) track separated by Demucs should automatically duck down by `-6.0 dB` to maintain speech intelligibility. Once speech stops, the background audio must smoothly ramp back up to normal volume without acoustic pumping or clicking artifacts.

In FFmpeg, this is achieved using `sidechaincompress`:
```
[0:a][1:a]sidechaincompress=threshold=0.05:ratio=4:attack=20:release=250:level_in=1[ducked_bg]
```
- **Input 0**: Background M&E audio track.
- **Input 1**: Composite dialogue audio track (the sidechain trigger).
- **Threshold & Ratio**: Calibrated to achieve `-6 dB` attenuation during active speech.
- **Attack (20ms)**: Fast enough to avoid clipping dialog start transients.
- **Release (250ms)**: Smooth release ramp preventing abrupt noise floor modulation.

### 🎯 Problem Specification
Implement `apply_sidechain_ducking(background_path: Optional[Union[str, Path]], dialogue_bus_path: Union[str, Path], output_path: Union[str, Path], ducking_db: float = -6.0) -> Path`:
- If `background_path` is `None` or does not exist, return the `dialogue_bus_path` directly.
- Construct the FFmpeg `sidechaincompress` filter.
- Render ducked background track to `output_path`.

---

## Exercise 13.03: EBU R128 Broadcast Loudness Mastering (`master_ebu_r128`)

### 🧠 Explainer
International broadcast and streaming delivery standards (EBU R128, ITU-R BS.1770-4) require delivered master audio to meet:
- **Integrated Loudness**: `-24.0 LUFS` (tolerance ±0.5 LUFS).
- **Loudness Range (LRA)**: `7.0 LU`.
- **True Peak (TP)**: `-2.0 dBTP` maximum to prevent inter-sample clipping upon AAC transcoding.

In FFmpeg, this is applied via the `loudnorm` filter:
```
loudnorm=I=-24.0:LRA=7.0:TP=-2.0
```

### 🎯 Problem Specification
Implement `master_ebu_r128(input_audio_path: Union[str, Path], output_path: Union[str, Path], target_lufs: float = -24.0, true_peak: float = -2.0) -> Path`:
- Apply `loudnorm` filter with target integrated loudness `target_lufs` and true peak `true_peak`.
- Render final normalized master to `output_path`.

---

## Exercise 13.04: Unified Acoustic Mastering Engine (`AcousticMasteringEngine.master_mix`)

### 🧠 Explainer
The `AcousticMasteringEngine` wraps these individual stages into a single high-leverage method:
1. Composite dialogue stems into dialogue bus (`[dialogue_bus]`).
2. If background M&E exists, duck M&E using dialogue bus as sidechain (`[ducked_bg]`) and mix them together: `[dialogue_bus][ducked_bg]amix=inputs=2:dropout_transition=0:normalize=0[unmastered]`.
3. Pass through EBU R128 loudness normalizer: `[unmastered]loudnorm=I=-24.0:LRA=7.0:TP=-2.0[master]`.
4. Output final broadcast-ready audio file.

### 🎯 Problem Specification
Implement `AcousticMasteringEngine.master_mix(job_id, background_audio_path, dialogue_segments, output_path, ducking_db=-6.0, target_lufs=-24.0) -> Path`.

---

## Verification & Test Plan

Run the automated test suite:
```bash
backend/.venv/Scripts/pytest backend/tests/test_acoustic_mixer.py -v
```

Test cases covered:
1. `test_composite_dialogue_bus_empty_segments`
2. `test_composite_dialogue_bus_multiple_segments`
3. `test_sidechain_ducking_filter_parameters`
4. `test_sidechain_ducking_fallback_when_bg_missing`
5. `test_master_ebu_r128_filter_string`
6. `test_acoustic_mastering_engine_end_to_end`
7. `test_acoustic_mastering_engine_custom_ducking_and_lufs`
