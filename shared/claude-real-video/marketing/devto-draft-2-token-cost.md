# dev.to 第二篇草稿（等 Leo 過目後發佈）
# 帳號: huangchihhungleo | tags: ai, llm, video, python

---
title: "How many tokens does it cost for an LLM to watch a 60-second video? I measured it."
tags: ai, llm, video, python
---

A customer asked me this yesterday and I realized I'd been answering from intuition, not data. So I measured it properly. Here are the numbers, and the three-tier strategy that falls out of them.

## Setup

The tool is [claude-real-video](https://github.com/HUANGCHIHHUNGLeo/claude-real-video) — an open-source CLI that turns a video into scene-aware keyframes plus a timestamped transcript, all locally. The important part for cost: **the pipeline itself consumes zero tokens.** ffmpeg picks frames on scene changes, whisper transcribes, dedup runs on downscaled signatures. You only pay when an LLM reads the output.

Test subject: a real 74-second fast-cut Instagram reel. It produced 70 keyframes at 640×1138 — close to a worst case, since fast cuts mean many distinct frames. A talking-head video of the same length produces 10-15.

Token counts below use each provider's documented image pricing (Anthropic: w×h/750 with a 1568px long-side cap; OpenAI: 85 base + 170 per 512px tile after resize) against the actual output dimensions, and tiktoken for the text.

## The numbers

| Reading strategy | Claude | GPT |
|---|---|---|
| Frame by frame (70 images) | ~68,000 | ~77,350 |
| 3×3 contact sheets, `--grid` (8 images) | ~14,400 | ~8,800 |
| Text tracks only (transcript + shot table) | ~8,000 | ~8,000 |
| Local vision model | 0 | 0 |

Three things surprised me:

**1. `--grid` isn't a compromise, it's usually better.** Nine frames tiled into one image cuts tokens ~5x, and the model gets temporal order for free — it sees the sequence, not nine disconnected pictures. For "what happens in this video" questions, grid answers were as good or better in my testing.

**2. GPT reads big images cheaper than Claude.** OpenAI's tile cap means a large contact sheet costs the same as a mid-size photo. Claude's linear w×h/750 keeps scaling. For grid mode, GPT is ~40% cheaper; for individual small frames, Claude is cheaper. Providers price geometry differently — worth knowing before you pick a default.

**3. Text tracks answer most questions at ~10% of the cost.** A timestamped transcript plus a shot table ("14 shots, 21 cuts/min, pacing front-loaded") answers "what is this video about and how is it edited" without a single image token. I now reach for images only when the question is actually visual.

## What about free?

Point a local vision model (Qwen-VL, Llama vision, anything in LM Studio/Ollama) at the output folder: zero tokens, and the footage never leaves your machine. The trade: minutes instead of seconds, and multi-image reasoning quality drops noticeably. The pragmatic hybrid is a local model + `--grid` + text tracks.

## The workflow

```bash
pip install 'claude-real-video[fast]'
crv "video url or file" --grid
```

Then hand the output folder to whatever model you use. With the bundled Claude Code skill you just paste a link in chat and it watches the video by itself.

In dollar terms, the grid strategy reads a 60-second video for about $0.03-0.05 of API time. The real cost of LLM video understanding isn't the model call — it's sending frames the model didn't need.
