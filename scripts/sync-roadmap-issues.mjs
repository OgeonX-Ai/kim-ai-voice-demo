import fs from 'fs';
import path from 'path';
import process from 'process';
import { fileURLToPath } from 'url';
import { parse } from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const token = process.env.GITHUB_TOKEN;
if (!token) {
  console.error('Missing GITHUB_TOKEN');
  process.exit(1);
}

const roadmapPath = path.join(__dirname, '..', 'roadmap', 'roadmap.yml');
if (!fs.existsSync(roadmapPath)) {
  console.error('Missing roadmap file at roadmap/roadmap.yml');
  process.exit(1);
}

const owner = process.env.GITHUB_REPOSITORY?.split('/')[0];
if (!owner) {
  console.error('Unable to determine owner from GITHUB_REPOSITORY');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  'User-Agent': 'roadmap-sync-script',
  Accept: 'application/vnd.github+json',
};

async function githubRequest(url, options = {}) {
  const response = await fetch(url, { headers, ...options });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API error ${response.status}: ${text}`);
  }
  if (response.status === 204) return null;
  return response.json();
}

function loadRoadmap() {
  const raw = fs.readFileSync(roadmapPath, 'utf8');
  const data = parse(raw);
  if (!data || !Array.isArray(data.issues)) {
    throw new Error('Invalid roadmap.yml: missing issues array');
  }
  return data;
}

async function findMilestone(repo, title) {
  if (!title) return null;
  const url = `https://api.github.com/repos/${owner}/${repo}/milestones?state=all&per_page=100`;
  const milestones = await githubRequest(url);
  const existing = milestones.find((m) => m.title === title);
  if (existing) return existing;

  const createUrl = `https://api.github.com/repos/${owner}/${repo}/milestones`;
  return githubRequest(createUrl, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
}

async function ensureLabels(repo, labels = []) {
  if (!labels.length) return labels;
  const url = `https://api.github.com/repos/${owner}/${repo}/labels?per_page=100`;
  const existing = await githubRequest(url);
  const missing = labels.filter((label) => !existing.some((l) => l.name === label));
  for (const label of missing) {
    const createUrl = `https://api.github.com/repos/${owner}/${repo}/labels`;
    await githubRequest(createUrl, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: label, color: '0f172a' }),
    });
  }
  return labels;
}

async function searchIssueByKey(repo, key) {
  const query = encodeURIComponent(`repo:${owner}/${repo} "roadmap-key: ${key}" in:body`);
  const url = `https://api.github.com/search/issues?q=${query}`;
  const results = await githubRequest(url);
  return results.items && results.items.length > 0 ? results.items[0] : null;
}

function buildBody(body, key, priority) {
  const meta = priority ? `\n\nPriority: ${priority}` : '';
  return `${body.trim()}${meta}\n\n<!-- roadmap-key: ${key} -->`;
}

async function updateIssue(repo, issue, payload) {
  const updateUrl = `https://api.github.com/repos/${owner}/${repo}/issues/${issue.number}`;
  await githubRequest(updateUrl, {
    method: 'PATCH',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

async function createIssue(repo, payload) {
  const createUrl = `https://api.github.com/repos/${owner}/${repo}/issues`;
  return githubRequest(createUrl, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function labelsFromIssue(issue) {
  return Array.isArray(issue.labels) ? issue.labels.map((l) => (typeof l === 'string' ? l : l.name)) : [];
}

async function processIssue(item, milestoneId) {
  const { key, title, repo, labels = [], priority, body } = item;
  if (!key || !title || !repo || !body) {
    console.warn(`Skipping invalid item with missing fields (key: ${key})`);
    return;
  }

  const targetLabels = await ensureLabels(repo, labels);
  const desiredBody = buildBody(body, key, priority);
  const existing = await searchIssueByKey(repo, key);

  if (existing) {
    const currentLabels = labelsFromIssue(existing);
    const mergedLabels = Array.from(new Set([...currentLabels, ...targetLabels]));
    const needsUpdate = existing.title !== title || existing.body.trim() !== desiredBody.trim();
    const payload = {
      title,
      body: desiredBody,
      labels: mergedLabels,
      milestone: milestoneId || undefined,
    };
    if (needsUpdate || mergedLabels.length !== currentLabels.length) {
      await updateIssue(repo, existing, payload);
      console.log(`Updated issue #${existing.number} in ${repo}`);
    } else {
      console.log(`No changes for issue #${existing.number} in ${repo}`);
    }
  } else {
    const payload = {
      title,
      body: desiredBody,
      labels: targetLabels,
      milestone: milestoneId || undefined,
    };
    const created = await createIssue(repo, payload);
    console.log(`Created issue #${created.number} in ${repo}`);
  }
}

async function main() {
  try {
    const roadmap = loadRoadmap();
    const milestoneName = roadmap.milestone;
    const groupedByRepo = {};
    for (const issue of roadmap.issues) {
      groupedByRepo[issue.repo] = groupedByRepo[issue.repo] || [];
      groupedByRepo[issue.repo].push(issue);
    }

    for (const [repo, repoIssues] of Object.entries(groupedByRepo)) {
      const milestone = await findMilestone(repo, milestoneName);
      const milestoneId = milestone ? milestone.number : null;
      for (const issue of repoIssues) {
        await processIssue(issue, milestoneId);
      }
    }
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
