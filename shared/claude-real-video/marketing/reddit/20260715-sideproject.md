Subreddit: r/SideProject
Title: My open-source side project hit 1.6k GitHub stars. The lessons came from the two users who complained.

Body:

I built a small CLI called claude-real-video because it bothered me that when you paste a video link into an AI chat, the model answers from the transcript and never sees a single frame. The tool extracts only the frames that actually changed (ffmpeg scene detection + dedup), lines them up with a timestamped transcript, and hands the folder to whatever LLM you use. Everything runs locally.

It made the Hacker News front page, which got the stars moving. But looking back, the two moments that actually improved the product were both complaints:

1. An animator reported that slow squash-and-stretch motion never triggered a keyframe — no single frame changes enough. That became an adaptive mode that scores frames against their rolling neighbourhood instead of a fixed threshold.

2. Another user pointed out that lecture recordings produce almost no frames because the slide sits still while the speaker talks through three ideas. That became subtitle-anchored frames — one forced frame per spoken segment.

Neither idea was on my roadmap. Both came within days of real people using it on videos I never tested.

The other thing that surprised me: I fund the project with a paid add-on (camera motion + emotion timeline analysis for creators), stated plainly in the README. I expected pushback for mixing open source and money. Instead the first paying customers were strangers who found the free tool first, and one of them wrote back that it genuinely helped his work. Being upfront about the funding model cost me nothing.

Solo dev, non-CS background, building everything with an AI pair. Happy to answer anything about the scene-detection approach or the open-core setup.

Repo: https://github.com/HUANGCHIHHUNGLeo/claude-real-video
