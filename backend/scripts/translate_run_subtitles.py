import json
import re
import asyncio
import httpx
from pathlib import Path

async def translate_all():
    run_dir = Path("storage/runs/cb8ff0c2-d990-4a4e-bc8a-79e1e91e042a_dub_hi_01")
    transcript_path = run_dir / "transcript.json"
    
    with open(transcript_path, "r", encoding="utf-8") as f:
        segments = json.load(f)
        
    print(f"Total segments to translate: {len(segments)}")
    
    system_prompt = (
        "You are a professional film and media localization director.\n"
        "Translate the following dialogue into natural, colloquial Hindi (hi).\n"
        "Preserve character voice, emotional tone, and rhythmic duration.\n"
        "Do NOT translate proper names, brand names, or software names.\n"
        "Output ONLY valid JSON matching this schema: [{\"id\": 1, \"translated_text\": \"...\"}]"
    )
    
    batch_size = 6
    translated_map = {}
    
    async with httpx.AsyncClient(timeout=180.0) as client:
        for i in range(0, len(segments), batch_size):
            batch = segments[i:i + batch_size]
            batch_items = [
                {"id": i + idx + 1, "text": seg.get("source_text", "")}
                for idx, seg in enumerate(batch)
            ]
            
            print(f"Translating batch {i // batch_size + 1}/{(len(segments) + batch_size - 1) // batch_size} (IDs {i + 1} to {i + len(batch)})...")
            
            payload = {
                "model": "qwen2.5:3b",
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": json.dumps(batch_items, ensure_ascii=False)}
                ],
                "stream": False,
                "options": {
                    "temperature": 0.3
                }
            }
            
            for attempt in range(2):
                try:
                    resp = await client.post("http://127.0.0.1:11434/api/chat", json=payload)
                    if resp.status_code == 200:
                        raw_reply = resp.json().get("message", {}).get("content", "")
                        json_match = re.search(r"\[\s*\{.*\}\s*\]", raw_reply, re.DOTALL)
                        if json_match:
                            try:
                                parsed = json.loads(json_match.group(0))
                                for item in parsed:
                                    translated_map[item.get("id")] = item.get("translated_text", "")
                                    print(f"  [{item.get('id')}] {item.get('translated_text')}")
                                break
                            except Exception as e:
                                print(f"JSON decode error in batch: {e}")
                        else:
                            print(f"Regex match failed for batch. Raw reply:\n{raw_reply}")
                    else:
                        print(f"HTTP error: {resp.status_code} - {resp.text}")
                except Exception as ex:
                    print(f"Attempt {attempt+1} failed: {ex}")
                    await asyncio.sleep(2)

    print(f"Successfully translated {len(translated_map)} / {len(segments)} segments.")
    
    # Save translated segments
    output_segments = []
    for idx, seg in enumerate(segments):
        seg_id = idx + 1
        trans_text = translated_map.get(seg_id) or seg.get("source_text", "")
        seg_copy = dict(seg)
        seg_copy["translated_text"] = trans_text
        seg_copy["target_language"] = "hi"
        output_segments.append(seg_copy)
        
    # Write SRT
    from app.engine.subtitle_formatter import clean_segments, format_srt, format_vtt
    qa_segments = clean_segments(output_segments)
    srt_content = format_srt(qa_segments)
    vtt_content = format_vtt(qa_segments)
    
    srt_path = run_dir / "subtitles_hi.srt"
    vtt_path = run_dir / "subtitles_hi.vtt"
    
    with open(srt_path, "w", encoding="utf-8") as f:
        f.write(srt_content)
        
    with open(vtt_path, "w", encoding="utf-8") as f:
        f.write(vtt_content)
        
    print(f"Saved translated subtitles to {srt_path} and {vtt_path}")

if __name__ == "__main__":
    asyncio.run(translate_all())
