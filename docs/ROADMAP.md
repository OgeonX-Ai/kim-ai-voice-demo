# Roadmap Issue Sync

This repository can create and update GitHub Issues from a single YAML file so roadmap items stay organized without manual duplication.

## Source file
- `roadmap/roadmap.yml` defines milestones and roadmap issues.
- Each issue includes a stable `key` used to track and update the issue body.
- A hidden marker `<!-- roadmap-key: <key> -->` is injected into every synced issue body.

## Workflow
- `.github/workflows/roadmap-sync.yml` can run manually (`workflow_dispatch`) or on the daily schedule.
- The workflow installs a YAML parser, runs `scripts/sync-roadmap-issues.mjs`, and syncs issues for each roadmap item.
- Permissions: issues write, contents read.

## YAML format (example)
```yaml
milestone: "Dev Log v1"
issues:
  - key: "devlog-dashboard-polish"
    title: "Polish Dev Log Dashboard (product-grade)"
    repo: "kim-ai-voice-demo"
    labels: ["roadmap", "frontend", "devlog"]
    priority: "P1"
    body: |
      Goal:
      - Make dashboard look product-grade and easy to scan.

      Acceptance criteria:
      - KPI cards, charts, filters, responsive
      - Reads stats.json + posts.json
      - No external JS frameworks

      Tasks:
      - [ ] Add posts.json generation
      - [ ] Improve CSS + layout
      - [ ] Add repo filter + search
      - [ ] Add charts
```

## Behavior
1. The script fetches roadmap items and optional milestone name from `roadmap.yml`.
2. For each issue:
   - Searches the target repo for an issue containing the matching roadmap marker.
   - If found, updates the title, body, and ensures labels are present.
   - If not found, creates a new issue with the provided metadata.
3. Labels referenced in YAML are created automatically if missing.
4. If a milestone name is provided, it is created when absent and applied to the issues.

## How to run locally
1. Ensure `node >= 18` and a `GITHUB_TOKEN` with `repo` scope is available in the environment.
2. Install dependencies: `npm install yaml --no-save --no-package-lock`.
3. Run: `node scripts/sync-roadmap-issues.mjs`.

## Notes
- The script is idempotent; re-running will not duplicate issues.
- All API interactions are scoped to the `GITHUB_TOKEN` repository permissions.
- Roadmap items can target any repo within the same GitHub organization.
