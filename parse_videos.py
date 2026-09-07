import json

with open("latest_10_videos_detailed.json", "r", encoding="utf-8") as f:
    videos = json.load(f)

for v in videos:
    print("=" * 80)
    print(f"VIDEO #{v['index']}: {v['title']}")
    print(f"Date: {v['upload_date']} | URL: {v['webpage_url']}")
    print("-" * 40)
    desc = v.get('description', '')
    # Print description up to 1000 chars or all relevant lines
    print(desc[:1500])
    print("\n")
