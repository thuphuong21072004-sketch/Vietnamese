import sys
import json
import requests
from youtube_transcript_api import YouTubeTranscriptApi


def get_title(video_id):
    try:
        url = f"https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v={video_id}&format=json"
        res = requests.get(url, timeout=10)
        if res.status_code == 200:
            return res.json().get("title", video_id)
    except Exception:
        pass
    return video_id


def get_transcript(video_id):
    try:
        return YouTubeTranscriptApi.get_transcript(video_id, languages=["vi"])
    except Exception:
        return []


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "youtubeId argument required"}), flush=True)
        sys.exit(1)

    video_id = sys.argv[1]
    title = get_title(video_id)
    raw = get_transcript(video_id)

    transcripts = [
        {"text": line.get("text", "").strip(), "start": float(line.get("start", 0))}
        for line in raw
        if line.get("text", "").strip()
    ]

    print(json.dumps({"title": title, "transcripts": transcripts}), flush=True)
