import { repoConfigs } from '../ecosystem-repos.mjs';

const VALID_STATUSES = new Set(['ok', 'error', 'private-token-required']);
const VALID_VISIBILITY = new Set(['public', 'private']);

export function validateLocHistory(data) {
  const errors = [];

  if (!data || typeof data !== 'object') {
    errors.push('loc-history.json must be a JSON object');
    return errors;
  }

  if (typeof data.generated_at !== 'string' || !data.generated_at) {
    errors.push('loc-history.json: generated_at must be a non-empty string');
  }

  if (typeof data.days_back !== 'number' || data.days_back < 1) {
    errors.push('loc-history.json: days_back must be a positive number');
  }

  if (!Array.isArray(data.repos)) {
    errors.push('loc-history.json: repos must be an array');
    return errors;
  }

  const expectedNames = repoConfigs.map((repo) => repo.name).sort().join('\0');
  const actualNames = data.repos.map((repo) => repo?.name).filter(Boolean).sort().join('\0');
  if (expectedNames !== actualNames) {
    errors.push('loc-history.json: repos list does not match scripts/ecosystem-repos.mjs');
  }

  for (const [index, repo] of data.repos.entries()) {
    if (!repo || typeof repo !== 'object') {
      errors.push(`loc-history.json: repos[${index}] must be an object`);
      continue;
    }
    if (typeof repo.name !== 'string' || !repo.name.includes('/')) {
      errors.push(`loc-history.json: repos[${index}].name must be an owner/repo string`);
    }
    if (typeof repo.branch !== 'string' || !repo.branch) {
      errors.push(`loc-history.json: repos[${index}].branch must be a non-empty string`);
    }
    if (!VALID_VISIBILITY.has(repo.visibility)) {
      errors.push(`loc-history.json: repos[${index}].visibility must be public or private`);
    }
  }

  if (!Array.isArray(data.days)) {
    errors.push('loc-history.json: days must be an array');
    return errors;
  }

  for (const [index, day] of data.days.entries()) {
    if (!day || typeof day !== 'object') {
      errors.push(`loc-history.json: days[${index}] must be an object`);
      continue;
    }
    if (typeof day.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day.date)) {
      errors.push(`loc-history.json: days[${index}].date must be YYYY-MM-DD`);
    }
    if (!day.metrics || typeof day.metrics !== 'object') {
      errors.push(`loc-history.json: days[${index}].metrics must be an object`);
      continue;
    }

    for (const [repoName, metric] of Object.entries(day.metrics)) {
      if (!metric || typeof metric !== 'object') {
        errors.push(`loc-history.json: days[${index}].metrics["${repoName}"] must be an object`);
        continue;
      }
      for (const field of ['additions', 'deletions', 'changes', 'commits']) {
        if (typeof metric[field] !== 'number' || metric[field] < 0) {
          errors.push(`loc-history.json: days[${index}].metrics["${repoName}"].${field} must be a non-negative number`);
        }
      }
      if (metric.status && !VALID_STATUSES.has(metric.status)) {
        errors.push(`loc-history.json: days[${index}].metrics["${repoName}"].status is invalid`);
      }
    }
  }

  return errors;
}
