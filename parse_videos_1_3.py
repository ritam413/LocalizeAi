import json

with open("latest_10_videos_detailed.json", "r", encoding="utf-8") as f:
    videos = json.load(f)

for v in videos[:3]:
    print("=" * 80)
    print(f"VIDEO #{v['index']}: {v['title']}")
    print(f"Date: {v['upload_date']} | URL: {v['webpage_url']}")
    print("-" * 40)
    desc = v.get('description', '')
    print(desc)
    print("\n")
