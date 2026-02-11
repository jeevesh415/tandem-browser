# Changelog — Tandem Browser

## [0.1.0] — 2026-02-11

### Added
- 🚲 Initial project setup (Electron + TypeScript + Express)
- 🌐 Browser shell with dark theme UI, URL bar, navigation buttons
- 🔌 HTTP API on localhost:8765 with 13 endpoints:
  - `/status` — browser state
  - `/navigate` — open URL
  - `/page-content` — extract readable text
  - `/page-html` — raw HTML
  - `/click` — click element by CSS selector
  - `/type` — type text into element
  - `/execute-js` — run arbitrary JavaScript
  - `/screenshot` — capture page as PNG
  - `/cookies` — read cookies
  - `/scroll` — scroll page
  - `/wait` — wait for element or page load
  - `/links` — list all links on page
  - `/forms` — list all forms with fields
  - `/copilot-alert` — send notification to Robin
- 🛡️ Stealth layer:
  - Realistic Chrome User-Agent
  - Sec-CH-UA headers matching UA
  - Navigator.webdriver = false
  - Fake plugins, languages, chrome runtime
  - Electron header removal
- 💾 Persistent sessions (`persist:tandem` partition)
- 🔔 Copilot alert system (macOS notification + in-browser overlay)
- 📝 Project documentation (PROJECT.md, README.md, TODO.md, AGENTS.md)
- 🔒 GitHub repo: hydro13/tandem-browser (private)
