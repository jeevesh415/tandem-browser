# Fase [N] — [Naam]: [Korte omschrijving]

> **Feature:** [Feature naam]
> **Sessies:** 1 sessie (soms 2 als het complex is)
> **Prioriteit:** [HOOG / MIDDEL / LAAG]
> **Afhankelijk van:** Fase [N-1] klaar / Geen

---

## Doel van deze fase

[2-3 zinnen: wat bouwt Claude Code in deze sessie? Wat is het eindresultaat?]

---

## Bestaande code te lezen — ALLEEN dit

> Lees NIETS anders. Geen wandering door de codebase.

| Bestand | Zoek naar functie/klasse | Waarom |
|---------|--------------------------|--------|
| `src/api/routes/[file].ts` | `function register[X]Routes()` | Hier komen nieuwe endpoints bij |
| `src/[module]/manager.ts` | `class [X]Manager` | Bestaande manager die uitgebreid wordt |
| `src/main.ts` | `startAPI()` | Registratie nieuwe manager |
| `shell/index.html` | `// === [SECTIE] ===` | UI aanpassen |

---

## Te bouwen in deze fase

### [Stap 1: Naam]

**Wat:** [Duidelijke omschrijving in 1-2 zinnen]

**Bestand:** `src/[pad/naar/bestand].ts`

**Functie toevoegen aan:** `function [existingFunction]()`

```typescript
// Code voorbeeld / skelet
export class [NieuweKlasse] {
  constructor(private [dep]: [DepType]) {}
  
  async [methode](): Promise<[ReturnType]> {
    // implementatie
  }
}
```

### [Stap 2: Naam]

**Wat:** [Omschrijving]

**Bestand:** `src/api/routes/[file].ts`

**Toevoegen aan:** `function register[X]Routes()`

```typescript
router.post('/[endpoint]', async (req, res) => {
  try {
    // implementatie
    res.json({ ok: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
```

### [Stap N: UI aanpassen]

**Bestand:** `shell/index.html`

**Zoek naar:** `// === [SECTIE] ===`

**Voeg toe:**

```html
<!-- Beschrijving van UI toevoeging -->
<div class="[class]">...</div>
```

---

## Acceptatiecriteria — dit moet werken na de sessie

```bash
# Test 1: [naam]
TOKEN=$(cat ~/.tandem/api-token)
curl -H "Authorization: Bearer $TOKEN" \
  -X POST http://localhost:8765/[endpoint] \
  -H "Content-Type: application/json" \
  -d '{"[param]": "[waarde]"}'
# Verwacht: {"ok":true, "[veld]": ...}

# Test 2: [naam]
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8765/[endpoint]
# Verwacht: {"ok":true, ...}
```

**UI verificatie:**
- [ ] [Visueel te zien: beschrijf wat zichtbaar moet zijn]
- [ ] [Interactie: beschrijf wat klikbaar/werkend moet zijn]

---

## Sessie Protocol

### Bij start:
```
1. Lees LEES-MIJ-EERST.md
2. Lees DIT bestand (fase-[N].md) volledig
3. Run: curl http://localhost:8765/status && npx tsc && git status
4. Lees de bestanden in de "Te lezen" tabel hierboven
```

### Bij einde:
```
1. npx tsc — ZERO errors verplicht
2. npm start — app start zonder crashes
3. Alle curl tests uit "Acceptatiecriteria" uitvoeren
4. npx vitest run — alle bestaande tests blijven slagen
5. CHANGELOG.md bijwerken met korte entry
6. git commit -m "[emoji] feat: [korte beschrijving]"
7. git push
8. Rapport:
   ## Gebouwd
   ## Getest (plak curl output)
   ## Problemen
   ## Volgende sessie start bij...
```

---

## Bekende valkuilen

- [ ] [Valkuil 1: bv. vergeet de will-quit cleanup]
- [ ] [Valkuil 2: bv. TypeScript strict mode — geen any buiten catch]
- [ ] [Valkuil 3: bv. test in persist:tandem sessie, niet in guest]
