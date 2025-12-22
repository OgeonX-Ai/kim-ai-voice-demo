# Gate faster-whisper on supported Python versions and document runner guidance

![enterprise-ai-gateway](https://img.shields.io/badge/repo-enterprise-ai-gateway-blue)

**PR:** [#24](https://github.com/OgeonX-Ai/enterprise-ai-gateway/pull/24)\  
**Repo:** enterprise-ai-gateway\  
**Merged:** 2025-12-18T15:29:28Z\  
**Author:** OgeonX-Ai

## What changed
## Summary
- gate the faster-whisper dependency to Python versions with available PyAV wheels to avoid failing installs on the Windows runner
- document the recommendation to use Python 3.11–3.12 on the self-hosted runner in the README and pipeline guide

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
