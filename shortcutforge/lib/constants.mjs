export const CUSTOM_MODEL_VALUE = '__custom__';

export const ALLOWED_SHORTCUT_IDS = new Set([
  'send-message-runner',
  'create-task-from-text',
  'capture-idea-to-inbox',
  'what-should-i-work-on-now',
  'ask-scheduleos',
]);

export const ALLOWED_ROUTING_MODES = new Set([
  'local_runner_branch',
  'interpret',
  'task_intake',
  'capture',
  'priority_lookup',
]);

export const ALLOWED_ROUTING_TARGETS = new Set(['Shortcuts', 'ScheduleOS']);

export const ALLOWED_RETURN_TYPES = new Set(['confirmation', 'text', 'structured_snippet']);

export const FETCH_TIMEOUT_MS = 60_000;

export const DEFAULT_CONFIG = {
  appName: 'ShortcutForge Web Runner',
  runnerShortcutName: 'ShortcutForge Runner',
  runnerInstallUrl: 'https://www.icloud.com/shortcuts/290365e70329446caec7e93f702a7919',
  scheduleOsEndpoint: '',
  llmProviders: {
    openrouter: {
      label: 'OpenRouter',
      endpoint: 'https://openrouter.ai/api/v1/chat/completions',
      modelsEndpoint: 'https://openrouter.ai/api/v1/models',
      defaultModel: 'openai/gpt-4o-mini',
      modelFallbacks: ['openai/gpt-4o-mini'],
    },
    nvidia: {
      label: 'NVIDIA NIM',
      endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
      modelsEndpoint: 'https://integrate.api.nvidia.com/v1/models',
      defaultModel: 'meta/llama-3.1-70b-instruct',
      modelFallbacks: ['meta/llama-3.1-70b-instruct'],
    },
  },
  defaultProvider: 'openrouter',
  customModelValue: CUSTOM_MODEL_VALUE,
  examplePrompts: [
    'Ask me what text to send, let me choose a contact, and prepare the message.',
  ],
};
