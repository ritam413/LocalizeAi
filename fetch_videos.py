import yt_dlp
import json
import os

def fetch_latest_videos(channel_url, limit=10):
    ydl_opts = {
        'extract_flat': 'in_playlist',
        'playlistend': limit,
        'quiet': True,
        'no_warnings': True
    }
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(channel_url, download=False)
        entries = info.get('entries', [])
        
    videos = []
    print(f"Found {len(entries)} video entries. Extracting full info for top {limit}...")
    
    # Now get detailed info for each video (description, upload date, tags, etc.)
    detail_opts = {
        'quiet': True,
        'no_warnings': True,
        'skip_download': True,
        'writesubtitles': False,
        'writeautomaticsub': False,
    }
    
    with yt_dlp.YoutubeDL(detail_opts) as ydl:
        for idx, entry in enumerate(entries[:limit]):
            vid_id = entry.get('id')
            vid_url = f"https://www.youtube.com/watch?v={vid_id}"
            try:
                vinfo = ydl.extract_info(vid_url, download=False)
                video_data = {
                    'index': idx + 1,
                    'id': vid_id,
                    'title': vinfo.get('title'),
                    'upload_date': vinfo.get('upload_date'),
                    'webpage_url': vid_url,
                    'description': vinfo.get('description'),
                    'tags': vinfo.get('tags', []),
                    'categories': vinfo.get('categories', [])
                }
                videos.append(video_data)
                print(f"[{idx+1}/{limit}] Downloaded metadata: {video_data['title']} ({video_data['upload_date']})")
            except Exception as e:
                print(f"Error fetching {vid_url}: {e}")
                
    output_path = "latest_10_videos_detailed.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(videos, f, indent=2, ensure_ascii=False)
    print(f"Saved detailed info to {output_path}")

if __name__ == "__main__":
    fetch_latest_videos("https://www.youtube.com/@shivamlucknowi/videos", 10)
