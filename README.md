# 🧠🤝👤 Tandem Browser

> Half mens, half AI. Samen het internet op.

A browser built for **human-AI symbiosis**. Robin (human) and Kees (AI) browse the web as one entity. Robin handles detection gates, captchas, and human judgment calls. Kees navigates, extracts data, and automates workflows.

## Why?

Platforms are locking out AI crawlers. LinkedIn returns 403. Twitter blocks bots. Even basic websites hide behind Cloudflare. 

A real browser with a real human behind it passes every detection gate. Tandem combines that with AI-powered automation — the best of both worlds.

## Quick Start

```bash
cd tandem-browser
npm install
npm run dev
```

The browser opens. The API starts on `localhost:8765`.

## API

Kees (via OpenClaw) controls the browser through a local HTTP API:

### Navigation & Content

```bash
# Status (includes active tab info)
curl localhost:8765/status

# Navigate
curl -X POST localhost:8765/navigate -H 'Content-Type: application/json' -d '{"url":"https://linkedin.com"}'

# Read the page
curl localhost:8765/page-content

# Get raw HTML
curl localhost:8765/page-html

# List all links
curl localhost:8765/links

# List all forms
curl localhost:8765/forms
```

### Interaction (anti-detect: sendInputEvent, Event.isTrusted = true)

```bash
# Click — uses OS-level mouse events with humanized delays
curl -X POST localhost:8765/click -H 'Content-Type: application/json' -d '{"selector":"button.sign-in"}'

# Type — char-by-char sendInputEvent with gaussian timing (30-120ms per key)
curl -X POST localhost:8765/type -H 'Content-Type: application/json' -d '{"selector":"#email","text":"robin@example.com","clear":true}'

# Scroll — uses mouseWheel input event
curl -X POST localhost:8765/scroll -H 'Content-Type: application/json' -d '{"direction":"down","amount":500}'

# Wait for element or page load
curl -X POST localhost:8765/wait -H 'Content-Type: application/json' -d '{"selector":".results","timeout":10000}'

# Execute arbitrary JS in page
curl -X POST localhost:8765/execute-js -H 'Content-Type: application/json' -d '{"code":"document.title"}'
```

### Screenshot & Cookies

```bash
# Screenshot (via capturePage — main process, not detectable)
curl localhost:8765/screenshot --output screen.png

# Save to file
curl "localhost:8765/screenshot?save=/tmp/screen.png"

# Cookies
curl localhost:8765/cookies
curl "localhost:8765/cookies?url=https://linkedin.com"
```

### Tabs

```bash
# Open a new tab
curl -X POST localhost:8765/tabs/open -H 'Content-Type: application/json' -d '{"url":"https://example.com"}'

# List all tabs and groups
curl localhost:8765/tabs/list

# Focus a tab
curl -X POST localhost:8765/tabs/focus -H 'Content-Type: application/json' -d '{"tabId":"tab-2"}'

# Close a tab
curl -X POST localhost:8765/tabs/close -H 'Content-Type: application/json' -d '{"tabId":"tab-2"}'

# Group tabs (with color)
curl -X POST localhost:8765/tabs/group -H 'Content-Type: application/json' -d '{"groupId":"work","name":"Werk","color":"#4285f4","tabIds":["tab-1","tab-2"]}'
```

### Copilot Alerts

```bash
# Ask Robin for help (shows notification)
curl -X POST localhost:8765/copilot-alert -H 'Content-Type: application/json' -d '{"title":"Captcha!","body":"Er staat een captcha op LinkedIn, kun je die even oplossen?"}'
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd+T | New tab |
| Cmd+W | Close tab |
| Cmd+1-9 | Switch to tab 1-9 |

## Architecture

```
Tandem Browser (Electron)
├── Tab Bar ← Multiple tabs with favicons, groups, colors
├── Browser UI (Chromium webviews) ← Robin sees and navigates
├── Tandem API (localhost:8765) ← Kees sends commands
├── Input Layer ← sendInputEvent (OS-level, Event.isTrusted=true)
├── Stealth Layer ← Anti-detection (UA, headers, navigator)
└── Copilot Alerts ← Kees asks Robin for help
```

## Anti-Detection

All automated interactions use `webContents.sendInputEvent()` which produces OS-level events:
- **Click**: mouseMove → mouseDown → mouseUp with gaussian delays (80-300ms)
- **Type**: char-by-char with gaussian typing rhythm (30-120ms per key)
- **Scroll**: mouseWheel events
- **Screenshot**: `capturePage()` from main process (invisible to page)
- All events have `Event.isTrusted = true` — indistinguishable from human input

## Philosophy

- **Real browser** — Not headless, not Puppeteer. A browser Robin actually uses.
- **API-first** — Everything Kees does goes through the HTTP API.
- **Local only** — No cloud, no external services. Your data stays yours.
- **Tandem** — Together stronger than apart.

## License

MIT
