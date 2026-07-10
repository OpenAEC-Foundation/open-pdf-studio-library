# Wereldwijde Library — Masterplan + Repo-skelet — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deze repo omvormen tot de wereldwijde content-bibliotheek voor Open PDF Studio: MASTERPLAN.md, JSON-schema's, collecties + land-manifesten (NL + VS als eerste), validatie/index-tooling en CI.

**Architecture:** Content leeft één keer als *collectie* (`collections/<id>/`), land-manifesten (`countries/<iso2>.json`) stellen per sector geconsolideerde pakketten samen, en een gegenereerde `index.json` is het enige bestand dat de app ophaalt. Node-scripts (ajv-validatie + deterministische index-build) bewaken de integriteit; CI draait beide.

**Tech Stack:** Node.js (ESM, `node:test`), ajv (JSON Schema draft-07), GitHub Actions. Geen andere dependencies.

**Spec:** `docs/superpowers/specs/2026-07-10-worldwide-library-masterplan-design.md`

**Werkbranch:** `library-masterplan` (bestaat al).

**HARDE REGEL (uit gebruikersinstructies):** nergens in repo-content (code, docs, commits) namen van externe rekensoftware/concurrent-producten noemen. Normnamen (NEN, ISO, DIN, NFPA, BS, AISC, …) zijn wél toegestaan. Geen chat-/conversatiegeschiedenis toevoegen.

---

### Task 1: Project-tooling (package.json, .gitignore, ajv)

**Files:**
- Create: `.gitignore`
- Create: `package.json` (via npm)

- [ ] **Step 1: Schrijf `.gitignore`**

```gitignore
node_modules/
```

- [ ] **Step 2: Initialiseer npm en installeer ajv**

Run (in repo-root):
```bash
npm init -y
npm install --save-dev ajv
```
Expected: `package.json`, `package-lock.json` en `node_modules/` verschijnen.

- [ ] **Step 3: Zet package.json goed**

Vervang de inhoud van `package.json` door:

```json
{
  "name": "open-pdf-studio-library",
  "version": "0.1.0",
  "description": "Worldwide symbol, stamp and template library for Open PDF Studio",
  "type": "module",
  "private": true,
  "scripts": {
    "test": "node --test tests/",
    "validate": "node scripts/validate.mjs",
    "build-index": "node scripts/build-index.mjs",
    "check-index": "node scripts/build-index.mjs --check"
  },
  "devDependencies": {
    "ajv": "^8.17.1"
  }
}
```

(Behoud de exacte ajv-versie die npm installeerde als die nieuwer is.)

- [ ] **Step 4: Commit**

```bash
git add .gitignore package.json package-lock.json
git commit -m "chore: add npm tooling with ajv for schema validation"
```

---

### Task 2: JSON-schema's

**Files:**
- Create: `schema/collection.schema.json`
- Create: `schema/country.schema.json`
- Create: `schema/index.schema.json`

- [ ] **Step 1: Schrijf `schema/collection.schema.json`**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Open PDF Studio Library collection",
  "type": "object",
  "additionalProperties": false,
  "required": ["id", "name", "sector", "types", "scope", "status", "version", "license"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z0-9][a-z0-9-]{1,63}$" },
    "name": {
      "type": "object",
      "required": ["en"],
      "additionalProperties": { "type": "string" }
    },
    "description": {
      "type": "object",
      "additionalProperties": { "type": "string" }
    },
    "sector": { "enum": ["aec", "mep", "electrical", "process", "infra"] },
    "types": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": { "enum": ["symbols", "parametric", "stamps", "hatches", "legends"] }
    },
    "standard": { "type": "string" },
    "scope": { "enum": ["international", "regional", "national"] },
    "status": { "enum": ["available", "planned"] },
    "version": { "type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$" },
    "license": { "type": "string" }
  }
}
```

- [ ] **Step 2: Schrijf `schema/country.schema.json`**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Open PDF Studio Library country manifest",
  "type": "object",
  "additionalProperties": false,
  "required": ["id", "name", "flag", "region", "wave", "sectors"],
  "properties": {
    "id": { "type": "string", "pattern": "^[a-z]{2}$" },
    "name": {
      "type": "object",
      "required": ["en"],
      "additionalProperties": { "type": "string" }
    },
    "flag": { "type": "string", "minLength": 1 },
    "region": { "enum": ["europe", "north-america", "south-america", "middle-east", "africa", "asia", "oceania"] },
    "wave": { "type": "integer", "minimum": 1, "maximum": 9 },
    "sectors": {
      "type": "object",
      "minProperties": 1,
      "propertyNames": { "enum": ["aec", "mep", "electrical", "process", "infra"] },
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "required": ["collections"],
        "properties": {
          "collections": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true,
            "items": { "type": "string" }
          }
        }
      }
    }
  }
}
```

- [ ] **Step 3: Schrijf `schema/index.schema.json`**

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Open PDF Studio Library world index (generated file — do not edit by hand)",
  "type": "object",
  "additionalProperties": false,
  "required": ["formatVersion", "regions", "collections"],
  "properties": {
    "formatVersion": { "const": 1 },
    "regions": {
      "type": "array",
      "items": {
        "type": "object",
        "additionalProperties": false,
        "required": ["id", "countries"],
        "properties": {
          "id": { "type": "string" },
          "countries": {
            "type": "array",
            "items": {
              "type": "object",
              "additionalProperties": false,
              "required": ["id", "name", "flag", "wave", "sectors"],
              "properties": {
                "id": { "type": "string" },
                "name": { "type": "object" },
                "flag": { "type": "string" },
                "wave": { "type": "integer" },
                "sectors": { "type": "object" }
              }
            }
          }
        }
      }
    },
    "collections": {
      "type": "object",
      "additionalProperties": {
        "type": "object",
        "additionalProperties": false,
        "required": ["name", "sector", "types", "scope", "status", "version", "path"],
        "properties": {
          "name": { "type": "object" },
          "sector": { "type": "string" },
          "types": { "type": "array" },
          "scope": { "type": "string" },
          "status": { "type": "string" },
          "version": { "type": "string" },
          "path": { "type": "string" },
          "standard": { "type": "string" },
          "symbolCount": { "type": "integer" }
        }
      }
    }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add schema/
git commit -m "feat: add JSON schemas for collections, countries and world index"
```

---

### Task 3: Validatiescript (TDD)

**Files:**
- Test: `tests/validate.test.mjs`
- Create: `scripts/validate.mjs`

- [ ] **Step 1: Schrijf de failing tests**

`tests/validate.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCollectionJson, validateCountryJson, validateSvg } from '../scripts/validate.mjs';

const goodCollection = {
  id: 'test-set',
  name: { en: 'Test set' },
  sector: 'aec',
  types: ['symbols'],
  scope: 'international',
  status: 'planned',
  version: '0.1.0',
  license: 'repository'
};

const goodCountry = {
  id: 'nl',
  name: { en: 'Netherlands', nl: 'Nederland' },
  flag: '🇳🇱',
  region: 'europe',
  wave: 1,
  sectors: { aec: { collections: ['test-set'] } }
};

test('valid collection passes', () => {
  assert.deepEqual(validateCollectionJson(goodCollection, 'test-set'), []);
});

test('collection id must match directory name', () => {
  assert.ok(validateCollectionJson(goodCollection, 'other-dir').length > 0);
});

test('collection with unknown sector is rejected', () => {
  assert.ok(validateCollectionJson({ ...goodCollection, sector: 'nope' }, 'test-set').length > 0);
});

test('collection without english name is rejected', () => {
  assert.ok(validateCollectionJson({ ...goodCollection, name: { nl: 'Testset' } }, 'test-set').length > 0);
});

test('valid country passes', () => {
  assert.deepEqual(validateCountryJson(goodCountry, 'nl', new Set(['test-set'])), []);
});

test('country id must match file name', () => {
  assert.ok(validateCountryJson(goodCountry, 'us', new Set(['test-set'])).length > 0);
});

test('country referencing unknown collection is rejected', () => {
  assert.ok(validateCountryJson(goodCountry, 'nl', new Set()).length > 0);
});

test('valid svg passes (xmlns http is allowed)', () => {
  const svg = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="2"><circle cx="32" cy="32" r="20"/></svg>';
  assert.deepEqual(validateSvg(svg, 'a.svg'), []);
});

test('svg without 64x64 viewBox is rejected', () => {
  const svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20"/></svg>';
  assert.ok(validateSvg(svg, 'a.svg').length > 0);
});

test('svg with external href is rejected', () => {
  const svg = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/x.png"/></svg>';
  assert.ok(validateSvg(svg, 'a.svg').length > 0);
});

test('svg with script tag is rejected', () => {
  const svg = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
  assert.ok(validateSvg(svg, 'a.svg').length > 0);
});
```

- [ ] **Step 2: Run tests, verifieer dat ze falen**

Run: `node --test tests/`
Expected: FAIL — `Cannot find module '.../scripts/validate.mjs'`

- [ ] **Step 3: Implementeer `scripts/validate.mjs`**

```js
// Validatie van alle library-content: schema's, kruisverwijzingen en SVG-sanity.
// Gebruik: node scripts/validate.mjs   (exit 1 bij fouten)
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// Content-bestanden die een collectie met status "available" per type moet hebben.
const TYPE_FILES = {
  parametric: 'parametric.json',
  stamps: 'stamps.json',
  hatches: 'hatches.json',
  legends: 'legends.json'
};

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const ajv = new Ajv({ allErrors: true });
const collectionSchema = ajv.compile(loadJson(join(ROOT, 'schema', 'collection.schema.json')));
const countrySchema = ajv.compile(loadJson(join(ROOT, 'schema', 'country.schema.json')));

function schemaErrors(validate, data, label) {
  if (validate(data)) return [];
  return validate.errors.map(e => `${label}: ${e.instancePath || '(root)'} ${e.message}`);
}

export function validateCollectionJson(data, dirName) {
  const errors = schemaErrors(collectionSchema, data, dirName);
  if (!errors.length && data.id !== dirName) {
    errors.push(`${dirName}: id "${data.id}" komt niet overeen met de mapnaam`);
  }
  return errors;
}

export function validateCountryJson(data, fileBase, collectionIds) {
  const errors = schemaErrors(countrySchema, data, fileBase);
  if (errors.length) return errors;
  if (data.id !== fileBase) {
    errors.push(`${fileBase}: id "${data.id}" komt niet overeen met de bestandsnaam`);
  }
  for (const [sector, def] of Object.entries(data.sectors)) {
    for (const ref of def.collections) {
      if (!collectionIds.has(ref)) {
        errors.push(`${fileBase}: sector "${sector}" verwijst naar onbekende collectie "${ref}"`);
      }
    }
  }
  return errors;
}

export function validateSvg(svg, label) {
  const errors = [];
  if (!svg.includes('<svg')) errors.push(`${label}: geen <svg>-element`);
  if (!/viewBox="0 0 64 64"/.test(svg)) errors.push(`${label}: viewBox moet "0 0 64 64" zijn`);
  // Externe verwijzingen: href/src-attributen of css url() naar http(s).
  // Het xmlns-attribuut bevat legitiem "http://www.w3.org/..." en blijft toegestaan.
  if (/(href|src)\s*=\s*["']https?:/i.test(svg) || /url\(\s*["']?https?:/i.test(svg)) {
    errors.push(`${label}: externe verwijzing niet toegestaan`);
  }
  if (/<script/i.test(svg)) errors.push(`${label}: <script> niet toegestaan`);
  return errors;
}

export function runAll(root = ROOT) {
  const errors = [];
  const collectionIds = new Set();

  const collectionsDir = join(root, 'collections');
  if (existsSync(collectionsDir)) {
    for (const dir of readdirSync(collectionsDir).sort()) {
      const jsonPath = join(collectionsDir, dir, 'collection.json');
      if (!existsSync(jsonPath)) {
        errors.push(`${dir}: collection.json ontbreekt`);
        continue;
      }
      let data;
      try {
        data = loadJson(jsonPath);
      } catch (e) {
        errors.push(`${dir}/collection.json: ongeldige JSON — ${e.message}`);
        continue;
      }
      errors.push(...validateCollectionJson(data, dir));
      collectionIds.add(data.id);

      if (data.status === 'available' && Array.isArray(data.types)) {
        if (data.types.includes('symbols')) {
          const symDir = join(collectionsDir, dir, 'symbols');
          const svgs = existsSync(symDir) ? readdirSync(symDir).filter(f => f.endsWith('.svg')) : [];
          if (!svgs.length) {
            errors.push(`${dir}: status "available" met type "symbols" maar geen symbols/*.svg`);
          }
          for (const f of svgs) {
            errors.push(...validateSvg(readFileSync(join(symDir, f), 'utf8'), `${dir}/symbols/${f}`));
          }
        }
        for (const [type, file] of Object.entries(TYPE_FILES)) {
          if (data.types.includes(type) && !existsSync(join(collectionsDir, dir, file))) {
            errors.push(`${dir}: status "available" met type "${type}" maar ${file} ontbreekt`);
          }
        }
      }
    }
  }

  const countriesDir = join(root, 'countries');
  if (existsSync(countriesDir)) {
    for (const f of readdirSync(countriesDir).filter(f => f.endsWith('.json')).sort()) {
      const fileBase = f.replace(/\.json$/, '');
      let data;
      try {
        data = loadJson(join(countriesDir, f));
      } catch (e) {
        errors.push(`countries/${f}: ongeldige JSON — ${e.message}`);
        continue;
      }
      errors.push(...validateCountryJson(data, fileBase, collectionIds));
    }
  }

  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const errors = runAll();
  if (errors.length) {
    for (const e of errors) console.error('FOUT: ' + e);
    console.error(`\n${errors.length} fout(en) gevonden.`);
    process.exit(1);
  }
  console.log('Validatie OK');
}
```

- [ ] **Step 4: Run tests, verifieer dat ze slagen**

Run: `node --test tests/`
Expected: alle tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate.mjs tests/validate.test.mjs
git commit -m "feat: add content validator (schemas, cross-refs, svg sanity)"
```

---

### Task 4: Index-builder (TDD)

**Files:**
- Test: `tests/build-index.test.mjs`
- Create: `scripts/build-index.mjs`

- [ ] **Step 1: Schrijf de failing tests**

`tests/build-index.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIndex } from '../scripts/build-index.mjs';

const collections = [
  {
    id: 'zz-set',
    name: { en: 'ZZ set' },
    sector: 'aec',
    types: ['symbols'],
    scope: 'national',
    status: 'planned',
    version: '0.1.0',
    license: 'repository'
  },
  {
    id: 'aa-set',
    name: { en: 'AA set' },
    sector: 'aec',
    types: ['symbols'],
    standard: 'ISO 7010',
    scope: 'international',
    status: 'available',
    version: '1.0.0',
    license: 'repository',
    symbolCount: 4
  }
];

const countries = [
  {
    id: 'us',
    name: { en: 'United States' },
    flag: '🇺🇸',
    region: 'north-america',
    wave: 1,
    sectors: { aec: { collections: ['aa-set'] } }
  },
  {
    id: 'nl',
    name: { en: 'Netherlands', nl: 'Nederland' },
    flag: '🇳🇱',
    region: 'europe',
    wave: 1,
    sectors: { aec: { collections: ['aa-set', 'zz-set'] } }
  }
];

test('index groups countries by region, europe first', () => {
  const idx = buildIndex(countries, collections);
  assert.equal(idx.formatVersion, 1);
  assert.deepEqual(idx.regions.map(r => r.id), ['europe', 'north-america']);
  assert.equal(idx.regions[0].countries[0].id, 'nl');
});

test('collections map is sorted and carries path + metadata', () => {
  const idx = buildIndex(countries, collections);
  assert.deepEqual(Object.keys(idx.collections), ['aa-set', 'zz-set']);
  assert.equal(idx.collections['aa-set'].path, 'collections/aa-set/');
  assert.equal(idx.collections['aa-set'].standard, 'ISO 7010');
  assert.equal(idx.collections['aa-set'].symbolCount, 4);
  assert.equal(idx.collections['zz-set'].standard, undefined);
});

test('output is deterministic for same input', () => {
  const a = JSON.stringify(buildIndex(countries, collections));
  const b = JSON.stringify(buildIndex([...countries].reverse(), [...collections].reverse()));
  assert.equal(a, b);
});
```

- [ ] **Step 2: Run tests, verifieer dat de nieuwe falen**

Run: `node --test tests/`
Expected: FAIL — `Cannot find module '.../scripts/build-index.mjs'` (validate-tests blijven groen).

- [ ] **Step 3: Implementeer `scripts/build-index.mjs`**

```js
// Genereert index.json: de wereldindex (regio's → landen → sectoren → collecties)
// die de app als enige bestand ophaalt. Deterministisch: zelfde input → zelfde output.
// Gebruik: node scripts/build-index.mjs [--check]
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REGION_ORDER = ['europe', 'north-america', 'south-america', 'middle-east', 'africa', 'asia', 'oceania'];

export function buildIndex(countries, collections) {
  const collMap = {};
  for (const c of [...collections].sort((a, b) => a.id.localeCompare(b.id))) {
    collMap[c.id] = {
      name: c.name,
      sector: c.sector,
      types: c.types,
      scope: c.scope,
      status: c.status,
      version: c.version,
      path: `collections/${c.id}/`,
      ...(c.standard ? { standard: c.standard } : {}),
      ...(c.symbolCount ? { symbolCount: c.symbolCount } : {})
    };
  }

  const regions = [];
  for (const regionId of REGION_ORDER) {
    const inRegion = countries
      .filter(c => c.region === regionId)
      .sort((a, b) => a.id.localeCompare(b.id));
    if (!inRegion.length) continue;
    regions.push({
      id: regionId,
      countries: inRegion.map(c => ({
        id: c.id,
        name: c.name,
        flag: c.flag,
        wave: c.wave,
        sectors: c.sectors
      }))
    });
  }

  return { formatVersion: 1, regions, collections: collMap };
}

export function loadData(root = ROOT) {
  const collections = [];
  const collectionsDir = join(root, 'collections');
  if (existsSync(collectionsDir)) {
    for (const dir of readdirSync(collectionsDir).sort()) {
      const p = join(collectionsDir, dir, 'collection.json');
      if (!existsSync(p)) continue;
      const data = JSON.parse(readFileSync(p, 'utf8'));
      const symDir = join(collectionsDir, dir, 'symbols');
      if (existsSync(symDir)) {
        const n = readdirSync(symDir).filter(f => f.endsWith('.svg')).length;
        if (n) data.symbolCount = n;
      }
      collections.push(data);
    }
  }
  const countries = [];
  const countriesDir = join(root, 'countries');
  if (existsSync(countriesDir)) {
    for (const f of readdirSync(countriesDir).filter(f => f.endsWith('.json')).sort()) {
      countries.push(JSON.parse(readFileSync(join(countriesDir, f), 'utf8')));
    }
  }
  return { countries, collections };
}

function main() {
  const { countries, collections } = loadData();
  const json = JSON.stringify(buildIndex(countries, collections), null, 2) + '\n';
  const outPath = join(ROOT, 'index.json');
  if (process.argv.includes('--check')) {
    const current = existsSync(outPath) ? readFileSync(outPath, 'utf8') : '';
    if (current !== json) {
      console.error('index.json is niet actueel — draai: node scripts/build-index.mjs');
      process.exit(1);
    }
    console.log('index.json actueel');
    return;
  }
  writeFileSync(outPath, json);
  console.log('index.json geschreven');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run tests, verifieer dat alles slaagt**

Run: `node --test tests/`
Expected: alle tests PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/build-index.mjs tests/build-index.test.mjs
git commit -m "feat: add deterministic world-index builder"
```

---

### Task 5: Seed-collecties

**Files:**
- Create: `collections/common-north-arrows/collection.json`
- Create: `collections/common-north-arrows/symbols/north-arrow-classic.svg`
- Create: `collections/common-north-arrows/symbols/north-arrow-simple.svg`
- Create: `collections/common-north-arrows/symbols/north-arrow-circled.svg`
- Create: `collections/common-north-arrows/symbols/north-arrow-quartered.svg`
- Create: `collections/<id>/collection.json` voor de 10 geplande collecties uit de tabel in Step 3.

- [ ] **Step 1: Schrijf `collections/common-north-arrows/collection.json`**

```json
{
  "id": "common-north-arrows",
  "name": { "en": "North arrows", "nl": "Noordpijlen" },
  "description": {
    "en": "Universal north arrow symbols for site plans and floor plans.",
    "nl": "Universele noordpijlen voor situatietekeningen en plattegronden."
  },
  "sector": "aec",
  "types": ["symbols"],
  "scope": "international",
  "status": "available",
  "version": "1.0.0",
  "license": "repository"
}
```

- [ ] **Step 2: Schrijf de vier SVG's**

`collections/common-north-arrows/symbols/north-arrow-classic.svg`:
```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="2"><path d="M32 6 L44 50 L32 42 Z" fill="#000" stroke="none"/><path d="M32 6 L20 50 L32 42 Z" fill="none"/><text x="32" y="62" font-size="12" font-weight="bold" text-anchor="middle" fill="#000" stroke="none">N</text></svg>
```

`collections/common-north-arrows/symbols/north-arrow-simple.svg`:
```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="2"><line x1="32" y1="56" x2="32" y2="14"/><path d="M24 22 L32 6 L40 22 Z" fill="#000" stroke="none"/><text x="44" y="16" font-size="12" font-weight="bold" text-anchor="middle" fill="#000" stroke="none">N</text></svg>
```

`collections/common-north-arrows/symbols/north-arrow-circled.svg`:
```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="2"><circle cx="32" cy="36" r="20"/><path d="M32 20 L38 44 L32 39 L26 44 Z" fill="#000" stroke="none"/><text x="32" y="12" font-size="12" font-weight="bold" text-anchor="middle" fill="#000" stroke="none">N</text></svg>
```

`collections/common-north-arrows/symbols/north-arrow-quartered.svg`:
```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="2"><circle cx="32" cy="36" r="20"/><line x1="12" y1="36" x2="52" y2="36"/><line x1="32" y1="16" x2="32" y2="56"/><path d="M32 16 L37 36 L32 36 Z" fill="#000" stroke="none"/><path d="M32 16 L27 36 L32 36 Z" fill="none"/><text x="32" y="11" font-size="12" font-weight="bold" text-anchor="middle" fill="#000" stroke="none">N</text></svg>
```

- [ ] **Step 3: Schrijf de 10 geplande collection.json's**

Voor elke rij hieronder: maak `collections/<id>/collection.json` met exact deze velden, plus altijd `"status": "planned"`, `"version": "0.1.0"`, `"license": "repository"`, `"sector": "aec"`.

| id | name.en | name.nl | types | standard | scope |
|---|---|---|---|---|---|
| `iso7010-safety` | Safety signs (ISO 7010) | Veiligheidssignalering (ISO 7010) | `["symbols"]` | `ISO 7010` | `international` |
| `en-steel-profiles` | European steel profiles | Europese staalprofielen | `["parametric"]` | `EN 10365` | `regional` |
| `common-material-hatches` | Material hatch patterns | Materiaal-arceringen | `["hatches", "legends"]` | *(geen standard-veld)* | `international` |
| `nen1414-fire` | Fire safety drawing symbols (NEN 1414) | Brandveiligheidssymbolen (NEN 1414) | `["symbols"]` | `NEN 1414` | `national` |
| `nl-drafting-parametric` | Dutch drafting components | Nederlandse tekenwerk-componenten | `["parametric"]` | *(geen)* | `national` |
| `nl-stamps` | Dutch approval stamps | Nederlandse stempels | `["stamps"]` | *(geen)* | `national` |
| `nfpa170-fire` | Fire safety symbols (NFPA 170) | Brandveiligheidssymbolen (NFPA 170) | `["symbols"]` | `NFPA 170` | `national` |
| `aisc-steel-shapes` | US steel shapes (AISC) | Amerikaanse staalprofielen (AISC) | `["parametric"]` | `AISC` | `national` |
| `us-stamps` | US approval stamps | Amerikaanse stempels | `["stamps"]` | *(geen)* | `national` |
| `us-drafting-parametric` | US drafting components | Amerikaanse tekenwerk-componenten | `["parametric"]` | *(geen)* | `national` |

Voorbeeld (volledig) voor `collections/nfpa170-fire/collection.json` — de andere negen volgen hetzelfde patroon met de waarden uit de tabel:

```json
{
  "id": "nfpa170-fire",
  "name": {
    "en": "Fire safety symbols (NFPA 170)",
    "nl": "Brandveiligheidssymbolen (NFPA 170)"
  },
  "sector": "aec",
  "types": ["symbols"],
  "standard": "NFPA 170",
  "scope": "national",
  "status": "planned",
  "version": "0.1.0",
  "license": "repository"
}
```

- [ ] **Step 4: Valideer**

Run: `node scripts/validate.mjs`
Expected: `Validatie OK`

- [ ] **Step 5: Commit**

```bash
git add collections/
git commit -m "feat: seed collections (north arrows available, 10 planned)"
```

---

### Task 6: Land-manifesten NL + VS

**Files:**
- Create: `countries/nl.json`
- Create: `countries/us.json`

- [ ] **Step 1: Schrijf `countries/nl.json`**

```json
{
  "id": "nl",
  "name": { "en": "Netherlands", "nl": "Nederland" },
  "flag": "🇳🇱",
  "region": "europe",
  "wave": 1,
  "sectors": {
    "aec": {
      "collections": [
        "nen1414-fire",
        "iso7010-safety",
        "nl-drafting-parametric",
        "nl-stamps",
        "en-steel-profiles",
        "common-material-hatches",
        "common-north-arrows"
      ]
    }
  }
}
```

- [ ] **Step 2: Schrijf `countries/us.json`**

```json
{
  "id": "us",
  "name": { "en": "United States", "nl": "Verenigde Staten" },
  "flag": "🇺🇸",
  "region": "north-america",
  "wave": 1,
  "sectors": {
    "aec": {
      "collections": [
        "nfpa170-fire",
        "us-drafting-parametric",
        "us-stamps",
        "aisc-steel-shapes",
        "common-material-hatches",
        "common-north-arrows"
      ]
    }
  }
}
```

- [ ] **Step 3: Valideer**

Run: `node scripts/validate.mjs`
Expected: `Validatie OK`

- [ ] **Step 4: Commit**

```bash
git add countries/
git commit -m "feat: add country manifests for nl and us"
```

---

### Task 7: index.json genereren + integratietest

**Files:**
- Create: `index.json` (gegenereerd)
- Test: `tests/repo-integrity.test.mjs`

- [ ] **Step 1: Schrijf de integratietest**

`tests/repo-integrity.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAll } from '../scripts/validate.mjs';
import { buildIndex, loadData } from '../scripts/build-index.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('repo content validates clean', () => {
  assert.deepEqual(runAll(ROOT), []);
});

test('index.json exists and matches generated output', () => {
  assert.ok(existsSync(join(ROOT, 'index.json')), 'index.json ontbreekt — draai build-index');
  const { countries, collections } = loadData(ROOT);
  const expected = JSON.stringify(buildIndex(countries, collections), null, 2) + '\n';
  assert.equal(readFileSync(join(ROOT, 'index.json'), 'utf8'), expected);
});
```

- [ ] **Step 2: Run tests, verifieer dat de index-test faalt**

Run: `node --test tests/`
Expected: `index.json exists...` FAIL (bestand ontbreekt nog); de rest PASS.

- [ ] **Step 3: Genereer de index**

Run: `node scripts/build-index.mjs`
Expected: `index.json geschreven`

- [ ] **Step 4: Run alle tests, verifieer groen**

Run: `node --test tests/`
Expected: alle tests PASS.

- [ ] **Step 5: Commit**

```bash
git add index.json tests/repo-integrity.test.mjs
git commit -m "feat: generate world index and add repo-integrity test"
```

---

### Task 8: MASTERPLAN.md

**Files:**
- Create: `MASTERPLAN.md`

- [ ] **Step 1: Schrijf `MASTERPLAN.md` met exact deze inhoud**

````markdown
# MASTERPLAN — Wereldwijde bibliotheken voor Open PDF Studio

> Status: levend document. Laatste herziening: 2026-07-10.

## 1. Visie

Elke gebruiker van Open PDF Studio kiest **regio → land → sector** en krijgt
een compleet, lokaal correct bibliotheekpakket: symbolen volgens de normen van
dat land, parametrische componenten met lokale profielen en notaties, stempels
in de eigen taal en arceringen/legenda's volgens de lokale tekenstandaard.

Fase 1 is de sector **AEC (bouw)**, wereldwijd, grote markten eerst. Overige
sectoren volgen daarna (hoofdstuk 9).

## 2. Hoe het werkt

- **Collectie** = content-eenheid, leeft één keer in `collections/<id>/`.
  Gedeelde normen (ISO/EN) worden over tientallen landen hergebruikt.
- **Land-manifest** = `countries/<iso2>.json`, stelt per sector een
  geconsolideerd pakket samen uit collecties.
- **Wereldindex** = `index.json` (gegenereerd), het enige bestand dat de app
  ophaalt; collecties worden on-demand gedownload.

Formaat en tekenrichtlijnen: zie `docs/data-format.md`.

## 3. Wave-overzicht

| Wave | Landen | Rationale |
|---|---|---|
| 1 | 🇺🇸 VS · 🇳🇱 NL · 🇩🇪 DE · 🇬🇧 VK | VS: hoog gebruik in statistieken. NL: bestaande content, referentie-land. DE/VK: grootste Europese bouwmarkten. |
| 2 | 🇫🇷 FR · 🇮🇹 IT · 🇪🇸 ES · 🇵🇱 PL · 🇧🇪 BE · 🇦🇹 AT · 🇨🇭 CH · 🇸🇪 SE · 🇳🇴 NO · 🇩🇰 DK · 🇫🇮 FI | Grote/middelgrote EU-markten; hoog hergebruik van de EN/ISO-laag. |
| 3 | 🇵🇹 PT · 🇮🇪 IE · 🇨🇿 CZ · 🇸🇰 SK · 🇭🇺 HU · 🇷🇴 RO · 🇧🇬 BG · 🇬🇷 GR · 🇭🇷 HR · 🇸🇮 SI · 🇪🇪 EE · 🇱🇻 LV · 🇱🇹 LT · 🇱🇺 LU | Rest van Europa; vrijwel volledig hergebruik + dunne nationale laag. |
| 4 | 🇨🇦 CA · 🇦🇺 AU · 🇳🇿 NZ · 🇯🇵 JP · 🇰🇷 KR · 🇨🇳 CN · 🇮🇳 IN · 🇧🇷 BR · 🇲🇽 MX · Golfregio | Anglosfeer hergebruikt VS/VK-collecties; daarna Azië, Latijns-Amerika, Midden-Oosten. |

## 4. Gedeeld fundament (bouwen vóór/tijdens Wave 1)

| Collectie | Inhoud | Hergebruikt door |
|---|---|---|
| `iso7010-safety` | Veiligheidssignalering ISO 7010 (vluchtwegen, brandbestrijding, verbod/gebod/waarschuwing) — kernset ± 60 symbolen | Alle landen behalve VS (VS gebruikt eigen conventies) |
| `en-steel-profiles` | Parametrische Europese staalprofielen (HEA/HEB/HEM, IPE, UNP, kokers, buizen) | Alle Europese landen |
| `common-material-hatches` | Materiaal-arceringen (beton, metselwerk, isolatie, hout, staal, grond) + renvooi-templates | Wereldwijd |
| `common-north-arrows` | Noordpijlen (beschikbaar — eerste bewijs van de pipeline) | Wereldwijd |

## 5. Wave 1 — uitwerking per land

### 5.1 🇺🇸 Verenigde Staten (hoogste prioriteit nieuwe content)

De VS is een eigen normwereld: imperial units, eigen symboolconventies, eigen
profielen en papierformaten. Hergebruik van de EN/ISO-laag is beperkt (± 20%).

| Collectie | Inhoud | Status |
|---|---|---|
| `nfpa170-fire` | Brandveiligheidssymbolen volgens NFPA 170 (detectie, alarmering, blussing, egress) — zelf hertekend | gepland |
| `us-drafting-parametric` | Grid bubbles, elevation datums (ft-in), section/detail markers, rebar callouts (`#4 @ 12" o.c.`) | gepland |
| `us-stamps` | APPROVED / REJECTED / REVISED / FOR CONSTRUCTION / NOT FOR CONSTRUCTION / PRELIMINARY / DRAFT | gepland |
| `aisc-steel-shapes` | Parametrische AISC-profielen: W, S, C, L, HSS | gepland |
| `common-material-hatches` | + Amerikaanse arceringsvarianten waar afwijkend | gedeeld |
| `common-north-arrows` | — | beschikbaar |

Aandachtspunten: ANSI- en ARCH-papierformaten voor legenda-templates;
deur-/raamsymboliek en elektrasymbolen op Amerikaanse plattegronden wijken af
van de Europese — aparte research-stap in de productie-checklist.

### 5.2 🇳🇱 Nederland (referentie-land, content bestaat al in de app)

| Collectie | Inhoud | Status |
|---|---|---|
| `nen1414-fire` | ± 180 symbolen NEN 1414 (migratie uit de app; PNG → her-tekenen naar SVG waar haalbaar) | gepland (migratie) |
| `nl-drafting-parametric` | Stramienen, peilmaten, wapening, NL-staalnotatie, vloertypen, elektra-renvooi | gepland (migratie) |
| `nl-stamps` | GOEDGEKEURD / AFGEKEURD / GEZIEN / VOOR UITVOERING / CONCEPT / TER GOEDKEURING | gepland |
| `iso7010-safety` · `en-steel-profiles` · `common-*` | — | gedeeld |

### 5.3 🇩🇪 Duitsland

Hergebruik ± 60% (ISO/EN-laag). Nationale laag:

| Collectie | Inhoud | Status |
|---|---|---|
| `din14034-fire` | Brandveiligheidssymbolen voor Feuerwehrpläne (DIN 14034-6, DIN 14095) | te definiëren in Wave-1-productie |
| `de-drafting-parametric` | Achsen, Höhenkoten (DIN 406-notatie), Bewehrung-callouts | idem |
| `de-stamps` | GEPRÜFT / FREIGEGEBEN / ZUR GENEHMIGUNG / ENTWURF / VORABZUG | idem |

### 5.4 🇬🇧 Verenigd Koninkrijk

Hergebruik ± 50%. VK is metrisch maar heeft eigen staalprofielen en de
ISO 19650-statuscodes zijn er de facto verplicht op tekeningen.

| Collectie | Inhoud | Status |
|---|---|---|
| `uk-fire-symbols` | Brandveiligheidssymbolen volgens Britse tekenconventies (BS-reeks) | te definiëren in Wave-1-productie |
| `uk-steel-sections` | Parametrisch: UB, UC, PFC, RSA | idem |
| `uk-stamps` | Suitability-codes (S0–S7, A-reeks) + APPROVED/DRAFT-set | idem |
| `uk-drafting-parametric` | Grid references, levels, section markers | idem |

## 6. Wave 2 — Europa breed

Elk Wave-2-land krijgt: de volledige gedeelde laag (`iso7010-safety`,
`en-steel-profiles`, `common-*`) + een dunne nationale laag van gemiddeld
2–3 collecties (nationale brandveiligheids-plansymbolen, stempels in de
landstaal, nationale notatie-conventies). Specifiek te researchen per land:

| Land | Nationale laag (verwacht) |
|---|---|
| 🇫🇷 FR | NF-plansymbolen brandveiligheid; tampons (VU / BON POUR EXÉCUTION / PROJET) |
| 🇮🇹 IT | UNI-conventies; timbri (APPROVATO / BOZZA / PER COSTRUZIONE) |
| 🇪🇸 ES | UNE-conventies; sellos (APROBADO / BORRADOR / PARA CONSTRUCCIÓN) |
| 🇵🇱 PL | PN-conventies; pieczątki (ZATWIERDZONO / PROJEKT) |
| 🇧🇪 BE | Hergebruik NL-collecties + NBN-check + tweetalige stempels (NL/FR) |
| 🇦🇹 AT | Hergebruik DE-collecties + ÖNORM-check |
| 🇨🇭 CH | Hergebruik DE-collecties + SIA-conventies + drietalige stempels (DE/FR/IT) |
| 🇸🇪🇳🇴🇩🇰🇫🇮 | SS/NS/DS/SFS-checks; stempels per taal; verder vrijwel volledig gedeelde laag |

## 7. Wave 3 — rest van Europa

PT, IE (hergebruik VK), CZ, SK, HU, RO, BG, GR, HR, SI, EE, LV, LT,
LU (hergebruik BE/FR/DE). Aanpak identiek aan Wave 2; verwacht hergebruik
70–90%. Productie kan grotendeels parallel omdat de gedeelde laag dan af is.

## 8. Wave 4 — buiten Europa

| Land/regio | Aanpak |
|---|---|
| 🇨🇦 Canada | VS-collecties + tweetalige stempels (EN/FR) + CSA-check |
| 🇦🇺 AU / 🇳🇿 NZ | AS/NZS-staalprofielen; verder VK-achtig |
| 🇯🇵 JP | JIS-symboliek — eigen productieronde |
| 🇰🇷 KR | KS-symboliek |
| 🇨🇳 CN | GB-symboliek |
| 🇮🇳 IN | IS-symboliek; Engelstalige stempels |
| 🇧🇷 BR | ABNT-conventies; Portugese stempels |
| 🇲🇽 MX + LATAM | Spaanse stempels; mix VS/EU-conventies |
| Golfregio | VS/VK-mix; Engels + Arabisch |

## 9. Toekomstige sectoren (geschetst, niet uitgewerkt)

| Sector | Kern-normen | Opmerking |
|---|---|---|
| `mep` (installatietechniek) | Nationale klimaat/sanitair-symboolreeksen | Grote overlap met AEC-doelgroep — eerste kandidaat |
| `electrical` | IEC 60617 (internationaal!) + nationale reeksen | IEC-laag is één keer bouwen, wereldwijd bruikbaar |
| `process` (industrie/P&ID) | ISO 10628; in de VS de ISA-symboolreeks | Aparte doelgroep, hoge symbooldichtheid |
| `infra` (GWW) | Nationale wegontwerp/riolering-symboolreeksen | Sterk nationaal bepaald |

Sector-ids liggen al vast in de schema's; een sector activeren = collecties
toevoegen + land-manifesten uitbreiden. Geen datamodel-wijziging nodig.

## 10. Productieproces per land (checklist)

1. **Research** — welke normen gelden, welke symbolen zijn gangbaar op
   tekeningen in dat land; bronnen: normoverzichten, publiek beschikbare
   voorbeeldtekeningen, marktkennis.
2. **Collectie-definitie** — `collection.json` (status `planned`) +
   symbolenlijst als issue in de repo-tracker.
3. **Productie** — SVG's zelf tekenen volgens `docs/data-format.md`
   (stroke-based, viewBox 64×64); parametrische componenten als parameterset
   op bestaande app-templates.
4. **Review** — check door iemand met marktkennis + `npm run validate`.
5. **Publicatie** — status → `available`, land-manifest bijwerken,
   `npm run build-index`, PR.

## 11. Juridische lijn

Alle symbolen worden **zelf getekend** naar de betekenis en het doel van de
norm. Nooit content uit normdocumenten kopiëren (geen scans, geen
vector-extracties uit normbestanden). Normnamen en -nummers noemen is
toegestaan en gewenst voor vindbaarheid. Elke collectie draagt een
licentie-notitie (`license`-veld).

## 12. App-integratie (afhankelijkheid, buiten deze repo)

De app (open-pdf-studio) heeft al een industrie/land-kiezer en een
filtermodel op categorie-metadata. Benodigde uitbreiding, als vervolgtraject
in die repo:

1. Regio → land → sector-kiezer die `index.json` van deze repo leest.
2. On-demand download van collecties (GitHub raw/releases) + lokale cache.
3. Import van collectie-formaten (symbols/parametric/stamps/hatches) in het
   bestaande palette-model.
4. Migratie: gebundelde NL-content vervangen door collecties uit deze repo.

## 13. Succes-metrieken

- Aantal landen met manifest / met ≥ 80% collecties `available`.
- Hergebruikgraad (gedeelde vs. nationale collecties per land).
- Download-statistieken per land/collectie zodra de app-integratie live is.
````

- [ ] **Step 2: Controleer op verboden verwijzingen**

Run: controleer handmatig dat MASTERPLAN.md geen namen van externe
rekensoftware/concurrent-producten bevat (normnamen zijn ok) en geen
conversatie-verwijzingen.

- [ ] **Step 3: Commit**

```bash
git add MASTERPLAN.md
git commit -m "docs: add worldwide library masterplan (waves, wave-1 countries, sectors)"
```

---

### Task 9: Documentatie (README, data-format, contributing)

**Files:**
- Create: `README.md`
- Create: `docs/data-format.md`
- Create: `docs/contributing-content.md`

- [ ] **Step 1: Schrijf `README.md`**

````markdown
# Open PDF Studio Library

Worldwide symbol, stamp and template library for
[Open PDF Studio](https://github.com/OpenAEC-Foundation). Users pick
**region → country → sector** in the app and get a consolidated library
package for their market.

## Structure

- `MASTERPLAN.md` — the worldwide rollout plan (waves, countries, sectors).
- `collections/<id>/` — content collections (symbols, parametric components,
  stamps, hatches/legends). Each collection exists exactly once; shared
  standards (ISO/EN) are reused across countries.
- `countries/<iso2>.json` — country manifests composing collections per sector.
- `index.json` — generated world index; the only file the app fetches.
- `schema/` — JSON Schemas for all of the above.
- `docs/data-format.md` — data format and SVG drawing guidelines.

## Tooling

```bash
npm install
npm test              # unit + repo-integrity tests
npm run validate      # schema + cross-reference + SVG checks
npm run build-index   # regenerate index.json
```

## Contributing

See `docs/contributing-content.md`.

## Legal

All symbols are drawn from scratch to convey the meaning defined by the
referenced standards. No content is copied from standards documents.
````

- [ ] **Step 2: Schrijf `docs/data-format.md`**

````markdown
# Data format

## Collection

`collections/<id>/collection.json`, validated by `schema/collection.schema.json`:

```json
{
  "id": "nfpa170-fire",
  "name": { "en": "Fire safety symbols (NFPA 170)", "nl": "Brandveiligheidssymbolen (NFPA 170)" },
  "sector": "aec",
  "types": ["symbols"],
  "standard": "NFPA 170",
  "scope": "national",
  "status": "planned",
  "version": "0.1.0",
  "license": "repository"
}
```

- `id` — kebab-case, must equal the directory name.
- `name` — localized; `en` is required, add the local language of the market.
- `sector` — `aec` | `mep` | `electrical` | `process` | `infra`.
- `types` — any of `symbols`, `parametric`, `stamps`, `hatches`, `legends`.
- `standard` — optional; the standard the content is drawn *for* (never copied *from*).
- `scope` — `international` (ISO-level), `regional` (e.g. EN), `national`.
- `status` — `planned` (declared, no content yet) or `available` (content present).
- `license` — `repository` means the repo LICENSE applies.

Content files per type (required once `status` is `available`):

| type | content |
|---|---|
| `symbols` | `symbols/*.svg` |
| `parametric` | `parametric.json` |
| `stamps` | `stamps.json` |
| `hatches` | `hatches.json` |
| `legends` | `legends.json` |

## SVG drawing guidelines

- `viewBox="0 0 64 64"`, stroke-based (`fill="none" stroke="#000" stroke-width="2"`),
  solid fills only where the symbol's meaning requires it.
- Self-contained: no external references (`href`/`url()` to http(s)), no scripts,
  no raster images. The `xmlns` attribute is of course fine.
- One symbol per file; the file name (kebab-case) is the symbol id.
- Text inside symbols: `text-anchor="middle"`, `fill="#000" stroke="none"`.

## Country manifest

`countries/<iso2>.json`, validated by `schema/country.schema.json`:

```json
{
  "id": "us",
  "name": { "en": "United States" },
  "flag": "🇺🇸",
  "region": "north-america",
  "wave": 1,
  "sectors": {
    "aec": { "collections": ["nfpa170-fire", "common-north-arrows"] }
  }
}
```

Every referenced collection must exist. Planned collections may be referenced —
the app shows them as "coming soon" based on their `status` in the index.

## World index

`index.json` is generated by `npm run build-index` — never edit by hand.
It groups countries by region and carries a flat collection map with
download paths. The app fetches this single file, then downloads collection
content on demand.
````

- [ ] **Step 3: Schrijf `docs/contributing-content.md`**

````markdown
# Contributing content

## Adding a new country

1. Check `MASTERPLAN.md` for the country's wave and expected collections.
2. Create `countries/<iso2>.json` (see `docs/data-format.md`).
3. Reference shared collections (`iso7010-safety`, `common-*`, …) plus the
   national layer. Declare missing national collections as `planned`.
4. Run `npm run validate && npm run build-index && npm test`.
5. Open a PR titled `country: <iso2>`.

## Adding or filling a collection

1. Create/extend `collections/<id>/` with `collection.json`.
2. Draw content following the SVG guidelines in `docs/data-format.md`.
   Draw everything from scratch — never copy from standards documents,
   other software's cliparts, or scanned material.
3. Set `status` to `available` only when the content is complete enough to
   be useful (rule of thumb: covers the symbols commonly seen on real
   drawings in that market).
4. Bump `version` (semver) on every content change.
5. Run `npm run validate && npm run build-index && npm test`.
6. Open a PR titled `collection: <id>`. Review requires one person with
   knowledge of the target market.

## Hard rules

- No references to third-party commercial software products anywhere in
  content, code, comments or commit messages. Standard names/numbers
  (ISO, EN, NEN, DIN, NFPA, BS, AISC, …) are fine and encouraged.
- All content is drawn from scratch (see Legal note in README).
````

- [ ] **Step 4: Commit**

```bash
git add README.md docs/data-format.md docs/contributing-content.md
git commit -m "docs: add readme, data format and contributing guides"
```

---

### Task 10: CI-workflow

**Files:**
- Create: `.github/workflows/validate.yml`

- [ ] **Step 1: Schrijf `.github/workflows/validate.yml`**

```yaml
name: validate
on:
  push:
  pull_request:
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: node --test tests/
      - run: node scripts/validate.mjs
      - run: node scripts/build-index.mjs --check
```

- [ ] **Step 2: Draai lokaal alles nog één keer als eindcheck**

Run:
```bash
npm test && npm run validate && npm run check-index
```
Expected: alle tests PASS, `Validatie OK`, `index.json actueel`.

- [ ] **Step 3: Commit**

```bash
git add .github/workflows/validate.yml
git commit -m "ci: validate content and index on every push"
```

---

## Self-review notes

- **Spec coverage:** kernmodel (Task 2/5/6/7), repo-structuur (Task 1–10), masterplan-inhoud incl. VS-hoofdstuk en sectoren-schets (Task 8), juridische lijn (Task 8 §11 + docs), migratie benoemd (Task 8 §5.2/§12), testen & kwaliteit (Task 3/4/7/10), buiten-scope gerespecteerd (geen app-wijzigingen, geen massaproductie — alleen north-arrows als pipeline-bewijs).
- **Type-consistentie:** veldnamen (`formatVersion`, `sectors.<id>.collections`, `status: planned|available`) zijn identiek in schema's, scripts, tests en content.
- **Geen placeholders:** alle bestandsinhoud staat volledig in het plan; de tabel in Task 5 Step 3 specificeert elk veld van de tien geplande collecties exact.
