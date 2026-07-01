import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLocHistory } from '../scripts/lib/loc-history-schema.mjs';
import { escapeHtml } from '../scripts/lib/html-escape.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const LOC_HISTORY_PATH = path.join(ROOT, 'data', 'loc-history.json');

test('escapeHtml neutralizes HTML metacharacters', () => {
  assert.equal(escapeHtml('<script>"\'&</script>'), '&lt;script&gt;&quot;&#39;&amp;&lt;/script&gt;');
  assert.equal(escapeHtml(null), '');
});

test('validateLocHistory accepts committed dashboard data', async () => {
  const raw = await fs.readFile(LOC_HISTORY_PATH, 'utf8');
  const data = JSON.parse(raw);
  assert.deepEqual(validateLocHistory(data), []);
});

test('validateLocHistory rejects malformed payloads', () => {
  const errors = validateLocHistory({ generated_at: '', days_back: 0, repos: [], days: [] });
  assert.ok(errors.length > 0);
  assert.ok(errors.some((message) => message.includes('generated_at')));
});
