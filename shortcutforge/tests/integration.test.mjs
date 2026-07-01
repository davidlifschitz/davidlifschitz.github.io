import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRunnerPayload, extractJson, normalizeLlmPayload } from '../lib/payload.mjs';

test('integration: LLM-like response normalizes into safe runner payload', () => {
  const prompt = 'Capture this idea to my ecosystem inbox';
  const llmResponse = `\`\`\`json
{
  "shortcutId": "capture-idea-to-inbox",
  "invocationMode": "web",
  "input": {
    "message": "Capture this idea to my ecosystem inbox",
    "source": "ShortcutForge web app",
    "capturedAt": "2026-01-01T00:00:00.000Z"
  },
  "routing": {
    "mode": "capture",
    "target": "ScheduleOS"
  },
  "return": {
    "type": "text"
  },
  "runnerPlan": ["Ask for the idea", "Store it in inbox"]
}
\`\`\``;

  const parsed = extractJson(llmResponse);
  const payload = normalizeLlmPayload(parsed, prompt);

  assert.equal(payload.shortcutId, 'capture-idea-to-inbox');
  assert.equal(payload.routing.mode, 'capture');
  assert.equal(payload.input.message, prompt);
  assert.ok(Array.isArray(payload.runnerPlan));
});

test('integration: invalid LLM shortcut falls back to heuristic payload', () => {
  const prompt = 'Tell me what I should work on next';
  const payload = normalizeLlmPayload(
    extractJson(JSON.stringify({ shortcutId: 'not-real', input: { message: prompt } })),
    prompt,
  );

  assert.equal(payload.shortcutId, 'what-should-i-work-on-now');
  assert.deepEqual(buildRunnerPayload(prompt).shortcutId, payload.shortcutId);
});
