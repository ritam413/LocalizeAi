# ADR 0001: Vocal Isolation & Anti-Hallucination for Action Subtitling

## Context
When subtitling media content with heavy action sequences (fight scenes, background explosions, intense music), raw audio contains high-energy sound effects with subtle or intermittent dialogue. Standard Whisper ASR models operating on raw audio produce hallucinations (repeating phantom text during fight scenes) or misaligned subtitle timestamps triggered by sound effects.

## Decision
We plan to introduce a multi-layer speech isolation & anti-hallucination strategy:
1. **Source Separation**: Replace the stub `DenoiseStage` with vocal isolation (Demucs/HTDemucs) to split audio into `vocals.wav` and `other.wav`.
2. **Targeted VAD**: Run Voice Activity Detection strictly on `vocals.wav` so non-speech sound effects (punches, explosions) cannot trigger speech segments.
3. **Whisper Anti-Hallucination Tuning**: Configure `no_speech_threshold`, `compression_ratio_threshold`, and `condition_on_previous_text=False` to discard low-confidence ASR outputs.

## Consequences
- **Positive**: Eliminates hallucinated subtitles during non-speech fight scenes; maintains accurate timestamp boundaries before and after action sequences.
- **Trade-off**: Increases processing time per video due to the vocal separation step (Demucs GPU inference).
