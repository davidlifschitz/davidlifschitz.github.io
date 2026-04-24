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

const manifest = await readJson("manifest.webmanifest");
if (!manifest.name || !manifest.start_url || manifest.display !== "standalone") {
  throw new Error("manifest.webmanifest is missing required PWA fields");
}

console.log("ShortcutForge web runner validation passed.");
