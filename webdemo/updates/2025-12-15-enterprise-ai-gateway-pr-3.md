# Add real connectors and config validation

![enterprise-ai-gateway](https://img.shields.io/badge/repo-enterprise-ai-gateway-blue)

**PR:** [#3](https://github.com/OgeonX-Ai/enterprise-ai-gateway/pull/3)\  
**Repo:** enterprise-ai-gateway\  
**Merged:** 2025-12-15T16:39:19Z\  
**Author:** OgeonX-Ai

## What changed
## Summary
- add Azure OpenAI, Speech, AI Search, and service desk connectors with feature flags and env-driven registry
- expose registry filtering and /v1/admin/config/validate for safe configuration checks plus updated setup docs and UI
- enhance agent runtime and frontend to surface provider configuration, debug data, and mock defaults without exposing secrets

## Testing
- python -m compileall backend/app

------
[Codex Task](https://chatgpt.com/codex/tasks/task_e_694028b03f248325a133e16adf2690cd)

## Impact
- +undefined / -undefined
- undefined files changed

## Tags
codex
