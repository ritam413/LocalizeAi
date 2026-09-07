# PH major-update launch copy (Option A)

## Launch tagline (60 chars)
Let Claude — or any LLM — actually watch a video

## Short description
Open-source CLI that turns any video into scene-aware keyframes and a timestamped transcript, processed locally. New since the first launch: exact per-frame timestamps, faster-whisper transcription, a trilingual interactive viewer, and honest dedup for slow-changing footage.

## Maker first comment
Hi Product Hunt — Leo here, from Taiwan.

I launched this quietly ten days ago — 8 upvotes, no plan, no post. Since then the tool grew faster than I expected, and almost everything that changed came from strangers' bug reports. This update is their work as much as mine, so I wanted to launch it properly this time.

What it does, for anyone new: paste a video URL or a local file, and it produces the things an LLM can genuinely read — keyframes picked on scene changes (not a timer), deduplicated so you don't pay tokens for near-identical frames, and a timestamped transcript. Everything runs locally with ffmpeg and whisper; nothing is uploaded. The output folder works with ChatGPT, Claude, Gemini, or a local model. It also ships as a Claude Code skill, so you can paste a link in chat and the agent watches the video by itself.

What changed since the first launch:

- Per-frame source timestamps (frames.json). Every keyframe knows exactly which second of the video it came from, and the mapping survives extraction, dedup and renaming. A user who analyzes 22-minute lectures requested this — then re-verified my implementation with his own SHA-256 replay test. 60 out of 60 frames matched.
- faster-whisper support. Install the [fast] extra and transcription switches to an engine several times faster, same output, no new flags.
- Dedup that catches slow changes. Handwriting, caption cards and screen recordings used to collapse into three frames because the comparator measured them as zero difference. A benchmark proved my own tool wrong; a settled-local detector fixed it.
- The end-of-run summary now shows your video's real numbers instead of a generic line.

The core is MIT open source and stays that way. There's a paid Pro add-on ($19) for camera motion, pacing and voice emotion analysis — that's what funds full-time work on the free tool.

I'll be around all day. Ask me anything about the pipeline.
