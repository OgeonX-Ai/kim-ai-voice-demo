# Add runtime stats endpoint and enrich health metadata

![enterprise-ai-gateway](https://img.shields.io/badge/repo-enterprise-ai-gateway-blue)

**PR:** [#13](https://github.com/OgeonX-Ai/enterprise-ai-gateway/pull/13)\  
**Repo:** enterprise-ai-gateway\  
**Merged:** 2025-12-16T22:05:25Z\  
**Author:** OgeonX-Ai

## What changed
## Summary
- add in-memory runtime stats tracker and expose live metrics via `/v1/runtime` alongside enriched `/healthz` metadata
- tighten the multipart `/v1/audio/transcribe-file` flow with timing metrics, defaults, and error handling while keeping demo CORS origins enabled
- refresh tests to cover the updated health payload, runtime stats endpoint, and new timing fields

## Testing
- Not run (not available in this environment)


------
[Codex Task](https://chatgpt.com/codex/tasks/task_e_694076ab51b483259d99208618188473)

## Impact
- +undefined / -undefined
- undefined files changed

## Tags
codex
