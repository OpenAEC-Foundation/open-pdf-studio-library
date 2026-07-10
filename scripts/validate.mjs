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

// stamps.json: { stamps: [{ id, text, color }] } — sluit aan op het
// stamp-model van de app (name/text/color); id is de stabiele sleutel.
export function validateStampsJson(data, label) {
  const errors = [];
  if (!data || !Array.isArray(data.stamps) || data.stamps.length === 0) {
    errors.push(`${label}: "stamps" moet een niet-lege array zijn`);
    return errors;
  }
  const seen = new Set();
  data.stamps.forEach((s, i) => {
    const where = `${label}: stamps[${i}]`;
    if (!s || typeof s !== 'object') { errors.push(`${where}: geen object`); return; }
    if (typeof s.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(s.id)) {
      errors.push(`${where}: id moet kebab-case zijn`);
    } else if (seen.has(s.id)) {
      errors.push(`${where}: dubbele id "${s.id}"`);
    } else {
      seen.add(s.id);
    }
    if (typeof s.text !== 'string' || !s.text.trim()) errors.push(`${where}: text ontbreekt`);
    if (typeof s.color !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(s.color)) {
      errors.push(`${where}: color moet #rrggbb zijn`);
    }
  });
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
        const stampsPath = join(collectionsDir, dir, 'stamps.json');
        if (data.types.includes('stamps') && existsSync(stampsPath)) {
          try {
            errors.push(...validateStampsJson(loadJson(stampsPath), `${dir}/stamps.json`));
          } catch (e) {
            errors.push(`${dir}/stamps.json: ongeldige JSON — ${e.message}`);
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
