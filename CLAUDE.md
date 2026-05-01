# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Local Preview

No build step. Serve files directly:

```bash
uv run --with http-server http-server -p 8080
# or
npx serve .
```

## Architecture

Static GitHub Pages site — raw HTML/CSS/JS, no framework, no SSG.

**Pages:**
- `index.html` — personal homepage / ecosystem launchpad
- `ecosystem.html` — ecosystem overview
- `dashboard.html` — ecosystem activity dashboard (references `scripts/dashboard.js` and `styles/dashboard.css`)

**Dashboard data pipeline:**
- `data/loc-history.json` — the live data file; JSON with per-repo daily lines-changed history
- `scripts/update-loc-history.mjs` — Node 20 script that hits the GitHub API to regenerate `loc-history.json`; requires `ECOSYSTEM_GH_TOKEN` env var for private repos
- `.github/workflows/update-ecosystem-dashboard.yml` — runs the script nightly (2:15 AM UTC) and auto-commits updated data

**ShortcutForge subdirectory:**
- `shortcutforge/` is synced from `davidlifschitz/ShortcutForge` repo's `web` branch
- Do **not** edit files in `shortcutforge/` directly — changes belong in the source repo

**Docs:**
- `docs/` contains planning docs (ECOSYSTEM_PLAN.md, DASHBOARD_REDESIGN_SPEC.md, etc.) — useful for intent behind features but not authoritative on current state

## Data Update

To manually refresh dashboard data locally:

```bash
ECOSYSTEM_GH_TOKEN=<token> DAYS_BACK=21 node scripts/update-loc-history.mjs
```

The workflow can also be triggered manually via `workflow_dispatch` in GitHub Actions.
