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
      ...(c.symbolCount ? { symbolCount: c.symbolCount } : {}),
      // Volledige bestandslijst (relatief aan `path`) zodat apps alles via
      // raw-URLs kunnen ophalen. Zonder deze lijst moeten consumenten een
      // per-collectie directory-listing doen via de GitHub contents-API, en
      // die is voor anonieme gebruikers hard rate-limited (HTTP 403 na een
      // handvol downloads). index.json is al het enige bestand dat de app
      // ophaalt — met `files` erbij is de hele download API-vrij.
      ...(c.files && c.files.length ? { files: c.files } : {})
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
      const files = [];
      const symDir = join(collectionsDir, dir, 'symbols');
      if (existsSync(symDir)) {
        const svgs = readdirSync(symDir).filter(f => f.endsWith('.svg')).sort();
        if (svgs.length) data.symbolCount = svgs.length;
        files.push(...svgs.map(f => `symbols/${f}`));
      }
      // Overige door apps consumeerbare databestanden naast collection.json.
      for (const extra of ['stamps.json', 'parametric.json', 'hatches.json', 'legends.json']) {
        if (existsSync(join(collectionsDir, dir, extra))) files.push(extra);
      }
      if (files.length) data.files = files;
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
