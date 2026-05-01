# Site Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign homepage, ecosystem page, and dashboard to a stark black/white A24 × Vercel aesthetic with a shared token system.

**Architecture:** Create `styles/site.css` with shared design tokens and base CSS. Rebuild `index.html` and `ecosystem.html` to link to it and adopt the new layout. Update `styles/dashboard.css` in-place to apply the same tokens and strip gradients/shadows/radii from UI chrome.

**Tech Stack:** Vanilla HTML, CSS custom properties, Inter font (system stack). No build step. Open files directly in browser to verify.

---

### Task 1: Gitignore + shared stylesheet

**Files:**
- Create: `.gitignore`
- Create: `styles/site.css`

- [ ] **Step 1: Create `.gitignore`**

```
.DS_Store
.superpowers/
```

Save to `.gitignore` at the repo root.

- [ ] **Step 2: Create `styles/site.css`**

```css
/* ── Tokens ────────────────────────────────────── */
:root {
  --bg:     #ffffff;
  --text:   #000000;
  --muted:  #666666;
  --border: #000000;
  --max:    1080px;
}

/* ── Reset ─────────────────────────────────────── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--text);
  line-height: 1.6;
}
a { color: inherit; text-decoration: none; }
a:hover { text-decoration: underline; }

/* ── Layout ─────────────────────────────────────── */
.wrap { width: min(calc(100% - 32px), var(--max)); margin: 0 auto; }

/* ── Nav ─────────────────────────────────────────── */
.site-header { border-bottom: 1px solid var(--border); }
.nav-inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
  gap: 16px;
}
.brand { font-weight: 700; font-size: 0.95rem; }
.nav-links { display: flex; flex-wrap: wrap; gap: 20px; font-size: 0.85rem; }
.nav-links a { font-weight: 500; color: var(--muted); }
.nav-links a:hover { color: var(--text); text-decoration: none; }

/* ── Buttons ─────────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 22px;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  border: 1px solid var(--border);
  text-decoration: none !important;
}
.btn--primary { background: var(--text); color: var(--bg); }
.btn--secondary { background: var(--bg); color: var(--text); border-left: none; }
.btn-row { display: flex; }

/* ── Footer ──────────────────────────────────────── */
.site-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 0 40px;
  border-top: 1px solid var(--border);
  font-size: 0.85rem;
  color: var(--muted);
  margin-top: 48px;
}
.site-footer a { color: var(--muted); }
.site-footer a:hover { color: var(--text); text-decoration: none; }

/* ── Hero ────────────────────────────────────────── */
.hero { padding: 72px 0 48px; }
.hero-rule { width: 100%; height: 1px; background: var(--border); }
.hero-rule--thick { height: 2px; margin-bottom: 28px; }
h1 {
  font-size: clamp(3rem, 8vw, 6rem);
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: -0.04em;
  line-height: 0.95;
  margin: 0 0 20px;
}
.hero-sub {
  font-size: 1rem;
  color: var(--muted);
  margin: 20px 0 28px;
  max-width: 480px;
}

/* ── Surfaces list ───────────────────────────────── */
.surfaces { padding: 48px 0; }
.surfaces-label {
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 8px;
}
.surface-list { border-top: 1px solid var(--border); }
.surface-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 0;
  border-bottom: 1px solid var(--border);
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--text);
  text-decoration: none !important;
}
.surface-row:hover .arrow { color: var(--text); }
.arrow { color: var(--muted); transition: color 120ms; }

/* ── Responsive ──────────────────────────────────── */
@media (max-width: 600px) {
  .nav-inner { flex-direction: column; align-items: flex-start; }
  h1 { font-size: clamp(2.5rem, 12vw, 4rem); }
  .btn--secondary { border-left: 1px solid var(--border); border-top: none; }
  .btn-row { flex-direction: column; }
}
```

- [ ] **Step 3: Verify file exists**

Run: `ls -la styles/site.css`  
Expected: file present, non-zero size.

- [ ] **Step 4: Commit**

```bash
git add .gitignore styles/site.css
git commit -m "Add shared site token system and base CSS"
```

---

### Task 2: Rebuild `index.html`

**Files:**
- Modify: `index.html` (full rewrite — strip 200-line inline style block, replace 7-section layout with 3-section)

- [ ] **Step 1: Replace `index.html` entirely**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>David Lifschitz</title>
  <meta name="description" content="Operator tooling, mobile utilities, and research surfaces — connected into one ecosystem." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles/site.css" />
</head>
<body>
  <header class="site-header">
    <div class="wrap nav-inner">
      <a class="brand" href="index.html">David Lifschitz</a>
      <nav class="nav-links" aria-label="Primary">
        <a href="ecosystem.html">Ecosystem</a>
        <a href="dashboard.html">Dashboard</a>
        <a href="shortcutforge/index.html">ShortcutForge</a>
        <a href="https://github.com/davidlifschitz" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </div>
  </header>

  <main class="wrap">
    <section class="hero">
      <div class="hero-rule hero-rule--thick"></div>
      <h1>Build fast.<br>Route smart.<br>Ship everything.</h1>
      <div class="hero-rule"></div>
      <p class="hero-sub">Operator tooling, mobile utilities, and research surfaces.</p>
      <div class="btn-row">
        <a class="btn btn--primary" href="ecosystem.html">Explore Ecosystem</a>
        <a class="btn btn--secondary" href="https://github.com/davidlifschitz" target="_blank" rel="noreferrer">GitHub ↗</a>
      </div>
    </section>

    <section class="surfaces">
      <div class="surfaces-label">Surfaces</div>
      <div class="surface-list">
        <a class="surface-row" href="https://github.com/davidlifschitz/ScheduleOS" target="_blank" rel="noreferrer">
          <span>ScheduleOS — operator shell</span><span class="arrow">→</span>
        </a>
        <a class="surface-row" href="shortcutforge/index.html">
          <span>ShortcutForge — mobile capture &amp; trigger flows</span><span class="arrow">→</span>
        </a>
        <a class="surface-row" href="ecosystem.html">
          <span>Ecosystem overview</span><span class="arrow">→</span>
        </a>
        <a class="surface-row" href="dashboard.html">
          <span>Dashboard &amp; metrics</span><span class="arrow">→</span>
        </a>
      </div>
    </section>
  </main>

  <footer class="site-footer wrap">
    <span>David Lifschitz · 2026</span>
    <a href="https://github.com/davidlifschitz" target="_blank" rel="noreferrer">GitHub ↗</a>
  </footer>
</body>
</html>
```

- [ ] **Step 2: Open in browser and verify**

Open `index.html` directly in a browser. Check:
- Black nav bar border, no blue, no background color
- h1 is large, bold uppercase on three lines
- Two thick/thin horizontal rules framing the h1
- Two sharp-edged buttons side by side (black fill + black outline, no radius)
- Surfaces section: four ruled rows with right-side arrows
- Footer: name left, GitHub right, separated by top border
- No cards, no rounded corners, no shadows, no blue anywhere

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Rebuild homepage with A24/Vercel aesthetic and 3-section layout"
```

---

### Task 3: Rebuild `ecosystem.html`

**Files:**
- Modify: `ecosystem.html` (full rewrite — strip inline styles, replace card-grid layout with ruled-table layout)

- [ ] **Step 1: Replace `ecosystem.html` entirely**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Ecosystem — David Lifschitz</title>
  <meta name="description" content="Five layers — operator shell, mobile capture, execution backend, memory/context, and public surface — connected into one routing and review system." />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700;900&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles/site.css" />
  <style>
    .eco-header { padding: 64px 0 0; }
    .eco-rule { width: 100%; height: 2px; background: var(--border); margin-bottom: 20px; }
    .eco-rule--thin { height: 1px; margin: 12px 0 28px; }
    h1.eco-title {
      font-size: clamp(2rem, 5vw, 3.5rem);
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: -0.04em;
      line-height: 1.0;
      margin: 0;
    }
    .eco-subtitle {
      font-size: 0.95rem;
      color: var(--muted);
      max-width: 640px;
      line-height: 1.65;
    }
    .layers { padding: 48px 0; }
    .layers-header {
      display: grid;
      grid-template-columns: 180px 1fr 32px;
      gap: 24px;
      padding: 8px 0 10px;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--muted);
      border-bottom: 2px solid var(--border);
    }
    .layer-row {
      display: grid;
      grid-template-columns: 180px 1fr 32px;
      gap: 24px;
      padding: 20px 0;
      border-bottom: 1px solid var(--border);
      align-items: baseline;
    }
    .layer-name {
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .layer-desc { font-size: 0.9rem; color: var(--muted); line-height: 1.55; }
    .layer-desc a { color: var(--text); text-decoration: underline; text-underline-offset: 3px; }
    .layer-desc a:hover { color: var(--muted); }
    .layer-link { font-size: 0.9rem; color: var(--muted); text-align: right; }
    .layer-link a { color: var(--text); text-decoration: none; font-weight: 600; }
    .layer-link a:hover { text-decoration: underline; }
    @media (max-width: 600px) {
      .layers-header, .layer-row { grid-template-columns: 1fr; gap: 6px; }
      .layers-header .layer-link-col, .layer-link { display: none; }
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="wrap nav-inner">
      <a class="brand" href="index.html">David Lifschitz</a>
      <nav class="nav-links" aria-label="Primary">
        <a href="index.html">Home</a>
        <a href="ecosystem.html">Ecosystem</a>
        <a href="dashboard.html">Dashboard</a>
        <a href="shortcutforge/index.html">ShortcutForge</a>
        <a href="https://github.com/davidlifschitz" target="_blank" rel="noreferrer">GitHub</a>
      </nav>
    </div>
  </header>

  <main class="wrap">
    <div class="eco-header">
      <div class="eco-rule"></div>
      <h1 class="eco-title">Ecosystem</h1>
      <div class="eco-rule eco-rule--thin"></div>
      <p class="eco-subtitle">Five layers — operator shell, mobile capture, execution backend, memory/context, and public surface — connected into one routing and review system.</p>
    </div>

    <section class="layers">
      <div class="layers-header">
        <span>Layer</span>
        <span>Description</span>
        <span class="layer-link-col"></span>
      </div>
      <div class="layer-row">
        <div class="layer-name">Operator Shell</div>
        <div class="layer-desc"><a href="https://github.com/davidlifschitz/ScheduleOS" target="_blank" rel="noreferrer">ScheduleOS</a> — receives work, routes requests, and surfaces queue and result state.</div>
        <div class="layer-link"><a href="https://github.com/davidlifschitz/ScheduleOS" target="_blank" rel="noreferrer">↗</a></div>
      </div>
      <div class="layer-row">
        <div class="layer-name">Mobile Layer</div>
        <div class="layer-desc"><a href="shortcutforge/index.html">ShortcutForge</a> — fast mobile capture, one-tap triggers, and lightweight return flows.</div>
        <div class="layer-link"><a href="shortcutforge/index.html">→</a></div>
      </div>
      <div class="layer-row">
        <div class="layer-name">Execution Backend</div>
        <div class="layer-desc">Delegated systems perform heavy async work after operator routing.</div>
        <div class="layer-link">—</div>
      </div>
      <div class="layer-row">
        <div class="layer-name">Memory / Context</div>
        <div class="layer-desc">Context and artifact lookup surfaces that enrich routing and review decisions.</div>
        <div class="layer-link">—</div>
      </div>
      <div class="layer-row">
        <div class="layer-name">Public Surface</div>
        <div class="layer-desc">This site — discovery, explanation, and visitor routing without exposing internal state.</div>
        <div class="layer-link"><a href="index.html">→</a></div>
      </div>
      <div class="layer-row">
        <div class="layer-name">Product Surfaces</div>
        <div class="layer-desc">Public-facing tools and experiments. Explore <a href="https://github.com/davidlifschitz/graphify" target="_blank" rel="noreferrer">Graphify</a> and <a href="https://github.com/davidlifschitz" target="_blank" rel="noreferrer">other repos</a>.</div>
        <div class="layer-link"><a href="https://github.com/davidlifschitz" target="_blank" rel="noreferrer">↗</a></div>
      </div>
    </section>
  </main>

  <footer class="site-footer wrap">
    <span>David Lifschitz · 2026</span>
    <a href="https://github.com/davidlifschitz" target="_blank" rel="noreferrer">GitHub ↗</a>
  </footer>
</body>
</html>
```

- [ ] **Step 2: Open in browser and verify**

Open `ecosystem.html` directly. Check:
- Nav identical to homepage
- Two thick/thin rules, then "ECOSYSTEM" in uppercase bold
- Subtitle sentence in muted gray
- Three-column ruled table: LAYER / DESCRIPTION / link
- No cards, no rounded corners, no blue accent
- Footer matches homepage

- [ ] **Step 3: Commit**

```bash
git add ecosystem.html
git commit -m "Rebuild ecosystem page with editorial ruled-table layout"
```

---

### Task 4: Update `styles/dashboard.css`

**Files:**
- Modify: `styles/dashboard.css`

The dashboard is a functional app — keep the sidebar layout and all JS/charting logic untouched. Change: tokens at the top of the file (replace the existing `:root` block), and targeted overrides for sidebar, brand-mark, nav-item, KPI cards, and body background.

- [ ] **Step 1: Replace the `:root` block at the top of `styles/dashboard.css`**

Find and replace the entire existing `:root { ... }` block (lines 1–22) with:

```css
:root {
  --bg:           #f9f9f9;
  --bg-elevated:  #f2f2f2;
  --surface:      #ffffff;
  --surface-soft: #f9f9f9;
  --text:         #000000;
  --muted:        #666666;
  --muted-2:      #999999;
  --border:       #000000;
  --border-strong:#000000;
  --accent:       #5865f2;
  --accent-strong:#4251ee;
  --accent-soft:  #eef1ff;
  --success:      #0f9f6e;
  --success-soft: #eafaf4;
  --danger:       #d84d57;
  --danger-soft:  #fff1f2;
  --warning:      #d18a14;
  --warning-soft: #fff7e8;
  --shadow-sm:    none;
  --shadow-md:    none;
  --shadow-lg:    none;
  --radius-lg:    0px;
  --radius-md:    0px;
  --radius-sm:    0px;
  --sidebar-width:  268px;
  --content-max:    1600px;
}
```

- [ ] **Step 2: Replace the `body` rule**

Find:
```css
body {
  margin: 0;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background:
    radial-gradient(circle at top left, rgba(88, 101, 242, 0.08), transparent 24%),
    linear-gradient(180deg, #f8fbff 0%, var(--bg) 24%, #f7f9fd 100%);
  color: var(--text);
  min-height: 100vh;
}
```

Replace with:
```css
body {
  margin: 0;
  font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  background: var(--bg);
  color: var(--text);
  min-height: 100vh;
}
```

- [ ] **Step 3: Replace the `.sidebar` rule**

Find:
```css
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 28px 22px;
  background: rgba(247, 250, 255, 0.88);
  backdrop-filter: blur(18px);
  border-right: 1px solid rgba(202, 213, 232, 0.82);
}
```

Replace with:
```css
.sidebar {
  position: sticky;
  top: 0;
  height: 100vh;
  padding: 28px 22px;
  background: #ffffff;
  border-right: 1px solid var(--border);
}
```

- [ ] **Step 4: Replace the `.brand-mark` rule**

Find:
```css
.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--accent), #7f8bff);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
  box-shadow: var(--shadow-md);
}
```

Replace with:
```css
.brand-mark {
  width: 42px;
  height: 42px;
  border-radius: 0;
  background: #000000;
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  font-weight: 800;
}
```

- [ ] **Step 5: Replace `.nav-item`, `.nav-item:hover`, `.nav-item.active` rules**

Find:
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  color: var(--muted);
  font-weight: 600;
  transition: background 160ms ease, color 160ms ease, transform 160ms ease;
}

.nav-item:hover {
  background: rgba(88, 101, 242, 0.08);
  color: var(--text);
  transform: translateX(1px);
}

.nav-item.active {
  background: linear-gradient(180deg, rgba(88, 101, 242, 0.12), rgba(88, 101, 242, 0.08));
  color: var(--accent-strong);
  box-shadow: inset 0 0 0 1px rgba(88, 101, 242, 0.14);
}
```

Replace with:
```css
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 0;
  color: var(--muted);
  font-weight: 600;
  transition: color 160ms ease;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  color: var(--text);
}

.nav-item.active {
  border-left: 3px solid var(--text);
  color: var(--text);
}
```

- [ ] **Step 6: Open `dashboard.html` in browser and verify**

Check:
- Sidebar is white with a solid black right border — no glass/blur
- Brand mark "DL" is a black square with white text — no gradient
- Active nav item has a solid black left border — no rounded highlight
- Page background is flat `#f9f9f9` — no radial gradient
- KPI cards and panels have no shadows, no rounded corners
- Chart colors (blue, green, red) are unaffected — functional colors remain

- [ ] **Step 7: Commit**

```bash
git add styles/dashboard.css
git commit -m "Apply shared token system to dashboard: flat bg, hard edges, no shadows"
```

---

### Task 5: Final verification pass

- [ ] **Step 1: Open all three pages in browser tabs**

`index.html`, `ecosystem.html`, `dashboard.html` — open all three.

Check cross-page consistency:
- Nav is identical on homepage and ecosystem (same font, same links, same bottom border)
- Footer is identical on homepage and ecosystem
- No blue accent appears in nav, buttons, or layout chrome on any page
- Dashboard sidebar matches the stark direction (black borders, no glass)

- [ ] **Step 2: Check mobile (resize browser to ~375px)**

- Homepage: h1 wraps gracefully, buttons stack vertically
- Ecosystem: layer table collapses to single-column (link column hides)
- Dashboard: sidebar behavior unchanged (existing responsive handling)

- [ ] **Step 3: Commit if any fixes were needed, then push**

```bash
git add -p
git commit -m "Fix responsive layout issues found in final verification"
# Then:
git push origin main
```

If no fixes needed, just push:
```bash
git push origin main
```
