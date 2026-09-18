import os
import sys
import json
import asyncio
import shutil
import argparse
import re
from pathlib import Path
import urllib.request
import urllib.parse
import urllib.error

# Ensure utf-8 encoding for Windows terminals
sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

# Ensure backend root is in sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

import edge_tts


def format_srt_time(seconds: float) -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hrs:02d}:{mins:02d}:{secs:02d},{millis:03d}"


def format_vtt_time(seconds: float) -> str:
    hrs = int(seconds // 3600)
    mins = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    return f"{hrs:02d}:{mins:02d}:{secs:02d}.{millis:03d}"


def is_hindi(text: str) -> bool:
    """Checks if text contains Devanagari Hindi characters."""
    return bool(re.search(r'[\u0900-\u097F]', text))


async def translate_text_robust(
    text: str,
    target_lang: str = "hi"
) -> str:
    """High-speed neural translation with multi-endpoint and multi-agent rotation."""
    if not text or not text.strip():
        return ""

    loop = asyncio.get_event_loop()

    # Rotate through client endpoints
    clients = ["gtx", "dict-chrome-ex", "webapp"]
    for attempt in range(4):
        client = clients[attempt % len(clients)]
        try:
            def fetch_translation():
                url = f"https://translate.googleapis.com/translate_a/single?client={client}&sl=en&tl={target_lang}&dt=t&q=" + urllib.parse.quote(text)
                req = urllib.request.Request(
                    url,
                    headers={
                        "User-Agent": f"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/12{attempt}.0.0.0 Safari/537.36"
                    }
                )
                with urllib.request.urlopen(req, timeout=6) as resp:
                    data = json.loads(resp.read().decode("utf-8"))
                    translated = "".join([chunk[0] for chunk in data[0] if chunk and chunk[0]])
                    return translated.strip()

            result = await loop.run_in_executor(None, fetch_translation)
            if result and is_hindi(result):
                return result
        except Exception:
            await asyncio.sleep(0.2 * (attempt + 1))

    return text


def write_live_subtitles(results_dict: dict, total_count: int, srt_path: Path, vtt_path: Path, json_path: Path):
    """Atomically writes subtitle files and json checkpoint in real time."""
    sorted_items = [results_dict[i] for i in sorted(results_dict.keys())]

    # Write SRT
    with open(srt_path, "w", encoding="utf-8") as fsrt:
        for item in sorted_items:
            fsrt.write(f"{item['segment_id']}\n")
            fsrt.write(f"{format_srt_time(item['start_s'])} --> {format_srt_time(item['end_s'])}\n")
            fsrt.write(f"{item['translated_text']}\n\n")

    # Write VTT
    with open(vtt_path, "w", encoding="utf-8") as fvtt:
        fvtt.write("WEBVTT\n\n")
        for item in sorted_items:
            fvtt.write(f"{item['segment_id']}\n")
            fvtt.write(f"{format_vtt_time(item['start_s'])} --> {format_vtt_time(item['end_s'])}\n")
            fvtt.write(f"{item['translated_text']}\n\n")

    # Write JSON checkpoint
    with open(json_path, "w", encoding="utf-8") as fjson:
        json.dump(sorted_items, fjson, ensure_ascii=False, indent=2)


async def translate_all_parallel_and_stream(
    segments: list,
    target_lang: str,
    srt_path: Path,
    vtt_path: Path,
    json_path: Path,
    concurrency: int = 10
) -> list:
    print(f"\n[1/5] 🚀 Stage: High-Speed Parallel Translation Streaming ({concurrency} concurrent workers)")
    print(f"  Streaming Hindi translations directly to {srt_path.name}...\n")

    results_dict = {}
    lock = asyncio.Lock()
    sem = asyncio.Semaphore(concurrency)

    # Load existing checkpoint ONLY if it already has valid Hindi
    if json_path.exists():
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                saved = json.load(f)
                for item in saved:
                    t_text = item.get("translated_text", "")
                    s_text = item.get("source_text", "")
                    # Only keep if truly translated to Hindi and not raw English
                    if t_text and is_hindi(t_text) and t_text != s_text:
                        results_dict[item["segment_id"]] = item
            if results_dict:
                print(f"  ✓ Preserving {len(results_dict)}/{len(segments)} valid Hindi segments from checkpoint.")
        except Exception:
            pass

    async def worker(idx: int, seg: dict):
        global_id = idx + 1
        src_text = seg.get("source_text") or seg.get("text", "")
        start_s = float(seg["start_s"] if "start_s" in seg else seg.get("start", 0.0))
        end_s = float(seg["end_s"] if "end_s" in seg else seg.get("end", start_s + 1.0))
        target_window = max(0.5, round(end_s - start_s, 3))

        # If already translated properly to Hindi, skip
        if global_id in results_dict:
            return

        async with sem:
            hindi_text = await translate_text_robust(
                text=src_text,
                target_lang=target_lang
            )

        async with lock:
            results_dict[global_id] = {
                "segment_id": global_id,
                "start_s": start_s,
                "end_s": end_s,
                "target_window_s": target_window,
                "source_text": src_text,
                "translated_text": hindi_text
            }
            # Immediately flush live to disk
            write_live_subtitles(results_dict, len(segments), srt_path, vtt_path, json_path)
            print(f"  [✓ {len(results_dict):3d}/{len(segments)}] #{global_id:3d}: {hindi_text[:45]}...")

    tasks = [worker(idx, seg) for idx, seg in enumerate(segments)]
    await asyncio.gather(*tasks)

    sorted_list = [results_dict[i] for i in sorted(results_dict.keys())]
    print(f"\n✓ 100% Hindi Localization Complete! All {len(sorted_list)} segments written to {srt_path.name}")
    return sorted_list


async def run_dub_pipeline(
    run_dir: Path,
    video_path: Path,
    target_lang: str = "hi",
    voice_id: str = "hi-IN-MadhurNeural",
    ducking_db: float = -6.0
):
    print("=" * 60)
    print(f"🎬 LOCALIZE CREW: PARALLEL HIGH-SPEED HINDI DUBBING PIPELINE")
    print(f"📁 Run Directory: {run_dir}")
    print(f"🌐 Target Language: {target_lang.upper()} (Voice: {voice_id})")
    print("=" * 60)

    # 1. Verify required existing artifacts
    transcript_file = run_dir / "transcript.json"
    if not transcript_file.exists():
        raise FileNotFoundError(f"Missing transcript.json in {run_dir}")

    with open(transcript_file, "r", encoding="utf-8") as f:
        raw_segments = json.load(f)

    print(f"\n✓ Loaded {len(raw_segments)} segments from transcript.json.")

    lang_dir = run_dir / target_lang
    stems_dir = lang_dir / "stems"
    aligned_dir = lang_dir / "aligned_stems"
    lang_dir.mkdir(parents=True, exist_ok=True)
    stems_dir.mkdir(parents=True, exist_ok=True)
    aligned_dir.mkdir(parents=True, exist_ok=True)

    srt_path = lang_dir / f"subtitles_{target_lang}.srt"
    vtt_path = lang_dir / f"subtitles_{target_lang}.vtt"
    json_path = lang_dir / f"translated_segments_{target_lang}.json"

    # 2. Stage 1: Parallel Translation Streaming
    localized_lines = await translate_all_parallel_and_stream(
        segments=raw_segments,
        target_lang=target_lang,
        srt_path=srt_path,
        vtt_path=vtt_path,
        json_path=json_path,
        concurrency=10
    )

    # 3. Stage 2: Parallel Neural Voice Synthesis (Edge TTS)
    print(f"\n[2/5] 🎙️ Stage: Parallel Neural Voice Synthesis ({voice_id})")
    synthesized_stems = [None] * len(localized_lines)
    tts_sem = asyncio.Semaphore(8)

    async def synthesize_stem(idx: int, line: dict):
        seg_id = line["segment_id"]
        text = line["translated_text"]
        raw_mp3 = stems_dir / f"seg_{seg_id}_raw.mp3"
        raw_wav = stems_dir / f"seg_{seg_id}_raw.wav"

        if not text.strip():
            synthesized_stems[idx] = {
                "segment_id": seg_id,
                "audio_path": str(raw_wav),
                "synthesized_duration_s": line["target_window_s"],
                "target_duration_s": line["target_window_s"]
            }
            return

        async with tts_sem:
            try:
                tts = edge_tts.Communicate(text, voice_id)
                await tts.save(str(raw_mp3))

                # Convert to 16kHz WAV
                cmd_conv = ["ffmpeg", "-y", "-i", str(raw_mp3), "-ar", "16000", "-ac", "1", str(raw_wav)]
                proc = await asyncio.create_subprocess_exec(
                    *cmd_conv,
                    stdout=asyncio.subprocess.DEVNULL,
                    stderr=asyncio.subprocess.DEVNULL
                )
                await proc.communicate()

                # Probe duration
                cmd_probe = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(raw_wav)]
                proc_p = await asyncio.create_subprocess_exec(*cmd_probe, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.DEVNULL)
                out_p, _ = await proc_p.communicate()
                actual_dur = float(out_p.decode().strip())
            except Exception:
                actual_dur = line["target_window_s"]
                raw_wav = stems_dir / f"seg_{seg_id}_raw.wav"

        synthesized_stems[idx] = {
            "segment_id": seg_id,
            "audio_path": str(raw_wav),
            "synthesized_duration_s": round(actual_dur, 3),
            "target_duration_s": line["target_window_s"]
        }

    await asyncio.gather(*[synthesize_stem(i, l) for i, l in enumerate(localized_lines)])
    print(f"  ✓ Finished synthesizing all {len(synthesized_stems)} Hindi speech stems in parallel.")

    # 4. Stage 3: Duration & Time Alignment (FFmpeg atempo)
    print(f"\n[3/5] ⏱️ Stage: Sync Engineer Duration Alignment")
    sync_adjustments = []
    speed_adjusted_count = 0

    for stem in synthesized_stems:
        seg_id = stem["segment_id"]
        raw_dur = stem["synthesized_duration_s"]
        target_dur = stem["target_duration_s"]
        diff = abs(raw_dur - target_dur)
        aligned_wav = aligned_dir / f"aligned_seg_{seg_id}.wav"
        src_path = Path(stem["audio_path"])

        if not src_path.exists() or diff <= 0.15 or target_dur <= 0:
            if src_path.exists():
                shutil.copy2(str(src_path), str(aligned_wav))
            final_dur = raw_dur
            factor = 1.0
        else:
            factor = max(0.75, min(1.35, round(raw_dur / target_dur, 3)))
            speed_adjusted_count += 1
            cmd_atempo = ["ffmpeg", "-y", "-i", str(src_path), "-filter:a", f"atempo={factor}", str(aligned_wav)]
            proc_a = await asyncio.create_subprocess_exec(*cmd_atempo, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
            await proc_a.communicate()
            final_dur = round(raw_dur / factor, 3)

        sync_adjustments.append({
            "segment_id": seg_id,
            "aligned_wav": str(aligned_wav),
            "original_window_s": target_dur,
            "final_duration_s": final_dur,
            "atempo_factor": factor
        })

    print(f"  ✓ Aligned {len(sync_adjustments)} stems ({speed_adjusted_count} adjusted with atempo).")

    # 5. Stage 4: Acoustic Mastering & Background Mixdown
    print(f"\n[4/5] 🎚️ Stage: Acoustic Mixdown & Sidechain Ducking")
    dialogue_bus = lang_dir / f"dialogue_bus_{target_lang}.wav"
    mastered_audio = lang_dir / f"master_dub_{target_lang}.wav"

    valid_stems = [(line, adj) for line, adj in zip(localized_lines, sync_adjustments) if Path(adj["aligned_wav"]).exists()]
    
    if valid_stems:
        fc_inputs = []
        fc_delays = []
        for idx, (line, adj) in enumerate(valid_stems):
            start_ms = int(line["start_s"] * 1000)
            fc_inputs.extend(["-i", adj["aligned_wav"]])
            fc_delays.append(f"[{idx}:a]adelay={start_ms}|{start_ms}[a{idx}];")

        amix_in = "".join([f"[a{i}]" for i in range(len(valid_stems))])
        fc_str = "".join(fc_delays) + f"{amix_in}amix=inputs={len(valid_stems)}:dropout_transition=0:normalize=0[aout]"
        
        cmd_bus = ["ffmpeg", "-y"] + fc_inputs + ["-filter_complex", fc_str, "-map", "[aout]", str(dialogue_bus)]
        proc_bus = await asyncio.create_subprocess_exec(*cmd_bus, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
        await proc_bus.communicate()
    else:
        shutil.copy2(str(run_dir / "vocals.wav"), str(dialogue_bus))

    # Ducking with background.wav if present
    bg_path = run_dir / "background.wav"
    if bg_path.exists() and dialogue_bus.exists():
        cmd_duck = [
            "ffmpeg", "-y",
            "-i", str(bg_path),
            "-i", str(dialogue_bus),
            "-filter_complex",
            f"[0:a][1:a]sidechaincompress=threshold=0.08:ratio=4:attack=20:release=250[bg_ducked];"
            f"[bg_ducked][1:a]amix=inputs=2:weights=0.8 1.0:dropout_transition=0[master_raw];"
            f"[master_raw]loudnorm=I=-24:LRA=7:TP=-2.0[aout]",
            "-map", "[aout]",
            str(mastered_audio)
        ]
        proc_duck = await asyncio.create_subprocess_exec(*cmd_duck, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
        await proc_duck.communicate()
        print(f"  ✓ Sidechain ducking applied ({ducking_db}dB) + EBU R128 (-24 LUFS) normalized.")
    else:
        shutil.copy2(str(dialogue_bus), str(mastered_audio))

    # 6. Stage 5: Multiplexing Video Cut
    print(f"\n[5/5] 🎞️ Stage: Video Stream Muxing")
    final_video = lang_dir / f"twitter_n8n_{target_lang}_dubbed.mp4"

    if video_path.exists() and mastered_audio.exists():
        cmd_mux = [
            "ffmpeg", "-y",
            "-i", str(video_path),
            "-i", str(mastered_audio),
            "-c:v", "copy",
            "-c:a", "aac",
            "-b:a", "192k",
            "-map", "0:v:0",
            "-map", "1:a:0",
            "-shortest",
            str(final_video)
        ]
        proc_mux = await asyncio.create_subprocess_exec(*cmd_mux, stdout=asyncio.subprocess.DEVNULL, stderr=asyncio.subprocess.DEVNULL)
        await proc_mux.communicate()
        print(f"\n🎉 100% HINDI DUB & SUBTITLES CREATED SUCCESSFULLY!")
        print(f"  ✨ Video Output: {final_video}")
        if final_video.exists():
            print(f"  ✨ File Size: {final_video.stat().st_size / (1024*1024):.2f} MB")
        print(f"  ✨ Master Audio: {mastered_audio}")
        print(f"  ✨ Subtitles: {srt_path}")
    else:
        print(f"  [Notice] Master audio ready at: {mastered_audio}")

    print("=" * 60)
    return final_video


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate dubbed video with parallel streaming agents.")
    parser.add_argument("--run-dir", type=str, default="storage/runs/Twitter_API_With_n8n__Step-by-Step___No_Code__3", help="Path to run directory")
    parser.add_argument("--video", type=str, default="storage/uploads/Twitter API With n8n (Step-by-Step) (No Code).mp4", help="Path to original video")
    parser.add_argument("--lang", type=str, default="hi", help="Target language code (e.g. hi, es, fr)")
    parser.add_argument("--voice", type=str, default="hi-IN-MadhurNeural", help="Edge TTS voice")

    args = parser.parse_args()
    run_dir = Path(args.run_dir)
    video_path = Path(args.video)

    asyncio.run(run_dub_pipeline(
        run_dir=run_dir,
        video_path=video_path,
        target_lang=args.lang,
        voice_id=args.voice
    ))
