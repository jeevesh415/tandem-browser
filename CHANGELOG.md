# Changelog

## [Unreleased] — 2026-02-11

### 🐛 Bugfixes
- **Voice input**: Auto-restart recognition after `onend` event so continuous listening works 10s+
- **Voice UI**: Larger pulsating indicator (16px dot), "Spreek nu..." text, prominent styling
- **Screenshot without draw mode**: `Cmd+Shift+S` or toolbar 📸 button captures webview directly (no draw overlay needed), saves to clipboard + ~/Pictures/Tandem/
- **Chat auto-refresh**: Polls API every 2 seconds for new messages; messages sent via `POST /chat` appear instantly in Robin's panel
- **Chat auto-scroll**: Always scrolls to newest message

### 💬 Phase 2.6 — Kees Chat Koppeling
- Chat history persistent in `~/.tandem/chat-history.json` (survives app restart)
- Each message has timestamp + from (robin/kees)
- Chat UI: Robin messages right-aligned (green), Kees messages left-aligned (accent color)
- Timestamps shown on each message
- Typing indicator when Kees "thinks" — `POST /chat/typing` API endpoint
- `GET /chat?since_id=N` for efficient polling

### 🧬 Phase 2.8 — Behavioral Learning (Observation Layer)
- New `BehaviorObserver` class in main process (passive, no performance impact)
- Tracks: mouse clicks (position + timestamp), scroll events, keyboard timing (interval between keystrokes), navigation events, tab switches
- Raw data stored in `~/.tandem/behavior/raw/{date}.jsonl` (append-only, one event per line)
- `GET /behavior/stats` API endpoint with basic statistics (total events, avg click delay, avg keypress interval, etc.)
