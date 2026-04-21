# Ecosystem Integration Plan

## Role in the ecosystem

[davidlifschitz.github.io](https://github.com/davidlifschitz/davidlifschitz.github.io) should be the public front door to the ecosystem: the portfolio shell that explains the system, links to products, and makes the platform understandable quickly.

## Connected repos

- [agentic-os](https://github.com/davidlifschitz/agentic-os) — ecosystem control plane and architecture source
- [ScheduleOS](https://github.com/davidlifschitz/ScheduleOS) — operator shell and assistant runtime
- [children-of-israel-agent-swarm](https://github.com/davidlifschitz/children-of-israel-agent-swarm) — execution backend
- [graphify](https://github.com/davidlifschitz/graphify) — shared context and architecture mapping layer
- [ShortcutForge](https://github.com/davidlifschitz/ShortcutForge) — mobile action layer
- [workout-planner](https://github.com/davidlifschitz/workout-planner) — wellness product surface
- [Bttr](https://github.com/davidlifschitz/Bttr) — accountability product surface
- [fastest-growing-finance-repos](https://github.com/davidlifschitz/fastest-growing-finance-repos) — public finance intelligence product
- [autoresearch-genealogy](https://github.com/davidlifschitz/autoresearch-genealogy) — skill-pack and research workflow example

## How this repo should connect

### 1. Serve as the ecosystem launchpad

The home page should link to:

- flagship products
- live demos
- architecture docs
- research/skill-pack examples
- mobile and operator interfaces

### 2. Explain the ecosystem layers

This site should communicate the high-level system clearly:

- control plane: [agentic-os](https://github.com/davidlifschitz/agentic-os)
- operator shell: [ScheduleOS](https://github.com/davidlifschitz/ScheduleOS)
- execution backend: [children-of-israel-agent-swarm](https://github.com/davidlifschitz/children-of-israel-agent-swarm)
- context layer: [graphify](https://github.com/davidlifschitz/graphify)
- mobile layer: [ShortcutForge](https://github.com/davidlifschitz/ShortcutForge)
- product surfaces: [workout-planner](https://github.com/davidlifschitz/workout-planner), [Bttr](https://github.com/davidlifschitz/Bttr), [fastest-growing-finance-repos](https://github.com/davidlifschitz/fastest-growing-finance-repos)

### 3. Route visitors into the right entry points

Examples:

- product visitor → finance, workout, or Bttr pages
- technical visitor → architecture or repo links
- mobile-first visitor → ShortcutForge
- research visitor → autoresearch-genealogy

## Files to add next

- `docs/site-map.md`
- `docs/content-plan.md`
- homepage sections for Products, Research, Infrastructure, and Mobile
- a dedicated ecosystem overview page

## Example site structure

- Home
- Ecosystem
- Products
- Research
- Mobile
- GitHub / Repos

## Acceptance criteria

- a new visitor can understand the ecosystem quickly
- the site clearly routes people to the right products and repos
- the site becomes the public storefront rather than just a minimal personal landing page
