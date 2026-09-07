---
title: Your LLM isn't watching that video — it's reading the subtitles
tags: ai, python, opensource, ffmpeg
---

A few months ago I pasted a YouTube link into an AI chat and asked "what happens in this video?"

It answered instantly. Confidently. And completely from the *transcript*. The video had a sight gag in the middle — the whole point of the clip — and the model had no idea, because nobody ever showed it a single frame.

That bugged me enough to build [claude-real-video](https://github.com/HUANGCHIHHUNGLeo/claude-real-video) (crv), a small open-source CLI that turns any video into something an LLM can actually read. It hit the Hacker News front page and just passed 1.6k GitHub stars, so I figured it's time to write up how it works under the hood.

## The naive approach fails on tokens

The obvious fix is "extract frames, paste them in." But at a fixed 1 fps, a 58-second clip becomes 58 images. Most are near-duplicates of their neighbours, and vision tokens are expensive — you're paying to show the model the same talking head 40 times.

Fixed-interval sampling has the opposite failure too: a fast cut between two samples just disappears.

## What crv does instead

```bash
pip install "claude-real-video[whisper]"
crv "https://www.youtube.com/watch?v=..."
# → crv-out/frames/*.jpg + frames.json + transcript.txt/.json + MANIFEST.txt
```

Everything runs locally. No ML models to download for the core path — it's ffmpeg doing the heavy lifting:

**1. Scene-change detection, not a fixed quota.** One ffmpeg metadata pass computes a scene score for every frame. Frames are kept where the content actually changes, so that same 58-second clip yields 26 frames instead of 58 — and no cut slips through, because cuts are exactly what scene scores spike on.

**2. Sliding-window dedup.** Near-duplicates that survive the threshold get compared against a rolling window and dropped. What's left is the minimal set of frames that differ.

**3. Contact sheets.** `--grid` packs the survivors into a few labeled grid images. 26 frames become 3 contact sheets. Fewer images, same information, and the timestamps are printed on each cell so the model can reference "at 0:41" correctly.

**4. Timestamped transcript.** Subtitles when the platform provides them, Whisper when it doesn't — written both as plain text and as `transcript.json` with per-segment timestamps, so the frames and the words line up on one timeline.

The output is one folder with a `MANIFEST.txt` on top. Drop it into Claude, ChatGPT or Gemini and ask away.

## The two failure modes that took real users to find

The fixed scene-score threshold turned out to have blind spots, and both fixes came from GitHub issues:

**Slow morphs never spike.** An animator reported that a 2-3 second squash-and-stretch never triggered a single frame — no individual frame differs enough from the previous one. `--adaptive` fixes this by scoring each frame against its rolling 2-second neighbourhood mean instead of a global constant. Slow change accumulates against the local baseline and gets caught.

**Slides don't change when the speaker does.** In lectures and screen recordings, the picture can sit still for a minute while the audio moves through three ideas. `--text-anchors` forces one extra frame at each subtitle-cue timestamp (capped at one per second), so every spoken segment has a matching visual even when scene detection sees nothing.

## Why local matters here

The model never needs the video file — it needs the *residue*: which frames changed, what was said, when. That residue is small enough to compute on any laptop with ffmpeg, which means the video itself never has to leave your machine. What goes to a cloud LLM afterwards is only whatever you choose to paste.

If you're on Claude Code, the repo ships a skill folder — install it and the agent watches videos on its own when you paste a link.

## Honest footnote

crv is MIT and stays free. I fund the work with a paid add-on (crv Pro) that adds camera-motion and emotion-timeline analysis for creators — the free core is the complete watching pipeline, not a demo.

Repo: https://github.com/HUANGCHIHHUNGLeo/claude-real-video
PyPI: https://pypi.org/project/claude-real-video/

— Leo Huang (黃志弘, LeoAido), building a one-person company with an AI team.
