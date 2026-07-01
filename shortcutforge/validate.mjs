import { readFile } from 'node:fs/promises';
import { collectProviderConnectOrigins } from './lib/config-utils.mjs';

const REQUIRED_FILES = [
  'index.html',
  'styles.css',
  'app.js',
  'config.json',
  'manifest.webmanifest',
  'sw.js',
];

const LIB_FILES = [
  'lib/constants.mjs',
  'lib/config-utils.mjs',
  'lib/crypto-api.mjs',
  'lib/network.mjs',
  'lib/payload.mjs',
];

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

for (const path of [...REQUIRED_FILES, ...LIB_FILES]) {
  const content = await readFile(path, 'utf8');
  if (!content.trim()) {
    throw new Error(`${path} is empty`);
  }
}

const config = await readJson('config.json');
if (!config.runnerInstallUrl?.startsWith('https://www.icloud.com/shortcuts/')) {
  throw new Error('config.runnerInstallUrl must be an iCloud Shortcuts URL');
}

if (!Array.isArray(config.examplePrompts) || config.examplePrompts.length === 0) {
  throw new Error('config.examplePrompts must include at least one prompt');
}

if (!config.llmProviders || typeof config.llmProviders !== 'object') {
  throw new Error('config.llmProviders must define at least one BYOK LLM provider');
}

for (const [key, provider] of Object.entries(config.llmProviders)) {
  if (!provider.label || !provider.endpoint || !provider.modelsEndpoint || !provider.defaultModel) {
    throw new Error(`config.llmProviders.${key} must include label, endpoint, modelsEndpoint, and defaultModel`);
  }
  if (!provider.endpoint.startsWith('https://') || !provider.modelsEndpoint.startsWith('https://')) {
    throw new Error(`config.llmProviders.${key} endpoints must be HTTPS URLs`);
  }
  if (!Array.isArray(provider.modelFallbacks) || provider.modelFallbacks.length === 0) {
    throw new Error(`config.llmProviders.${key}.modelFallbacks must include at least one fallback model`);
  }
}

if (!config.defaultProvider || !config.llmProviders[config.defaultProvider]) {
  throw new Error('config.defaultProvider must reference a configured LLM provider');
}

if (!config.customModelValue) {
  throw new Error('config.customModelValue must be configured for the custom model dropdown option');
}

if (config.scheduleOsEndpoint && !config.scheduleOsEndpoint.startsWith('https://')) {
  throw new Error('config.scheduleOsEndpoint must be an HTTPS URL when configured');
}

const manifest = await readJson('manifest.webmanifest');
if (!manifest.name || !manifest.start_url || manifest.display !== 'standalone') {
  throw new Error('manifest.webmanifest is missing required PWA fields');
}

if (!Array.isArray(manifest.icons) || manifest.icons.length === 0) {
  throw new Error('manifest.webmanifest must include at least one icon');
}

const indexHtml = await readFile('index.html', 'utf8');
for (const requiredSnippet of [
  'Content-Security-Policy',
  'class="site-back"',
  '../index.html',
  '../ecosystem.html',
  'Use pasted key once',
  'Forget pasted API key after generation',
  'modelSelect',
  'customModelField',
  'Refresh model list',
  'Custom model ID',
  'submitToScheduleOS',
  'aria-live="polite"',
  'worker-src \'self\'',
]) {
  if (!indexHtml.includes(requiredSnippet)) {
    throw new Error(`index.html is missing expected hardened BYOK/model snippet: ${requiredSnippet}`);
  }
}

const stylesCss = await readFile('styles.css', 'utf8');
for (const requiredSnippet of ['.site-back']) {
  if (!stylesCss.includes(requiredSnippet)) {
    throw new Error(`styles.css is missing deploy-only site navigation snippet: ${requiredSnippet}`);
  }
}

const cspMatch = indexHtml.match(/connect-src ([^;]+);/);
if (!cspMatch) {
  throw new Error('index.html CSP is missing connect-src directive');
}

const cspConnectSources = new Set(cspMatch[1].split(/\s+/).filter(Boolean));
for (const origin of collectProviderConnectOrigins(config)) {
  if (!cspConnectSources.has(origin)) {
    throw new Error(`index.html CSP connect-src must include ${origin} for configured providers/endpoints`);
  }
}

const appJs = await readFile('app.js', 'utf8');
for (const requiredSnippet of [
  './lib/crypto-api.mjs',
  './lib/payload.mjs',
  'fetchWithTimeout',
  'sanitizeProviderErrorDetail',
  'submitPayloadToScheduleOS',
  'WrongPassphraseError',
  'assertSecureCryptoContext',
  'requirePastedKey',
  'forgetKeyAfterGeneration.checked',
  'refreshProviderModels',
  'modelsEndpoint',
  'customModelInput',
  'getSelectedModelId',
]) {
  if (!appJs.includes(requiredSnippet)) {
    throw new Error(`app.js is missing expected hardened BYOK/model snippet: ${requiredSnippet}`);
  }
}

console.log('ShortcutForge web runner validation passed.');
