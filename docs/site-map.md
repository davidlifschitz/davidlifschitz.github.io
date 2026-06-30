# Public storefront v1 site map

## Purpose

This document defines the page-level information architecture for the public storefront.

The site should explain the ecosystem quickly, separate public-facing surfaces from internal/operator systems, and route visitors toward the right next step.

## Primary pages

| Page | Purpose | Minimum content |
| --- | --- | --- |
| Home | Plain-language storefront and ecosystem overview | hero, `#projects-reel`, surfaces strip, `#products`, `#research`, `#mobile` sections |
| Ecosystem | Architecture and layer map | major ecosystem layers (including children-of-israel-agent-swarm, graphify), public vs internal distinctions |
| Dashboard | Ecosystem activity metrics | KPI cards, charts, repo activity table (no sidebar) |
| ShortcutForge | Mobile action layer | mobile capture, triggers, return flows |
| Writing | Research and writeups | blog index and selected posts |
| GitHub | Technical visitor jump point | external link to profile and repos |
| Book a Call | Consulting intake | booking form / scheduling CTA |

Products, Research, and Mobile are **homepage sections** (`#products`, `#research`, `#mobile`), not separate top-level routes.

## Navigation model

Primary navigation (via `scripts/site-nav.js`):
- Home
- Ecosystem
- Dashboard
- ShortcutForge
- Writing
- GitHub (external)
- Book a Call (CTA)

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
- what are the main layers?
- how do the repos relate conceptually?
- which surfaces are public-facing versus internal/operator-facing?

Layer links include [children-of-israel-agent-swarm](https://github.com/davidlifschitz/children-of-israel-agent-swarm) and [graphify](https://github.com/davidlifschitz/graphify).

### Dashboard
Should answer:
- what is the ecosystem activity level?
- which repos are moving?

Single-column layout; no sidebar.

### ShortcutForge / Writing / GitHub / Book a Call
ShortcutForge and Writing are dedicated pages; GitHub is external; Book a Call is the consulting intake route.

## Implementation notes

- the public storefront should explain, not overwhelm
- GitHub remains the detailed technical source
- ScheduleOS should be described clearly, but not presented as the default path for a casual visitor
- repo links should support the story rather than replace it
- Space mode (interactive portfolio map) is intentionally homepage-only via `index.html`; other pages use shared `site-nav.js` without a space toggle.
