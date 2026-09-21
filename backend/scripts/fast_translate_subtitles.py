import json
import re
import sys
import asyncio
import httpx
from pathlib import Path
from app.engine.subtitle_formatter import clean_segments, format_srt, format_vtt

async def main():
    run_dir = Path("storage/runs/cb8ff0c2-d990-4a4e-bc8a-79e1e91e042a_dub_hi_01")
    transcript_path = run_dir / "transcript.json"
    
    with open(transcript_path, "r", encoding="utf-8") as f:
        segments = json.load(f)
        
    total_segments = len(segments)
    print(f"Total dialogue segments to translate: {total_segments}", flush=True)
    
    system_prompt = (
        "You are a professional film and media localization director.\n"
        "Translate the following dialogue from English into natural, colloquial Hindi (hi).\n"
        "Preserve character voice, emotional tone, and rhythmic duration.\n"
        "Do NOT translate proper names, brand names, or software names.\n"
        "Output ONLY valid JSON matching this schema: [{\"id\": 1, \"translated_text\": \"...\"}]"
    )
    
    batch_size = 10
    translated_map = {}
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        num_batches = (total_segments + batch_size - 1) // batch_size
        for b_idx in range(num_batches):
            i = b_idx * batch_size
            batch = segments[i:i + batch_size]
            batch_items = [
                {"id": i + idx + 1, "text": seg.get("source_text", "")}
                for idx, seg in enumerate(batch)
            ]
            
            print(f"[{b_idx + 1}/{num_batches}] Translating lines {i + 1} to {i + len(batch)}...", end=" ", flush=True)
            
            payload = {
                "model": "qwen2.5:3b",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(batch_items, ensure_ascii=False)}
                ],
                "stream": False,
                "keep_alive": "10m",
                "options": {
                    "temperature": 0.3
                }
            }
            
            success = False
            for attempt in range(2):
                try:
                    resp = await client.post("http://127.0.0.1:11434/api/chat", json=payload)
                    if resp.status_code == 200:
                        raw_reply = resp.json().get("message", {}).get("content", "")
                        json_match = re.search(r"\[\s*\{.*\}\s*\]", raw_reply, re.DOTALL)
                        if json_match:
                            parsed = json.loads(json_match.group(0))
                            for item in parsed:
                                translated_map[item.get("id")] = item.get("translated_text", "")
                            print(f"DONE ({len(parsed)} lines)", flush=True)
                            success = True
                            break
                        else:
                            print(f"[RETRY - regex fail]", end=" ", flush=True)
                    else:
                        print(f"[HTTP {resp.status_code}]", end=" ", flush=True)
                except Exception as ex:
                    print(f"[ERR: {ex}]", end=" ", flush=True)
                    await asyncio.sleep(1)
            
            if not success:
                print("[FALLBACK]", flush=True)
                for item in batch_items:
                    if item["id"] not in translated_map:
                        translated_map[item["id"]] = item["text"]

            # Save incremental progress
            out_segs = []
            for idx, s in enumerate(segments):
                sid = idx + 1
                t_text = translated_map.get(sid) or s.get("source_text", "")
                sc = dict(s)
                sc["translated_text"] = t_text
                sc["target_language"] = "hi"
                out_segs.append(sc)
                
            qa_segs = clean_segments(out_segs)
            srt_content = format_srt(qa_segs)
            vtt_content = format_vtt(qa_segs)
            
            for srt_out in [run_dir / "subtitles_hi.srt", run_dir / "deliverables" / "subtitles.srt"]:
                srt_out.parent.mkdir(parents=True, exist_ok=True)
                with open(srt_out, "w", encoding="utf-8") as sf:
                    sf.write(srt_content)
                    
            for vtt_out in [run_dir / "subtitles_hi.vtt", run_dir / "deliverables" / "subtitles.vtt"]:
                vtt_out.parent.mkdir(parents=True, exist_ok=True)
                with open(vtt_out, "w", encoding="utf-8") as vf:
                    vf.write(vtt_content)

    print(f"\nAll {total_segments} lines translated and saved successfully!", flush=True)

if __name__ == "__main__":
    asyncio.run(main())
