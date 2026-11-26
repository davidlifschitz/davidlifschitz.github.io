import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const INDEX_PATH = path.join(ROOT, 'index.html');
const CSS_PATH = path.join(ROOT, 'styles', 'home.css');
const OG_PATH = path.join(ROOT, 'assets', 'og.png');
const DEMOS_DIR = path.join(ROOT, 'assets', 'demos');

const SITE = 'https://davidlifschitz.github.io/';
const TITLE = 'David Lifschitz | AI engineer building agent systems';
const POSITIONING = 'Multi-agent pipelines, tools, and products, running live today. Looking for an AI engineering role.';
const EMAIL = 'mailto:david.p.lifschitz@gmail.com';

const PROJECTS = [
  {
    slug: 'app-factory',
    title: 'App Factory',
    line: 'A 5-agent pipeline that turns an app idea into requirements, a plan, a build spec, a reviewed PR, and a Vercel + Supabase deploy, with me approving each step.',
  },
  {
    slug: 'traingames',
    title: 'TrainGames',
    line: 'Games for the train, not games about trains: a free browser arcade built to play on a commute.',
  },
  {
    slug: 'shorts',
    title: 'YouTube Shorts agent workflow',
    line: 'An agent workflow that runs a Shorts channel from niche research to scripted, voiced, captioned uploads, with a human approving every post.',
  },
  {
    slug: 'bettermta',
    title: 'BetterMTA',
    line: '[one line on what I built]',
  },
];

const REAL_LINKS = [
  'https://os-online-board-games.vercel.app',
  'https://github.com/davidlifschitz/online-board-games',
  'https://github.com/davidlifschitz/BetterMTA',
  'https://github.com/davidlifschitz',
  EMAIL,
];

const PLACEHOLDERS = [
  '[stack]',
  '[live link]',
  '[repo link]',
  '[one line on what I built]',
  '[about: 2 sentences, to be supplied]',
  '[LinkedIn URL]',
];

const html = await fs.readFile(INDEX_PATH, 'utf8');

function meta(attr, name) {
  const pattern = new RegExp(`<meta\\s+${attr}="${name}"\\s+content="([^"]*)"`, 'i');
  return html.match(pattern)?.[1];
}

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

test('homepage head has title, description, canonical, theme-color, favicon', () => {
  assert.equal(html.match(/<title>([^<]*)<\/title>/)?.[1], TITLE);
  assert.equal(meta('name', 'description'), POSITIONING);
  assert.match(html, new RegExp(`<link rel="canonical" href="${SITE}"`));
  assert.ok(meta('name', 'theme-color'), 'theme-color meta missing');
  assert.match(html, /<link rel="icon" href="favicon\.svg"/);
});

test('homepage has Open Graph and Twitter tags with an absolute image URL', () => {
  const image = `${SITE}assets/og.png`;
  assert.equal(meta('property', 'og:url'), SITE);
  assert.equal(meta('property', 'og:title'), TITLE);
  assert.equal(meta('property', 'og:description'), POSITIONING);
  assert.equal(meta('property', 'og:image'), image);
  assert.equal(meta('property', 'og:image:width'), '1200');
  assert.equal(meta('property', 'og:image:height'), '630');
  assert.equal(meta('name', 'twitter:card'), 'summary_large_image');
  assert.equal(meta('name', 'twitter:image'), image);
});

test('assets/og.png is a 1200x630 PNG', async () => {
  const buf = await fs.readFile(OG_PATH);
  assert.equal(buf.subarray(1, 4).toString('ascii'), 'PNG');
  assert.equal(buf.readUInt32BE(16), 1200);
  assert.equal(buf.readUInt32BE(20), 630);
});

test('homepage copy is present word for word, projects in order', () => {
  assert.match(html, /<h1[^>]*>I build agent systems that ship\.<\/h1>/);
  assert.ok(html.includes(POSITIONING));
  assert.match(html, /<a class="btn btn--primary" href="mailto:david\.p\.lifschitz@gmail\.com">Email me<\/a>/);
  assert.match(html, /<a class="btn" href="https:\/\/github\.com\/davidlifschitz">GitHub<\/a>/);

  let cursor = 0;
  for (const project of PROJECTS) {
    const at = html.indexOf(`>${project.title}</h2>`, cursor);
    assert.ok(at > cursor, `${project.title} missing or out of order`);
    assert.ok(html.includes(`<p>${project.line}</p>`), `${project.title} one-liner changed`);
    cursor = at;
  }

  for (const label of ['Writing', 'Ecosystem', 'Dashboard']) {
    assert.ok(html.includes(`>${label}</a>`), `footer link ${label} missing`);
  }
});

test('placeholders stay visible verbatim and are never links', () => {
  for (const placeholder of PLACEHOLDERS) {
    assert.ok(html.includes(placeholder), `placeholder ${placeholder} missing`);
  }
  for (const [, href, text] of html.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
    assert.ok(!/\[[^\]]*\]/.test(href), `placeholder used as href: ${href}`);
    assert.ok(!/\[[^\]]*\]/.test(text), `placeholder rendered as a link: ${text}`);
  }
});

test('external links are only the ones supplied', () => {
  const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]*)"/g)].map((m) => m[1]);
  for (const href of hrefs.filter((h) => /^(?:https?:|mailto:)/.test(h))) {
    assert.ok(REAL_LINKS.includes(href), `unexpected external link: ${href}`);
  }
});

test('homepage loads no third-party code, fonts, reel, or space mode', () => {
  assert.doesNotMatch(html, /<script[^>]+src=/i, 'homepage must not load external scripts');
  assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cal\.com/i);
  assert.doesNotMatch(html, /hyperframes|space-mode|data-space|data-site-nav|site\.css/i);
  assert.match(html, /<link rel="stylesheet" href="styles\/home\.css"/);
});

test('CSP is enforced, self-only, and allows exactly the inline script', () => {
  const csp = html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]*)"/)?.[1];
  assert.ok(csp, 'enforcing CSP meta missing');
  assert.doesNotMatch(html, /Content-Security-Policy-Report-Only/);
  assert.doesNotMatch(csp, /https?:|unsafe-inline|unsafe-eval/);

  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  assert.equal(scripts.length, 1, 'expected one inline script');
  const hash = `sha256-${crypto.createHash('sha256').update(scripts[0], 'utf8').digest('base64')}`;
  assert.ok(csp.includes(`'${hash}'`), `CSP script hash is stale; expected '${hash}'`);
});

test('homepage has landmarks, skip link, and one section per project', () => {
  assert.match(html, /<a class="skip-link" href="#main-content">/);
  assert.match(html, /<header\b/);
  assert.match(html, /<main\b[^>]*id="main-content"/);
  assert.match(html, /<footer\b/);
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  for (const { slug } of PROJECTS) {
    assert.match(html, new RegExp(`<section class="card" aria-labelledby="p-${slug}">`));
  }
});

test('demo slots match the clips in assets/demos', async () => {
  for (const { slug } of PROJECTS) {
    const slot = html.match(new RegExp(`<div class="demo" data-demo-slot="${slug}">([\\s\\S]*?)</div>`))?.[1];
    assert.ok(slot !== undefined, `demo slot for ${slug} missing`);

    const hasClip = await exists(path.join(DEMOS_DIR, `${slug}.mp4`));
    if (!hasClip) {
      assert.equal(slot.trim(), '20s demo coming', `${slug} has no clip, so it should show the placeholder`);
      continue;
    }

    assert.ok(await exists(path.join(DEMOS_DIR, `${slug}.jpg`)), `${slug}.mp4 needs a ${slug}.jpg poster`);
    assert.match(slot, /<video data-demo muted loop playsinline preload="none"/, `${slug} clip exists but slot has no <video>`);
    assert.ok(slot.includes(`poster="assets/demos/${slug}.jpg"`));
    assert.ok(slot.includes(`src="assets/demos/${slug}.mp4"`));
  }
});

test('every local href, src, and poster on the homepage resolves', async () => {
  const refs = [...html.matchAll(/\b(?:href|src|poster)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(?:[a-z]+:|#)/i.test(ref)) continue;
    let target = path.join(ROOT, ref.split(/[?#]/)[0]);
    if (ref.endsWith('/')) target = path.join(target, 'index.html');
    assert.ok(await exists(target), `homepage reference does not resolve: ${ref}`);
  }
});

test('homepage HTML + CSS stay under 30 KB', async () => {
  const [htmlStat, cssStat] = await Promise.all([fs.stat(INDEX_PATH), fs.stat(CSS_PATH)]);
  const total = htmlStat.size + cssStat.size;
  assert.ok(total < 30 * 1024, `homepage is ${total} bytes`);
});
