# Add conversion-aware transcription endpoint and debug log stream

![enterprise-ai-gateway](https://img.shields.io/badge/repo-enterprise-ai-gateway-blue)

**PR:** [#14](https://github.com/OgeonX-Ai/enterprise-ai-gateway/pull/14)\  
**Repo:** enterprise-ai-gateway\  
**Merged:** 2025-12-16T23:46:11Z\  
**Author:** OgeonX-Ai

## What changed
## Summary
- add ffmpeg-backed conversion for webm/ogg uploads with detailed logging and timing in /v1/audio/transcribe-file
- broadcast backend logs over SSE and wire app state to expose /v1/debug/stream
- enrich health metadata for UI runtime cards and keep settings for debug streaming

## Testing
- python -m compileall backend/app

------
[Codex Task](https://chatgpt.com/codex/tasks/task_e_6941e4ddf7448325988b0bcab26c87a2)

## Impact
- +undefined / -undefined
- undefined files changed

## Tags
codex
