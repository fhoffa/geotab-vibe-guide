#!/usr/bin/env python3
"""
Fetch YouTube transcripts for all Geotab Vibe Coding playlist videos.

Usage:
    pip install youtube-transcript-api
    python3 transcripts/fetch_transcripts.py

Outputs one .txt file per video in the transcripts/ directory.
"""

from youtube_transcript_api import YouTubeTranscriptApi

VIDEOS = [
    ("Zuazi88lBeg", "kickoff-webinar"),
    ("avEXlVw2lU8", "google-ai-tools-deep-dive"),
    ("SS3Y9UBDfoA", "vibe-coding-geofencing-app"),
    ("EiZsIof1Scw", "lp-papillon-last-week-in-fleet"),
]

api = YouTubeTranscriptApi()

for vid_id, slug in VIDEOS:
    out_path = f"transcripts/{slug}.txt"
    try:
        transcript = api.fetch(vid_id)
        segments = list(transcript)
        text = "\n".join(seg["text"] for seg in segments)
        with open(out_path, "w") as f:
            f.write(text)
        duration_min = sum(s["duration"] for s in segments) / 60
        print(f"[ok] {slug}.txt  ({len(segments)} segments, ~{duration_min:.0f} min)")
    except Exception as e:
        print(f"[err] {vid_id} ({slug}): {e}")
