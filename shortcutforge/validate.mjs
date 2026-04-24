import { readFile } from "node:fs/promises";

const REQUIRED_FILES = [
  "index.html",
  "styles.css",
  "app.js",
  "config.json",
  "manifest.webmanifest"
];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

for (const path of REQUIRED_FILES) {
  const content = await readFile(path, "utf8");
  if (!content.trim()) {
    throw new Error(`${path} is empty`);
  }
}

const config = await readJson("config.json");
if (!config.runnerInstallUrl?.startsWith("https://www.icloud.com/shortcuts/")) {
  throw new Error("config.runnerInstallUrl must be an iCloud Shortcuts URL");
}

if (!Array.isArray(config.examplePrompts) || config.examplePrompts.length === 0) {
  throw new Error("config.examplePrompts must include at least one prompt");
}

if (!config.llmProviders || typeof config.llmProviders !== "object") {
  throw new Error("config.llmProviders must define at least one BYOK LLM provider");
}

for (const [key, provider] of Object.entries(config.llmProviders)) {
  if (!provider.label || !provider.endpoint || !provider.defaultModel) {
    throw new Error(`config.llmProviders.${key} must include label, endpoint, and defaultModel`);
  }
  if (!provider.endpoint.startsWith("https://")) {
    throw new Error(`config.llmProviders.${key}.endpoint must be an HTTPS URL`);
  }
}

if (!config.defaultProvider || !config.llmProviders[config.defaultProvider]) {
  throw new Error("config.defaultProvider must reference a configured LLM provider");
}

const manifest = await readJson("manifest.webmanifest");
if (!manifest.name || !manifest.start_url || manifest.display !== "standalone") {
  throw new Error("manifest.webmanifest is missing required PWA fields");
}

const appJs = await readFile("app.js", "utf8");
for (const requiredSnippet of ["crypto.subtle", "Generate with LLM", "Authorization: `Bearer ${apiKey}`"]) {
  if (!appJs.includes(requiredSnippet)) {
    throw new Error(`app.js is missing expected BYOK LLM snippet: ${requiredSnippet}`);
  }
}

console.log("ShortcutForge web runner validation passed.");
