"""MCP server for claude-real-video.

Exposes the crv pipeline over the Model Context Protocol so any MCP client
(Claude Desktop, Claude Code, Cursor, ...) can ask for a video to be watched:
scene-aware deduplicated keyframes plus a timestamped transcript, processed
entirely on the user's machine.

Run directly:            crv-mcp
Claude Code:             claude mcp add crv -- crv-mcp
Claude Desktop config:   {"mcpServers": {"crv": {"command": "crv-mcp"}}}

Requires the optional dependency group:  pip install 'claude-real-video[mcp]'
"""

from __future__ import annotations

import base64
import hashlib
import io
import os
import re
import sys
from pathlib import Path

try:  # mcp >= 2.0
    from mcp.server.mcpserver import MCPServer as _ServerClass, Image
except ImportError:
    try:  # mcp 1.x
        from mcp.server.fastmcp import FastMCP as _ServerClass, Image
    except ImportError:  # pragma: no cover
        print(
            "The MCP server needs the optional 'mcp' dependency.\n"
            "Install it with: pip install 'claude-real-video[mcp]'",
            file=sys.stderr,
        )
        sys.exit(1)

from . import core

# Analyses are cached per source under one root so repeated questions about the
# same video (or a follow-up get_frames call) never re-download or re-extract.
CACHE_ROOT = Path(os.environ.get("CRV_MCP_CACHE", "~/.cache/crv-mcp")).expanduser()

# Frame images are resized before being returned inline: MCP responses travel
# through the model's context window, so full-resolution frames would blow the
# token budget for zero visual gain.
FRAME_MAX_SIDE = 768
DEFAULT_FRAME_BATCH = 12
TRANSCRIPT_CHAR_CAP = 20_000

mcp_app = _ServerClass("claude-real-video")


def _out_dir_for(source: str) -> Path:
    return CACHE_ROOT / hashlib.sha1(source.encode("utf-8")).hexdigest()[:16]


def _sorted_frames(frames_dir: Path) -> list[Path]:
    def key(p: Path):
        nums = re.findall(r"\d+", p.stem)
        return (int(nums[-1]) if nums else 0, p.name)

    return sorted(
        (p for p in frames_dir.iterdir() if p.suffix.lower() in {".jpg", ".jpeg", ".png"}),
        key=key,
    )


def _frame_image(path: Path) -> Image:
    from PIL import Image as PILImage

    with PILImage.open(path) as im:
        im = im.convert("RGB")
        im.thumbnail((FRAME_MAX_SIDE, FRAME_MAX_SIDE))
        buf = io.BytesIO()
        im.save(buf, format="JPEG", quality=82)
    return Image(data=buf.getvalue(), format="jpeg")


def _read_capped(path: Path, cap: int) -> str:
    text = path.read_text(encoding="utf-8", errors="replace")
    if len(text) <= cap:
        return text
    return text[:cap] + f"\n…[transcript truncated at {cap} characters — read {path} for the rest]"


@mcp_app.tool()
def watch_video(
    source: str,
    max_frames: int = DEFAULT_FRAME_BATCH,
    language: str = "auto",
    transcribe: bool = True,
) -> list:
    """Actually watch a video: download (URL) or read (local path), extract
    scene-aware deduplicated keyframes and a timestamped transcript, all
    locally. Returns the transcript plus the first batch of keyframes as
    images; use get_frames for more frames from the same video.

    Args:
        source: Video URL (YouTube, Instagram, ...) or a local file path.
        max_frames: How many keyframes to return inline (1-24, default 12).
        language: Transcript language hint, e.g. "auto", "en", "zh".
        transcribe: Set false to skip audio transcription (frames only).
    """
    max_frames = max(1, min(24, max_frames))
    out_dir = _out_dir_for(source)
    manifest = out_dir / "MANIFEST.txt"

    if manifest.exists():
        result_note = "cached analysis (already processed earlier)"
    else:
        out_dir.parent.mkdir(parents=True, exist_ok=True)
        r = core.process(
            source,
            str(out_dir),
            lang=language,
            do_transcribe=transcribe,
            overwrite=True,
        )
        result_note = f"duration {r.duration}s, {r.frame_count} keyframes kept"

    frames = _sorted_frames(out_dir / "frames")
    transcript_path = out_dir / "transcript.txt"

    parts: list = []
    header = [
        f"claude-real-video analysis of: {source}",
        f"({result_note})",
        f"keyframes: {len(frames)} total, showing 1-{min(max_frames, len(frames))} "
        f"(call get_frames with start_index for more)",
        f"output dir: {out_dir}",
    ]
    if transcript_path.exists():
        header.append("--- timestamped transcript ---")
        header.append(_read_capped(transcript_path, TRANSCRIPT_CHAR_CAP))
    else:
        header.append("(no transcript: video has no audio, transcription disabled, "
                      "or whisper is not installed)")
    parts.append("\n".join(header))
    parts.extend(_frame_image(p) for p in frames[:max_frames])
    return parts


@mcp_app.tool()
def get_frames(source: str, start_index: int = 1, count: int = DEFAULT_FRAME_BATCH) -> list:
    """Fetch more keyframes from a video already analysed with watch_video.

    Args:
        source: The same URL or path given to watch_video.
        start_index: 1-based index of the first frame to return.
        count: How many frames to return (1-24).
    """
    count = max(1, min(24, count))
    out_dir = _out_dir_for(source)
    frames_dir = out_dir / "frames"
    if not frames_dir.is_dir():
        return [f"No analysis found for this source — call watch_video first. (looked in {out_dir})"]
    frames = _sorted_frames(frames_dir)
    if not frames:
        return ["The analysis exists but holds no frames — re-run watch_video."]
    start = max(1, start_index) - 1
    batch = frames[start : start + count]
    if not batch:
        return [f"start_index {start_index} is past the end — this video has {len(frames)} keyframes."]
    parts: list = [
        f"keyframes {start + 1}-{start + len(batch)} of {len(frames)} for: {source}"
    ]
    parts.extend(_frame_image(p) for p in batch)
    return parts


def main() -> None:
    mcp_app.run()


if __name__ == "__main__":
    main()
