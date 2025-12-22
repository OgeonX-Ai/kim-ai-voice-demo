# Gracefully handle missing faster-whisper dependency

![enterprise-ai-gateway](https://img.shields.io/badge/repo-enterprise-ai-gateway-blue)

**PR:** [#25](https://github.com/OgeonX-Ai/enterprise-ai-gateway/pull/25)\  
**Repo:** enterprise-ai-gateway\  
**Merged:** 2025-12-18T15:38:39Z\  
**Author:** OgeonX-Ai

## What changed
## Summary
- adjust local Whisper provider and helper to lazy-import faster-whisper and raise clear dependency guidance when absent
- keep whisper demo routes importable on Python versions without available faster-whisper wheels

## Testing
- python -m ruff check backend
- python -m pytest -q backend

------
[Codex Task](https://chatgpt.com/codex/tasks/task_e_694400e34efc8325807c70c531c15e20)

## Impact
- +undefined / -undefined
- undefined files changed

## Tags
codex
