# Public storefront v1 site map

## Purpose

This document defines the page-level information architecture for the public storefront.

The site should explain the ecosystem quickly, separate public-facing surfaces from internal/operator systems, and route visitors toward the right next step.

## Primary pages

| Page | Purpose | Minimum content |
| --- | --- | --- |
| Home | Plain-language storefront and ecosystem overview | positioning statement, visitor entry points, flagship surfaces, highlighted layers |
| Ecosystem | Architecture and layer map | major ecosystem layers, how repos fit together, public vs internal distinctions |
| Products | Public or user-facing tools and experiments | product cards, short descriptions, links to demos or repos |
| Research | Vertical explorations and research-oriented surfaces | research themes, repo highlights, selected writeups or experiment summaries |
| Mobile | Mobile entry layer explanation | ShortcutForge role, mobile workflows, fast-entry examples |
| GitHub / Repos | Technical visitor jump point | repo categories, canonical repo links, notes on where deeper detail lives |

## Navigation model

Primary navigation should expose:
- Home
- Ecosystem
- Products
- Research
- Mobile
- GitHub / Repos

Secondary routing elements on Home should expose the main visitor paths:
- explore the ecosystem
- browse products
- understand the mobile layer
- go deeper in GitHub

## Visitor routing paths

### Product visitor
Home → Products → selected product or repo

### Technical visitor
Home → Ecosystem → GitHub / Repos

### Mobile-first visitor
Home → Mobile → ShortcutForge

### Operator-curious visitor
Home → Ecosystem → ScheduleOS explanation

## Page-level content boundaries

### Home
Should answer:
- what is this ecosystem?
- what are its major surfaces?
- where should I go next?

### Ecosystem
Should answer:
- what are the main layers?
- how do the repos relate conceptually?
- which surfaces are public-facing versus internal/operator-facing?

### Products
Should answer:
- what usable tools or experiments are available?
- which projects are public-facing?

### Research
Should answer:
- which repos or themes are exploratory, vertical, or research-oriented?

### Mobile
Should answer:
- what is ShortcutForge?
- why does the ecosystem have a mobile layer?
- what should happen on mobile versus in ScheduleOS?

### GitHub / Repos
Should answer:
- where can I inspect the repos?
- which repos are architectural versus product-oriented?

## Implementation notes

- the public storefront should explain, not overwhelm
- GitHub remains the detailed technical source
- ScheduleOS should be described clearly, but not presented as the default path for a casual visitor
- repo links should support the story rather than replace it
