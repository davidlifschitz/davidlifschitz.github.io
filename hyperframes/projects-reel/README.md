# Projects Reel — Hyperframes composition

A 36-second auto-rotating 3D coverflow that cycles through 12 selected projects.
Authored as a [Hyperframes](https://hyperframes.heygen.com) composition (HTML + GSAP timeline). Preview in a browser or render to MP4 via the CLI.

## Preview

The composition lives standalone at `hyperframes/projects-reel/index.html`. It is **not** embedded on the public site — the repo root `index.html` does not include it, and nothing in the site currently links to this page.

To preview locally:

```bash
cd hyperframes/projects-reel
npx hyperframes preview     # local preview server (recommended while editing)
```

## Edit the cards

Open `index.html` in this folder. Each card is a `<div class="card">` inside `#track`.
Card slots, copy, kicker, accent class, and repo path are all inline.

To add a card:

1. Append a new `<div class="card accent-X" data-i="N">…</div>`
2. Increment `N` (currently 12) — the runtime auto-detects, no other changes needed.
3. Update `data-duration` on the three top-level clips and the GSAP `duration: 36` value if you want a different per-card dwell time (default = 3s × N).

Accent classes: `accent-a` (blue), `accent-b` (pink), `accent-c` (mint), `accent-d` (amber).

## Render to MP4

From the repo root:

```bash
cd hyperframes/projects-reel
npx hyperframes lint        # check structure
npx hyperframes preview     # local preview server (recommended while editing)
npx hyperframes render      # outputs MP4 alongside index.html
```

Requires Node 22+ and FFmpeg. See https://hyperframes.heygen.com/quickstart.

`npx hyperframes render` writes the MP4 next to `index.html` in this folder.

## Why Hyperframes (not React/Remotion)

Plain HTML + CSS + a tiny GSAP timeline. No build step, no framework lock-in.
Same source can be embedded on a page later via `<hyperframes-player>` and renders deterministically to MP4 via the CLI.
