# David Lifschitz

Personal landing page and public storefront for GitHub Pages — static HTML/CSS/JS, no build step.

## Local preview

Serve from the repo root:

```bash
uv run --with http-server http-server -p 8080
# or
npx serve -l 8080 .
# or
python3 -m http.server 8080
```

Open [http://localhost:8080](http://localhost:8080).

## Pages

| Route | Purpose |
| --- | --- |
| `index.html` | Homepage — hero, surfaces strip, `#products`, `#research`, `#mobile`; **space mode** (homepage-only interactive portfolio map); **projects reel** embed (`#projects-reel` → `hyperframes/projects-reel/`) |
| `ecosystem.html` | Ecosystem overview and layer map |
| `dashboard.html` | Ecosystem activity dashboard (lines changed per repo) |
| `booking.html` | Consulting intake (Cal.com embed) |
| `blog/index.html` | Writing hub — *Unwrapping the Stack* (6-part series) |
| `blog/part1-files-folders.html` | Part 1 — Files & Folders |
| `blog/part2-apps.html` | Part 2 — Apps |
| `blog/part3-browsers.html` | Part 3 — Browsers |
| `blog/part4-operating-systems.html` | Part 4 — Operating Systems |
| `blog/part5-hardware.html` | Part 5 — Hardware |
| `blog/part6-identity.html` | Part 6 — Identity |
| `shortcutforge/index.html` | ShortcutForge mobile web runner (synced subtree; see below) |
| `hyperframes/projects-reel/index.html` | Hyperframes composition embedded on the homepage |
| `robots.txt` | Crawler rules; points to sitemap |
| `sitemap.xml` | Canonical URL list for search engines |
| `404.html` | GitHub Pages not-found page |

Shared chrome: `scripts/site-nav.js`, `styles/site.css`.

## Ecosystem dashboard

The dashboard at `dashboard.html` tracks daily lines changed per repo (`data/loc-history.json`).

Public repos update from the scheduled workflow. Private repos populate once an `ECOSYSTEM_GH_TOKEN` repository secret with cross-repo read access is configured.

To refresh data locally:

```bash
ECOSYSTEM_GH_TOKEN=<token> DAYS_BACK=21 node scripts/update-loc-history.mjs
```

## ShortcutForge

`shortcutforge/` is synced from the `web` branch of [davidlifschitz/ShortcutForge](https://github.com/davidlifschitz/ShortcutForge). Feature work belongs in that source repo.

This deploy copy may still receive **intentional patches** that are site-specific — for example the `.site-back` header/back-nav links that route visitors back into the main storefront. Do not treat every file under `shortcutforge/` as upstream-owned.

Ad Studio ([jewish-link-ad-studio](https://github.com/davidlifschitz/jewish-link-ad-studio)) is external-only and is not vendored in this repo.
