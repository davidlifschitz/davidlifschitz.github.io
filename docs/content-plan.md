# Public storefront v1 content plan

## Purpose

This document defines what the public storefront should say, who it should speak to first, and how it should route visitors into the right next step.

## Primary visitor types

### 1. Product visitor

What they care about:
- usable tools
- concrete product surfaces
- simple explanations

What they should see first:
- concise ecosystem summary
- highlighted product cards
- plain-language descriptions

Primary next step:
- visit Products
- then open a selected project or repo

### 2. Technical visitor

What they care about:
- architecture
- repo boundaries
- implementation layering

What they should see first:
- ecosystem layers
- repo relationship map
- public vs internal distinctions

Primary next step:
- visit Ecosystem
- then visit GitHub / Repos

### 3. Mobile-first visitor

What they care about:
- quick entry points
- simple triggers
- mobile utility

What they should see first:
- ShortcutForge explanation
- examples of mobile capture and trigger flows

Primary next step:
- visit Mobile
- then ShortcutForge

### 4. Operator-curious visitor

What they care about:
- how work enters and moves through the system
- what the operator shell does

What they should see first:
- explanation of ScheduleOS as the operator shell
- conceptual architecture path, not a default casual-user CTA

Primary next step:
- visit Ecosystem
- then read about ScheduleOS

## Content buckets

### Public-facing content

Should include:
- ecosystem overview
- layer explanations
- highlighted products
- mobile layer explanation
- selected repo links
- public demos or public-facing artifacts

### Technical-but-public content

Should include:
- architecture summaries
- repo catalog cards
- high-level integration story
- distinctions between operator shell, execution backend, and memory layer

### GitHub/internal-detail boundary

Should remain out of the main storefront pages:
- raw issue queues
- internal sprint checklists
- deep implementation details better suited for GitHub
- backend/control-plane internals beyond high-level explanation

## Home page content plan

Recommended section order:
1. hero: what the ecosystem is in one paragraph
2. visitor entry cards: products, ecosystem, mobile, GitHub
3. highlighted surfaces: ScheduleOS, ShortcutForge, flagship product examples
4. public vs internal note
5. next-step CTA strip

## Ecosystem page content plan

Recommended section order:
1. layer map
2. role of each major repo
3. how work moves across layers
4. distinction between public storefront, operator shell, and backend systems
5. canonical repo links

## CTA model by visitor type

| Visitor type | First CTA | Secondary CTA |
| --- | --- | --- |
| Product visitor | Explore products | View GitHub repo |
| Technical visitor | See ecosystem architecture | Browse repos |
| Mobile-first visitor | Explore mobile layer | View ShortcutForge |
| Operator-curious visitor | Understand the operator shell | Read about ScheduleOS |

## Placeholder versus live content guidance

### Placeholder content allowed in v1
- section descriptions
- architecture summaries
- product cards without polished branding
- repo cards without full case studies

### Intended live/public content later
- refined copy and visuals
- richer project summaries
- public demos
- selected artifacts or writeups

## Writing style guidance

- plain language first
- architecture second
- repo links as support, not the headline
- keep public-facing explanations distinct from operator-only flows
