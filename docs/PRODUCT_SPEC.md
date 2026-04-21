# Public Storefront Product Spec

## Purpose

`davidlifschitz.github.io` is the public front door to the ecosystem. It should explain the system quickly, route visitors to the right entry points, and make the overall portfolio understandable without requiring a visitor to understand all the internals first.

## Role in the ecosystem

The public site is not the control plane, operator shell, execution engine, or mobile action layer.

It is the public discovery and explanation layer that:
- introduces the ecosystem clearly
- explains the main layers and products
- routes visitors to the right repo, product, or demo
- acts as the public storefront for selected outputs and experiments

## Primary users

- visitor discovering the ecosystem for the first time
- technical visitor trying to understand architecture and repos
- product-oriented visitor looking for concrete tools and demos
- mobile-first visitor looking for the easiest entry point

## V1 product goal

In v1, the site should make it easy to:
1. understand what the ecosystem is
2. see the major layers and products
3. discover the most relevant repo or surface quickly
4. separate public-facing items from internal/operator-only systems

## Core jobs to be done

- "I want to understand this ecosystem quickly."
- "I want to know what each major repo does."
- "I want to find the products, not just the infrastructure."
- "I want to know where to go next based on my interests."

## V1 scope

### 1. Ecosystem overview
- explain the major layers:
  - control plane
  - operator shell
  - execution backend
  - memory/context layer
  - mobile layer
  - product surfaces

### 2. Visitor routing
Main visitor paths:
- product visitor -> public tools and product pages
- technical visitor -> architecture and repo links
- mobile-first visitor -> ShortcutForge explanation
- operator-curious visitor -> ScheduleOS explanation

### 3. Project catalog
- short cards for the main repos
- clear distinction between public-facing and internal-facing surfaces
- concise role statements for each major project

### 4. Selected highlights
- flagship products
- research examples
- infrastructure layer explanation
- links to GitHub repos where appropriate

## Out of scope for v1

- full operator functionality
- deep internal dashboards
- artifact management interfaces
- mobile shortcut execution itself
- replacing GitHub as the detailed technical source

## Site structure

### Home
Purpose:
- explain the ecosystem in plain language
- highlight core surfaces and projects

### Ecosystem
Purpose:
- explain the architecture and layers
- show how the repos fit together

### Products
Purpose:
- showcase public or user-facing outputs

### Research
Purpose:
- show vertical skill packs and deeper explorations

### Mobile
Purpose:
- explain ShortcutForge and mobile entry flows

### GitHub / Repos
Purpose:
- link visitors to the underlying repos and technical surfaces

## Inputs

Primary inputs:
- ecosystem descriptions
- project metadata
- public artifacts and summaries
- selected demos and links

Upstream dependencies:
- `agentic-os` for the high-level ecosystem model
- `graphify` for future public architecture summaries
- selected public repos and outputs

## Outputs

Primary outputs:
- public explanation pages
- project catalog pages
- routing links into the right products or repos
- ecosystem overview content

## Connected repos

- `agentic-os` — source of ecosystem structure and meaning
- `ScheduleOS` — explained as the operator shell
- `children-of-israel-agent-swarm` — explained as execution backend
- `graphify` — explained as context/memory layer
- `ShortcutForge` — explained as the mobile action layer
- `workout-planner`, `Bttr`, `fastest-growing-finance-repos`, `autoresearch-genealogy` — examples of product and vertical surfaces

## Relationship to ScheduleOS

The public site should describe ScheduleOS as the operator-facing shell, but not expose it as the default path for a casual visitor.

## Relationship to ShortcutForge

The public site should present ShortcutForge as the mobile-friendly entry point for fast recurring actions.

## Success criteria for v1

- a new visitor can understand the ecosystem quickly
- the site clearly separates architecture from products
- the site routes different visitor types into the right next step
- the site feels like a public storefront, not just a list of repos
