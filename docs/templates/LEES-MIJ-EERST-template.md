# [FEATURE NAAM] — START HIER

> **Datum:** YYYY-MM-DD
> **Status:** In progress / Klaar
> **Doel:** [Één zin: wat gaat deze feature toevoegen aan Tandem]
> **Volgorde:** Fase 1 → 2 → 3 (elke fase is één sessie)

---

## Waarom deze feature?

[2-3 zinnen: waarom wil Robin dit hebben? Welk probleem lost het op?
Verwijzing naar gap analyse als relevant: docs/research/gap-analysis.md]

---

## Architectuur in 30 seconden

```
[ASCII diagram van hoe het werkt]
[Bv: HTTP request → Manager → Electron API → UI]
```

---

## Projectstructuur — relevante bestanden

> ⚠️ Lees ALLEEN de bestanden in de "Te lezen" tabel.
> Ga NIET wandelen door de rest van de codebase.

### Te lezen voor ALLE fases

| Bestand | Wat staat erin | Zoek naar functie |
|---------|---------------|-------------------|
| `AGENTS.md` | Anti-detect regels, code stijl, commit format | — (lees volledig) |
| `src/main.ts` | App startup, manager registratie | `startAPI()`, `createWindow()` |
| `src/api/server.ts` | TandemAPI class, route registratie | `class TandemAPI`, `TandemAPIOptions` |

### Per fase aanvullend te lezen

_(zie het relevante fase-bestand)_

---

## Regels voor deze feature

> Dit zijn de HARDE regels naast de algemene AGENTS.md regels.

1. **[Specifieke regel 1]** — bv: alle nieuwe UI-elementen gaan in de shell, nooit in de webview
2. **[Specifieke regel 2]** — bv: geen nieuwe npm packages zonder Robin goedkeuring
3. **Functienamen > regelnummers** — verwijs altijd naar `function setupRoutes()`, nooit naar "regel 287"

---

## Manager Wiring — hoe nieuwe component registreren

Elke nieuwe manager moet op **3 plekken** worden aangesloten:

### 1. `src/api/server.ts` — `TandemAPIOptions` interface

```typescript
export interface TandemAPIOptions {
  // ... bestaande managers ...
  [nieuweManager]: [NieuweManager];  // ← toevoegen
}
```

### 2. `src/main.ts` — `startAPI()` functie

```typescript
// Na aanmaken van aanverwante manager:
const [nieuweManager] = new [NieuweManager]([afhankelijkheden]);

// In new TandemAPI({...}):
[nieuweManager]: [nieuweManager]!,
```

### 3. `src/main.ts` — `app.on('will-quit')` handler

```typescript
if ([nieuweManager]) [nieuweManager].destroy();
```

---

## API Endpoint Patroon — kopieer exact

```typescript
// Sectie header (verplicht bij nieuwe feature-groep)
// ═══════════════════════════════════════════════
// [FEATURE] — [Beschrijving]
// ═══════════════════════════════════════════════

this.app.get('/[endpoint]', async (req: Request, res: Response) => {
  try {
    const result = await this.[manager].[methode](req.body);
    res.json({ ok: true, ...result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
```

**Regels:**
- `try/catch` rond ALLES, catch als `(e: any)`
- 400 voor ontbrekende verplichte velden
- 404 voor niet-gevonden resources
- Success: altijd `{ ok: true, ...data }`

---

## Documenten in deze map

| Bestand | Wat | Status |
|---------|-----|--------|
| `LEES-MIJ-EERST.md` | ← dit bestand | — |
| `fase-1-[naam].md` | [Wat fase 1 doet] | 📋 Klaar om te starten |
| `fase-2-[naam].md` | [Wat fase 2 doet] | ⏳ Wacht op fase 1 |
| `fase-3-[naam].md` | [Wat fase 3 doet] | ⏳ Wacht op fase 2 |

---

## Quick Status Check (altijd eerst uitvoeren)

```bash
# App draait?
curl http://localhost:8765/status

# TypeScript clean?
npx tsc

# Git status clean?
git status

# Tests slagen?
npx vitest run
```
