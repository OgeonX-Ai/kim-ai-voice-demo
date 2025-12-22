# Devlog sync workflow fixes

Issue Description:
npm install failed due to missing scripts/package.json and repo listing returned 404 for user org.

State:
Workflow failed before syncing PRs.

Action:
Skipped npm install when scripts/package.json is missing, used github.token, and made repo listing fall back to /users when /orgs returns 404.

Result:
Devlog sync now completes successfully.

Rationale:
Guarded installs prevent hard failures and user/org mismatch must be handled explicitly.

Diff Patch:
```diff
commit 91e96c2578def35dac02988254eab22dab265b8f
Author: Kim Harjamaki <ogeon@msn.com>
Date:   Mon Dec 22 23:20:58 2025 +0200

    Fix devlog sync workflow and repo fetch

diff --git a/.github/workflows/devlog-sync.yml b/.github/workflows/devlog-sync.yml
index 990efeb..ce434b6 100644
--- a/.github/workflows/devlog-sync.yml
+++ b/.github/workflows/devlog-sync.yml
@@ -20,12 +20,16 @@ jobs:
         with:
           node-version: '20'
       - name: Install dependencies
-        run: npm install
-        working-directory: scripts
+        run: |
+          if [ -f scripts/package.json ]; then
+            npm install --prefix scripts
+          else
+            echo "No scripts/package.json; skipping npm install."
+          fi
         continue-on-error: true
       - name: Sync merged PRs across org
         env:
-          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
+          GITHUB_TOKEN: ${{ github.token }}
           GH_AGGREGATOR_TOKEN: ${{ secrets.GH_AGGREGATOR_TOKEN }}
         run: |
           node scripts/sync-org-prs.mjs
diff --git a/scripts/sync-org-prs.mjs b/scripts/sync-org-prs.mjs
index 096e718..49d1ab5 100644
--- a/scripts/sync-org-prs.mjs
+++ b/scripts/sync-org-prs.mjs
@@ -54,8 +54,23 @@ function saveCache(cache) {
 async function fetchAllRepos() {
   const repos = [];
   let page = 1;
+  let baseUrl = `https://api.github.com/orgs/${ORG}/repos`;
   while (true) {
-    const pageRepos = await githubRequest(`https://api.github.com/orgs/${ORG}/repos?per_page=100&page=${page}`);
+    const response = await fetch(`${baseUrl}?per_page=100&page=${page}`, { headers });
+    if (response.status === 404) {
+      if (baseUrl.includes('/orgs/')) {
+        baseUrl = `https://api.github.com/users/${ORG}/repos`;
+        page = 1;
+        continue;
+      }
+      const text = await response.text();
+      throw new Error(`GitHub API error ${response.status}: ${text}`);
+    }
+    if (!response.ok) {
+      const text = await response.text();
+      throw new Error(`GitHub API error ${response.status}: ${text}`);
+    }
+    const pageRepos = await response.json();
     if (!Array.isArray(pageRepos) || pageRepos.length === 0) break;
     repos.push(...pageRepos.filter((repo) => !repo.archived && repo.private === false));
     page += 1;
```
