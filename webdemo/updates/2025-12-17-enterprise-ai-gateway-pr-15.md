# Add structured JSON logging for debug stream visibility

![enterprise-ai-gateway](https://img.shields.io/badge/repo-enterprise-ai-gateway-blue)

**PR:** [#15](https://github.com/OgeonX-Ai/enterprise-ai-gateway/pull/15)\  
**Repo:** enterprise-ai-gateway\  
**Merged:** 2025-12-17T00:12:50Z\  
**Author:** OgeonX-Ai

## What changed
## Summary
- switch logging to JSON line events with timestamps, correlation IDs, and stack details for console and SSE consumers
- add structured log_event helpers across speech, audio upload, ServiceNow tools, and runtime flows to emit consistent event names
- ensure SSE debug stream replays the same structured records for richer local debugging

## Testing
- python -m compileall backend/app

------
[Codex Task](https://chatgpt.com/codex/tasks/task_e_6941e4ddf7448325988b0bcab26c87a2)

## Impact
- +undefined / -undefined
- undefined files changed

## Tags
codex
