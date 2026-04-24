const STORAGE_KEY = "shortcutforge.encryptedApiKey.v1";
const MODEL_CACHE_KEY = "shortcutforge.modelCache.v1";
const CUSTOM_MODEL_VALUE = "__custom__";
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const DEFAULT_CONFIG = {
  appName: "ShortcutForge Web Runner",
  runnerShortcutName: "ShortcutForge Runner",
  runnerInstallUrl: "https://www.icloud.com/shortcuts/290365e70329446caec7e93f702a7919",
  scheduleOsEndpoint: "",
  llmProviders: {
    openrouter: {
      label: "OpenRouter",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      modelsEndpoint: "https://openrouter.ai/api/v1/models",
      defaultModel: "openai/gpt-4o-mini",
      modelFallbacks: ["openai/gpt-4o-mini"]
    },
    nvidia: {
      label: "NVIDIA NIM",
      endpoint: "https://integrate.api.nvidia.com/v1/chat/completions",
      modelsEndpoint: "https://integrate.api.nvidia.com/v1/models",
      defaultModel: "meta/llama-3.1-70b-instruct",
      modelFallbacks: ["meta/llama-3.1-70b-instruct"]
    }
  },
  defaultProvider: "openrouter",
  customModelValue: CUSTOM_MODEL_VALUE,
  examplePrompts: [
    "Ask me what text to send, let me choose a contact, and prepare the message."
  ]
};

const elements = {
  installRunner: document.querySelector("#installRunner"),
  copyRunnerLink: document.querySelector("#copyRunnerLink"),
  runnerStatus: document.querySelector("#runnerStatus"),
  providerSelect: document.querySelector("#providerSelect"),
  modelSelect: document.querySelector("#modelSelect"),
  refreshModels: document.querySelector("#refreshModels"),
  customModelField: document.querySelector("#customModelField"),
  customModelInput: document.querySelector("#customModelInput"),
  modelStatus: document.querySelector("#modelStatus"),
  apiKeyInput: document.querySelector("#apiKeyInput"),
  passphraseInput: document.querySelector("#passphraseInput"),
  forgetKeyAfterGeneration: document.querySelector("#forgetKeyAfterGeneration"),
  useKeyOnce: document.querySelector("#useKeyOnce"),
  saveApiKey: document.querySelector("#saveApiKey"),
  clearApiKey: document.querySelector("#clearApiKey"),
  keyStatus: document.querySelector("#keyStatus"),
  promptInput: document.querySelector("#promptInput"),
  copyPrompt: document.querySelector("#copyPrompt"),
  generateWithLlm: document.querySelector("#generateWithLlm"),
  buildPayload: document.querySelector("#buildPayload"),
  examples: document.querySelector("#examples"),
  payloadPreview: document.querySelector("#payloadPreview"),
  copyPayload: document.querySelector("#copyPayload")
};

let activeConfig = DEFAULT_CONFIG;
let activePayload = null;

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function base64ToBytes(base64) {
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

function clearSensitiveInputs() {
  elements.apiKeyInput.value = "";
}

async function deriveKey(passphrase, salt) {
  const material = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 250000,
      hash: "SHA-256"
    },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptApiKey(apiKey, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoder.encode(apiKey)
  );

  return {
    version: 1,
    kdf: "PBKDF2-SHA256",
    iterations: 250000,
    cipher: "AES-GCM",
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(ciphertext),
    savedAt: new Date().toISOString()
  };
}

async function decryptApiKey(encrypted, passphrase) {
  const salt = base64ToBytes(encrypted.salt);
  const iv = base64ToBytes(encrypted.iv);
  const ciphertext = base64ToBytes(encrypted.ciphertext);
  const key = await deriveKey(passphrase, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return decoder.decode(plaintext);
}

async function loadConfig() {
  try {
    const response = await fetch("./config.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Config request failed with ${response.status}`);
    }
    const config = await response.json();
    activeConfig = { ...DEFAULT_CONFIG, ...config };
  } catch (error) {
    console.warn("Using default ShortcutForge web config", error);
    activeConfig = DEFAULT_CONFIG;
  }
}

function getCustomModelValue() {
  return activeConfig.customModelValue || CUSTOM_MODEL_VALUE;
}

function getSelectedProvider() {
  const providerKey = elements.providerSelect.value || activeConfig.defaultProvider;
  const provider = activeConfig.llmProviders[providerKey];
  if (!provider) {
    throw new Error(`Unknown provider: ${providerKey}`);
  }
  return { providerKey, provider };
}

function getCachedModels(providerKey) {
  try {
    const cache = JSON.parse(localStorage.getItem(MODEL_CACHE_KEY) || "{}");
    return cache[providerKey] || null;
  } catch {
    return null;
  }
}

function setCachedModels(providerKey, models) {
  try {
    const cache = JSON.parse(localStorage.getItem(MODEL_CACHE_KEY) || "{}");
    cache[providerKey] = {
      savedAt: new Date().toISOString(),
      models
    };
    localStorage.setItem(MODEL_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.warn("Unable to cache model list", error);
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

function renderModelOptions(models, { source = "fallback", savedAt = null } = {}) {
  const { providerKey, provider } = getSelectedProvider();
  const customValue = getCustomModelValue();
  const existingSelection = elements.modelSelect.value;
  const modelOptions = models?.length ? models : fallbackModelOptions(provider);

  elements.modelSelect.innerHTML = "";
  for (const model of modelOptions) {
    const option = document.createElement("option");
    option.value = model.id;
    option.textContent = modelLabel(model);
    elements.modelSelect.append(option);
  }

  const customOption = document.createElement("option");
  customOption.value = customValue;
  customOption.textContent = "Custom model…";
  elements.modelSelect.append(customOption);

  const preferred = modelOptions.some((model) => model.id === existingSelection)
    ? existingSelection
    : provider.defaultModel;
  elements.modelSelect.value = modelOptions.some((model) => model.id === preferred)
    ? preferred
    : modelOptions[0]?.id || customValue;

  syncCustomModelVisibility();

  if (source === "live") {
    elements.modelStatus.textContent = `Loaded ${modelOptions.length} current ${provider.label || providerKey} models.`;
  } else if (source === "cache") {
    const suffix = savedAt ? ` Cached ${new Date(savedAt).toLocaleString()}.` : "";
    elements.modelStatus.textContent = `Using cached ${provider.label || providerKey} model list.${suffix}`;
  } else {
    elements.modelStatus.textContent = `Using fallback ${provider.label || providerKey} model list. Tap Refresh model list for current models.`;
  }
}

function parseProviderModels(data) {
  const models = Array.isArray(data?.data) ? data.data : [];
  return models
    .map((model) => ({
      id: model.id || model.root || model.name,
      name: model.name || model.id || model.root
    }))
    .filter((model) => model.id)
    .filter((model, index, all) => all.findIndex((candidate) => candidate.id === model.id) === index)
    .sort((a, b) => a.id.localeCompare(b.id));
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
  } catch {
    return null;
  }
}

async function refreshProviderModels() {
  const { providerKey, provider } = getSelectedProvider();
  if (!provider.modelsEndpoint) {
    renderModelOptions(fallbackModelOptions(provider), { source: "fallback" });
    return;
  }

  let apiKey = null;
  try {
    elements.refreshModels.disabled = true;
    elements.refreshModels.textContent = "Refreshing…";
    elements.modelStatus.textContent = `Loading current ${provider.label || providerKey} models…`;
    apiKey = await getOptionalApiKeyForModelRefresh();

    const headers = { Accept: "application/json" };
    if (apiKey) {
      headers.Authorization = `Bearer ${apiKey}`;
    }

    const response = await fetch(provider.modelsEndpoint, { headers });
    if (!response.ok) {
      throw new Error(`Model list request failed with ${response.status}`);
    }

    const data = await response.json();
    const models = parseProviderModels(data);
    if (!models.length) {
      throw new Error("Provider response did not include model IDs.");
    }

    setCachedModels(providerKey, models);
    renderModelOptions(models, { source: "live" });
  } catch (error) {
    const cached = getCachedModels(providerKey);
    if (cached?.models?.length) {
      renderModelOptions(cached.models, { source: "cache", savedAt: cached.savedAt });
      elements.modelStatus.textContent += ` Refresh failed: ${error.message}`;
    } else {
      renderModelOptions(fallbackModelOptions(provider), { source: "fallback" });
      elements.modelStatus.textContent += ` Refresh failed: ${error.message}`;
    }
  } finally {
    apiKey = null;
    elements.refreshModels.disabled = false;
    elements.refreshModels.textContent = "Refresh model list";
  }
}

function renderConfig() {
  document.title = activeConfig.appName;
  elements.installRunner.href = activeConfig.runnerInstallUrl;
  elements.runnerStatus.textContent = `${activeConfig.runnerShortcutName} install link is configured.`;

  elements.providerSelect.innerHTML = "";
  for (const [key, provider] of Object.entries(activeConfig.llmProviders || {})) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = provider.label || key;
    elements.providerSelect.append(option);
  }
  elements.providerSelect.value = activeConfig.defaultProvider || Object.keys(activeConfig.llmProviders)[0];
  syncModelSelectWithProvider();

  elements.examples.innerHTML = "";
  for (const prompt of activeConfig.examplePrompts || []) {
    const button = document.createElement("button");
    button.className = "example-button";
    button.type = "button";
    button.textContent = prompt;
    button.addEventListener("click", () => {
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
    renderModelOptions(cached.models, { source: "cache", savedAt: cached.savedAt });
  } else {
    renderModelOptions(fallbackModelOptions(provider), { source: "fallback" });
  }
}

function syncCustomModelVisibility() {
  const isCustom = elements.modelSelect.value === getCustomModelValue();
  elements.customModelField.classList.toggle("hidden", !isCustom);
  if (isCustom) {
    elements.customModelInput.focus();
  }
}

function getSelectedModelId() {
  if (elements.modelSelect.value === getCustomModelValue()) {
    const customModel = elements.customModelInput.value.trim();
    if (!customModel) {
      throw new Error("Paste a custom model ID or choose a model from the dropdown.");
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
    ? "Encrypted API key is saved in this browser. Enter the passphrase when generating with saved/direct key."
    : "No encrypted API key saved. Session-only use is available with a pasted key.";
}

function inferShortcutId(prompt) {
  const normalized = prompt.toLowerCase();
  if (normalized.includes("text") || normalized.includes("message") || normalized.includes("contact")) {
    return "send-message-runner";
  }
  if (normalized.includes("task")) {
    return "create-task-from-text";
  }
  if (normalized.includes("idea") || normalized.includes("inbox")) {
    return "capture-idea-to-inbox";
  }
  if (normalized.includes("work on") || normalized.includes("next")) {
    return "what-should-i-work-on-now";
  }
  return "ask-scheduleos";
}

function buildRunnerPayload(prompt) {
  const trimmedPrompt = prompt.trim();
  const shortcutId = inferShortcutId(trimmedPrompt);
  const isLocalMessageRunner = shortcutId === "send-message-runner";

  return {
    shortcutId,
    invocationMode: "web",
    input: {
      message: trimmedPrompt,
      source: "ShortcutForge web app",
      capturedAt: new Date().toISOString()
    },
    routing: {
      mode: isLocalMessageRunner ? "local_runner_branch" : "interpret",
      target: isLocalMessageRunner ? "Shortcuts" : "ScheduleOS"
    },
    return: {
      type: isLocalMessageRunner ? "confirmation" : "text"
    }
  };
}

function buildSystemPrompt() {
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

function extractJson(text) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }
  const match = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/) || trimmed.match(/({[\s\S]*})/);
  if (!match) {
    throw new Error("LLM response did not contain JSON.");
  }
  return JSON.parse(match[1].trim());
}

function normalizeLlmPayload(payload, prompt) {
  const fallback = buildRunnerPayload(prompt);
  const normalized = {
    ...fallback,
    ...payload,
    input: {
      ...fallback.input,
      ...(payload.input || {}),
      source: "ShortcutForge web app",
      capturedAt: new Date().toISOString()
    },
    routing: {
      ...fallback.routing,
      ...(payload.routing || {})
    },
    return: {
      ...fallback.return,
      ...(payload.return || {})
    }
  };

  if (!normalized.shortcutId) {
    normalized.shortcutId = fallback.shortcutId;
  }

  return normalized;
}

async function callLlm(prompt, apiKey) {
  const { providerKey, provider } = getSelectedProvider();
  const model = getSelectedModelId();

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`
  };

  if (providerKey === "openrouter") {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = activeConfig.appName;
  }

  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model,
      temperature: 0.1,
      messages: [
        { role: "system", content: buildSystemPrompt() },
        { role: "user", content: prompt }
      ]
    })
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`${provider.label || providerKey} request failed with ${response.status}: ${detail.slice(0, 500)}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Provider response did not include message content.");
  }

  return normalizeLlmPayload(extractJson(content), prompt);
}

async function copyText(text, successLabel) {
  await navigator.clipboard.writeText(text);
  announce(successLabel);
}

function announce(message) {
  elements.runnerStatus.textContent = message;
}

function renderPayload(payload) {
  activePayload = payload;
  elements.payloadPreview.textContent = JSON.stringify(payload, null, 2);
}

async function getApiKeyForGeneration({ requirePastedKey = false } = {}) {
  const directKey = elements.apiKeyInput.value.trim();
  if (directKey) {
    return { apiKey: directKey, source: "pasted" };
  }

  if (requirePastedKey) {
    throw new Error("Paste an API key to use session-only generation.");
  }

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    throw new Error("No API key provided. Paste a key for this session or save an encrypted key first.");
  }

  const passphrase = elements.passphraseInput.value;
  if (!passphrase) {
    throw new Error("Enter the encryption passphrase to decrypt the saved key.");
  }

  return { apiKey: await decryptApiKey(JSON.parse(saved), passphrase), source: "saved" };
}

async function generatePayloadWithKeyMode({ requirePastedKey = false } = {}) {
  const prompt = elements.promptInput.value.trim();
  if (!prompt) {
    announce("Add a prompt before generating.");
    return;
  }

  let apiKeyRecord = null;
  try {
    elements.generateWithLlm.disabled = true;
    elements.useKeyOnce.disabled = true;
    elements.generateWithLlm.textContent = "Generating…";
    announce("Generating runner payload with LLM…");
    apiKeyRecord = await getApiKeyForGeneration({ requirePastedKey });
    const payload = await callLlm(prompt, apiKeyRecord.apiKey);
    renderPayload(payload);
    announce(apiKeyRecord.source === "pasted" ? "LLM payload generated with session-only key." : "LLM payload generated with saved key.");
  } catch (error) {
    announce(`Generation failed: ${error.message}`);
  } finally {
    if (apiKeyRecord?.source === "pasted" && elements.forgetKeyAfterGeneration.checked) {
      clearSensitiveInputs();
    }
    apiKeyRecord = null;
    elements.generateWithLlm.disabled = false;
    elements.useKeyOnce.disabled = false;
    elements.generateWithLlm.textContent = "Generate with saved/direct key";
  }
}

function wireEvents() {
  elements.providerSelect.addEventListener("change", syncModelSelectWithProvider);
  elements.modelSelect.addEventListener("change", syncCustomModelVisibility);
  elements.refreshModels.addEventListener("click", refreshProviderModels);

  elements.saveApiKey.addEventListener("click", async () => {
    const apiKey = elements.apiKeyInput.value.trim();
    const passphrase = elements.passphraseInput.value;
    if (!apiKey || !passphrase) {
      updateKeyStatus("Paste an API key and enter a passphrase before saving.");
      return;
    }
    try {
      const encrypted = await encryptApiKey(apiKey, passphrase);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));
      clearSensitiveInputs();
      updateKeyStatus("Encrypted API key saved locally in this browser. Use a dedicated low-limit provider key.");
    } catch (error) {
      updateKeyStatus(`Could not save key: ${error.message}`);
    }
  });

  elements.clearApiKey.addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEY);
    clearSensitiveInputs();
    elements.passphraseInput.value = "";
    updateKeyStatus("Saved key and local key fields cleared from this browser.");
  });

  elements.copyRunnerLink.addEventListener("click", async () => {
    await copyText(activeConfig.runnerInstallUrl, "Runner iCloud link copied.");
  });

  elements.copyPrompt.addEventListener("click", async () => {
    const prompt = elements.promptInput.value.trim();
    if (!prompt) {
      announce("Add a prompt before copying.");
      return;
    }
    await copyText(prompt, "Prompt copied.");
  });

  elements.useKeyOnce.addEventListener("click", async () => {
    await generatePayloadWithKeyMode({ requirePastedKey: true });
  });

  elements.generateWithLlm.addEventListener("click", async () => {
    await generatePayloadWithKeyMode({ requirePastedKey: false });
  });

  elements.buildPayload.addEventListener("click", () => {
    const prompt = elements.promptInput.value.trim();
    if (!prompt) {
      announce("Add a prompt before building a payload.");
      return;
    }
    renderPayload(buildRunnerPayload(prompt));
    announce("Fallback runner payload built.");
  });

  elements.copyPayload.addEventListener("click", async () => {
    if (!activePayload) {
      announce("Build or generate a payload before copying.");
      return;
    }
    await copyText(JSON.stringify(activePayload, null, 2), "Payload JSON copied.");
  });
}

await loadConfig();
renderConfig();
wireEvents();
