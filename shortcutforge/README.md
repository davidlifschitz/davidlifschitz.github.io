# ShortcutForge Web Runner V1

This is the first web-first ShortcutForge surface.

It does not try to import generated unsigned `.shortcut` files directly. Instead, it sends the user through a trusted iCloud Shortcut install link and then helps draft the runner payload that the installed shortcut can consume.

## Why this exists

Local unsigned `.shortcut` files can be rejected by iOS. The V1 workaround is:

```text
web app
→ iCloud runner shortcut link
→ user adds the runner in Apple Shortcuts
→ web app drafts/copies a structured request payload
→ runner shortcut executes supported branches or sends the payload to ScheduleOS
```

## Local preview

From the repository root:

```bash
cd web
python3 -m http.server 4173
```

Then open:

```text
http://localhost:4173
```

For phone testing, serve the same directory over an HTTPS-capable host such as GitHub Pages, Vercel, Netlify, or Cloudflare Pages.

## Configuration

Edit `config.json`:

```json
{
  "runnerInstallUrl": "https://www.icloud.com/shortcuts/290365e70329446caec7e93f702a7919",
  "scheduleOsEndpoint": ""
}
```

`runnerInstallUrl` should point at the trusted iCloud Shortcut that users add to their Shortcuts app.

`scheduleOsEndpoint` is intentionally blank for V1. Once ScheduleOS exposes a stable mobile endpoint, the runner can POST the copied/generated payload there.

## V1 limitations

- The web app does not generate signed Apple shortcut files.
- The runner shortcut must be created and shared through Apple Shortcuts/iCloud.
- Dynamic behavior is limited to branches that the installed runner shortcut already supports.
- ScheduleOS submission is represented as a payload preview until the live endpoint is available.
