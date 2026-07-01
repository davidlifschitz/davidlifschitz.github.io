import {
  ALLOWED_RETURN_TYPES,
  ALLOWED_ROUTING_MODES,
  ALLOWED_ROUTING_TARGETS,
  ALLOWED_SHORTCUT_IDS,
} from './constants.mjs';

export function inferShortcutId(prompt) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes('text') || normalized.includes('message') || normalized.includes('contact')) {
    return 'send-message-runner';
  }
  if (normalized.includes('task')) {
    return 'create-task-from-text';
  }
  if (normalized.includes('idea') || normalized.includes('inbox')) {
    return 'capture-idea-to-inbox';
  }
  if (normalized.includes('work on') || normalized.includes('next')) {
    return 'what-should-i-work-on-now';
  }
  return 'ask-scheduleos';
}

export function buildRunnerPayload(prompt) {
  const trimmedPrompt = prompt.trim();
  const shortcutId = inferShortcutId(trimmedPrompt);
  const isLocalMessageRunner = shortcutId === 'send-message-runner';

  return {
    shortcutId,
    invocationMode: 'web',
    input: {
      message: trimmedPrompt,
      source: 'ShortcutForge web app',
      capturedAt: new Date().toISOString(),
    },
    routing: {
      mode: isLocalMessageRunner ? 'local_runner_branch' : 'interpret',
      target: isLocalMessageRunner ? 'Shortcuts' : 'ScheduleOS',
    },
    return: {
      type: isLocalMessageRunner ? 'confirmation' : 'text',
    },
  };
}

function extractBalancedJsonObject(text) {
  const start = text.indexOf('{');
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];
    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }
    if (char === '{') {
      depth += 1;
    } else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, index + 1);
      }
    }
  }

  return null;
}

export function extractJson(text) {
  const trimmed = String(text || '').trim();
  if (!trimmed) {
    throw new Error('LLM response did not contain JSON.');
  }

  const candidates = [];
  if (trimmed.startsWith('{')) {
    candidates.push(trimmed);
  }

  const fencedMatches = [...trimmed.matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)];
  for (const match of fencedMatches) {
    candidates.push(match[1].trim());
  }

  const balanced = extractBalancedJsonObject(trimmed);
  if (balanced) {
    candidates.push(balanced);
  }

  let lastError = null;
  for (const candidate of candidates) {
    if (!candidate) {
      continue;
    }
    try {
      return JSON.parse(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(lastError?.message || 'LLM response did not contain valid JSON.');
}

function sanitizeRunnerPlan(value) {
  if (!Array.isArray(value)) {
    return undefined;
  }
  const steps = value
    .filter((step) => typeof step === 'string')
    .map((step) => step.trim())
    .filter(Boolean)
    .slice(0, 12);
  return steps.length ? steps : undefined;
}

export function normalizeLlmPayload(payload, prompt) {
  const fallback = buildRunnerPayload(prompt);
  const shortcutId = ALLOWED_SHORTCUT_IDS.has(payload?.shortcutId)
    ? payload.shortcutId
    : fallback.shortcutId;

  const routingMode = ALLOWED_ROUTING_MODES.has(payload?.routing?.mode)
    ? payload.routing.mode
    : fallback.routing.mode;
  const routingTarget = ALLOWED_ROUTING_TARGETS.has(payload?.routing?.target)
    ? payload.routing.target
    : fallback.routing.target;
  const returnType = ALLOWED_RETURN_TYPES.has(payload?.return?.type)
    ? payload.return.type
    : fallback.return.type;

  const message = typeof payload?.input?.message === 'string' && payload.input.message.trim()
    ? payload.input.message.trim()
    : fallback.input.message;

  const normalized = {
    shortcutId,
    invocationMode: 'web',
    input: {
      message,
      source: 'ShortcutForge web app',
      capturedAt: new Date().toISOString(),
    },
    routing: {
      mode: routingMode,
      target: routingTarget,
    },
    return: {
      type: returnType,
    },
  };

  const runnerPlan = sanitizeRunnerPlan(payload?.runnerPlan);
  if (runnerPlan) {
    normalized.runnerPlan = runnerPlan;
  }

  return normalized;
}

export function buildSystemPrompt() {
  return `You convert plain-English mobile workflow requests into ShortcutForge runner payload JSON.
Return only valid JSON. Do not wrap it in markdown.

Allowed shortcutId values:
- send-message-runner: ask for message text, choose a contact, send a message
- create-task-from-text: create a task from the user's text
- capture-idea-to-inbox: capture an idea or note
- what-should-i-work-on-now: ask for a priority recommendation
- ask-scheduleos: general ScheduleOS request

Required JSON shape:
{
  "shortcutId": "one allowed shortcutId",
  "invocationMode": "web",
  "input": {
    "message": "original user request or refined instruction",
    "source": "ShortcutForge web app",
    "capturedAt": "ISO timestamp"
  },
  "routing": {
    "mode": "local_runner_branch or interpret or task_intake or capture or priority_lookup",
    "target": "Shortcuts or ScheduleOS"
  },
  "return": {
    "type": "confirmation or text or structured_snippet"
  },
  "runnerPlan": ["short human-readable runner steps"]
}

Use local_runner_branch and target Shortcuts for send-message-runner.
Use ScheduleOS for interpretation-heavy task, idea, priority, and general requests.`;
}
