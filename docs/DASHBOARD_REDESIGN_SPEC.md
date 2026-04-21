# Dashboard Redesign Spec

## Objective

Redesign the ecosystem dashboard into a polished, production-quality SaaS-style analytics dashboard while preserving the existing underlying data behavior and GitHub Pages compatibility.

The redesigned experience should feel like a real product dashboard rather than a narrow landing page. It should match the approved visual direction: a full app shell, better hierarchy, stronger spacing, richer charting, clearer status presentation, and a more maintainable implementation structure.

## Current State

The current implementation is a single-file page with inline CSS and inline JavaScript. It already supports the core functional behavior needed for the dashboard:

- loads `data/loc-history.json`
- supports repo filtering
- supports time-window filtering
- renders summary metrics
- renders a daily lines-of-code chart
- renders a repository summary table
- supports refresh behavior
- handles status states such as OK, fetch error, and token-required scenarios

The redesign should preserve those capabilities while substantially improving layout, visual polish, maintainability, and usability.

## Goals

### Primary Goal

Turn `dashboard.html` into a premium, polished, SaaS-style ecosystem analytics dashboard.

### Secondary Goals

- preserve the existing data source and behavior
- improve information hierarchy and visual clarity
- make the dashboard feel like a product UI
- improve code organization and maintainability
- keep implementation lightweight and GitHub Pages friendly

## Non-Goals

The redesign should **not**:

- introduce a new backend
- replace `data/loc-history.json` as the source of truth unless a minimal compatibility adjustment is required
- add unnecessary framework complexity
- require a build step unless absolutely necessary
- create a second planning layer or speculative architecture unrelated to implementation

## Source of Truth

Use the existing repository files as the source of truth, especially:

- `dashboard.html`
- `data/loc-history.json`
- the current dashboard rendering behavior

## Scope

### Preserve

The redesign must preserve:

- `data/loc-history.json` as the primary dashboard data source
- repo filtering behavior
- time-window filtering behavior
- refresh behavior
- summary metric rendering
- repository summary table behavior
- status handling for:
  - `OK`
  - `Fetch error`
  - `Needs cross-repo token`

### Improve

The redesign should improve:

- layout architecture
- visual hierarchy
- typography and spacing
- KPI presentation
- chart presentation
- table styling and readability
- responsive behavior
- code organization
- accessibility and interaction polish

## Information Architecture

## 1. App Shell

The page should move from a single-column landing-page structure to a product-style application shell with three main areas:

- left sidebar
- top header
- main dashboard content area

## 2. Sidebar

The left sidebar should contain:

### Brand Area

- label: `Ecosystem`
- compact product-style branding treatment

### Navigation

Include the following navigation items:

- Dashboard
- Repositories
- Tokens
- Settings
- Docs

The current page should visually indicate that `Dashboard` is the active section.

### Helper Card

Include a helper/support card in the sidebar for cross-repo access. It should explain:

- some repos require `ECOSYSTEM_GH_TOKEN`
- the token must have read access to private repos
- this affects the visibility of private-repo metrics

### User Footer Area

Include a small user/account area with initials or avatar and account label.

## 3. Top Header

The top header should be lightweight and secondary to the page title. It should include:

- a compact telemetry/environment label such as `Ecosystem telemetry v1`
- optional small utility icons or profile affordances on the right

This header should not dominate the page.

## 4. Main Content

The main content area should be broken into the following sections.

### Title and Control Row

This area should include:

- page title: `Ecosystem Change Dashboard`
- short subtitle explaining what the dashboard tracks
- right-aligned controls:
  - repo select
  - time-window select
  - refresh button
  - last-updated indicator

### KPI Row

Four KPI cards should appear prominently near the top:

- Tracked repos
- Additions
- Deletions
- Commits

Each KPI card should include:

- icon or icon container
- uppercase or small label
- large numeric value
- short helper text

### Primary Chart Panel

A large chart panel should visualize daily lines-of-code changes for the selected repo and selected time window.

The panel should include:

- title: `Daily lines-of-code changes`
- legend:
  - Additions
  - Deletions
  - Net change
- readable axes
- clearly labeled dates
- visually strong presentation of positive and negative values

Preferred visual treatment:

- green bars for additions
- red bars for deletions
- blue line for net change

### Repository Summary Panel

A polished repository summary table should appear below the chart.

Columns:

- Repository
- Visibility
- Tracked branch
- Additions
- Deletions
- Total changes
- Commits
- Status

The table should be visually improved and easier to scan than the current implementation.

## Visual Design Requirements

### Design Direction

The visual direction should match the approved mockup direction:

- light SaaS dashboard aesthetic
- cool-gray app background
- white cards and panels
- subtle borders and shadows
- blue-violet accent color
- strong spacing and hierarchy
- rounded corners
- refined typography
- premium but restrained UI polish

### Suggested Design Tokens

These are implementation-directional rather than absolute requirements.

- app background: very light cool gray
- surface: white
- primary text: dark slate
- secondary text: muted slate
- accent: blue-violet
- success: green
- danger: red
- warning: amber
- border: light neutral gray
- card radius: approximately 16px to 20px
- button radius: approximately 12px to 14px
- sidebar width: approximately 220px to 240px

### Typography

Typography should support a more productized feel.

Requirements:

- strong page title
- restrained micro-labels
- clean section headers
- readable small text
- tabular numerals for KPI and table metrics
- tighter, more polished type hierarchy than the current page

## Functional Requirements

## 1. Data Loading

The dashboard must:

- fetch `data/loc-history.json`
- support cache-busting for manual refresh
- gracefully handle fetch failure
- surface `generated_at` as a last-updated indicator when available

## 2. Summary Metrics

The summary metrics should compute correctly across the selected time window.

Expected values:

- Tracked repos = total number of tracked repos
- Additions = total additions across selected window
- Deletions = total deletions across selected window
- Commits = total commits across selected window

Unless intentionally changed, these summary cards should remain ecosystem-wide rather than repo-specific.

## 3. Repo Filter

Requirements:

- populate repo dropdown from the existing dataset
- default to the first available repo or another clearly defined default
- changing repo must update the chart and any repo-specific contextual text

## 4. Time Window Filter

Requirements:

- support at least:
  - 7 days
  - 14 days
  - 21 days
  - 30 days
- changing the time window must update:
  - KPI totals
  - chart
  - repository summary aggregation

## 5. Refresh Behavior

The manual refresh action must:

- re-fetch the dashboard JSON
- avoid stale cached results
- preserve a smooth user experience

## 6. Chart Behavior

The chart should be materially better than the current simple stacked div rendering.

Preferred implementation:

- SVG or canvas-based custom rendering
- or another lightweight GitHub Pages-compatible approach

Requirements:

- show additions above baseline
- show deletions below baseline
- show net change as a line
- keep axes and dates readable
- support zero-activity states gracefully
- handle partial or sparse datasets cleanly

Optional but encouraged:

- hover states or lightweight tooltips
- current-day highlight or subtle date focus state

## 7. Repository Summary Table

The repository table must:

- aggregate values over the selected time window
- link repository names to GitHub
- preserve visibility and status information
- use improved badge styling for:
  - public/private
  - OK
  - Fetch error
  - Needs cross-repo token
- be easier to scan visually than the current version

Optional but encouraged:

- visually sortable headers
- row hover states
- small repo icon treatment

## 8. Token Helper Treatment

If there are private repos in a token-required state, the UI should make that understandable without overwhelming the primary dashboard content.

Preferred treatment:

- sidebar helper card
- concise explanatory microcopy
- optional link or pointer to documentation

## Technical Architecture

## Preferred File Structure

Refactor the current page away from a monolithic inline implementation.

Preferred structure:

- `dashboard.html`
- `styles/dashboard.css`
- `scripts/dashboard.js`

Optional supporting modules if helpful:

- `scripts/dashboard-state.js`
- `scripts/dashboard-renderers.js`

## Technical Constraints

Implementation should:

- remain GitHub Pages compatible
- avoid unnecessary dependencies
- avoid unnecessary framework adoption
- avoid requiring a build step unless there is a very strong justification
- preserve straightforward local inspectability and maintainability

## Responsiveness Requirements

### Desktop

- sidebar visible
- KPI cards in a four-column row
- large chart panel
- full-width readable table

### Tablet

- controls wrap gracefully
- KPI cards can move to a 2x2 layout
- chart remains readable
- spacing remains balanced

### Mobile

- sidebar collapses or becomes secondary
- controls stack cleanly
- KPI cards become single column
- chart remains usable
- table supports horizontal scrolling without breaking layout

## Accessibility Requirements

The redesign should improve accessibility.

Requirements:

- semantic heading structure
- form labels for selects and controls
- sufficient color contrast
- visible keyboard focus states
- keyboard-accessible interactions
- preserved table semantics
- meaningful status communication beyond color alone

## Maintainability Requirements

The redesign should leave the codebase in a cleaner state than it is now.

Requirements:

- CSS should be extracted from inline blocks
- JavaScript should be extracted from inline blocks
- DOM structure should be easier to understand and extend
- naming should be clean and consistent
- rendering logic should be reasonably modular

## Acceptance Criteria

## Design Acceptance

The redesign is successful when:

- the page clearly resembles a premium product dashboard rather than a landing page
- the app shell feels intentional and spacious
- the approved visual direction is meaningfully reflected in the live implementation
- the current cramped/narrow feeling is eliminated

## Functional Acceptance

The redesign is successful when:

- the page loads using the existing `data/loc-history.json`
- repo select works
- time-window select works
- refresh works
- KPI totals render correctly
- chart renders correctly
- repository summary renders correctly
- OK / fetch error / token-required states are clearly understandable

## Code Acceptance

The redesign is successful when:

- the page is no longer implemented as one large inline HTML/CSS/JS block
- CSS and JavaScript are extracted into maintainable files
- the implementation remains lightweight
- the dashboard works on GitHub Pages without special build infrastructure

## Implementation Order

Recommended order of work:

1. inspect the current implementation and preserve functional behavior
2. extract CSS and JavaScript from the current monolithic file
3. build the new app-shell layout
4. implement design tokens and foundational styles
5. rebuild the title/control row
6. rebuild the KPI cards
7. replace the current chart rendering with a more polished implementation
8. restyle and improve the repository summary table
9. add sidebar helper and account treatments
10. finish responsive and accessibility polish
11. verify live behavior against the current dashboard data file

## Delivery Expectations

Expected implementation deliverables:

- updated `dashboard.html`
- extracted stylesheet files as needed
- extracted JavaScript files as needed
- any small supporting assets if helpful
- a concise implementation summary of what changed
- a short note of any follow-up recommendations

## Implementation Prompt

The following prompt is intended for direct handoff to an execution thread.

```text
@GitHub
Implement a full redesign of the ecosystem dashboard in `davidlifschitz/davidlifschitz.github.io` based on the approved dashboard mockup and the following requirements.

Goal:
Turn the current `dashboard.html` into a polished, production-quality SaaS-style analytics dashboard while preserving the existing underlying data behavior.

Source of truth:
Use the existing repo files as the source of truth, especially the current `dashboard.html` and the existing `data/loc-history.json` contract. Do not invent a new backend. Keep the existing data flow unless a tiny compatibility adjustment is required.

Design target:
Match the approved mockup direction:
- left sidebar app shell
- top utility header
- strong page title and subtitle
- right-aligned repo/time controls and refresh button
- 4 polished KPI cards
- large main chart panel
- polished repository summary table
- clean, spacious, premium light-theme SaaS UI

Functional requirements:
- Keep `data/loc-history.json` as the dashboard data source
- Preserve repo filtering
- Preserve time-window filtering
- Preserve refresh behavior
- Preserve summary metrics
- Preserve repo summary table
- Preserve status handling for OK / Fetch error / Needs cross-repo token

Implementation requirements:
- Refactor away from the current single-file inline-style/inline-script monolith
- Preferred structure:
  - `dashboard.html`
  - `styles/dashboard.css`
  - `scripts/dashboard.js`
- Keep it GitHub Pages compatible
- No framework required
- No unnecessary build step
- Plain HTML/CSS/JS is preferred unless there is a very strong reason otherwise

UI requirements:
- Sidebar nav with:
  - Dashboard
  - Repositories
  - Tokens
  - Settings
  - Docs
- Sidebar helper card explaining `ECOSYSTEM_GH_TOKEN`
- Top header with compact telemetry label and profile area
- KPI cards for:
  - Tracked repos
  - Additions
  - Deletions
  - Commits
- Chart panel for:
  - Additions
  - Deletions
  - Net change
- Repo summary table with columns:
  - Repository
  - Visibility
  - Tracked branch
  - Additions
  - Deletions
  - Total changes
  - Commits
  - Status

Visual requirements:
- Light cool-gray background
- White cards
- Blue-violet accent
- Green/red/amber status colors
- Strong spacing and hierarchy
- Rounded corners and subtle shadows
- Professional typography
- Wide app layout, not narrow landing-page layout

Chart requirements:
- Make the chart materially better than the current div-bar rendering
- Prefer SVG or canvas if staying framework-free
- Show positive additions, negative deletions, and a net-change line
- Make axes and dates readable
- Handle zero/empty states gracefully

Responsive requirements:
- Desktop: full sidebar and wide layout
- Tablet: wrapping controls and 2x2 KPI layout
- Mobile: stacked controls, single-column cards, horizontally scrollable table, usable chart

Execution instructions:
- First inspect current files and preserve the working data behavior
- Then implement the redesign end to end
- Make only the necessary file additions/changes
- Keep copy tight and professional
- Validate that the dashboard still works with the current data file
- If any small data-shape tweak is needed, make it minimal and update the renderer accordingly
- Do not create a second planning layer
- Do the implementation directly

Deliverables:
- updated `dashboard.html`
- new extracted CSS/JS files as needed
- any tiny supporting asset files if useful
- final summary of what changed and any follow-up recommendations
```
