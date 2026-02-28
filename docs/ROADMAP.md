# Tandem Browser — Feature Roadmap

> **Beheerd door:** Kees (AI) + Robin (beslissingen)
> **Bijgewerkt:** 2026-02-28
> **Basis:** Gap analyse vs Opera Browser (zie research/gap-analysis.md)

---

## Werkwijze

1. **Kees schrijft design doc** → `docs/plans/{feature}-design.md`
2. **Robin keurt goed** → go/no-go + eventuele aanpassingen
3. **Kees schrijft implementatie-docs** → `docs/implementations/{feature}/`
   - `LEES-MIJ-EERST.md` (context voor Claude Code)
   - `fase-1-*.md`, `fase-2-*.md`, ...
4. **Claude Code voert 1 fase uit** → commit
5. **Robin + Kees reviewen diff**
6. **Volgende fase of volgende feature**

### Sesizie-discipline (geen regelnummers!)
- Verwijs altijd naar **functienamen**, nooit naar regelnummers
- `function startAPI()` is stabiel. Regel 287 niet.
- Claude Code gebruikt `grep` of `Read` om functies te vinden

---

## Huidige Sprint — Week 1-2 (1-14 maart 2026)

### 🔴 ACTIEF

| Feature | Status | Fase | Notities |
|---------|--------|------|---------|
| — | Wachten op go | — | Robin beslist welke feature first |

### ⏳ IN WACHTRIJ (design-fase)

| Feature | Prio | Effort | Design Doc |
|---------|------|--------|-----------|
| Sidebar Chat Clients | 🔴 HIGH | Hard (1-2 wk) | Schrijven |
| Pinboards | 🔴 HIGH | Hard (1-2 wk) | Schrijven |
| Tab Islands (upgrade) | 🔴 HIGH | Medium (3-5d) | Schrijven |
| Split Screen | 🔴 HIGH | Medium (3-5d) | Schrijven |
| Workspaces UI | 🔴 HIGH | Medium (3-5d) | Schrijven |
| Tab Emojis | 🔴 HIGH | Easy (1-2d) | Schrijven |
| Search in Tabs | 🔴 HIGH | Easy (1-2d) | Schrijven |

---

## Backlog — Week 3-4

| Feature | Prio | Effort | Afhankelijk van |
|---------|------|--------|----------------|
| Ad Blocker (EasyList) | 🔴 HIGH | Medium | — |
| Tab Snoozing | 🔴 HIGH | Medium | — |
| Private Browsing Window | 🔴 HIGH | Easy | — |
| Tracker Blocker (actief) | 🟡 MED | Easy | — |
| Security Badges (adresbalk) | 🟡 MED | Easy | — |
| Tab Traces (recency glow) | 🟡 MED | Easy | — |
| Duplicate Tabs Highlighter | 🟡 MED | Easy | — |
| Tab Preview on Hover | 🟡 MED | Medium | — |
| Paste Protection | 🟡 MED | Easy | — |
| Search Popup (tekst selectie) | 🟡 MED | Medium | — |
| Spotify/Music Player sidebar | 🟡 MED | Medium | Sidebar Chat Clients |
| Dynamic Themes | 🟡 MED | Medium | — |

---

## Ooit / Low Priority

| Feature | Prio | Notities |
|---------|------|---------|
| Visual Tab Cycler (Ctrl+Tab) | 🟢 LOW | Leuk, niet urgent |
| Currency/Unit/Timezone converter | 🟢 LOW | Selectie popup |
| Page Translate | 🟢 LOW | Extensions werken ook |
| Battery Saver | 🟢 LOW | — |
| Personal News start page | 🟢 LOW | — |
| My Flow (cross-device) | 🟢 LOW | Vereist mobile app |
| Video Skip button | 🟢 LOW | — |

---

## Niet bouwen ❌

- Lucid Mode (video sharpening) — oninteressant voor AI-werktuig
- Facebook Messenger — niet nodig
- VK (Russische chat) — niet nodig
- Opera Cashback — commerce, niet passend
- Crypto Wallet — niet passend
- Midsommar/Aurora animated themes met browser sounds — te consumer-ish

---

## Voltooide Features (deze sprint)

| Feature | Afgerond | Notities |
|---------|----------|---------|
| Research Opera-inventaris | 2026-02-28 | Gap analyse klaar in docs/research/ |

---

## Regels voor deze ROADMAP

- Status: 🔴 ACTIEF | ⏳ WACHTRIJ | ✅ KLAAR | ❌ GEBLOKKEERD | 🚫 GEANNULEERD
- Robin beslist over prio-volgorde — Kees houdt bij
- Kees werkt de tabel bij na elke afgeronde fase
- Design doc verplicht voor elke feature VOOR implementatie start
