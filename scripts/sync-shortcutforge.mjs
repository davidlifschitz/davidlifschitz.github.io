#!/usr/bin/env node
import { cp, mkdir, readFile, rm, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TARGET_DIR = path.join(ROOT, 'shortcutforge');
const UPSTREAM_REPO = process.env.SHORTCUTFORGE_UPSTREAM_REPO || 'https://github.com/davidlifschitz/ShortcutForge.git';
const UPSTREAM_BRANCH = process.env.SHORTCUTFORGE_UPSTREAM_BRANCH || 'web';
const WORKDIR = path.join(ROOT, '.tmp-shortcutforge-sync');

const PRESERVE_SNIPPETS = [
  'class="site-back"',
  '../index.html',
  '../ecosystem.html',
];

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function readPreserveSnippets() {
  const indexPath = path.join(TARGET_DIR, 'index.html');
  const stylesPath = path.join(TARGET_DIR, 'styles.css');
  const indexHtml = await readFile(indexPath, 'utf8');
  const stylesCss = await readFile(stylesPath, 'utf8');

  const siteBackBlock = indexHtml.match(/<header class="site-back">[\s\S]*?<\/header>/);
  if (!siteBackBlock) {
    throw new Error('Current shortcutforge/index.html is missing the deploy-only site-back header block.');
  }

  const siteBackCss = stylesCss.match(/\.site-back[\s\S]*?(?=\n\.|\n\/\*|\n@media|$)/);
  if (!siteBackCss) {
    throw new Error('Current shortcutforge/styles.css is missing the deploy-only .site-back styles.');
  }

  return {
    siteBackHeader: siteBackBlock[0],
    siteBackCss: siteBackCss[0],
  };
}

async function restoreSitePatches(indexHtml, stylesCss, preserved) {
  let nextIndex = indexHtml;
  if (!nextIndex.includes('class="site-back"')) {
    nextIndex = nextIndex.replace(
      /<body>\s*/,
      `$&${preserved.siteBackHeader}\n    `,
    );
  }

  let nextStyles = stylesCss;
  if (!nextStyles.includes('.site-back')) {
    nextStyles = `${nextStyles.trim()}\n\n${preserved.siteBackCss}\n`;
  }

  return { nextIndex, nextStyles };
}

async function resolveUpstreamWebDir(cloneDir) {
  const webDir = path.join(cloneDir, 'web');
  if (await pathExists(path.join(webDir, 'index.html'))) {
    return webDir;
  }
  if (await pathExists(path.join(cloneDir, 'index.html'))) {
    return cloneDir;
  }
  throw new Error('Upstream ShortcutForge clone did not include index.html at web/ or repo root.');
}

async function main() {
  const preserved = await readPreserveSnippets();

  await rm(WORKDIR, { recursive: true, force: true });
  await mkdir(WORKDIR, { recursive: true });

  const clone = spawnSync(
    'git',
    ['clone', '--depth', '1', '--branch', UPSTREAM_BRANCH, UPSTREAM_REPO, WORKDIR],
    { stdio: 'inherit' },
  );
  if (clone.status !== 0) {
    process.exit(clone.status || 1);
  }

  const upstreamPath = await resolveUpstreamWebDir(WORKDIR);

  await rm(TARGET_DIR, { recursive: true, force: true });
  await mkdir(TARGET_DIR, { recursive: true });
  await cp(upstreamPath, TARGET_DIR, { recursive: true });

  const indexPath = path.join(TARGET_DIR, 'index.html');
  const stylesPath = path.join(TARGET_DIR, 'styles.css');
  const { nextIndex, nextStyles } = await restoreSitePatches(
    await readFile(indexPath, 'utf8'),
    await readFile(stylesPath, 'utf8'),
    preserved,
  );

  await writeFile(indexPath, nextIndex, 'utf8');
  await writeFile(stylesPath, nextStyles, 'utf8');

  for (const snippet of PRESERVE_SNIPPETS) {
    if (!nextIndex.includes(snippet)) {
      throw new Error(`Sync result lost deploy-only snippet in index.html: ${snippet}`);
    }
  }

  const validate = spawnSync('node', ['validate.mjs'], {
    cwd: TARGET_DIR,
    stdio: 'inherit',
  });
  if (validate.status !== 0) {
    process.exit(validate.status || 1);
  }

  await rm(WORKDIR, { recursive: true, force: true });
  console.log('ShortcutForge deploy copy synced from upstream and site patches restored.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
