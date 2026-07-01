import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { validateLocHistory } from './lib/loc-history-schema.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SHORTCUTFORGE_DIR = path.join(ROOT, 'shortcutforge');
const FEED_PATH = path.join(ROOT, 'blog', 'feed.xml');
const LOC_HISTORY_PATH = path.join(ROOT, 'data', 'loc-history.json');
const SITEMAP_PATH = path.join(ROOT, 'sitemap.xml');
const ROBOTS_PATH = path.join(ROOT, 'robots.txt');
const CLIENT_SCRIPT_PATHS = [
  'scripts/site-nav.js',
  'scripts/dashboard.js',
  'scripts/booking.js',
  'scripts/hyperframes-fallback.js',
  'scripts/space-mode.js',
];

/** Pages with data-site-nav that intentionally omit id="main-content" on main. */
const MAIN_CONTENT_EXCEPTIONS = new Set([
  '404.html',
]);

const HREF_PATTERN = /\bhref\s*=\s*(["'])(.*?)\1/gi;
const DATA_SITE_NAV_PATTERN = /data-site-nav\b/;
const MAIN_WITH_ID_PATTERN = /<main\b[^>]*\bid\s*=\s*["']main-content["']/i;

const errors = [];

function fail(message) {
  errors.push(message);
}

function relPath(absolutePath) {
  return path.relative(ROOT, absolutePath).split(path.sep).join('/');
}

function isExternalHref(href) {
  return /^(?:https?:|\/\/|mailto:|tel:|javascript:|data:)/i.test(href);
}

function shouldSkipHref(href) {
  if (!href || href === '#') {
    return true;
  }
  if (href.startsWith('#')) {
    return true;
  }
  return isExternalHref(href);
}

function resolveInternalTarget(htmlPath, href) {
  const withoutQuery = href.split('?')[0];
  const withoutHash = withoutQuery.split('#')[0];
  if (!withoutHash || withoutHash === '.') {
    return null;
  }

  const absolute = path.resolve(path.dirname(htmlPath), withoutHash);
  return absolute.startsWith(ROOT) ? absolute : null;
}

async function walkHtmlFiles(dir, results = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') {
      continue;
    }

    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkHtmlFiles(absolutePath, results);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push(absolutePath);
    }
  }

  return results;
}

async function checkInternalHrefs() {
  const htmlFiles = await walkHtmlFiles(ROOT);
  const checked = new Set();

  for (const htmlPath of htmlFiles) {
    const content = await fs.readFile(htmlPath, 'utf8');
    let match;

    HREF_PATTERN.lastIndex = 0;
    while ((match = HREF_PATTERN.exec(content)) !== null) {
      const href = match[2].trim();
      if (shouldSkipHref(href)) {
        continue;
      }

      const targetPath = resolveInternalTarget(htmlPath, href);
      if (!targetPath) {
        continue;
      }

      const key = `${relPath(htmlPath)} -> ${href}`;
      if (checked.has(key)) {
        continue;
      }
      checked.add(key);

      let exists = await pathExists(targetPath);
      if (!exists && !path.extname(targetPath)) {
        exists = await pathExists(path.join(targetPath, 'index.html'));
      }

      if (!exists) {
        fail(`Missing internal link target: ${key} (expected ${relPath(targetPath)})`);
      }
    }
  }
}

async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function checkMainContent() {
  const htmlFiles = await walkHtmlFiles(ROOT);

  for (const htmlPath of htmlFiles) {
    const relative = relPath(htmlPath);
    const content = await fs.readFile(htmlPath, 'utf8');

    if (!DATA_SITE_NAV_PATTERN.test(content)) {
      continue;
    }

    if (MAIN_CONTENT_EXCEPTIONS.has(relative)) {
      continue;
    }

    if (!MAIN_WITH_ID_PATTERN.test(content)) {
      fail(
        `Page with data-site-nav must have <main id="main-content">: ${relative} ` +
          `(exceptions: ${[...MAIN_CONTENT_EXCEPTIONS].join(', ')})`,
      );
    }
  }
}

function runShortcutforgeValidate() {
  const result = spawnSync('node', ['validate.mjs'], {
    cwd: SHORTCUTFORGE_DIR,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.status === 0) {
    return;
  }

  const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
  fail(`ShortcutForge validation failed${output ? `:\n${output}` : ''}`);
}

async function checkBlogFeed() {
  let content;

  try {
    content = await fs.readFile(FEED_PATH, 'utf8');
  } catch {
    fail(`Missing blog feed: ${relPath(FEED_PATH)}`);
    return;
  }

  try {
    assertWellFormedXml(content, relPath(FEED_PATH));
  } catch (error) {
    fail(error.message);
  }
}

function assertWellFormedXml(content, label) {
  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error(`${label}: empty XML document`);
  }

  const xmllint = spawnSync('xmllint', ['--noout', '-'], {
    input: trimmed,
    encoding: 'utf8',
  });

  if (!xmllint.error) {
    if (xmllint.status === 0) {
      return;
    }
    throw new Error(`${label}: ${(xmllint.stderr || 'invalid XML').trim()}`);
  }

  parseWellFormedXml(trimmed, label);
}

function parseWellFormedXml(content, label) {
  let index = 0;

  function skipWhitespace() {
    while (index < content.length && /\s/.test(content[index])) {
      index += 1;
    }
  }

  function parseName() {
    skipWhitespace();
    const start = index;
    if (!/[\w:.-]/.test(content[index] ?? '')) {
      throw new Error(`${label}: expected XML name at position ${index}`);
    }
    index += 1;
    while (index < content.length && /[\w:.-]/.test(content[index])) {
      index += 1;
    }
    return content.slice(start, index);
  }

  function parseAttributes() {
    const attributes = new Map();

    while (true) {
      skipWhitespace();
      if (content[index] === '>' || content.startsWith('/>', index)) {
        return attributes;
      }

      const name = parseName();
      skipWhitespace();
      if (content[index] !== '=') {
        throw new Error(`${label}: expected '=' after attribute ${name}`);
      }
      index += 1;
      skipWhitespace();
      const quote = content[index];
      if (quote !== '"' && quote !== "'") {
        throw new Error(`${label}: expected quoted attribute value for ${name}`);
      }
      index += 1;
      const valueStart = index;
      while (index < content.length && content[index] !== quote) {
        index += 1;
      }
      if (index >= content.length) {
        throw new Error(`${label}: unterminated attribute value for ${name}`);
      }
      attributes.set(name, content.slice(valueStart, index));
      index += 1;
    }
  }

  function parseProlog() {
    skipWhitespace();
    if (content.startsWith('<?xml', index)) {
      const end = content.indexOf('?>', index);
      if (end === -1) {
        throw new Error(`${label}: unterminated XML declaration`);
      }
      index = end + 2;
      skipWhitespace();
    }
  }

  function parseElement() {
    skipWhitespace();
    if (content[index] !== '<') {
      throw new Error(`${label}: expected element at position ${index}`);
    }
    index += 1;

    if (content.startsWith('!--', index)) {
      index += 3;
      const end = content.indexOf('-->', index);
      if (end === -1) {
        throw new Error(`${label}: unterminated comment`);
      }
      index = end + 3;
      return null;
    }

    if (content.startsWith('![CDATA[', index)) {
      index += 8;
      const end = content.indexOf(']]>', index);
      if (end === -1) {
        throw new Error(`${label}: unterminated CDATA section`);
      }
      index = end + 3;
      return null;
    }

    if (content.startsWith('!', index)) {
      index += 1;
      while (index < content.length && content[index] !== '>') {
        index += 1;
      }
      if (index >= content.length) {
        throw new Error(`${label}: unterminated markup declaration`);
      }
      index += 1;
      return null;
    }

    if (content.startsWith('?', index)) {
      const end = content.indexOf('?>', index);
      if (end === -1) {
        throw new Error(`${label}: unterminated processing instruction`);
      }
      index = end + 2;
      return null;
    }

    const name = parseName();
    parseAttributes();
    skipWhitespace();

    if (content.startsWith('/>', index)) {
      index += 2;
      return { name, children: [] };
    }

    if (content[index] !== '>') {
      throw new Error(`${label}: expected '>' after start tag ${name}`);
    }
    index += 1;

    const children = [];
    while (index < content.length) {
      skipWhitespace();
      if (content.startsWith('</', index)) {
        index += 2;
        const closingName = parseName();
        skipWhitespace();
        if (content[index] !== '>') {
          throw new Error(`${label}: expected '>' closing tag ${closingName}`);
        }
        index += 1;
        if (closingName !== name) {
          throw new Error(`${label}: mismatched closing tag </${closingName}> for <${name}>`);
        }
        return { name, children };
      }

      if (content[index] === '<') {
        const child = parseElement();
        if (child) {
          children.push(child);
        }
        continue;
      }

      const textStart = index;
      while (index < content.length && content[index] !== '<') {
        index += 1;
      }
      if (content.slice(textStart, index).trim()) {
        children.push({ text: true });
      }
    }

    throw new Error(`${label}: unclosed element <${name}>`);
  }

  parseProlog();

  while (index < content.length) {
    skipWhitespace();
    if (index >= content.length) {
      break;
    }
    parseElement();
  }
}

async function checkLocHistory() {
  let content;

  try {
    content = await fs.readFile(LOC_HISTORY_PATH, 'utf8');
  } catch {
    fail(`Missing dashboard data file: ${relPath(LOC_HISTORY_PATH)}`);
    return;
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    fail(`Invalid JSON in ${relPath(LOC_HISTORY_PATH)}: ${error.message}`);
    return;
  }

  for (const message of validateLocHistory(parsed)) {
    fail(message);
  }
}

async function checkSitemap() {
  let content;

  try {
    content = await fs.readFile(SITEMAP_PATH, 'utf8');
  } catch {
    fail(`Missing sitemap: ${relPath(SITEMAP_PATH)}`);
    return;
  }

  const locPattern = /<loc>([^<]+)<\/loc>/g;
  let match;
  const checked = new Set();

  while ((match = locPattern.exec(content)) !== null) {
    const loc = match[1].trim();
    if (checked.has(loc)) {
      continue;
    }
    checked.add(loc);

    let pathname;
    try {
      pathname = new URL(loc).pathname;
    } catch {
      fail(`Invalid sitemap URL: ${loc}`);
      continue;
    }

    let targetPath = path.join(ROOT, pathname.replace(/^\//, ''));
    let exists = await pathExists(targetPath);
    if (!exists && pathname.endsWith('/')) {
      targetPath = path.join(ROOT, pathname.replace(/^\//, ''), 'index.html');
      exists = await pathExists(targetPath);
    }
    if (!exists && !path.extname(targetPath)) {
      exists = await pathExists(path.join(targetPath, 'index.html'));
    }

    if (!exists) {
      fail(`Sitemap URL does not resolve to a local file: ${loc} (expected ${relPath(targetPath)})`);
    }
  }

  try {
    const robots = await fs.readFile(ROBOTS_PATH, 'utf8');
    const sitemapRef = robots.match(/^Sitemap:\s*(.+)$/m);
    if (!sitemapRef) {
      fail('robots.txt must include a Sitemap directive');
    }
  } catch {
    fail(`Missing robots.txt: ${relPath(ROBOTS_PATH)}`);
  }
}

async function checkFeedEntries() {
  let content;

  try {
    content = await fs.readFile(FEED_PATH, 'utf8');
  } catch {
    return;
  }

  const entryPattern = /<entry>[\s\S]*?<link href="([^"]+)"[\s\S]*?<\/entry>/g;
  let match;

  while ((match = entryPattern.exec(content)) !== null) {
    const href = match[1].trim();
    let pathname;
    try {
      pathname = new URL(href).pathname;
    } catch {
      fail(`Invalid feed entry URL: ${href}`);
      continue;
    }

    const targetPath = path.join(ROOT, pathname.replace(/^\//, ''));
    if (!(await pathExists(targetPath))) {
      fail(`Feed entry URL does not resolve to a local file: ${href}`);
    }
  }
}

function checkClientScripts() {
  for (const relativePath of CLIENT_SCRIPT_PATHS) {
    const absolutePath = path.join(ROOT, relativePath);
    const result = spawnSync('node', ['--check', absolutePath], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    if (result.status !== 0) {
      const output = [result.stdout, result.stderr].filter(Boolean).join('\n').trim();
      fail(`JavaScript syntax check failed for ${relativePath}${output ? `: ${output}` : ''}`);
    }
  }
}

async function main() {
  await checkInternalHrefs();
  await checkMainContent();
  runShortcutforgeValidate();
  await checkBlogFeed();
  await checkFeedEntries();
  await checkLocHistory();
  await checkSitemap();
  checkClientScripts();

  if (errors.length > 0) {
    console.error('Site validation failed:\n');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Site validation passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
