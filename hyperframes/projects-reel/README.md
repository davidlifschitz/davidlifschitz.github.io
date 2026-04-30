# Projects Reel — Hyperframes composition

A 36-second auto-rotating 3D coverflow that cycles through 12 selected projects.
Authored as a [Hyperframes](https://hyperframes.heygen.com) composition (HTML + GSAP timeline) so it can play live on the site **and** render to MP4.

## Live on the site

The composition is embedded on `index.html` via `<hyperframes-player>` (CDN, zero install).
It autoplays muted, loops, and shows scrub controls on hover.

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

The rendered MP4 can be committed to `assets/projects-reel.mp4` and used as a `poster` or `<video>` fallback if you ever drop the live player.

## Why Hyperframes (not React/Remotion)

Plain HTML + CSS + a tiny GSAP timeline. No build step, no framework lock-in.
Same source plays in a browser via `<hyperframes-player>` and renders deterministically to MP4 via the CLI.
