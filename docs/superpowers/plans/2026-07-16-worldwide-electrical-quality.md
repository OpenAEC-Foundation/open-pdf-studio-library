# Worldwide Electrical Drawing Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bouw 114 elektrische SVG's voor een wereldwijde kern en zes bestaande marktprofielen met tekstvrije, uniforme en deterministisch gegenereerde geometrie.

**Architecture:** `scripts/electrical-symbols.mjs` bezit het expliciete collectiecontract, classificeert elke bestandsnaam naar een semantisch type en rendert die via kleine geometriefuncties. De bestaande tekenkwaliteitsmodule valideert de gegenereerde elektrische output naast staal en wanden. De bestaande index- en media-builders blijven de enige producenten van afgeleide repositorybestanden.

**Tech Stack:** Node.js ESM, ingebouwde `node:test`, `saxes` via de bestaande SVG-policy, JSON-collectiemetadata en SVG 1.1-geometrie.

## Global Constraints

- Iedere SVG gebruikt `viewBox="0 0 64 64"`.
- Hoofdcontouren gebruiken lijngewicht `1.6`; details `0.8`; hulplijnen `0.7`.
- Symboolgeometrie bevat geen `<text>`; toegankelijke namen staan in `<title>` en `<desc>`.
- Alle expliciete coördinaten blijven tussen 4 en 60.
- De internationale collectie bevat exact 36 symbolen; alle zes collecties samen exact 114.
- Alle zes gewijzigde collecties krijgen versie `1.1.0`.
- De repository kopieert geen betaalde normdatabase en claimt geen volledige normconformiteit.
- Er wordt geen nieuwe runtime- of ontwikkeldependency toegevoegd.

---

### Task 1: Expliciet collectiecontract en semantische classificatie

**Files:**
- Create: `scripts/electrical-symbols.mjs`
- Create: `tests/electrical-symbols.test.mjs`

**Interfaces:**
- Produces: `ELECTRICAL_COLLECTIONS: Record<string, { profile: string, files: string[] }>`.
- Produces: `classifyElectricalSymbol(fileName: string): { kind: string, qualifiers: string[] }`.
- Consumes: de bestaande 98 bestandsnamen plus de zestien nieuwe internationale namen uit de spec.

- [ ] **Step 1: Write the failing collection-contract test**

```js
test('electrical contract contains six collections and 114 unique files', () => {
  assert.equal(Object.keys(ELECTRICAL_COLLECTIONS).length, 6);
  assert.equal(Object.values(ELECTRICAL_COLLECTIONS)
    .reduce((sum, collection) => sum + collection.files.length, 0), 114);
  assert.equal(ELECTRICAL_COLLECTIONS['iec60617-electrical'].files.length, 36);
});
```

- [ ] **Step 2: Run the contract test and observe RED**

Run: `node --test tests/electrical-symbols.test.mjs`
Expected: FAIL met `ERR_MODULE_NOT_FOUND` voor `scripts/electrical-symbols.mjs`.

- [ ] **Step 3: Implement the explicit file contract**

Maak per collectie een alfabetisch gesorteerde array. Voeg aan de bestaande twintig IEC-bestanden exact deze zestien toe:

```js
const IEC_ADDITIONS = [
  'battery.svg', 'circuit-breaker.svg', 'earth.svg', 'emergency-light.svg',
  'fire-alarm-call-point.svg', 'fused-switch.svg', 'generator.svg',
  'heat-detector.svg', 'isolator.svg', 'motor-single-phase.svg',
  'motor-three-phase.svg', 'residual-current-device.svg', 'siren.svg',
  'smoke-detector.svg', 'transformer.svg', 'visual-alarm-device.svg'
];
```

- [ ] **Step 4: Write classification tests for every file**

Loop over alle contractbestanden en eis een niet-lege `kind`. Voeg gerichte assertions toe voor `socket-earthed`, `gfci-receptacle`, `switch-three-way`, `motor-three-phase`, `smoke-detector` en `visual-alarm-device`.

- [ ] **Step 5: Implement classification and verify GREEN**

Gebruik geordende herkenningsregels zodat specifieke varianten vóór generieke termen komen. Voorbeeld:

```js
if (/gfci/.test(stem)) return { kind: 'socket', qualifiers: ['double', 'protected'] };
if (/socket-earthed|wcd-randaarde|outlet-earthed/.test(stem)) {
  return { kind: 'socket', qualifiers: ['single', 'earthed'] };
}
if (/switch-(?:three-way)|switch-3way/.test(stem)) {
  return { kind: 'switch', qualifiers: ['three-way'] };
}
```

Run: `node --test tests/electrical-symbols.test.mjs`
Expected: PASS voor contract en classificatie.

### Task 2: Tekstvrije geometrie-engine

**Files:**
- Modify: `scripts/electrical-symbols.mjs`
- Modify: `tests/electrical-symbols.test.mjs`

**Interfaces:**
- Produces: `renderElectricalSymbol(classification, options): string`.
- `options` bevat `{ profile, title, fileName }`.
- Consumes: uitsluitend classificaties uit Task 1.

- [ ] **Step 1: Write failing renderer-contract tests**

Eis voor iedere classificatie een veilige SVG, de exacte viewBox, geen `<text>`, `stroke-width="1.6"`, `stroke-width="0.8"`, afgeronde lijnuiteinden en coördinaten binnen 4–60.

- [ ] **Step 2: Write failing distinction tests**

```js
assert.notEqual(render('socket-single'), render('socket-earthed'));
assert.notEqual(render('switch-one-way'), render('switch-three-way'));
assert.notEqual(render('motor-single-phase'), render('motor-three-phase'));
```

Controleer daarnaast dat beschermde stopcontacten twee kleine test/reset-markers hebben en driefasenmotoren drie poolmarkeringen.

- [ ] **Step 3: Run focused tests and observe RED**

Run: `node --test tests/electrical-symbols.test.mjs`
Expected: FAIL omdat `renderElectricalSymbol` nog niet bestaat.

- [ ] **Step 4: Implement bounded geometry helpers**

Maak kleine functies met één verantwoordelijkheid:

```js
function circle(cx, cy, r, extra = '') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}"${extra}/>`;
}
function line(x1, y1, x2, y2, extra = '') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${extra}/>`;
}
function detail(body) {
  return `<g stroke-width="0.8">${body}</g>`;
}
```

Gebruik afzonderlijke renderfuncties voor sockets, switches, lighting, boards,
communications, detection/alarm, machines/supplies en overige aansluitpunten.

- [ ] **Step 5: Replace letters and numbers with geometric qualifiers**

- Enkel/dubbel: één of twee contactstrepen.
- Geaard: aardstreep onder het contact.
- Protected/GFCI: twee kleine gevulde test/reset-markers.
- Switch ways: één tot vier contactpunten rond de schakelarm.
- Telecom: telefoonhoorn, antenne, netwerkpoort of coax-ring.
- Eén-/driefase: één of drie korte poolmarkeringen in de motorcirkel.
- Alarmfuncties: rookgolven, temperatuurpunt, luidsprekerboog of flitsstralen.

- [ ] **Step 6: Run focused tests and verify GREEN**

Run: `node --test tests/electrical-symbols.test.mjs`
Expected: alle renderer-, veiligheids- en onderscheidtests slagen.

### Task 3: Deterministische corpusgenerator en CI-gate

**Files:**
- Modify: `scripts/electrical-symbols.mjs`
- Modify: `scripts/drawing-quality.mjs`
- Modify: `tests/electrical-symbols.test.mjs`
- Modify: `tests/drawing-quality.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `generateElectricalSymbols(root): Map<string, string>`.
- Produces: `checkElectricalSymbols(root, expected): string[]`.
- Produces: `validateElectricalDrawing(svg, label): string[]`.

- [ ] **Step 1: Write failing corpus tests**

Eis een map van exact 114 items, aanwezigheid van alle zestien nieuwe IEC-bestanden en nul onbekende of dubbele paden. Test `checkElectricalSymbols` met een tijdelijk ontbrekend en gewijzigd bestand.

- [ ] **Step 2: Implement generation and check modes**

Render ieder contractbestand naar `collections/<id>/symbols/<file>`. Zonder argument schrijft het script alleen afwijkende bestanden en verwijdert het geen bestanden buiten het contract. Met `--check` rapporteert het `missing`, `changed` en `orphaned` voor SVG's in de zes beheerde mappen.

- [ ] **Step 3: Add package commands**

```json
"build-electrical": "node scripts/electrical-symbols.mjs",
"check-electrical": "node scripts/electrical-symbols.mjs --check"
```

- [ ] **Step 4: Write and implement drawing-quality tests**

Breid `validateDrawingQuality` uit met de elektrische map. `validateElectricalDrawing` hergebruikt veilige SVG-, viewBox-, tekst- en coördinaatcontroles en eist lijngewichten `1.6` en `0.8`.

- [ ] **Step 5: Integrate generator consistency into the quality CLI**

Laat `node scripts/drawing-quality.mjs` ook `checkElectricalSymbols` uitvoeren en rapporteer aantallen voor staal, wanden en elektra.

- [ ] **Step 6: Run focused quality tests**

Run: `node --test tests/electrical-symbols.test.mjs tests/drawing-quality.test.mjs`
Expected: PASS met 114 elektrische bestanden in het corpuscontract.

### Task 4: Collectierelease, documentatie en volledige verificatie

**Files:**
- Modify: `collections/{iec60617,nl,us,uk,jp,au}-electrical/collection.json`
- Modify: `collections/{iec60617,nl,us,uk,jp,au}-electrical/symbols/*.svg`
- Modify: `README.md`
- Modify: `MASTERPLAN.md`
- Modify: `docs/data-format.md`
- Modify: `docs/media/*.svg`
- Modify: `index.json`

**Interfaces:**
- Consumes: alle generator- en kwaliteitscommando's uit Task 3.
- Produces: een versieerbare releasebatch met actuele previews en checksums.

- [ ] **Step 1: Generate the electrical source corpus**

Run: `npm run build-electrical`
Expected: 98 bestaande SVG's gewijzigd en 16 nieuwe IEC-SVG's gemaakt.

- [ ] **Step 2: Update collection metadata**

Zet alle zes versies op `1.1.0`. Voeg bij IEC toe:

```json
"standardEdition": "2026 DB",
"references": [{
  "title": "IEC 60617 Database — Graphical symbols for diagrams",
  "url": "https://webstore.iec.ch/en/publication/2723"
}]
```

Beschrijf de collectie als zelf getekende installatiekern en niet als volledige normreproductie.

- [ ] **Step 3: Update public documentation**

README noemt 36 internationale en 78 nationale overlays, de zes profielen en het tekstvrije contract. `MASTERPLAN.md` krijgt dezelfde actuele telling. `docs/data-format.md` documenteert dat semantiek in bestandsnaam/metadata staat en niet in `<text>`.

- [ ] **Step 4: Regenerate derived artifacts**

Run: `npm run build-index` en `npm run build-media`.
Expected: indexchecksums en zes elektrische previews zijn bijgewerkt.

- [ ] **Step 5: Perform a visual render review**

Render `preview-iec60617-electrical.svg`, `preview-us-electrical.svg` en `preview-uk-electrical.svg` headless naar PNG. Controleer sockets, schakelaars, motoren, detectie en labels op afsnijding of semantische verwisseling.

- [ ] **Step 6: Run the complete verification matrix**

Run:

```text
npm test
npm run validate
npm run check-electrical
npm run check-drawings
npm run check-index
npm run check-media
npm run check-versions -- --base main
git diff --check
```

Expected: alle commando's exitcode 0; collectiecontrole meldt zes geldige wijzigingen.

- [ ] **Step 7: Commit, push and monitor CI**

Commit de generator/kwaliteit en de corpusrelease als afzonderlijke commits. Push `codex/library-quality-foundation` en volg de nieuwste `validate`-run tot conclusie `success`.

