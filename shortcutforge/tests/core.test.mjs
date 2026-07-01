import test from 'node:test';
import assert from 'node:assert/strict';
import { deepMergeConfig, parseProviderModels, collectProviderConnectOrigins } from '../lib/config-utils.mjs';
import { DEFAULT_CONFIG } from '../lib/constants.mjs';
import {
  buildRunnerPayload,
  extractJson,
  normalizeLlmPayload,
} from '../lib/payload.mjs';
import { sanitizeProviderErrorDetail } from '../lib/network.mjs';
import {
  decryptApiKey,
  encryptApiKey,
  WrongPassphraseError,
} from '../lib/crypto-api.mjs';

test('deepMergeConfig preserves default providers when config overrides one provider', () => {
  const merged = deepMergeConfig(DEFAULT_CONFIG, {
    llmProviders: {
      openrouter: {
        defaultModel: 'openai/gpt-4.1-mini',
      },
    },
  });

  assert.equal(merged.llmProviders.openrouter.defaultModel, 'openai/gpt-4.1-mini');
  assert.ok(merged.llmProviders.nvidia);
});

test('parseProviderModels deduplicates and sorts model IDs', () => {
  const models = parseProviderModels({
    data: [
      { id: 'b/model', name: 'Beta' },
      { id: 'a/model', name: 'Alpha' },
      { id: 'a/model', name: 'Alpha duplicate' },
    ],
  });

  assert.deepEqual(models.map((model) => model.id), ['a/model', 'b/model']);
});

test('extractJson parses fenced and balanced JSON blocks', () => {
  const payload = { shortcutId: 'ask-scheduleos', input: { message: 'hello' } };
  assert.deepEqual(extractJson(JSON.stringify(payload)), payload);
  assert.deepEqual(extractJson(`Here you go:\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``), payload);
  assert.deepEqual(extractJson(`Noise before ${JSON.stringify(payload)} noise after`), payload);
});

test('normalizeLlmPayload rejects unknown shortcutId values', () => {
  const prompt = 'Create a task from this note';
  const normalized = normalizeLlmPayload(
    {
      shortcutId: 'totally-invalid',
      input: { message: 'Create a task from this note' },
      routing: { mode: 'evil', target: 'Unknown' },
      return: { type: 'unknown' },
      runnerPlan: ['step one', 42, 'step two'],
    },
    prompt,
  );

  assert.equal(normalized.shortcutId, 'create-task-from-text');
  assert.equal(normalized.routing.target, 'ScheduleOS');
  assert.deepEqual(normalized.runnerPlan, ['step one', 'step two']);
});

test('buildRunnerPayload maps message prompts to send-message-runner', () => {
  const payload = buildRunnerPayload('Ask me what text to send to a contact');
  assert.equal(payload.shortcutId, 'send-message-runner');
  assert.equal(payload.routing.mode, 'local_runner_branch');
});

test('sanitizeProviderErrorDetail truncates noisy provider errors', () => {
  const detail = sanitizeProviderErrorDetail('x'.repeat(400), 120);
  assert.equal(detail.length, 121);
  assert.match(detail, /…$/);
});

test('encryptApiKey roundtrip succeeds with matching passphrase', async () => {
  const encrypted = await encryptApiKey('test-api-key', 'strong-passphrase');
  const decrypted = await decryptApiKey(encrypted, 'strong-passphrase');
  assert.equal(decrypted, 'test-api-key');
});

test('decryptApiKey throws WrongPassphraseError for bad passphrase', async () => {
  const encrypted = await encryptApiKey('test-api-key', 'strong-passphrase');
  await assert.rejects(
    () => decryptApiKey(encrypted, 'wrong-passphrase'),
    WrongPassphraseError,
  );
});

test('collectProviderConnectOrigins includes scheduleOs endpoint when configured', () => {
  const origins = collectProviderConnectOrigins({
    llmProviders: DEFAULT_CONFIG.llmProviders,
    scheduleOsEndpoint: 'https://scheduleos.example/api/intake',
  });

  assert.ok(origins.includes('https://scheduleos.example'));
});
