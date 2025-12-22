# Add backend automation for ElevenLabs agents and Whisper playground

![kim-ai-voice-demo](https://img.shields.io/badge/repo-kim-ai-voice-demo-blue)

**PR:** [#3](https://github.com/OgeonX-Ai/kim-ai-voice-demo/pull/3)\  
**Repo:** kim-ai-voice-demo\  
**Merged:** 2025-12-16T20:58:58Z\  
**Author:** OgeonX-Ai

## What changed
## Summary
- Add an Express-based `enterprise-ai-gateway` with an agent automation endpoint, share-link retrieval, and a Whisper test stub that keeps API keys in-memory only.
- Extend the landing page with API key + agent name automation form, manual fallback guidance, and key-handling disclosure alongside the optional Whisper test uploader.
- Add a polished Whisper Playground page for microphone capture and multipart uploads to `/v1/audio/transcribe-file`, plus README notes and a link from the main site.

## Testing
- npm install --prefix enterprise-ai-gateway *(fails: 403 Forbidden from registry in this environment)*

------
[Codex Task](https://chatgpt.com/codex/tasks/task_e_6941af9c4b0c8325b70c0ef267f924e6)

## Impact
- +undefined / -undefined
- undefined files changed

## Tags
codex
