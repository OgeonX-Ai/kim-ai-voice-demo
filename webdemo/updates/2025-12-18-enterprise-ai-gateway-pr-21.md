# Fix CI workflow ruff invocation on Windows runner

![enterprise-ai-gateway](https://img.shields.io/badge/repo-enterprise-ai-gateway-blue)

**PR:** [#21](https://github.com/OgeonX-Ai/enterprise-ai-gateway/pull/21)\  
**Repo:** enterprise-ai-gateway\  
**Merged:** 2025-12-18T14:34:14Z\  
**Author:** OgeonX-Ai

## What changed
## Summary
- call ruff and pytest via `python -m` so the commands resolve on the Windows self-hosted runner
- ensure triage diagnostics use the module invocations as well

## Testing
- not run (workflow change only)


------
[Codex Task](https://chatgpt.com/codex/tasks/task_e_694400e34efc8325807c70c531c15e20)

## Impact
- +undefined / -undefined
- undefined files changed

## Tags
codex
