# Bookmark Unification Plan

> Status: Draft | Auteur: Kees | Datum: 2026-03-02

## Huidige situatie (4 systemen)

| # | Systeem | Locatie | Probleem |
|---|---------|---------|---------|
| 1 | Ster knop | `shell/js/main.js:2153` | Geen popup — slaat stil op in root |
| 2 | Bookmarks Bar | `shell/js/main.js:2217` | Werkend, behouden |
| 3 | Bookmarks Page | `shell/bookmarks.html` | Standalone, duplicaat van panel |
| 4 | Sidebar Panel ⭐ | `shell/index.html:654` | Mooiste, maar read-only |

**Doel:** Sidebar Panel = master UI. Ster popup + CRUD toevoegen. Standalone page deprecaten.

---

## Fase 1 — Bookmark Star Popup

**Bestand:** `shell/js/main.js` (rond line 2181 — `toggleBookmarkCurrentPage()`)

**Wat bouwen:**
- Klein popup dialoogje dat verschijnt bij klik op ster (Chrome-stijl)
- Positie: verankerd aan de ster knop, boven/onder de URL balk
- Velden:
  - **Naam** — input, pre-filled met `document.title`
  - **Map** — dropdown met alle bestaande folders (via `GET /bookmarks`)
  - **Opslaan** knop (groen) → `POST /bookmarks/add` met gekozen folder als parentId
  - **Verwijderen** knop (rood, alleen als al gebookmarkt) → `DELETE /bookmarks/remove`
  - **Sluiten** bij klik buiten popup of Escape
- Als pagina al gebookmarkt is: popup opent in "edit mode" (naam aanpassen, map verplaatsen)
- Na opslaan: ster wordt ★ (oranje), bar refresht

**HTML:** nieuw `<div id="bookmark-popup">` toevoegen in `shell/index.html`
**CSS:** nieuw blok in `shell/css/main.css` — frosted glass stijl (passend bij rest van Tandem)
**Auth:** fetch calls krijgen `Authorization: Bearer ${TOKEN}` header (fix meteen)

---

## Fase 2 — Sidebar Panel uitbreiden met CRUD

**Bestand:** `shell/index.html:654-822` (inline bookmark panel script)

**Wat toevoegen:**
- **"+ Bookmark" knop** bovenaan panel (naast zoekbalk)
  → opent inline mini-form (naam + URL velden) of hergebruikt de star popup logica
- **"+ Map" knop** — al mogelijk via bookmarks.html, toevoegen aan panel
- **Edit knop** bij hover over bookmark item (potloodicoon)
  → inline edit of klein modal — naam + URL aanpassen
- **Delete knop** bij hover (prullenbak icoon) → bevestigingsvraag → `DELETE /bookmarks/remove`
- **Drag-and-drop** om bookmarks te herordenen of naar andere map te slepen (toekomstige fase)

**Resultaat:** Panel is volledig functioneel, bookmarks.html wordt overbodig.

---

## Fase 3 — Standalone Page deprecaten

**Bestand:** `shell/bookmarks.html`

- Na fase 2: `Bookmark Manager` menu item opent het **sidebar panel** in plaats van een nieuwe tab
- `shell/bookmarks.html` blijft bestaan als fallback maar wordt niet meer actief gelinkt
- In een latere versie verwijderen

**Aanpassing:**
- `src/menu/app-menu.ts` — `open-bookmarks` event → stuur `open-sidebar-panel` met `bookmarks` als panel ID
- `shell/js/main.js` — `open-bookmarks` handler aanpassen

---

## Fase 4 — Auth fixes & code deduplicatie

**Auth:**
- `shell/js/main.js` — ster button fetch calls krijgen auth header
- `shell/bookmarks.html` — fetch calls krijgen auth header
- Of: bookmark endpoints whitelisten zonder auth (ze zijn al localhost-only)

**Code deduplicatie (optioneel, latere fase):**
- Gedeelde helper: `shell/js/bookmarks-utils.js`
  - `renderBookmarkItem(item)` — herbruikbaar template
  - `fetchBookmarks()` — centrale fetch met auth
  - `renderFolderTree(folders, selectedId)` — voor dropdown in popup + panel

---

## Implementatievolgorde voor Claude Code

```
Fase 1 → Fase 2 → Fase 3 → Fase 4
```

Start met Fase 1 (ster popup) — dat lost de meest zichtbare bug op en is zelfstandig.
Fase 2 bouwt voort op dezelfde popup/dialog patterns.
Fase 3 is puur routing — klein maar impactvol.
Fase 4 is cleanup — kan in dezelfde PR of apart.

---

## Bestanden die wijzigen

| Bestand | Wijziging |
|---------|-----------|
| `shell/index.html` | Bookmark popup HTML toevoegen + panel CRUD knoppen |
| `shell/js/main.js` | Popup logica + auth fix ster button |
| `shell/css/main.css` | Popup styling (frosted glass) |
| `src/menu/app-menu.ts` | `open-bookmarks` → open sidebar panel |
| `shell/js/main.js` | `open-bookmarks` handler aanpassen |

**Niet aanraken:**
- `src/bookmarks/manager.ts` — backend is prima
- `src/api/routes/data.ts` — API is compleet
- `shell/bookmarks.html` — alleen deprecaten, niet aanpassen

---

## Definitie van klaar

- [ ] Klik ster → popup verschijnt met naam + folder picker
- [ ] Popup slaat op in gekozen map (niet altijd root)
- [ ] Popup toont edit/delete als pagina al gebookmarkt is
- [ ] Sidebar panel heeft + Bookmark, + Map, edit en delete
- [ ] Bookmark Manager menu opent sidebar panel (niet nieuwe tab)
- [ ] Alle bookmark API calls hebben auth headers
- [ ] `npm run build` slaagt zonder errors
