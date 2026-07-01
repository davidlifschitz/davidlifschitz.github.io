# ShortcutForge public web runner

This directory is the **deploy copy** synced from `davidlifschitz/ShortcutForge` (`web` branch).

## Editing policy

- **Product/feature work** belongs in the upstream ShortcutForge repository, then sync here.
- **Site-specific deploy patches** in this copy are intentional and must be preserved during sync:
  - `.site-back` header links back to the main storefront (`../index.html`, `../ecosystem.html`)
  - matching `.site-back` styles in `styles.css`
- `validate.mjs` enforces those deploy patches and CSP/provider coupling.

## Sync

```bash
node scripts/sync-shortcutforge.mjs
```

Or trigger `.github/workflows/sync-shortcutforge.yml` via GitHub Actions `workflow_dispatch`.

The sync script restores the `.site-back` patch after copying upstream files.
