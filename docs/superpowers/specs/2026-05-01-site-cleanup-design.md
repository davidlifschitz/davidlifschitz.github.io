# Site Cleanup Design

**Date:** 2026-05-01  
**Scope:** Homepage, Ecosystem page, Dashboard  
**Direction:** A24 × Vercel — stark black/white, uppercase headlines, hard edges, editorial density

---

## Problem

All three pages have the same four issues:
1. **Copy sounds internal** — section intros read like planning docs ("the storefront should…"), footer says "v1 skeleton", eyebrow says "Public storefront"
2. **Visual polish lacking** — flat cards, uneven spacing, no typographic hierarchy
3. **Layout bloated** — homepage has 7 sections; most are placeholder structure, not real content
4. **Inconsistent** — homepage CSS is inline, dashboard has a separate stylesheet, accent color differs (`#3856ff` vs `#5865f2`)

---

## Design Direction

**A24 × Vercel.** Pure black/white. No accent color in UI chrome. Uppercase heavy headlines. Hard rectangular edges. Borders as dividers, never shadows. Confidence through restraint.

Reference aesthetics: Vercel's grayscale discipline, A24's poster boldness, Ink & Switch's editorial density.

---

## Token System — `styles/site.css`

Single shared stylesheet. All three pages link to it.

```css
:root {
  --bg:     #ffffff;
  --text:   #000000;
  --muted:  #666666;
  --border: #000000;
  --max:    1080px;
}
```

Rules:
- `border-radius: 0` everywhere — no rounding on buttons, cards, or inputs
- No `box-shadow` — borders only
- No gradients in UI chrome (data viz charts may keep functional color)
- Buttons: sharp rectangles, black fill (primary) or black outline (secondary)
- Headlines: Inter, `font-weight: 900`, `text-transform: uppercase`, `letter-spacing: -.04em`
- Body: Inter, `font-weight: 400`, `color: var(--muted)` for secondary text
- Dividers: `1px solid var(--border)` — full-width horizontal rules

`index.html` and `ecosystem.html` drop all inline `<style>` blocks and link to this file. `dashboard.css` imports tokens and overrides only what differs.

---

## Homepage (`index.html`)

**Structure — 3 sections only:**

### Nav
- Left: "David Lifschitz" — bold, no logo mark
- Right: Ecosystem · Dashboard · ShortcutForge · GitHub

### Hero
```
[full-width 2px rule]
BUILD FAST.
ROUTE SMART.
SHIP EVERYTHING.
[full-width 1px rule]
Operator tooling, mobile utilities, and research surfaces.
[EXPLORE ECOSYSTEM]  [GITHUB ↗]
```
- h1: ~5rem, 900 weight, uppercase, `letter-spacing: -.04em`, `line-height: 0.95`
- Subtitle: ~1rem, muted, no transformation
- Buttons: sharp rectangles — primary black fill, secondary black outline, no border-radius

### Surfaces
```
SURFACES                        (small-caps label, muted)
──────────────────────────────────────────────────────
ScheduleOS — operator shell                          →
ShortcutForge — mobile capture & trigger flows       →
Ecosystem overview                                   →
Dashboard & metrics                                  →
──────────────────────────────────────────────────────
```
- Each row: `display: flex; justify-content: space-between`
- Full-width rules above and below the list, between each row

### Footer
```
David Lifschitz · 2026          GitHub ↗
```

**Copy rules:**
- Remove: eyebrow "Public storefront", all "the storefront should…" section intros, footer "v1 skeleton" text, "Choose your path" section, "Major ecosystem layers" section, "Research and vertical explorations" section, "Mobile entry layer" section, "Where to go next" section
- Write every line as if the site is complete, not in progress

---

## Ecosystem Page (`ecosystem.html`)

**Structure:**

### Header
```
[rule]
ECOSYSTEM
[rule]
Five layers — operator shell, mobile capture, execution backend, memory/context, and public surface — connected into one routing and review system.
```

### Layers (ruled table)
```
LAYER              DESCRIPTION                                   LINK
──────────────────────────────────────────────────────────────────────
OPERATOR SHELL     ScheduleOS — receives, routes, monitors         →
MOBILE LAYER       ShortcutForge — fast capture & trigger flows    →
EXECUTION          Delegated backends handle heavy async work       —
MEMORY/CONTEXT     Enriches routing and review                      —
PUBLIC SURFACE     This site — discovery and visitor routing        —
──────────────────────────────────────────────────────────────────────
```
- No cards — ruled rows only
- Column headers: small-caps, muted
- Linked layers get `→` that links to GitHub/subpage; non-public layers get `—`

**Copy rules:** Remove all "the public site should…" / "this section will…" language. Write descriptions as present tense facts.

---

## Dashboard (`dashboard.html`)

Functional app — keep sidebar layout. Apply tokens for visual consistency.

**Changes:**
- Sidebar: `background: #fff`, `border-right: 1px solid #000`, no blur/glass/gradient
- Brand mark: black square (`background: #000`), no gradient
- Active nav item: `border-left: 3px solid #000` indicator, no rounded highlight
- KPI cards: `border: 1px solid #000`, `border-radius: 0`, no shadow
- Page background: flat `#f9f9f9`, no radial gradient
- Remove all `box-shadow` and `backdrop-filter` from UI chrome
- Data viz (charts, sparklines): keep functional colors (`#5865f2` etc) for data only — not for buttons or nav

---

## Implementation Approach

**Shared stylesheet first.** Define tokens in `styles/site.css` once, then build all three pages against it.

Order:
1. Create `styles/site.css` with token system
2. Rebuild `index.html` — new HTML structure, link to shared CSS
3. Rebuild `ecosystem.html` — editorial layer table, real copy
4. Update `dashboard.css` — import tokens, apply visual changes
5. Add `.superpowers/` to `.gitignore`

---

## Out of Scope

- ShortcutForge — standalone app, separate pass
- Dashboard functionality — charts, filters, data fetch logic untouched
- New pages or sections
- Dark mode
