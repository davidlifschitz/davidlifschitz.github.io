# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Preview

No build step. Serve from the repo root:

```bash
uv run --with http-server http-server -p 8080
# or
npx serve -l 8080 .
# or
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Architecture

Static GitHub Pages site — raw HTML/CSS/JS, no framework, no SSG.

**Pages:**

- `index.html` — personal homepage / ecosystem launchpad; **space mode** (homepage-only interactive portfolio map via `data-space-toggle`); **projects reel** section (`#projects-reel`) embeds `hyperframes/projects-reel/` via `<hyperframes-player>`; also hero, surfaces strip, `#products`, `#research`, `#mobile`
- `ecosystem.html` — ecosystem overview and layer map
- `dashboard.html` — ecosystem activity dashboard (references `scripts/dashboard.js` and `styles/dashboard.css`)
- `booking.html` — consulting intake (Cal.com embed)
- `blog/index.html` — writing hub for *Unwrapping the Stack* (6-part series)
- `blog/part1-files-folders.html` — Part 1: Files & Folders
- `blog/part2-apps.html` — Part 2: Apps
- `blog/part3-browsers.html` — Part 3: Browsers
- `blog/part4-operating-systems.html` — Part 4: Operating Systems
- `blog/part5-hardware.html` — Part 5: Hardware
- `blog/part6-identity.html` — Part 6: Identity
- `shortcutforge/index.html` — ShortcutForge mobile web runner (synced subtree; see below)
- `hyperframes/projects-reel/index.html` — Hyperframes composition; embedded on homepage, not a standalone nav target
- `robots.txt` — crawler rules; references sitemap URL
- `sitemap.xml` — canonical public URLs
- `404.html` — GitHub Pages not-found page

Shared site chrome: `scripts/site-nav.js`, `styles/site.css`. Space mode is intentionally homepage-only; other pages use `site-nav.js` without a space toggle.

**Dashboard data pipeline:**
- `data/loc-history.json` — the live data file; JSON with per-repo daily lines-changed history
- `scripts/update-loc-history.mjs` — Node 20 script that hits the GitHub API to regenerate `loc-history.json`; requires `ECOSYSTEM_GH_TOKEN` env var for private repos
- `.github/workflows/update-ecosystem-dashboard.yml` — runs the script nightly (2:15 AM UTC) and auto-commits updated data

**ShortcutForge subdirectory:**
- `shortcutforge/` is synced from `davidlifschitz/ShortcutForge` repo's `web` branch
- Do **not** edit files in `shortcutforge/` for product/feature work — changes belong in the source repo
- This deploy copy may still receive **intentional site-specific patches** (e.g. `.site-back` header/back-nav links into the main storefront). Preserve those when syncing; do not blindly overwrite with upstream

**Docs:**
- `docs/` contains planning docs (ECOSYSTEM_PLAN.md, DASHBOARD_REDESIGN_SPEC.md, etc.) — useful for intent behind features but not authoritative on current state

## Data Update

To manually refresh dashboard data locally:

```bash
ECOSYSTEM_GH_TOKEN=<token> DAYS_BACK=21 node scripts/update-loc-history.mjs
```

The workflow can also be triggered manually via `workflow_dispatch` in GitHub Actions.
