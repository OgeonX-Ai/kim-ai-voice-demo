# Add helper scripts and align CI and docs for showcase

![enterprise-ai-gateway](https://img.shields.io/badge/repo-enterprise-ai-gateway-blue)

**PR:** [#23](https://github.com/OgeonX-Ai/enterprise-ai-gateway/pull/23)\  
**Repo:** enterprise-ai-gateway\  
**Merged:** 2025-12-18T15:12:46Z\  
**Author:** OgeonX-Ai

## What changed
## Summary
- add PowerShell helper scripts for Ruff linting and pytest execution to mirror the Windows runner
- update CI workflow to use the helper scripts with system Python and document pipeline/triage behavior
- adjust tests and stubs so Ruff passes and pytest succeeds with current audio route implementation

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
