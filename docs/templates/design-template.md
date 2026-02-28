# Design: [Feature Naam]

> **Datum:** YYYY-MM-DD
> **Status:** Draft / Ter review / Goedgekeurd / Afgewezen
> **Effort:** Easy (1-2d) / Medium (3-5d) / Hard (1-2wk)
> **Auteur:** Kees

---

## Probleem / Motivatie

[Waarom willen we dit bouwen? Welk probleem lost het op?
Refereer naar gap analyse als relevant.]

**Opera heeft:** [beschrijving van Opera's implementatie]
**Tandem heeft nu:** [wat we nu hebben of juist missen]
**Gap:** [het verschil]

---

## Gebruikerservaring — hoe het werkt

[Vertel het verhaal vanuit Robin's perspectief]

> Robin opent Tandem. Hij klikt op [X]. Er verschijnt [Y].
> Hij kan nu [Z] doen zonder [pijnpunt].

---

## Technische Aanpak

### Architectuur

```
[ASCII diagram]
```

### Nieuwe bestanden

| Bestand | Verantwoordelijkheid |
|---------|---------------------|
| `src/[module]/manager.ts` | [Wat] |
| `shell/[component].js` | [Wat] |

### Bestaande bestanden aanpassen

| Bestand | Aanpassing | Functie |
|---------|-----------|---------|
| `src/api/server.ts` | `TandemAPIOptions` uitbreiden | `class TandemAPI` |
| `src/main.ts` | Manager instantiëren + registreren | `startAPI()` |
| `shell/index.html` | UI toevoegen | `// === [SECTIE] ===` |

### Nieuwe API Endpoints

| Methode | Endpoint | Beschrijving |
|---------|---------|--------------|
| GET | `/[endpoint]` | [wat doet het] |
| POST | `/[endpoint]` | [wat doet het] |

### Geen nieuwe npm packages nodig? ✅ / Nieuwe packages:
- `[package]@[version]` — [reden]

---

## Fase-opdeling

| Fase | Inhoud | Sessies | Afhankelijk van |
|------|--------|---------|----------------|
| 1 | [Basis/backend] | 1 | — |
| 2 | [UI/uitbreiding] | 1 | Fase 1 |
| 3 | [Polish/tests] | 1 | Fase 2 |

---

## Risico's / Valkuilen

- **[Risico 1]:** [Hoe mitigeren]
- **[Risico 2]:** [Hoe mitigeren]

---

## Anti-detect overwegingen

[Zijn er anti-detect implicaties? Bv. iets wat in de webview terechtkomt?]
- ✅ Alles via Electron main process / shell — geen injectie in webview
- ⚠️ [Eventuele aandachtspunten]

---

## Beslissingen nodig van Robin

- [ ] [Vraag 1: bv. wil je X of Y als UI aanpak?]
- [ ] [Vraag 2]

---

## Goedkeuring

Robin: [ ] Go / [ ] No-go / [ ] Go met aanpassing: ___________
