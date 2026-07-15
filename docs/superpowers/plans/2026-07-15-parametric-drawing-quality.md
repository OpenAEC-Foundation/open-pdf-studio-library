# Parametric Drawing Quality Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Genereer alle staal- en wandsymbolen deterministisch met correcte verhoudingen, echte afrondingen, hartlijnen en uniforme lijnprofielen.

**Architecture:** `scripts/steel-symbols.mjs` vertaalt catalogusrijen naar een intern sectiemodel en rendert doorsneden en aanzichten. `scripts/wall-symbols.mjs` rendert wandpatronen uit bestandsnamen en één tekenprofiel. `scripts/drawing-quality.mjs` controleert de resulterende corpusregels en beide generators ondersteunen een schrijvende en een read-only checkmodus.

**Tech Stack:** Node.js ESM, ingebouwde `node:test`, bestaande SVG-policy en bestaande JSON-catalogi.

## Global Constraints

- Alle SVG's houden `viewBox="0 0 64 64"`.
- Gegenereerde geometrie bevat geen `<text>`.
- Catalogusmaten blijven in millimeters en worden alleen voor weergave uniform geschaald.
- Een fallback-aanzicht gebruikt een voorbeeldlengte van exact `4 * h`.
- Geen nieuwe runtime-dependency toevoegen.
- Gewijzigde collecties krijgen een minor-versiebump.

---

### Task 1: Staalgeometrie-engine

**Files:**
- Create: `scripts/steel-symbols.mjs`
- Create: `tests/steel-symbols.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: `parametric.json` met `families[].columns`, `defaultSize` en `sizes`.
- Produces: `rowToSection(family)`, `renderSteelSection(section, options)`, `renderSteelElevation(section, options)`, `generateSteelSymbols(root)` en `checkSteelSymbols(root, expected)`.

- [ ] **Step 1: Write the failing tests**

  Test dat HEA 200 als I-profiel wordt gelezen, dat de doorsnede `A`-boogcommando's en twee hartlijnen bevat, dat geen `<text>` voorkomt en dat een aanzicht de verhouding `length / h = 4` gebruikt.

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test tests/steel-symbols.test.mjs`
  Expected: FAIL omdat `scripts/steel-symbols.mjs` nog niet bestaat.

- [ ] **Step 3: Implement the steel renderer**

  Bouw sectiemodellen voor `i`, `u`, `tee`, `angle`, `box`, `pipe` en `plate`; schaal elk model met zes units marge; render wortelstralen met `A`; render hartlijnen met het gedeelde streep-puntpatroon; map elk bestaand staalbestand op een catalogusfamilie of een expliciete canonieke fallbackvorm.

- [ ] **Step 4: Add deterministic write/check commands**

  Voeg `build-steel` en `check-steel` toe aan `package.json`. Zonder `--check` worden alleen afwijkende SVG's geschreven; met `--check` resulteert iedere afwijking in exitcode 1.

- [ ] **Step 5: Run the focused tests**

  Run: `node --test tests/steel-symbols.test.mjs`
  Expected: PASS.

### Task 2: Wandgeometrie-engine

**Files:**
- Create: `scripts/wall-symbols.mjs`
- Create: `tests/wall-symbols.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `classifyWallSymbol(fileName)`, `renderWallSymbol(kind)`, `generateWallSymbols(root)` en `checkWallSymbols(root, expected)`.

- [ ] **Step 1: Write the failing tests**

  Test classificatie van massief beton, metselwerk, cellenbeton, houten en metalen stijlwanden, schachten, brandwanden en spouwmuren. Eis tekstvrije output, vaste viewBox en begrensde hatchcoördinaten.

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test tests/wall-symbols.test.mjs`
  Expected: FAIL omdat `scripts/wall-symbols.mjs` nog niet bestaat.

- [ ] **Step 3: Implement the wall renderer**

  Gebruik contourdikte `1.6`, hatchdikte `0.75` en hulplijndikte `0.7`. Maak afzonderlijke deterministische patronen voor alle geteste klassen en behoud alle bestaande bestandsnamen.

- [ ] **Step 4: Add deterministic write/check commands**

  Voeg `build-walls` en `check-walls` toe aan `package.json` en laat beide modi dezelfde in-memory outputmap gebruiken.

- [ ] **Step 5: Run the focused tests**

  Run: `node --test tests/wall-symbols.test.mjs`
  Expected: PASS.

### Task 3: Corpuskwaliteitsgate

**Files:**
- Create: `scripts/drawing-quality.mjs`
- Create: `tests/drawing-quality.test.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/validate.yml`

**Interfaces:**
- Consumes: alle gegenereerde staal- en wand-SVG's en `validateSvgPolicy(svg, label)`.
- Produces: `validateDrawingQuality(root)` met een lijst concrete fouten en het commando `npm run check-drawings`.

- [ ] **Step 1: Write the failing tests**

  Test afwijzing van tekst, verkeerde viewBox, ontbrekende afronding en hartlijnen buiten het tekenvlak; test de echte repository op nul fouten nadat de generators draaien.

- [ ] **Step 2: Run test to verify it fails**

  Run: `node --test tests/drawing-quality.test.mjs`
  Expected: FAIL omdat de kwaliteitsmodule ontbreekt.

- [ ] **Step 3: Implement the quality checks**

  Valideer veilige SVG, tekstvrij staal/wand, viewBox, twee begrensde staalhartlijnen en boogcommando's voor afgeronde profielvormen. Laat `check-drawings` eerst generatorconsistentie en daarna corpuskwaliteit uitvoeren.

- [ ] **Step 4: Add the CI gate**

  Voeg `npm run check-drawings` na de bestaande SVG-validatie toe aan `.github/workflows/validate.yml`.

- [ ] **Step 5: Run the focused tests**

  Run: `node --test tests/drawing-quality.test.mjs`
  Expected: PASS.

### Task 4: Regeneratie, versies en documentatie

**Files:**
- Modify: `collections/*-steel-*/symbols/*.svg`
- Modify: `collections/*-steel-*/collection.json`
- Modify: `collections/{nl,us,de,uk}-wall-types/symbols/*.svg`
- Modify: `collections/{nl,us,de,uk}-wall-types/collection.json`
- Modify: `README.md`
- Modify: `docs/media/*.svg`
- Modify: `index.json`

**Interfaces:**
- Consumes: de generators en bestaande index/media-builders.
- Produces: een volledig geregenereerde, versieerbare releasebatch.

- [ ] **Step 1: Generate source SVGs**

  Run: `npm run build-steel` en `npm run build-walls`.
  Expected: alle 155 staal-SVG's en alle wand-SVG's zijn deterministisch bijgewerkt.

- [ ] **Step 2: Bump collection versions**

  Verhoog `1.4.0` naar `1.5.0` en `1.1.0` naar `1.2.0` voor staal; verhoog `1.0.0` naar `1.1.0` voor de vier wandsets.

- [ ] **Step 3: Document the drawing contract**

  Beschrijf in `README.md` dat staalfallbacks uit echte catalogusmaten komen, dat aanzichten een gedocumenteerde 4h-voorbeeldlengte gebruiken en dat labels buiten de SVG-geometrie blijven.

- [ ] **Step 4: Regenerate derived artifacts**

  Run: `npm run build-index` en `npm run build-media`.
  Expected: checksums en alle collectiepreviews volgen de nieuwe bron-SVG's.

- [ ] **Step 5: Run complete verification**

  Run: `npm test`, `npm run validate`, `npm run check-steel`, `npm run check-walls`, `npm run check-drawings`, `npm run check-index`, `npm run check-media`, `npm run check-versions -- --base main` en `git diff --check`.
  Expected: alle commando's slagen zonder waarschuwingen over gewijzigde gegenereerde bestanden.

