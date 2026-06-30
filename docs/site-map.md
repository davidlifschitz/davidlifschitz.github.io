# Public storefront v1 site map

## Purpose

This document defines the page-level information architecture for the public storefront.

The site should explain the ecosystem quickly, separate public-facing surfaces from internal/operator systems, and route visitors toward the right next step.

## Primary pages

| Page | Purpose | Minimum content |
| --- | --- | --- |
| Home | Plain-language storefront and ecosystem overview | hero, `#projects-reel`, surfaces strip, `#products`, `#research`, `#mobile`; Space mode toggle |
| Ecosystem | Architecture and layer map | seven layers (control plane → product surfaces), repo links, public vs internal distinctions |
| Dashboard | Ecosystem activity metrics | KPI cards, charts, repo activity table (no sidebar) |
| ShortcutForge | Mobile action layer | mobile capture, triggers, return flows; back-nav to Home and Ecosystem |
| Writing | Research and writeups | complete 6-part *Unwrapping the Stack* series + index |
| GitHub | Technical visitor jump point | external link to profile and repos |
| Book a Call | Consulting intake | booking form / scheduling CTA |

Products, Research, and Mobile are homepage sections (`#products`, `#research`, `#mobile`) linked from primary nav, not separate routes.

## Navigation model

Primary navigation (via `scripts/site-nav.js`; ShortcutForge uses its own back-nav header):
- Home
- Ecosystem
- Dashboard
- ShortcutForge
- Products → `index.html#products`
- Research → `index.html#research`
- Mobile → `index.html#mobile`
- Writing
- GitHub (external)
- Book a Call (CTA)

Mobile viewport: hamburger toggle (`nav-menu-toggle`) expands/collapses the nav link list.

Secondary routing on Home: hero CTAs, surfaces strip, and in-page sections (`#projects-reel`, `#products`, `#research`, `#mobile`).

## Visitor routing paths

### Product visitor
Home → `#products` → selected product or repo

### Technical visitor
Home → Ecosystem → GitHub

### Mobile-first visitor
Home → `#mobile` or nav → ShortcutForge

### Operator-curious visitor
Home → Ecosystem → ScheduleOS explanation

## Page-level content boundaries

### Home
Should answer:
- what is this ecosystem?
- what are its major surfaces?
- where should I go next?

Home sections: `#projects-reel`, `#products`, `#research`, `#mobile`.

### Ecosystem
Should answer:
- what are the seven layers (control plane through product surfaces)?
- how do the repos relate conceptually?
- which surfaces are public-facing versus internal/operator-facing?

Layers: control plane (`agentic-os`), operator shell (ScheduleOS), mobile layer (ShortcutForge), execution backend ([children-of-israel-agent-swarm](https://github.com/davidlifschitz/children-of-israel-agent-swarm)), memory/context ([graphify](https://github.com/davidlifschitz/graphify)), public surface (this site), product surfaces.

### Dashboard
Should answer:
- what is the ecosystem activity level?
- which repos are moving?

Single-column layout; no sidebar.

### ShortcutForge / Writing / GitHub / Book a Call
ShortcutForge is a dedicated page with back-nav (`← David Lifschitz`, Ecosystem); Writing hosts the complete 6-part series; GitHub is external; Book a Call is the consulting intake route.

Writing parts: files & folders, apps, browsers, operating systems, hardware, identity.

## Implementation notes

- the public storefront should explain, not overwhelm
- GitHub remains the detailed technical source
- ScheduleOS should be described clearly, but not presented as the default path for a casual visitor
- repo links should support the story rather than replace it
- `sitemap.xml` and `robots.txt` at site root for crawl/discovery
- Space mode (interactive portfolio map) is homepage-only via `index.html` (`data-space-toggle`); other pages use shared `site-nav.js` without a space toggle; no auto-restore on reload
