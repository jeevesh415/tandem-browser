# Opera Browser — Volledig Onderzoeksrapport
**Datum:** 28 februari 2026  
**Doel:** Alles leren van Opera's UI/UX om Tandem Browser te verbeteren  
**Bron:** Opera help.opera.com + opera.com/features  

---

## 1. LAYOUT & STRUCTUUR

Opera heeft 5 hoofdcomponenten:

```
┌─────────────────────────────────────────────────────────┐
│ MENU BAR (macOS native / Windows Opera menu)             │
├─────────────────────────────────────────────────────────┤
│ [←][→][↻][⌂]  [ COMBINED ADDRESS + SEARCH BAR ]  [⚙]   │
├──┬──────────────────────────────────────────────────────┤
│  │  TAB BAR (bovenaan, met Tab Islands + emojis)         │
│  ├──────────────────────────────────────────────────────┤
│S │                                                       │
│I │                   WEB VIEW                            │
│D │                                                       │
│E │                                                       │
│B │                                                       │
│A │                                                       │
│R │                                                       │
└──┴──────────────────────────────────────────────────────┘
```

**Sidebar (links, verticaal)**
- Workspaces (virtual desktops voor tabs)
- Messengers: WhatsApp, Telegram, FB Messenger, Instagram, Discord, Slack, VK, X/Twitter
- Flow (cross-device sync)
- Speed Dial
- Bookmarks
- Personal News
- Tabs (overview panel)
- History
- Downloads
- Extensions
- Settings
- Music Player (detachable)
- Pinboards
- Aria (AI)

De sidebar is **volledig aanpasbaar**: drag to reorder, enable/disable per item, narrow mode optie.

---

## 2. TAB MANAGEMENT — Opera's sterkste punt

### 2.1 Tab Islands ⭐⭐⭐
Tabs die vanuit dezelfde pagina geopend worden, worden automatisch gegroepeerd in een "eiland":
- Benoembaar (geef een island een naam)
- Inklapbaar (save space bij veel tabs)
- Per-island kleur instellen
- Manual islands ook te maken
- Werkt samen met Split Screen

**Verschil met Chrome Tab Groups:** Opera doet het _automatisch_ op basis van context, niet handmatig.

**⭐ VISUELE IMPLEMENTATIE (live bestudeerd):**
Simpeler dan verwacht! Tab Islands zijn GEEN speciale container of bracket. Het zijn tabs die dichter bij elkaar staan met een subtiele extra gap tussen de groepen. Dat is het. Voorbeeld gezien:
- Island 1: [Speed Dial] [Speed Dial] — gap — Island 2: [Gemini] [Add-ons] — gap — Island 3: [GitHub] [Claude]...
- Implementatie in Tandem: track `opener` tabId → groepeer in tab bar via CSS margin/gap tussen groepen. ~1 dag werk.

### 2.2 Workspaces ⭐⭐⭐
Zoals virtuele desktops, maar voor tabs:
- Meerdere workspaces (bv. "Work", "Shopping", "Research")
- Elk workspace heeft eigen set tabs
- Tabs verplaatsbaar tussen workspaces (right-click → Move to Workspace)
- Eigen naam + kleur + icoon per workspace
- Snel schakelen via sidebar of keyboard shortcut
- Workspaces zijn zichtbaar bovenaan de sidebar

**⭐ VISUELE IMPLEMENTATIE (live bestudeerd):**
Workspaces verschijnen als gekleurde vierkante icoontjes BOVENAAN de sidebar, bóven alle messenger iconen. Home icoon (huis) = default workspace. Andere workspaces = gekleurde vierkantjes met eigen icoon. Klikken switcht alle tabs naar die workspace.

**Opera's definitie:** "Organize tab groups in separate customizable workspaces"

### 2.3 Split Screen
- Drag een tab omlaag → keuze: links of rechts splitsen
- Of: Shift+select twee tabs → right-click → Create Split Screen
- Twee tabs naast elkaar
- Scheidingslijn klikken om te sluiten
- Werkt binnen Tab Islands
- Meerdere split screen groepen mogelijk

### 2.4 Tab Emojis
- Hover over tab → emoji picker verschijnt
- Visuele identificatie van tabs
- An- en uitzetten in Settings

### 2.5 Visual Tab Cycler
- Ctrl+Tab → thumbnail preview popup van alle open tabs
- Hou Ctrl ingedrukt, Tab om te cyclen, loslaten om te kiezen

### 2.6 Tab Preview
- Hover over tab → miniature preview van page content
- Ziet content zonder focus te wisselen
- Optioneel in Settings

### 2.7 Search in Tabs
- Ctrl+Space → zoekbalk die open tabs doorzoekt op keyword
- Superhandig bij 20+ tabs

### 2.8 Pinned Tabs
- Pin tab: blijft altijd aan (overleeft herstart)
- Verplaatst naar links van tab bar
- Kan niet per ongeluk gesloten worden

### 2.9 Save Tabs as Speed Dial Folder
- Right-click tab bar → "Save all tabs as Speed Dial folder"
- Hele sessie opslaan voor later
- Selectie van tabs ook mogelijk

### 2.10 Tab Snoozing
- Tab "slapen" sturen voor later
- Ontbreekt nog in Tandem!

---

## 3. SIDEBAR — Het hart van Opera's UX

### 3.1 Integrated Messengers ⭐⭐⭐
Opera bouwde alle grote messengers IN de browser als sidebar panels:
- **WhatsApp** — volledig functioneel in sidebar panel
- **Telegram** — volledig functioneel
- **Facebook Messenger** — volledig functioneel
- **Instagram** — DMs + feed
- **Discord** — volledig server/channel interface
- **Slack** — workspace + channels
- **VK Messenger** — Russisch social
- **X/Twitter** — timeline + compose
- **Spotify** — muziek speler in sidebar

Elk heeft notification badges op het icoon. De panels openen naast de main browser view zonder nieuwe tab.

### 3.2 Music Player ⭐⭐
- Spotify, Apple Music, YouTube Music, Deezer, Tidal in één plek
- Detachable: kan losgemaakt worden als floating module
- Overal op scherm te plaatsen (buiten browser)
- Pin to toolbar optie
- Auto-pause als andere media start

### 3.3 My Flow ⭐⭐⭐
Cross-device sync tool:
- Desktop ↔ Mobile Opera (QR code koppeling)
- Stuur links, notities, bestanden heen en weer
- Encrypted
- Real-time sync
- Geen account nodig (device-based pairing)

**Tandem equivalent:** Wij hebben geen cross-device sync. Grote kans hier.

### 3.4 Pinboards ⭐⭐
Visuele mood board / collectie tool:
- Sla web content op (links, afbeeldingen, tekst, video)
- Drag & drop interface
- Meerdere boards
- Deelbaar met anderen
- Visuele weergave (niet als lijst maar als board)

**Tandem equivalent:** Geen. Mogelijke toevoeging voor "research sessions"

---

## 4. AI — ARIA ⭐⭐⭐

Opera's ingebouwde AI assistent:
- **Naam:** Aria
- **Locatie:** Sidebar panel + address bar shortcut
- **Aangedreven door:** Meerdere LLMs (Opera's eigen AI gateway)
- **Functies:**
  - Chat / Q&A
  - Pagina samenvatten (actieve tab als context)
  - Tekst genereren
  - Afbeeldingen genereren (Google Imagen2, op mobile)
  - Zoeken op het web
  - Voice input (spreek je vragen in)
  - ChatGPT integratie als extra optie
- **Browser integratie:** Kan actieve pagina lezen als context
- **Gratis** — inbegrepen in browser, account nodig voor sommige functies

**Versus Tandem:** Tandem heeft dit al via de Copilot panel en OpenClaw WebSocket integratie — maar Opera's Aria heeft betere UX (voice, image gen, snellere sidebar toggle).

---

## 5. MEDIA & VIDEO ⭐⭐

### 5.1 Video Popout
- Hover over video → "Popout" knop verschijnt bovenaan video
- Video wordt floating window (boven alle andere vensters)
- Aanpasbaar formaat + positie
- Werkt op YouTube, Twitch, Vimeo, Google Meet, Zoom...
- Transparantie aanpasbaar
- Auto-popout optie (automatisch als je naar andere tab gaat)
- Volledig playback control in het floating window
- Video blijft spelen in host tab als je floating sluit

### 5.2 Lucid Mode — ❌ ONINTERESSANT VOOR TANDEM
Sharpening filter op gecomprimeerde video. Nuttig voor media-browsers, compleet irrelevant voor ons AI-werktuig. Nooit bouwen.

### 5.3 Video Skip
- Hover over video → "Skip" knop (dubbele pijl icoon)
- Springt naar het einde van video/advertentie
- Werkt ook als site vraagt om adblocker uit te zetten

---

## 6. PRIVACY & SECURITY

### 6.1 Ad Blocker (ingebouwd)
- Geen extensie nodig
- Blokkeert ook: cryptocurrency mining scripts (NoCoin)
- Badge rechts van adresbalk: toont aantal geblokkeerde ads/trackers
- Per-site uitzonderingen
- Meerdere blokkeerlijsten

### 6.2 Tracker Blocker
- Analytic scripts, tracking pixels, data collection methoden
- Aparte instelling van ad blocker
- Eigen lijsten + uitzonderingen

### 6.3 Free VPN (ingebouwd)
- Gratis, onbeperkt datavolume
- Geen logs
- 3 regio's: Europa, Azië, Amerika
- IP verandert naar VPN server locatie
- "Bypass for default search engines" optie (zoekresultaten blijven lokaal relevant)
- Toggle in adresbalk

### 6.4 Paste Protection ⭐
Uniek en slim:
- Detecteert als je een IBAN of creditcardnummer kopieert
- Monitort clipboard voor 2 minuten (of tot je plakt)
- Waarschuwt als een externe app het clipboard heeft gewijzigd
- Beschermt tegen clipboard hijacking aanvallen

**Tandem equivalent:** We hebben NetworkShield + OutboundGuard — maar geen clipboard protection. Nieuwe idee!

### 6.5 Private Window
- Geen history, geen cookies, geen cache
- Standaard Chromium incognito equivalent

---

## 7. START PAGE & SPEED DIAL

### 7.1 Speed Dial
- Visuele thumbnails van favoriete sites
- Organiseerbaar in folders (één thumbnail sleep je op een andere)
- Aanpasbare kolommen
- Geanimeerde thumbnails optioneel
- Suggested Speed Dials (op basis van browsing)
- Promoted Speed Dials (Opera's advertentie model)
- Sla alle open tabs op als Speed Dial folder

### 7.2 Personal News
- Nieuws feed op start pagina
- Selecteer onderwerpen en talen
- Niet beïnvloed door browsing history (privacy)
- Aanpasbaar via instellingen

### 7.3 Easy Setup Panel
- Knop rechtsboven bij adresbalk
- Quick access tot meest gebruikte instellingen:
  - Themes + wallpapers
  - Pin/unpin sidebar
  - Show/hide bookmarks bar
  - Ad blocker aan/uit
  - Download locatie
  - Clear browsing data
- Link naar volledige Settings

---

## 8. PRODUCTIVITEIT

### 8.1 Search Pop-up Tool ⭐
Selecteer tekst op pagina → popup verschijnt met:
- Zoeken met default search engine (één klik)
- Kopiëren
- Delen (macOS)
- **Currency converter:** Selecteer "$30" → toont in jouw valuta
- **Unit converter:** Selecteer "10 miles" → toont in km
- **Time zone converter:** Selecteer "18:30 KST" → toont in jouw tijdzone

**Ondersteunde valuta:** 35+ valuta + 4 cryptocurrencies (BTC, ETH, LTC, BCH)  
**Ondersteunde eenheden:** lb↔kg, °F↔°C, oz↔g, mph↔km/h, mi↔km, enz.

### 8.2 Snapshot ⭐⭐
Ingebouwde screenshot tool:
- Capture rectangle, volledig scherm, of specifiek element
- Annoteer (tekst, vormen, arrows)
- Direct delen of opslaan
- Knop in toolbar

**Tandem equivalent:** ⚠️ GEDEELTELIJK — Tandem HAS een snapshot tool met annotatie UI (pen, rechthoek, cirkel, freehand, tekst, kleuren, blur/pixelate), maar de kwaliteit/werking is nog work in progress. Verbetering staat op de TODO.

### 8.3 Easy Files
Upload dialoog toont recent gebruikte bestanden bovenaan — geen zoeken in mappenstructuur.

### 8.4 Battery Saver
- Activeer automatisch als laptop unplugged is
- Vermindert activiteit in background tabs
- Pauzeert plugins en animaties
- Herplant JavaScript timers
- Optimaliseert video playback parameters
- Toont geschatte resterende batterij tijd
- 50% langere browsetijd geclaimd

---

## 9. CUSTOMIZATION ⭐⭐

### 9.1 Themes
Drie themes met heel andere vibes:
- **Classic** — custom wallpaper, kleur kiezen (cool↔warm, calm↔vibrant), light/dark mode
- **Aurora** — geanimeerde dark mode, kleur: Borealis (rood/roze/paars) of Australis (blauw/groen)
- **Midsommar** — geanimeerde light mode, pastel tot gesatureerd, **MET GELUID**: browser sounds, keyboard sounds, achtergrondmuziek

Je kan de laatste 10 geconfigureerde themes opslaan. Snel wisselen via Alt+Shift+T.

### 9.2 Wallpapers
- Custom upload
- Right-click image op website → "Use Image as Wallpaper"
- Community wallpapers op addons.opera.com

### 9.3 Extensions
- Eigen extensies store (addons.opera.com)
- **Chrome extensies werken ook** via addon "Install Chrome extensions"

---

## 10. SYNC & CROSS-DEVICE

### 10.1 Opera Sync
- Sync via Opera account
- Synct: bookmarks, history, passwords, open tabs, settings, Flow inhoud
- Cross-device: desktop ↔ desktop ↔ mobile

### 10.2 My Flow (cross-device clipboard)
- Desktop Opera ↔ Opera Touch (iOS/Android)
- QR code koppeling (geen account nodig!)
- End-to-end encrypted
- Stuur: links, notities, bestanden, afbeeldingen
- Real-time sync

---

## 11. OVERIGE FEATURES

### Continue Booking / Continue Shopping
- Browser herkent als je op reis/product pagina bent
- Toont reminder als je terugkomt naar dezelfde soort pagina
- "Je was bezig met vlucht boeken naar Barcelona..."

### Crypto Wallet (ingebouwd)
- DeFi wallet
- Meerdere netwerken
- Geen extensie nodig

### Opera Cashback
- Automatisch cashback bij online shoppen
- Browser detecteert webshops
- Deals/coupons worden automatisch toegepast

---

## 12. MOUSE GESTURES & SHORTCUTS

### Mouse Gestures
- Ingebouwde gestures (geen extensie nodig)
- Rechtermuisknop + beweging = actie
- Bv. rechts-omlaag = tab sluiten, rechts-links = terug

### Keyboard Shortcuts
- Ctrl+Tab: Visual Tab Cycler
- Ctrl+Space: Search in Tabs  
- Ctrl+F: Find on page
- Ctrl+Shift+E: Extensions
- Alt+P: Settings
- Alt+Shift+T: Cycle through saved themes

---

## 13. DEVELOPER TOOLS

Standaard Chromium DevTools + extra:
- Experiments pagina (feature flags)
- Proxy settings (per-browser instellbaar)
- Source code viewer

---

# ANALYSE: WAT KAN TANDEM HIERVAN LEREN?

## 🔴 Hoge prioriteit — Dit moet Tandem ook hebben

### 1. Tab Islands (automatische tab groepering)
Opera's beste UI innovatie. Tabs die vanuit dezelfde parent geopend zijn, horen bij elkaar en Opera laat dat zien. Dit is extreem intuïtief. Tandem zou tabs die via copilot-navigatie geopend zijn als "copilot session" kunnen groeperen.

**Implementatie:** Track `opener` tab ID voor elke nieuwe tab in Electron. Automatisch in tab bar groeperen met visuele connector.

### 2. Workspaces (virtual tab desktops) ⭐⭐⭐
Dit is een perfecte match voor Tandem's use case. Stel je voor:
- Workspace "Research" — Copilot werkt hier autonoom
- Workspace "Work" — Robin's dagelijkse tabs
- Workspace "Projects" — per project een workspace

**Al deels aanwezig:** `/sessions/create` in Tandem doet iets vergelijkbaars maar is niet visueel in de browser UI. Dit verbeteren naar echte visuele workspaces.

### 3. Tab Preview (hover om content te zien)
Snel even zien wat er in een tab staat zonder te switchen. Electron kan dit met `webContents.capturePage()` + thumbnail in shell.

### 4. Search in Tabs
Ctrl+Space → alle open tabs doorzoeken. Trivial te implementeren in Tandem's shell UI.

### 5. Video Popout
Floating video player die boven alles zweeft. Electron kan dit via `BrowserWindow` met `alwaysOnTop: true` + WebContents capture.

### 6. Snapshot met annotaties — ⚠️ AANWEZIG MAAR WORK IN PROGRESS
Tandem heeft de tool (pen, rechthoek, cirkel, freehand, tekst, kleuren, blur/pixelate), maar of die ook lekker werkt is een tweede zaak. Staat op de TODO om te verbeteren/afmaken.

---

## 🟡 Medium prioriteit — Goede inspiratie

### 7. Easy Setup Quick Panel ⭐
Opera's quick settings panel rechtsbovenaan is heel slim. Tandem heeft een settings panel maar die is verborgen. Een "Quick Panel" knop in de toolbar met de meest gebruikte opties (security shield, copilot panel toggle, new workspace, snapshot) zou de UX enorm verbeteren.

### 8. ~~Lucid Mode~~ — NIET BOUWEN
Sharpening filter op video. Complete onzin voor Tandem — wij zijn geen media browser. Bestaat, oninteressant, nooit meer over nadenken.

### 9. Paste Protection
Clipboard monitoring voor IBAN/creditcard nummers. Past perfect bij Tandem's security-first aanpak! 

**Implementatie:** Electron `clipboard` module + listener + alert.

### 10. Tab Emojis
Leuke manier om tabs te identificeren. Snel te implementeren, verbetert UX significant.

### 11. Music Player (detachable module)
Opera's music player kan losgemaakt worden als floating module. Tandem's Copilot panel kan ook detachable worden gemaakt als floating widget — voor snellere toegang zonder sidebar te openen.

### 12. Battery Saver
Reduce background tab activity. Relevant voor Tandem — als Copilot tabs in background houdt, kunnen die "sleeping" gemaakt worden om RAM/CPU te besparen.

---

## 🟢 Lage prioriteit — Nice to have

### 13. Tab Snoozing (al in TODO!)
Snoze een tab voor later. Opera heeft het, Tandem TODO heeft het ook al staan.

### 14. Duplicate Tabs Highlighter
Detecteer als je dezelfde URL al open hebt. Trivial te bouwen, nuttiger dan je denkt.

### 15. Tab Emojis
Visuele tabherkenning via emoji. Snel te implementeren.

### 16. Personal News op start page
Tandem's new tab pagina is nu leeg. Een gecureerd nieuwsoverzicht (RSS feeds?) zou het nuttiger maken.

### 17. Save All Tabs as Collection
Sla alle open tabs op als named collection. Opera doet dit in Speed Dial folders. Tandem equivalent: "Research Session opslaan" als named set van URLs.

---

## 💡 ORIGINELE TANDEM IDEEËN geïnspireerd door Opera

### Idee A: "Copilot Workspace"
Speciale workspace voor Copilot's autonomous browsing — gescheiden van Robin's eigen tabs. Copilot opent tabs in zijn eigen workspace, Robin ziet ze maar ze storen zijn workflow niet.

### Idee B: "Flow voor Tandem" — Robin ↔ Kees file sync
Opera's Flow stuurt links/bestanden tussen devices. Tandem equivalent: Robin stuurt een URL naar Kees via de browser chat, Kees pakt hem op en navigeert er naartoe. We hebben al de chat, maar geen "push URL" functie.

### Idee C: Tab Islands voor Copilot Sessions
Alle tabs die Kees opent in een taak-sessie → automatisch in een "island" met de taaknaam. Zo zie je altijd overzichtelijk: "dit zijn Kees' research tabs voor LinkedIn analysis".

### Idee D: Quick Panel in toolbar (Opera-stijl Easy Setup)
Één knop in de toolbar rechtsbovenaan die de meest gebruikte Tandem-functies toont:
- Security shield status + toggle
- Nieuwe workspace
- Screenshot nemen
- Copilot task starten
- Recent notes/links (Flow)

### Idee E: Paste Protection + Clipboard AI
Tandem heeft het security voordeel. Uitbreiden: als Robin iets kopieert dat op een verdachte site staat, clipboard monitoren en waarschuwen. Of: Kees kan clipboard als context gebruiken ("ik zie je hebt dit gekopieerd, wil je dat ik het analyseer?").

---

## CONCLUSIE

Opera is de meest feature-rijke consumer browser en heeft 30 jaar productontwikkeling. De kernlessen voor Tandem:

1. **Tab management is hun sterkste punt** — Tab Islands + Workspaces zijn briljant. Tandem moet dit bouwen.
2. **Sidebar als command center** — Opera's sidebar is informatie-dicht maar overzichtelijk. Tandem heeft dit maar kan het verbeteren (badges, quick panel).
3. **Detachable components** — floating windows (video, music player) zijn enorm nuttig voor productiviteit. Tandem's Copilot panel zou ook detachable moeten zijn.
4. **Security als feature, niet als hinder** — Paste Protection is genius: security die je helpt zonder je te blokkeren. Exact de Tandem filosofie.
5. **Cross-device sync (Flow)** — wij hebben Kees↔Robin communicatie maar geen "push URL/file to device" feature. Dat is een gat.

**Grootste kansen voor Tandem:**
- Visuele Workspaces (UI voor bestaande `/sessions`)
- Tab Islands (automatisch groeperen)
- Video Popout (floating media player)  
- Paste Protection (security win)
- Easy Setup Quick Panel (discoverability)

---

*Rapport gemaakt door Kees — 28 februari 2026*  
*Bronnen: help.opera.com/en/latest/ + opera.com/features*
