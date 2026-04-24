# ShortcutForge Web Runner V1

This is the first web-first ShortcutForge surface.

It does not try to import generated unsigned `.shortcut` files directly. Instead, it sends the user through a trusted iCloud Shortcut install link and then helps draft or generate the runner payload that the installed shortcut can consume.

## Why this exists

Local unsigned `.shortcut` files can be rejected by iOS. The V1 workaround is:

```text
web app
→ iCloud runner shortcut link
→ user adds the runner in Apple Shortcuts
→ web app drafts/generates a structured request payload
→ runner shortcut executes supported branches or sends the payload to ScheduleOS
```

## BYOK LLM generation

The web app supports bring-your-own-key LLM generation for provider APIs that accept browser-origin requests.

Supported provider presets:

- OpenRouter
- NVIDIA NIM

The API key flow is:

```text
user enters API key + passphrase
→ browser encrypts the key with Web Crypto AES-GCM
→ encrypted blob is stored in localStorage
→ user enters passphrase when generating
→ browser decrypts key in memory
→ browser calls the selected provider
→ LLM returns a ShortcutForge runner payload
```

Security note: this is encrypted at rest in this browser. The key must still be decrypted in browser memory to call the provider. Do not treat this as equivalent to a server-side secret vault.

## Local preview

From the repository root:

```bash
cd web
npm run validate
npm run serve
```

Then open:

```text
http://localhost:4173
```

## Public deployment

The source of truth remains this directory:

```text
ShortcutForge/web/
```

The public copy is synced into:

```text
davidlifschitz.github.io/shortcutforge/
```

Expected public URL after the sync workflow succeeds:

```text
https://davidlifschitz.github.io/shortcutforge/
```

## Configuration

Edit `config.json`:

```json
{
  "runnerInstallUrl": "https://www.icloud.com/shortcuts/290365e70329446caec7e93f702a7919",
  "llmProviders": {
    "openrouter": {
      "endpoint": "https://openrouter.ai/api/v1/chat/completions"
    },
    "nvidia": {
      "endpoint": "https://integrate.api.nvidia.com/v1/chat/completions"
    }
  }
}
```

`runnerInstallUrl` should point at the trusted iCloud Shortcut that users add to their Shortcuts app.

`scheduleOsEndpoint` is intentionally blank for V1. Once ScheduleOS exposes a stable mobile endpoint, the runner can POST the generated payload there.

## V1 limitations

- The web app does not generate signed Apple shortcut files.
- The runner shortcut must be created and shared through Apple Shortcuts/iCloud.
- Dynamic behavior is limited to branches that the installed runner shortcut already supports.
- LLM provider calls may fail if the provider blocks direct browser requests with CORS rules.
- ScheduleOS submission is represented as a payload preview until the live endpoint is available.
