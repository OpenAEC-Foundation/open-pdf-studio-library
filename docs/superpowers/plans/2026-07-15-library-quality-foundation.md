# Library Quality Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Maak index, SVG-content, gegenereerde media en collectieversies aantoonbaar veilig, actueel en contractvast zonder bestaande consumers te breken.

**Architecture:** De bestaande JSON-bronnen blijven leidend. Kleine pure helpers verzorgen hashing, XML-beleid en semververgelijking; CLI-scripts koppelen die helpers aan de repository en CI. Alle gegenereerde output wordt eerst in geheugen opgebouwd, daarna geschreven of byte-voor-byte gecontroleerd.

**Tech Stack:** Node.js 22+, ECMAScript modules, `node:test`, AJV 8, `saxes` 6, GitHub Actions.

## Global Constraints

- `index.json.formatVersion` blijft exact `1`.
- Bestaande `files: string[]` blijft achterwaarts compatibel.
- Alle integriteitswaarden gebruiken `sha256-` plus 64 lowercase hextekens.
- Checkmodi schrijven geen bestanden.
- Externe of actieve SVG-content wordt geweigerd; huidige veilige SVG's blijven geldig.
- Geen repositorycontent verwijst naar externe commerciële rekensoftware of conversatiegeschiedenis.
- Iedere productiecodewijziging volgt red-green-refactor.
- De lokale `.claude/`-map wordt niet gestaged.

---

### Task 1: Publiek indexcontract en bestandsintegriteit

**Files:**
- Modify: `tests/build-index.test.mjs`
- Modify: `tests/repo-integrity.test.mjs`
- Modify: `scripts/build-index.mjs`
- Modify: `scripts/validate.mjs`
- Modify: `schema/index.schema.json`
- Modify: `index.json`

**Interfaces:**
- Produces: `sha256(bytes: string | Buffer): string`
- Produces: collectie-indexvelden `license`, optioneel `description`, `files`, `integrity`
- Produces: `validateIndexJson(data, label): string[]`

- [ ] **Step 1: Schrijf falende index- en checksumtests**

Voeg aan `tests/build-index.test.mjs` imports voor `createHash` toe en breid de bestaande collectiefixture uit met `license`, `description`, `files` en `fileContents`. Voeg deze tests toe:

```js
test('collection entries expose license, description and deterministic integrity', () => {
  const input = [{
    ...collections[1],
    description: { en: 'Available set' },
    files: ['symbols/a.svg'],
    fileContents: { 'symbols/a.svg': '<svg />' }
  }];
  const idx = buildIndex([], input);
  const entry = idx.collections['aa-set'];
  const expected = createHash('sha256').update('<svg />').digest('hex');

  assert.equal(entry.license, 'repository');
  assert.deepEqual(entry.description, { en: 'Available set' });
  assert.deepEqual(entry.files, ['symbols/a.svg']);
  assert.deepEqual(entry.integrity, {
    'symbols/a.svg': `sha256-${expected}`
  });
});

test('integrity keys match files exactly', () => {
  const idx = buildIndex([], [{
    ...collections[1],
    files: ['stamps.json'],
    fileContents: { 'stamps.json': '{"stamps":[]}' }
  }]);
  assert.deepEqual(
    Object.keys(idx.collections['aa-set'].integrity),
    idx.collections['aa-set'].files
  );
});
```

Voeg aan `tests/repo-integrity.test.mjs` toe:

```js
import { validateIndexJson } from '../scripts/validate.mjs';

test('generated index satisfies its public schema', () => {
  const data = JSON.parse(readFileSync(join(ROOT, 'index.json'), 'utf8'));
  assert.deepEqual(validateIndexJson(data, 'index.json'), []);
});
```

- [ ] **Step 2: Voer de gerichte tests uit en bevestig RED**

Run: `node --test tests/build-index.test.mjs tests/repo-integrity.test.mjs`

Expected: FAIL omdat `license`, `integrity` en `validateIndexJson` nog ontbreken en het huidige schema `files` afwijst.

- [ ] **Step 3: Implementeer hashing en indexvelden**

Pas `scripts/build-index.mjs` aan:

```js
import { createHash } from 'node:crypto';

export function sha256(value) {
  return `sha256-${createHash('sha256').update(value).digest('hex')}`;
}
```

Maak per collectie-entry exact deze additieve velden:

```js
license: c.license,
...(c.description ? { description: c.description } : {}),
...(c.files?.length ? { files: c.files } : {}),
...(c.files?.length ? {
  integrity: Object.fromEntries(c.files.map(file => [file, sha256(c.fileContents[file])]))
} : {})
```

Laat `loadData()` voor ieder consumeerbaar bestand zowel het relatieve pad als de ruwe `Buffer` in `fileContents` zetten. Sorteer `files` vóór hashing.

- [ ] **Step 4: Werk het indexschema volledig bij**

Voeg in `schema/index.schema.json` bij een collectie-entry toe:

```json
"license": { "type": "string", "minLength": 1 },
"description": {
  "type": "object",
  "additionalProperties": { "type": "string" }
},
"files": {
  "type": "array",
  "uniqueItems": true,
  "items": { "type": "string", "pattern": "^(symbols/[^/]+\\.svg|stamps\\.json|parametric\\.json|hatches\\.json|legends\\.json)$" }
},
"integrity": {
  "type": "object",
  "propertyNames": { "type": "string" },
  "additionalProperties": { "type": "string", "pattern": "^sha256-[0-9a-f]{64}$" }
}
```

Voeg `license` aan `required` toe. Controleer in `validateIndexJson()` aanvullend dat `files` en `Object.keys(integrity)` exact dezelfde gesorteerde waarden bevatten.

- [ ] **Step 5: Regenereer de index en bevestig GREEN**

Run: `npm run build-index`

Run: `node --test tests/build-index.test.mjs tests/repo-integrity.test.mjs`

Expected: alle gerichte tests PASS.

- [ ] **Step 6: Commit de indexcontractwijziging**

```bash
git add tests/build-index.test.mjs tests/repo-integrity.test.mjs scripts/build-index.mjs scripts/validate.mjs schema/index.schema.json index.json
git commit -m "feat: validate index integrity contract"
```

---

### Task 2: Provenance- en reviewmetadata

**Files:**
- Modify: `tests/validate.test.mjs`
- Modify: `tests/build-index.test.mjs`
- Modify: `schema/collection.schema.json`
- Modify: `schema/index.schema.json`
- Modify: `scripts/validate.mjs`
- Modify: `scripts/build-index.mjs`

**Interfaces:**
- Consumes: `validateCollectionJson(data, dirName): string[]`
- Produces: optionele collectievelden `standardEdition`, `jurisdiction`, `references`, `review`

- [ ] **Step 1: Schrijf falende reviewmetadatatests**

Voeg aan `tests/validate.test.mjs` toe:

```js
test('market-verified collection requires date and reviewer', () => {
  const data = { ...goodCollection, review: { status: 'market-verified' } };
  const errors = validateCollectionJson(data, 'test-set');
  assert.ok(errors.some(error => error.includes('verifiedAt')));
  assert.ok(errors.some(error => error.includes('verifiedBy')));
});

test('valid provenance and review metadata passes', () => {
  const data = {
    ...goodCollection,
    standardEdition: '2025',
    jurisdiction: ['NL'],
    references: [{ title: 'Public overview', identifier: 'Example 123' }],
    review: {
      status: 'market-verified',
      verifiedAt: '2026-07-15',
      verifiedBy: ['reviewer']
    }
  };
  assert.deepEqual(validateCollectionJson(data, 'test-set'), []);
});
```

Voeg aan `tests/build-index.test.mjs` een test toe die controleert dat `standardEdition`, `jurisdiction`, `references` en `review` ongewijzigd in de collectie-entry verschijnen.

- [ ] **Step 2: Voer tests uit en bevestig RED**

Run: `node --test tests/validate.test.mjs tests/build-index.test.mjs`

Expected: FAIL door `additionalProperties: false` en ontbrekende reviewvalidatie.

- [ ] **Step 3: Breid collectie- en indexschema uit**

Voeg aan beide relevante schemas toe:

```json
"standardEdition": { "type": "string", "minLength": 1 },
"jurisdiction": {
  "type": "array",
  "minItems": 1,
  "uniqueItems": true,
  "items": { "type": "string", "pattern": "^[A-Z]{2}$" }
},
"references": {
  "type": "array",
  "minItems": 1,
  "items": {
    "type": "object",
    "additionalProperties": false,
    "required": ["title"],
    "properties": {
      "title": { "type": "string", "minLength": 1 },
      "identifier": { "type": "string", "minLength": 1 },
      "url": { "type": "string", "format": "uri" }
    }
  }
},
"review": {
  "type": "object",
  "additionalProperties": false,
  "required": ["status"],
  "properties": {
    "status": { "enum": ["unreviewed", "technical-reviewed", "market-verified"] },
    "verifiedAt": { "type": "string", "format": "date" },
    "verifiedBy": {
      "type": "array",
      "minItems": 1,
      "uniqueItems": true,
      "items": { "type": "string", "minLength": 1 }
    }
  }
}
```

Initialiseer AJV met `formats` uit eigen regexcontroles: valideer URI via `new URL(value)` en datum via `YYYY-MM-DD` plus round-tripcontrole. Gebruik geen extra formatdependency.

- [ ] **Step 4: Voeg conditionele reviewvalidatie en indexdoorgifte toe**

Voeg na schemavalidatie in `validateCollectionJson()` toe:

```js
if (data.review?.status === 'market-verified') {
  if (!data.review.verifiedAt) errors.push(`${dirName}: review.verifiedAt ontbreekt`);
  if (!data.review.verifiedBy?.length) errors.push(`${dirName}: review.verifiedBy ontbreekt`);
}
```

Geef de vier optionele velden in `buildIndex()` door met conditionele object spreads.

- [ ] **Step 5: Bevestig GREEN en commit**

Run: `node --test tests/validate.test.mjs tests/build-index.test.mjs`

Expected: PASS.

```bash
git add tests/validate.test.mjs tests/build-index.test.mjs schema/collection.schema.json schema/index.schema.json scripts/validate.mjs scripts/build-index.mjs
git commit -m "feat: add collection provenance metadata"
```

---

### Task 3: Parsergebaseerd SVG-veiligheidsbeleid

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `scripts/svg-policy.mjs`
- Modify: `scripts/validate.mjs`
- Modify: `tests/validate.test.mjs`

**Interfaces:**
- Produces: `validateSvgPolicy(svg: string, label: string): string[]`
- Consumes: `SaxesParser` uit `saxes@6.0.0`

- [ ] **Step 1: Schrijf falende aanvalstests**

Voeg een tabeltest aan `tests/validate.test.mjs` toe:

```js
for (const [name, body] of [
  ['event handler', '<svg viewBox="0 0 64 64" onload="alert(1)"/>'],
  ['javascript href', '<svg viewBox="0 0 64 64"><a href="javascript:alert(1)">x</a></svg>'],
  ['foreignObject', '<svg viewBox="0 0 64 64"><foreignObject/></svg>'],
  ['doctype', '<!DOCTYPE svg [<!ENTITY x "boom">]><svg viewBox="0 0 64 64"/>'],
  ['animation', '<svg viewBox="0 0 64 64"><animate attributeName="x"/></svg>'],
  ['unknown attribute', '<svg viewBox="0 0 64 64" mystery="x"/>']
]) {
  test(`svg rejects ${name}`, () => {
    assert.ok(validateSvg(body, 'attack.svg').length > 0);
  });
}
```

- [ ] **Step 2: Bevestig RED**

Run: `node --test tests/validate.test.mjs`

Expected: minstens de event-handler-, `foreignObject`-, `DOCTYPE`- en animatietests FAIL.

- [ ] **Step 3: Installeer de XML-parser**

Run: `npm install --save-dev saxes@6.0.0`

Expected: `package.json` en `package-lock.json` bevatten exact `saxes` versie `6.0.0` als devDependency-resolutie.

- [ ] **Step 4: Implementeer de allowlist**

Maak `scripts/svg-policy.mjs` met geëxporteerde sets voor toegestane elementen en attributen. De elementset is:

```js
export const ALLOWED_ELEMENTS = new Set([
  'svg', 'g', 'path', 'line', 'polyline', 'polygon', 'rect', 'circle',
  'ellipse', 'text', 'tspan', 'title', 'desc'
]);
```

De attribuutset bevat alleen de huidige statische geometrie- en presentatieattributen:

```js
export const ALLOWED_ATTRIBUTES = new Set([
  'xmlns', 'viewBox', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r',
  'rx', 'ry', 'width', 'height', 'd', 'points', 'transform', 'fill',
  'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'fill-opacity',
  'stroke-opacity', 'font-size', 'font-weight', 'font-family', 'text-anchor',
  'dominant-baseline', 'letter-spacing'
]);
```

`validateSvgPolicy()` gebruikt `SaxesParser`, registreert parserfouten, telt precies één root, weigert namespaces behalve de SVG-namespace, blokkeert ieder `on*`-attribuut en iedere attribuutwaarde met `javascript:`, `data:` of `url(`. Controleer vóór parsing ook `<!DOCTYPE` en `<!ENTITY` case-insensitief.

- [ ] **Step 5: Koppel beleid aan bestaande validatie**

Laat `validateSvg()` de structurele viewBoxcontrole behouden en voeg de resultaten van `validateSvgPolicy()` toe. Verwijder de oude gedeeltelijke script/href-regexen zodra alle regressietests groen zijn.

- [ ] **Step 6: Bevestig GREEN voor tests en volledige corpus**

Run: `node --test tests/validate.test.mjs`

Run: `npm run validate`

Expected: alle tests PASS en alle bestaande SVG's blijven geldig. Als een bestaand attribuut veilig maar niet geallowlist is, voeg uitsluitend dat concrete statische attribuut toe met een regressietest.

- [ ] **Step 7: Commit het SVG-beleid**

```bash
git add package.json package-lock.json scripts/svg-policy.mjs scripts/validate.mjs tests/validate.test.mjs
git commit -m "feat: enforce safe svg policy"
```

---

### Task 4: Veilige en controleerbare README-media

**Files:**
- Create: `tests/readme-media.test.mjs`
- Modify: `scripts/build-readme-media.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `escapeXmlText(value: unknown): string`
- Produces: `buildMediaFiles(root: string): Map<string, string>`
- Produces: `checkMediaFiles(root: string, expected: Map<string, string>): string[]`

- [ ] **Step 1: Schrijf falende escaping- en checkmodustests**

Maak `tests/readme-media.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  escapeXmlText,
  checkMediaFiles
} from '../scripts/build-readme-media.mjs';

test('escapeXmlText escapes all XML-sensitive characters', () => {
  assert.equal(
    escapeXmlText(`A&B<"quote">'`),
    'A&amp;B&lt;&quot;quote&quot;&gt;&apos;'
  );
});

test('media check reports missing, changed and orphaned files', () => {
  const root = mkdtempSync(join(tmpdir(), 'library-media-'));
  mkdirSync(join(root, 'docs', 'media'), { recursive: true });
  writeFileSync(join(root, 'docs', 'media', 'changed.svg'), 'old');
  writeFileSync(join(root, 'docs', 'media', 'orphan.svg'), 'orphan');
  const expected = new Map([
    ['changed.svg', 'new'],
    ['missing.svg', 'new']
  ]);
  assert.deepEqual(checkMediaFiles(root, expected), [
    'changed: docs/media/changed.svg',
    'missing: docs/media/missing.svg',
    'orphaned: docs/media/orphan.svg'
  ]);
});
```

- [ ] **Step 2: Bevestig RED**

Run: `node --test tests/readme-media.test.mjs`

Expected: FAIL door ontbrekende exports.

- [ ] **Step 3: Refactor generator naar pure output**

Implementeer:

```js
export function escapeXmlText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}
```

Laat `symbolSheet()`, `stampSheet()` en `banner()` strings retourneren in plaats van direct schrijven. `buildMediaFiles(root)` retourneert alle verwachte bestandsnamen en inhoud. Escape symbool-id, collectielabel en stempeltekst vóór interpolatie.

`checkMediaFiles()` vergelijkt de map met de `Map`, sorteert fouten alfabetisch binnen de volgorde `changed`, `missing`, `orphaned` en negeert geen `preview-*.svg`-bestanden.

- [ ] **Step 4: Voeg CLI-modi en npm-script toe**

Zonder `--check` schrijft `main()` alle verwachte bestanden en verwijdert uitsluitend verweesde, door dit script beheerde `preview-*.svg`-bestanden. Met `--check` wordt niets geschreven en veroorzaakt iedere fout exitcode `1`.

Voeg aan `package.json` toe:

```json
"build-media": "node scripts/build-readme-media.mjs",
"check-media": "node scripts/build-readme-media.mjs --check"
```

- [ ] **Step 5: Bevestig GREEN en actuele media**

Run: `node --test tests/readme-media.test.mjs`

Run: `npm run build-media`

Run: `npm run check-media`

Expected: tests PASS en `check-media` eindigt met exitcode `0`.

- [ ] **Step 6: Commit de mediagate**

```bash
git add tests/readme-media.test.mjs scripts/build-readme-media.mjs package.json docs/media
git commit -m "feat: secure generated library previews"
```

---

### Task 5: Collectieversiecontrole

**Files:**
- Create: `scripts/check-collection-versions.mjs`
- Create: `tests/collection-versions.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `compareSemver(previous: string, current: string): number`
- Produces: `checkVersionBumps(previousById: Map, currentById: Map, changedIds: Set): string[]`
- CLI: `node scripts/check-collection-versions.mjs --base origin/main`

- [ ] **Step 1: Schrijf falende pure functietests**

Maak `tests/collection-versions.test.mjs` met tests voor `1.2.3 -> 1.2.4`, `1.2.9 -> 1.3.0`, `1.9.9 -> 2.0.0`, gelijke/lagere versies, een nieuwe collectie en meerdere fouten. De kernasserties zijn:

```js
assert.equal(compareSemver('1.2.9', '1.3.0'), 1);
assert.equal(compareSemver('1.2.3', '1.2.3'), 0);
assert.equal(compareSemver('2.0.0', '1.9.9'), -1);

assert.deepEqual(checkVersionBumps(
  new Map([['a', '1.0.0']]),
  new Map([['a', '1.0.0']]),
  new Set(['a'])
), ['a: version 1.0.0 moet hoger zijn dan 1.0.0']);

assert.deepEqual(checkVersionBumps(
  new Map(),
  new Map([['new-set', '0.1.0']]),
  new Set(['new-set'])
), []);
```

- [ ] **Step 2: Bevestig RED**

Run: `node --test tests/collection-versions.test.mjs`

Expected: FAIL omdat het modulebestand ontbreekt.

- [ ] **Step 3: Implementeer semver en repository-CLI**

`compareSemver()` splitst exact drie numerieke segmenten en vergelijkt segment voor segment. `checkVersionBumps()` sorteert collectie-id's en slaat ids zonder vorige versie over.

De CLI:

1. leest `--base` en weigert een ontbrekende waarde;
2. gebruikt `git diff --name-only <base> -- collections` via `execFileSync` zonder shell;
3. bepaalt unieke collectie-id's uit `collections/<id>/...`;
4. leest huidige versies uit de werkmap;
5. leest vorige `collection.json` via `git show <base>:collections/<id>/collection.json`;
6. rapporteert alle fouten en gebruikt exitcode `1`.

Voeg aan `package.json` toe:

```json
"check-versions": "node scripts/check-collection-versions.mjs"
```

- [ ] **Step 4: Bevestig GREEN en CLI-gedrag**

Run: `node --test tests/collection-versions.test.mjs`

Run: `npm run check-versions -- --base HEAD`

Expected: tests PASS; vergelijking met dezelfde tree rapporteert geen gewijzigde collecties.

- [ ] **Step 5: Commit versiecontrole**

```bash
git add scripts/check-collection-versions.mjs tests/collection-versions.test.mjs package.json
git commit -m "feat: require collection version bumps"
```

---

### Task 6: CI-gates en documentatie

**Files:**
- Modify: `.github/workflows/validate.yml`
- Modify: `README.md`
- Modify: `docs/data-format.md`
- Modify: `docs/contributing-content.md`
- Modify: `package.json`

**Interfaces:**
- Consumes: `npm run check-index`, `npm run check-media`, `npm run check-versions -- --base "$BASE_SHA"`

- [ ] **Step 1: Schrijf een falende repository-integriteitstest voor scripts en README-copy**

Voeg aan `tests/repo-integrity.test.mjs` toe:

```js
test('quality gate scripts and accurate coverage copy are present', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  assert.equal(pkg.scripts['check-media'], 'node scripts/build-readme-media.mjs --check');
  assert.equal(pkg.scripts['check-versions'], 'node scripts/check-collection-versions.mjs');
  assert.doesNotMatch(readme, /all of Europe/i);
  assert.doesNotMatch(readme, /complete national symbol sets/i);
  assert.match(readme, /all EU countries/i);
  assert.match(readme, /production-ready core collections/i);
});
```

- [ ] **Step 2: Bevestig RED**

Run: `node --test tests/repo-integrity.test.mjs`

Expected: FAIL op de oude README-claims en eventueel ontbrekende scripts.

- [ ] **Step 3: Werk README en formaatdocumentatie bij**

Vervang de coverage-copy exact door:

```markdown
**41 countries** across every inhabited region, including **all EU countries
plus selected non-EU markets**.

**Production-ready core collections** — available baseline content for the
first four priority markets:
```

Documenteer in `docs/data-format.md` de velden `integrity`, `license`,
`standardEdition`, `jurisdiction`, `references` en `review`, inclusief het
feit dat ontbrekende reviewmetadata geen verificatieclaim betekent.

Documenteer in `docs/contributing-content.md` dat iedere wijziging onder een
bestaande collectiemap een strikt hogere semver vereist en geef de commando's
`npm run check-media` en `npm run check-versions -- --base origin/main`.

- [ ] **Step 4: Harden de CI-workflow**

Voeg boven `jobs` toe:

```yaml
permissions:
  contents: read
```

Stel checkout in op `fetch-depth: 0`, activeer npm-cache in `setup-node` en
voeg `timeout-minutes: 10` toe. De runstappen worden:

```yaml
- run: npm ci
- run: npm test
- run: npm run validate
- run: npm run check-index
- run: npm run check-media
- name: Check collection versions
  if: github.event_name == 'pull_request'
  env:
    BASE_SHA: ${{ github.event.pull_request.base.sha }}
  run: npm run check-versions -- --base "$BASE_SHA"
- name: Check collection versions on push
  if: github.event_name == 'push' && github.event.before != '0000000000000000000000000000000000000000'
  env:
    BASE_SHA: ${{ github.event.before }}
  run: npm run check-versions -- --base "$BASE_SHA"
```

Bij een eerste push zonder bruikbare voorganger wordt alleen de
versiecontrole overgeslagen; alle overige gates blijven actief.

- [ ] **Step 5: Bevestig GREEN en commit**

Run: `node --test tests/repo-integrity.test.mjs`

Run: `npm run check-media`

Expected: PASS.

```bash
git add .github/workflows/validate.yml README.md docs/data-format.md docs/contributing-content.md package.json tests/repo-integrity.test.mjs
git commit -m "ci: enforce library quality gates"
```

---

### Task 7: Volledige verificatie en releasegereed maken

**Files:**
- Verify only; wijzig uitsluitend bestanden als een falende gate een regressie aantoont.

**Interfaces:**
- Consumes: alle scripts en tests uit Task 1-6.

- [ ] **Step 1: Draai de volledige suite**

Run: `npm test`

Expected: alle tests PASS, nul failures.

- [ ] **Step 2: Draai alle contract- en generatiegates**

Run: `npm run validate`

Run: `npm run check-index`

Run: `npm run check-media`

Run: `npm run check-versions -- --base HEAD`

Expected: ieder commando eindigt met exitcode `0`.

- [ ] **Step 3: Controleer repositoryhygiëne**

Run: `git diff --check`

Run: `git status --short`

Expected: geen whitespacefouten; alleen bedoelde branchwijzigingen en de reeds bestaande lokale `.claude/`-map.

- [ ] **Step 4: Controleer indexschema expliciet**

Run: `node --test tests/repo-integrity.test.mjs`

Expected: de test `generated index satisfies its public schema` PASS.

- [ ] **Step 5: Handel eventuele regressies af bij de eigenaarstaak**

Als een gate faalt, ga terug naar de taak die dat gedrag bezit, voeg daar
eerst een falende regressietest toe en herhaal de red-green-cyclus. Task 7
maakt geen losse verzamel- of lege commit.
