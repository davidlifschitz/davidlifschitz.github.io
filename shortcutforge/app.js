import { CUSTOM_MODEL_VALUE, DEFAULT_CONFIG } from './lib/constants.mjs';
import { deepMergeConfig, parseProviderModels } from './lib/config-utils.mjs';
import {
  WrongPassphraseError,
  assertSecureCryptoContext,
  decryptApiKey,
  encryptApiKey,
} from './lib/crypto-api.mjs';
import { fetchWithTimeout, sanitizeProviderErrorDetail } from './lib/network.mjs';
import {
  buildRunnerPayload,
  buildSystemPrompt,
  extractJson,
  normalizeLlmPayload,
} from './lib/payload.mjs';

const STORAGE_KEY = 'shortcutforge.encryptedApiKey.v1';
const MODEL_CACHE_KEY = 'shortcutforge.modelCache.v1';

const requiredElementIds = [
  'installRunner',
  'copyRunnerLink',
  'runnerStatus',
  'providerSelect',
  'modelSelect',
  'refreshModels',
  'customModelField',
  'customModelInput',
  'modelStatus',
  'apiKeyInput',
  'passphraseInput',
  'forgetKeyAfterGeneration',
  'useKeyOnce',
  'saveApiKey',
  'clearApiKey',
  'keyStatus',
  'promptInput',
  'copyPrompt',
  'generateWithLlm',
  'buildPayload',
  'examples',
  'payloadPreview',
  'copyPayload',
  'submitToScheduleOS',
];

const elements = {};
for (const id of requiredElementIds) {
  elements[id] = document.querySelector(`#${id}`);
}

const missingElements = requiredElementIds.filter((id) => !elements[id]);
if (missingElements.length) {
  throw new Error(`ShortcutForge markup is missing required elements: ${missingElements.join(', ')}`);
}

let activeConfig = DEFAULT_CONFIG;
let activePayload = null;
let secureContextAvailable = true;

function clearSensitiveInputs() {
  elements.apiKeyInput.value = '';
}

function clearPassphraseInput() {
  elements.passphraseInput.value = '';
}

async function loadConfig() {
  try {
    const response = await fetchWithTimeout('./config.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Config request failed with ${response.status}`);
    }
    const config = await response.json();
    activeConfig = deepMergeConfig(DEFAULT_CONFIG, config);
  } catch (error) {
    console.warn('Using default ShortcutForge web config', error);
    activeConfig = DEFAULT_CONFIG;
  }
}

function getCustomModelValue() {
  return activeConfig.customModelValue || CUSTOM_MODEL_VALUE;
}

function getSelectedProvider() {
  const providerKey = elements.providerSelect.value || activeConfig.defaultProvider;
  const provider = activeConfig.llmProviders?.[providerKey];
  if (!provider) {
    const fallbackKey = Object.keys(activeConfig.llmProviders || {})[0];
    if (!fallbackKey) {
      throw new Error('No LLM providers are configured.');
    }
    elements.providerSelect.value = fallbackKey;
    return { providerKey: fallbackKey, provider: activeConfig.llmProviders[fallbackKey] };
  }
  return { providerKey, provider };
}

function readJsonStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function getCachedModels(providerKey) {
  const cache = readJsonStorage(MODEL_CACHE_KEY, {});
  return cache[providerKey] || null;
}

function setCachedModels(providerKey, models) {
  try {
    const cache = readJsonStorage(MODEL_CACHE_KEY, {});
    cache[providerKey] = {
      savedAt: new Date().toISOString(),
      models,
    };
    localStorage.setItem(MODEL_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn('Unable to cache model list', error);
  }
}

function fallbackModelOptions(provider) {
  const fallbackIds = [provider.defaultModel, ...(provider.modelFallbacks || [])]
    .filter(Boolean)
    .filter((modelId, index, all) => all.indexOf(modelId) === index);

  return fallbackIds.map((id) => ({ id, name: id }));
}

function modelLabel(model) {
  if (model.name && model.name !== model.id) {
    return `${model.name} (${model.id})`;
  }
  return model.id;
}

function renderModelOptions(models, { source = 'fallback', savedAt = null } = {}) {
  const { providerKey, provider } = getSelectedProvider();
  const customValue = getCustomModelValue();
  const existingSelection = elements.modelSelect.value;
  const modelOptions = models?.length ? models : fallbackModelOptions(provider);

  elements.modelSelect.innerHTML = '';
  for (const model of modelOptions) {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = modelLabel(model);
    elements.modelSelect.append(option);
  }

  const customOption = document.createElement('option');
  customOption.value = customValue;
  customOption.textContent = 'Custom model…';
  elements.modelSelect.append(customOption);

  const preferred = modelOptions.some((model) => model.id === existingSelection)
    ? existingSelection
    : provider.defaultModel;
  elements.modelSelect.value = modelOptions.some((model) => model.id === preferred)
    ? preferred
    : modelOptions[0]?.id || customValue;

  syncCustomModelVisibility();

  if (source === 'live') {
    elements.modelStatus.textContent = `Loaded ${modelOptions.length} current ${provider.label || providerKey} models.`;
  } else if (source === 'cache') {
    const suffix = savedAt ? ` Cached ${new Date(savedAt).toLocaleString()}.` : '';
    elements.modelStatus.textContent = `Using cached ${provider.label || providerKey} model list.${suffix}`;
  } else {
    elements.modelStatus.textContent = `Using fallback ${provider.label || providerKey} model list. Tap Refresh model list for current models.`;
  }
}

async function getOptionalApiKeyForModelRefresh() {
  const directKey = elements.apiKeyInput.value.trim();
  if (directKey) {
    return directKey;
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  const passphrase = elements.passphraseInput.value;
  if (!saved || !passphrase) {
    return null;
  }

  try {
    return await decryptApiKey(JSON.parse(saved), passphrase);
  } catch (error) {
    if (error instanceof WrongPassphraseError) {
      elements.modelStatus.textContent = 'Model refresh skipped: wrong passphrase for saved key.';
    }
    return null;
  }
}

async function refreshProviderModels() {
  const { providerKey, provider } = getSelectedProvider();
  if (!provider.modelsEndpoint) {
    renderModelOptions(fallbackModelOptions(provider), { source: 'fallback' });
    return;
  }

  let apiKey = null;
  try {
    elements.refreshModels.disabled = true;
    elements.refreshModels.textContent = 'Refreshing…';
    elements.modelStatus.textContent = `Loading current ${provider.label || providerKey} models…`;
    apiKey = await getOptionalApiKeyForModelRefresh();

    const headers = { Accept: 'application/json' };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetchWithTimeout(provider.modelsEndpoint, { headers });
    if (!response.ok) {
      throw new Error(`Model list request failed with ${response.status}`);
    }

    const data = await response.json();
    const models = parseProviderModels(data);
    if (!models.length) {
      throw new Error('Provider response did not include model IDs.');
    }

    setCachedModels(providerKey, models);
    renderModelOptions(models, { source: 'live' });
  } catch (error) {
    const cached = getCachedModels(providerKey);
    if (cached?.models?.length) {
      renderModelOptions(cached.models, { source: 'cache', savedAt: cached.savedAt });
      elements.modelStatus.textContent += ` Refresh failed: ${error.message}`;
    } else {
      renderModelOptions(fallbackModelOptions(provider), { source: 'fallback' });
      elements.modelStatus.textContent += ` Refresh failed: ${error.message}`;
    }
  } finally {
    apiKey = null;
    elements.refreshModels.disabled = false;
    elements.refreshModels.textContent = 'Refresh model list';
  }
}

function syncScheduleOsControls() {
  const endpoint = (activeConfig.scheduleOsEndpoint || '').trim();
  const enabled = Boolean(endpoint);
  elements.submitToScheduleOS.hidden = !enabled;
  elements.submitToScheduleOS.disabled = !enabled;
  if (!enabled) {
    elements.submitToScheduleOS.title = 'Set scheduleOsEndpoint in config.json to enable ScheduleOS submission.';
  } else {
    elements.submitToScheduleOS.title = '';
  }
}

function renderConfig() {
  document.title = activeConfig.appName;
  elements.installRunner.href = activeConfig.runnerInstallUrl;
  elements.runnerStatus.textContent = `${activeConfig.runnerShortcutName} install link is configured.`;

  elements.providerSelect.innerHTML = '';
  for (const [key, provider] of Object.entries(activeConfig.llmProviders || {})) {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = provider.label || key;
    elements.providerSelect.append(option);
  }
  elements.providerSelect.value = activeConfig.defaultProvider || Object.keys(activeConfig.llmProviders)[0];
  syncModelSelectWithProvider();
  syncScheduleOsControls();

  elements.examples.innerHTML = '';
  for (const prompt of activeConfig.examplePrompts || []) {
    const button = document.createElement('button');
    button.className = 'example-button';
    button.type = 'button';
    button.textContent = prompt;
    button.addEventListener('click', () => {
      elements.promptInput.value = prompt;
      elements.promptInput.focus();
    });
    elements.examples.append(button);
  }

  updateKeyStatus();
}

function syncModelSelectWithProvider() {
  const { providerKey, provider } = getSelectedProvider();
  const cached = getCachedModels(providerKey);
  if (cached?.models?.length) {
    renderModelOptions(cached.models, { source: 'cache', savedAt: cached.savedAt });
  } else {
    renderModelOptions(fallbackModelOptions(provider), { source: 'fallback' });
  }
}

function syncCustomModelVisibility() {
  const isCustom = elements.modelSelect.value === getCustomModelValue();
  elements.customModelField.classList.toggle('hidden', !isCustom);
  if (isCustom) {
    elements.customModelInput.focus();
  }
}

function getSelectedModelId() {
  if (elements.modelSelect.value === getCustomModelValue()) {
    const customModel = elements.customModelInput.value.trim();
    if (!customModel) {
      throw new Error('Paste a custom model ID or choose a model from the dropdown.');
    }
    return customModel;
  }
  return elements.modelSelect.value;
}

function updateKeyStatus(message) {
  if (message) {
    elements.keyStatus.textContent = message;
    return;
  }
  const saved = localStorage.getItem(STORAGE_KEY);
  elements.keyStatus.textContent = saved
    ? 'Encrypted API key is saved in this browser. Enter the passphrase when generating with saved/direct key.'
    : 'No encrypted API key saved. Session-only use is available with a pasted key.';
}

async function callLlm(prompt, apiKey) {
  const { providerKey, provider } = getSelectedProvider();
  const model = getSelectedModelId();

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };

  if (providerKey === 'openrouter') {
    headers['HTTP-Referer'] = window.location.origin;
    headers['X-Title'] = activeConfig.appName;
  }

  const response = await fetchWithTimeout(provider.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: 'system', content: buildSystemPrompt() },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const detail = sanitizeProviderErrorDetail(await response.text());
    throw new Error(`${provider.label || providerKey} request failed with ${response.status}: ${detail}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Provider response did not include message content.');
  }

  return normalizeLlmPayload(extractJson(content), prompt);
}

async function copyText(text, successLabel) {
  if (!navigator.clipboard?.writeText) {
    announce('Clipboard is unavailable in this browser.');
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    announce(successLabel);
  } catch {
    announce('Could not copy to clipboard. Check browser permissions and try again.');
  }
}

function announce(message, target = elements.runnerStatus) {
  target.textContent = message;
}

function renderPayload(payload) {
  activePayload = payload;
  elements.payloadPreview.textContent = JSON.stringify(payload, null, 2);
}

async function getApiKeyForGeneration({ requirePastedKey = false } = {}) {
  const directKey = elements.apiKeyInput.value.trim();
  if (directKey) {
    return { apiKey: directKey, source: 'pasted' };
  }

  if (requirePastedKey) {
    throw new Error('Paste an API key to use session-only generation.');
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    throw new Error('No API key provided. Paste a key for this session or save an encrypted key first.');
  }

  const passphrase = elements.passphraseInput.value;
  if (!passphrase) {
    throw new Error('Enter the encryption passphrase to decrypt the saved key.');
  }

  return { apiKey: await decryptApiKey(JSON.parse(saved), passphrase), source: 'saved' };
}

async function generatePayloadWithKeyMode({ requirePastedKey = false } = {}) {
  const prompt = elements.promptInput.value.trim();
  if (!prompt) {
    announce('Add a prompt before generating.');
    return;
  }

  let apiKeyRecord = null;
  try {
    assertSecureCryptoContext();
    elements.generateWithLlm.disabled = true;
    elements.useKeyOnce.disabled = true;
    elements.generateWithLlm.textContent = 'Generating…';
    announce('Generating runner payload with LLM…');
    apiKeyRecord = await getApiKeyForGeneration({ requirePastedKey });
    const payload = await callLlm(prompt, apiKeyRecord.apiKey);
    renderPayload(payload);
    announce(apiKeyRecord.source === 'pasted' ? 'LLM payload generated with session-only key.' : 'LLM payload generated with saved key.');
  } catch (error) {
    announce(`Generation failed: ${error.message}`);
  } finally {
    if (apiKeyRecord?.source === 'pasted' && elements.forgetKeyAfterGeneration.checked) {
      clearSensitiveInputs();
    }
    if (elements.forgetKeyAfterGeneration.checked) {
      clearPassphraseInput();
    }
    apiKeyRecord = null;
    elements.generateWithLlm.disabled = false;
    elements.useKeyOnce.disabled = false;
    elements.generateWithLlm.textContent = 'Generate with saved/direct key';
  }
}

async function submitPayloadToScheduleOS() {
  const endpoint = (activeConfig.scheduleOsEndpoint || '').trim();
  if (!endpoint) {
    announce('ScheduleOS endpoint is not configured.');
    return;
  }
  if (!activePayload) {
    announce('Build or generate a payload before sending to ScheduleOS.');
    return;
  }

  try {
    elements.submitToScheduleOS.disabled = true;
    elements.submitToScheduleOS.textContent = 'Sending…';
    announce('Sending payload to ScheduleOS…');

    const response = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activePayload),
    });

    if (!response.ok) {
      const detail = sanitizeProviderErrorDetail(await response.text());
      throw new Error(`ScheduleOS request failed with ${response.status}: ${detail}`);
    }

    announce('Payload sent to ScheduleOS.');
  } catch (error) {
    announce(`ScheduleOS submission failed: ${error.message}`);
  } finally {
    elements.submitToScheduleOS.disabled = false;
    elements.submitToScheduleOS.textContent = 'Send to ScheduleOS';
    syncScheduleOsControls();
  }
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    return;
  }
  navigator.serviceWorker.register('./sw.js').catch((error) => {
    console.warn('ShortcutForge service worker registration failed', error);
  });
}

function showSecureContextWarning() {
  secureContextAvailable = false;
  announce('Secure context required for encryption and provider calls. Use HTTPS or localhost.');
  elements.saveApiKey.disabled = true;
  elements.generateWithLlm.disabled = true;
  elements.useKeyOnce.disabled = true;
  elements.refreshModels.disabled = true;
}

function wireEvents() {
  elements.providerSelect.addEventListener('change', syncModelSelectWithProvider);
  elements.modelSelect.addEventListener('change', syncCustomModelVisibility);
  elements.refreshModels.addEventListener('click', refreshProviderModels);

  elements.saveApiKey.addEventListener('click', async () => {
    const apiKey = elements.apiKeyInput.value.trim();
    const passphrase = elements.passphraseInput.value;
    if (!apiKey || !passphrase) {
      updateKeyStatus('Paste an API key and enter a passphrase before saving.');
      return;
    }
    try {
      assertSecureCryptoContext();
      const encrypted = await encryptApiKey(apiKey, passphrase);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
      clearSensitiveInputs();
      updateKeyStatus('Encrypted API key saved locally in this browser. Use a dedicated low-limit provider key.');
    } catch (error) {
      updateKeyStatus(`Could not save key: ${error.message}`);
    }
  });

  elements.clearApiKey.addEventListener('click', () => {
    localStorage.removeItem(STORAGE_KEY);
    clearSensitiveInputs();
    clearPassphraseInput();
    updateKeyStatus('Saved key and local key fields cleared from this browser.');
  });

  elements.copyRunnerLink.addEventListener('click', async () => {
    await copyText(activeConfig.runnerInstallUrl, 'Runner iCloud link copied.');
  });

  elements.copyPrompt.addEventListener('click', async () => {
    const prompt = elements.promptInput.value.trim();
    if (!prompt) {
      announce('Add a prompt before copying.');
      return;
    }
    await copyText(prompt, 'Prompt copied.');
  });

  elements.useKeyOnce.addEventListener('click', async () => {
    await generatePayloadWithKeyMode({ requirePastedKey: true });
  });

  elements.generateWithLlm.addEventListener('click', async () => {
    await generatePayloadWithKeyMode({ requirePastedKey: false });
  });

  elements.buildPayload.addEventListener('click', () => {
    const prompt = elements.promptInput.value.trim();
    if (!prompt) {
      announce('Add a prompt before building a payload.');
      return;
    }
    renderPayload(buildRunnerPayload(prompt));
    announce('Fallback runner payload built.');
  });

  elements.copyPayload.addEventListener('click', async () => {
    if (!activePayload) {
      announce('Build or generate a payload before copying.');
      return;
    }
    await copyText(JSON.stringify(activePayload, null, 2), 'Payload JSON copied.');
  });

  elements.submitToScheduleOS.addEventListener('click', submitPayloadToScheduleOS);
}

try {
  assertSecureCryptoContext();
} catch {
  showSecureContextWarning();
}

await loadConfig();
renderConfig();
wireEvents();
registerServiceWorker();
