import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const [,, prNumberArg, repoArg] = process.argv;
const prNumber = prNumberArg && Number(prNumberArg);
const repo = repoArg || process.env.REPO_FULL || process.env.GITHUB_REPOSITORY;
const token = process.env.GITHUB_TOKEN;

if (!token) {
  console.error('GITHUB_TOKEN is required');
  process.exit(1);
}

if (!prNumber || Number.isNaN(prNumber)) {
  console.error('Valid PR number is required');
  process.exit(1);
}

if (!repo) {
  console.error('Repository name is required');
  process.exit(1);
}

const apiBase = 'https://api.github.com';

async function githubRequest(endpoint) {
  const res = await fetch(`${apiBase}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'dev-updates-bot'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API request failed: ${res.status} ${res.statusText} - ${text}`);
  }
  return res.json();
}

async function fetchPrData() {
  const pr = await githubRequest(`/repos/${repo}/pulls/${prNumber}`);
  const comments = await githubRequest(`/repos/${repo}/issues/${prNumber}/comments?per_page=100`);
  const files = await githubRequest(`/repos/${repo}/pulls/${prNumber}/files?per_page=100`);
  return { pr, comments, files };
}

function formatDate(value) {
  const date = new Date(value);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const time = date.toISOString();
  return { dateOnly: `${year}-${month}-${day}`, iso: time };
}

function extractTesting(body) {
  if (!body) return null;
  const match = body.match(/##\s*Testing\s*([\s\S]*)/i);
  if (!match) return null;
  const afterHeading = match[1].trim();
  const nextHeadingIndex = afterHeading.search(/\n##\s+/);
  const section = nextHeadingIndex === -1 ? afterHeading : afterHeading.slice(0, nextHeadingIndex);
  return section.trim() || null;
}

function findLatestSummaryComment(comments) {
  const summaryComments = comments
    .filter((c) => c.body && c.body.trim().toLowerCase().startsWith('summary'))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return summaryComments[0]?.body || null;
}

function buildPost({ pr, comments, files }) {
  const { dateOnly, iso } = formatDate(pr.merged_at || new Date());
  const postFilename = `${dateOnly}-pr-${pr.number}.md`;
  const updatesDir = path.join(__dirname, '..', 'webdemo', 'updates');
  if (!fs.existsSync(updatesDir)) {
    fs.mkdirSync(updatesDir, { recursive: true });
  }
  const postPath = path.join(updatesDir, postFilename);
  const prLink = pr.html_url;
  const mergeCommit = pr.merge_commit_sha;
  const mergeCommitLink = mergeCommit ? `${pr.base.repo.html_url}/commit/${mergeCommit}` : null;
  const prBody = pr.body?.trim();
  const summaryComment = findLatestSummaryComment(comments);
  const testingSection = extractTesting(pr.body);
  const fileList = files.slice(0, 10).map((file) => `- ${file.filename}`).join('\n');

  const lines = [];
  lines.push(`# ${pr.title}`);
  lines.push('');
  lines.push(`- **PR:** [#${pr.number}](${prLink}) by @${pr.user.login}`);
  if (mergeCommitLink) {
    lines.push(`- **Merge commit:** [${mergeCommit.slice(0, 7)}](${mergeCommitLink})`);
  }
  lines.push(`- **Merged at:** ${iso}`);
  lines.push('');
  lines.push('## What changed');
  if (prBody) {
    lines.push('**PR body:**');
    lines.push('');
    lines.push(prBody);
    lines.push('');
  } else {
    lines.push('_No PR description provided._');
    lines.push('');
  }

  if (summaryComment) {
    lines.push('**Latest Summary comment:**');
    lines.push('');
    lines.push(summaryComment);
    lines.push('');
  }

  lines.push('## Files touched');
  if (fileList) {
    lines.push(fileList);
  } else {
    lines.push('_No files reported._');
  }
  lines.push('');

  lines.push('## How to test');
  if (testingSection) {
    lines.push(testingSection);
  } else {
    lines.push('_No testing steps provided._');
  }
  lines.push('');

  fs.writeFileSync(postPath, lines.join('\n'));
  return { postFilename, dateOnly };
}

function updateIndex({ dateOnly, postFilename, prTitle }) {
  const indexPath = path.join(__dirname, '..', 'webdemo', 'updates', 'index.md');
  let content = '# Dev Updates\n\n';

  if (fs.existsSync(indexPath)) {
    content = fs.readFileSync(indexPath, 'utf-8');
    if (!content.trim().startsWith('# Dev Updates')) {
      content = '# Dev Updates\n\n' + content.trim();
    }
  }

  const lines = content.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const entry = `- ${dateOnly} — [${prTitle}](./${postFilename})`;

  // Remove existing entry for same file if present
  const filtered = lines.filter((line) => !line.includes(`(${postFilename})`));
  // Ensure title header present at top
  const header = filtered[0] && filtered[0].startsWith('# Dev Updates') ? filtered[0] : '# Dev Updates';
  const body = filtered.slice(header === filtered[0] ? 1 : 0);

  const newLines = [header, '', entry, ...body];
  fs.writeFileSync(indexPath, newLines.join('\n'));
}

async function main() {
  const { pr, comments, files } = await fetchPrData();
  const { postFilename, dateOnly } = buildPost({ pr, comments, files });
  updateIndex({ dateOnly, postFilename, prTitle: pr.title });
  console.log(`Generated dev update for PR #${pr.number}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
