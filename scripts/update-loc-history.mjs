import fs from 'node:fs/promises';

const DAYS_BACK = Number(process.env.DAYS_BACK || 21);
const DATA_PATH = new URL('../data/loc-history.json', import.meta.url);
const TOKEN = process.env.ECOSYSTEM_GH_TOKEN || process.env.GITHUB_TOKEN || '';
const BASE_HEADERS = {
  Accept: 'application/vnd.github+json',
  'User-Agent': 'ecosystem-change-dashboard'
};
if (TOKEN) {
  BASE_HEADERS.Authorization = `Bearer ${TOKEN}`;
}

const repoConfigs = [
  { name: 'davidlifschitz/agentic-os', branch: 'main', visibility: 'private' },
  { name: 'davidlifschitz/spec-to-repo', branch: 'main', visibility: 'public' },
  { name: 'davidlifschitz/children-of-israel-agent-swarm', branch: 'main', visibility: 'public' },
  { name: 'davidlifschitz/graphify', branch: 'v3', visibility: 'public' },
  { name: 'davidlifschitz/ScheduleOS', branch: 'main', visibility: 'private' },
  { name: 'davidlifschitz/ShortcutForge', branch: 'main', visibility: 'private' },
  { name: 'davidlifschitz/davidlifschitz.github.io', branch: 'main', visibility: 'public' }
];

function isoDaysAgo(days) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

async function githubJson(url) {
  const response = await fetch(url, { headers: BASE_HEADERS });
  if (response.status === 404) {
    return { notFound: true };
  }
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub request failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function listCommits(repo, branch, since) {
  const commits = [];
  for (let page = 1; page <= 10; page += 1) {
    const url = `https://api.github.com/repos/${repo}/commits?sha=${encodeURIComponent(branch)}&since=${encodeURIComponent(since)}&per_page=100&page=${page}`;
    const pageData = await githubJson(url);
    if (pageData.notFound) {
      return { notFound: true, commits: [] };
    }
    if (!Array.isArray(pageData) || pageData.length === 0) {
      break;
    }
    commits.push(...pageData);
    if (pageData.length < 100) {
      break;
    }
  }
  return { commits };
}

async function fetchCommit(repo, sha) {
  const url = `https://api.github.com/repos/${repo}/commits/${sha}`;
  return githubJson(url);
}

function ensureDayMap(daysBack, previousDays, repoNames) {
  const byDate = new Map((previousDays || []).map(day => [day.date, day]));
  const result = [];
  for (let i = daysBack - 1; i >= 0; i -= 1) {
    const date = isoDaysAgo(i).slice(0, 10);
    const existing = byDate.get(date) || { date, metrics: {} };
    for (const repoName of repoNames) {
      existing.metrics[repoName] ||= { additions: 0, deletions: 0, changes: 0, commits: 0, status: 'ok' };
    }
    result.push(existing);
  }
  return result;
}

async function main() {
  const previous = JSON.parse(await fs.readFile(DATA_PATH, 'utf8'));
  const repoNames = repoConfigs.map(repo => repo.name);
  const days = ensureDayMap(DAYS_BACK, previous.days, repoNames);
  const byDate = new Map(days.map(day => [day.date, day]));
  const since = isoDaysAgo(DAYS_BACK - 1);

  for (const repo of repoConfigs) {
    for (const day of days) {
      day.metrics[repo.name] = { additions: 0, deletions: 0, changes: 0, commits: 0, status: 'ok' };
    }

    try {
      const listed = await listCommits(repo.name, repo.branch, since);
      if (listed.notFound) {
        const status = repo.visibility === 'private' ? 'private-token-required' : 'error';
        for (const day of days) {
          day.metrics[repo.name].status = status;
        }
        continue;
      }

      for (const summary of listed.commits) {
        const detailed = await fetchCommit(repo.name, summary.sha);
        if (detailed.notFound) {
          continue;
        }
        const date = (detailed.commit?.author?.date || '').slice(0, 10);
        if (!byDate.has(date)) {
          continue;
        }
        const day = byDate.get(date);
        day.metrics[repo.name].additions += detailed.stats?.additions || 0;
        day.metrics[repo.name].deletions += detailed.stats?.deletions || 0;
        day.metrics[repo.name].changes += detailed.stats?.total || 0;
        day.metrics[repo.name].commits += 1;
      }
    } catch (error) {
      console.error(`Failed to update ${repo.name}:`, error.message);
      const status = repo.visibility === 'private' && !process.env.ECOSYSTEM_GH_TOKEN
        ? 'private-token-required'
        : 'error';
      for (const day of days) {
        day.metrics[repo.name].status = status;
      }
    }
  }

  const next = {
    generated_at: new Date().toISOString(),
    days_back: DAYS_BACK,
    repos: repoConfigs,
    days
  };

  await fs.writeFile(DATA_PATH, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});