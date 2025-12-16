import fs from 'fs';
import path from 'path';
import process from 'process';

const ORG = 'OgeonX-Ai';
const OUTPUT_DIR = path.join('webdemo', 'updates');
const CACHE_PATH = path.join(OUTPUT_DIR, '_cache.json');
const STATS_PATH = path.join(OUTPUT_DIR, 'stats.json');
const INDEX_PATH = path.join(OUTPUT_DIR, 'index.md');

const token = process.env.GH_AGGREGATOR_TOKEN || process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Missing GITHUB_TOKEN or GH_AGGREGATOR_TOKEN');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'User-Agent': 'devlog-sync-script',
  Accept: 'application/vnd.github+json',
};

async function githubRequest(url) {
  const response = await fetch(url, { headers });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }
  return response.json();
}

function ensureDirs() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
  } catch (err) {
    console.warn('Failed to parse cache, starting fresh', err);
    return {};
  }
}

function saveCache(cache) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache, null, 2));
}

async function fetchAllRepos() {
  const repos = [];
  let page = 1;
  while (true) {
    const pageRepos = await githubRequest(`https://api.github.com/orgs/${ORG}/repos?per_page=100&page=${page}`);
    if (!Array.isArray(pageRepos) || pageRepos.length === 0) break;
    repos.push(...pageRepos.filter((repo) => !repo.archived && repo.private === false));
    page += 1;
  }
  return repos;
}

async function fetchMergedPRs(repoName) {
  const mergedPRs = [];
  let page = 1;
  while (true) {
    const pulls = await githubRequest(
      `https://api.github.com/repos/${ORG}/${repoName}/pulls?state=closed&per_page=100&page=${page}`
    );
    if (!Array.isArray(pulls) || pulls.length === 0) break;
    const merged = pulls.filter((pr) => pr.merged_at);
    mergedPRs.push(...merged);
    page += 1;
  }
  return mergedPRs;
}

async function fetchComments(repo, number) {
  const comments = [];
  let page = 1;
  while (true) {
    const data = await githubRequest(
      `https://api.github.com/repos/${ORG}/${repo}/issues/${number}/comments?per_page=100&page=${page}`
    );
    if (!Array.isArray(data) || data.length === 0) break;
    comments.push(...data);
    page += 1;
  }
  return comments;
}

function pickSummary(pr, comments) {
  const commentSumm = comments.find((c) => c.body && c.body.trim().toLowerCase().startsWith('summary'));
  if (commentSumm) return commentSumm.body.trim();

  const bulletComment = comments.find((c) => /(^|\n)[-*]\s+/m.test(c.body || ''));
  if (bulletComment) return bulletComment.body.trim();

  if (pr.body && pr.body.trim()) return pr.body.trim();

  return `Merged PR: ${pr.title}. Changes: +${pr.additions} / -${pr.deletions} across ${pr.changed_files} files.`;
}

function formatDate(iso) {
  return iso ? iso.split('T')[0] : '';
}

function repoBadge(repo) {
  return `![${repo}](https://img.shields.io/badge/repo-${encodeURIComponent(repo)}-blue)`;
}

function writePost(prInfo) {
  const date = formatDate(prInfo.merged_at);
  const filename = `${date}-${prInfo.repo}-pr-${prInfo.number}.md`;
  const filePath = path.join(OUTPUT_DIR, filename);
  const labels = prInfo.labels && prInfo.labels.length ? prInfo.labels.map((l) => l.name).join(', ') : null;
  const content = `# ${prInfo.title}\n\n${repoBadge(prInfo.repo)}\n\n` +
    `**PR:** [#${prInfo.number}](${prInfo.html_url})\\  \n` +
    `**Repo:** ${prInfo.repo}\\  \n` +
    `**Merged:** ${prInfo.merged_at}\\  \n` +
    `**Author:** ${prInfo.user?.login || 'unknown'}\n\n` +
    `## What changed\n${prInfo.summary}\n\n` +
    `## Impact\n` +
    `- +${prInfo.additions} / -${prInfo.deletions}\n` +
    `- ${prInfo.changed_files} files changed\n` +
    (labels ? `\n## Tags\n${labels}\n` : '');
  fs.writeFileSync(filePath, content);
  return filePath;
}

function updateIndex(entries) {
  const header = `# Dev Log\n\nLatest 100 merged PRs across public repositories in **${ORG}**.\n\n`;
  const tableHeader = `| Date | Repo | PR | + / - | Files |\n| --- | --- | --- | --- | --- |\n`;
  const rows = entries
    .slice(0, 100)
    .map((entry) => {
      const date = formatDate(entry.merged_at);
      const prLink = `[${entry.title}](${entry.fileLink})`;
      return `| ${date} | ${entry.repo} | ${prLink} | +${entry.additions} / -${entry.deletions} | ${entry.changed_files} |`;
    })
    .join('\n');
  const content = header + tableHeader + rows + (rows ? '\n' : '');
  fs.writeFileSync(INDEX_PATH, content);
}

function updateStats(entries) {
  const totals = entries.reduce(
    (acc, entry) => {
      acc.totalPRs += 1;
      acc.totalAdditions += entry.additions;
      acc.totalDeletions += entry.deletions;
      acc.netLoc += entry.additions - entry.deletions;
      acc.perRepo[entry.repo] = acc.perRepo[entry.repo] || { prs: 0, additions: 0, deletions: 0 };
      acc.perRepo[entry.repo].prs += 1;
      acc.perRepo[entry.repo].additions += entry.additions;
      acc.perRepo[entry.repo].deletions += entry.deletions;
      return acc;
    },
    { totalPRs: 0, totalAdditions: 0, totalDeletions: 0, netLoc: 0, perRepo: {} }
  );

  const sorted = [...entries].sort((a, b) => new Date(b.merged_at) - new Date(a.merged_at));
  const recent = sorted.slice(0, 30).map((entry) => ({
    repo: entry.repo,
    number: entry.number,
    title: entry.title,
    merged_at: entry.merged_at,
    additions: entry.additions,
    deletions: entry.deletions,
    changed_files: entry.changed_files,
    fileLink: entry.fileLink,
  }));

  const payload = { ...totals, recent };
  fs.writeFileSync(STATS_PATH, JSON.stringify(payload, null, 2));
}

async function main() {
  ensureDirs();
  const cache = loadCache();
  const repos = await fetchAllRepos();
  const entries = Object.values(cache);

  for (const repo of repos) {
    const mergedPRs = await fetchMergedPRs(repo.name);
    for (const pr of mergedPRs) {
      const cacheKey = `${repo.name}#${pr.number}`;
      if (cache[cacheKey]) continue;

      const comments = await fetchComments(repo.name, pr.number);
      const summary = pickSummary(pr, comments);
      const postPath = writePost({ ...pr, repo: repo.name, summary });
      const fileLink = `https://ogeonx-ai.github.io/kim-ai-voice-demo/${postPath.replace(/\\/g, '/')}`;

      const entry = {
        repo: repo.name,
        number: pr.number,
        title: pr.title,
        merged_at: pr.merged_at,
        additions: pr.additions,
        deletions: pr.deletions,
        changed_files: pr.changed_files,
        fileLink,
      };

      cache[cacheKey] = entry;
      entries.push(entry);
    }
  }

  const sortedEntries = entries.sort((a, b) => new Date(b.merged_at) - new Date(a.merged_at));
  updateIndex(sortedEntries);
  updateStats(sortedEntries);
  saveCache(cache);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
