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
const parametricSteelSchema = ajv.compile(loadJson(join(ROOT, 'schema', 'parametric-steel.schema.json')));
const indexSchema = ajv.compile(loadJson(join(ROOT, 'schema', 'index.schema.json')));

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

export function validateIndexJson(data, label = 'index.json') {
  const errors = schemaErrors(indexSchema, data, label);
  if (errors.length) return errors;

  for (const [id, collection] of Object.entries(data.collections)) {
    const files = collection.files || [];
    const integrityKeys = Object.keys(collection.integrity || {});
    if (JSON.stringify(files) !== JSON.stringify(integrityKeys)) {
      errors.push(`${label}: collectie "${id}" heeft geen 1:1 files/integrity-koppeling`);
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

// hatches.json: { hatches: [{ id, name: {en,...}, lineFamilies: [...] }] }.
// Het line-family formaat is identiek aan de hatch-catalogus van de app
// (en open-2d-studio), zodat pattern-ids round-trippen. Lege lineFamilies
// betekent "solid fill".
export function validateHatchesJson(data, label) {
  const errors = [];
  if (!data || !Array.isArray(data.hatches) || data.hatches.length === 0) {
    errors.push(`${label}: "hatches" moet een niet-lege array zijn`);
    return errors;
  }
  const seen = new Set();
  data.hatches.forEach((h, i) => {
    const where = `${label}: hatches[${i}]`;
    if (!h || typeof h !== 'object') { errors.push(`${where}: geen object`); return; }
    if (typeof h.id !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(h.id)) {
      errors.push(`${where}: id moet kebab-case zijn`);
    } else if (seen.has(h.id)) {
      errors.push(`${where}: dubbele id "${h.id}"`);
    } else {
      seen.add(h.id);
    }
    if (!h.name || typeof h.name.en !== 'string' || !h.name.en.trim()) {
      errors.push(`${where}: name.en ontbreekt`);
    }
    if (!Array.isArray(h.lineFamilies)) {
      errors.push(`${where}: lineFamilies moet een array zijn`);
      return;
    }
    h.lineFamilies.forEach((f, j) => {
      for (const key of ['angle', 'originX', 'originY', 'deltaX', 'deltaY']) {
        if (typeof f[key] !== 'number' || Number.isNaN(f[key])) {
          errors.push(`${where}.lineFamilies[${j}]: ${key} moet een getal zijn`);
        }
      }
      if (f.dashPattern !== undefined && (!Array.isArray(f.dashPattern) || f.dashPattern.some(n => typeof n !== 'number'))) {
        errors.push(`${where}.lineFamilies[${j}]: dashPattern moet een array van getallen zijn`);
      }
    });
  });
  return errors;
}

// parametric.json (format "steel-sections"): maatgedreven catalogus — families
// met vaste kolomdefinitie per vorm en maattabellen in mm. De app rendert de
// doorsneden/aanzichten zelf uit de tabel (geen SVG per maat).
const STEEL_SHAPE_COLUMNS = {
  i: ['designation', 'h', 'b', 'tw', 'tf', 'r'],
  u: ['designation', 'h', 'b', 'tw', 'tf', 'r'],
  tee: ['designation', 'h', 'b', 'tw', 'tf', 'r'],
  box: ['designation', 'h', 'b', 't'],
  angle: ['designation', 'h', 'b', 't'],
  pipe: ['designation', 'd', 't']
};

export function validateParametricJson(data, label) {
  const errors = [];
  if (!data || data.format !== 'steel-sections') {
    errors.push(`${label}: format moet "steel-sections" zijn`);
    return errors;
  }
  errors.push(...schemaErrors(parametricSteelSchema, data, label));
  if (errors.length) return errors;

  const famIds = new Set();
  data.families.forEach((f, i) => {
    const where = `${label}: families[${i}] (${f.id})`;
    if (famIds.has(f.id)) errors.push(`${where}: dubbele familie-id`);
    famIds.add(f.id);

    const expected = STEEL_SHAPE_COLUMNS[f.shape];
    if (JSON.stringify(f.columns) !== JSON.stringify(expected)) {
      errors.push(`${where}: columns moet voor vorm "${f.shape}" exact ${JSON.stringify(expected)} zijn`);
      return;
    }

    const names = new Set();
    let hasDefault = false;
    f.sizes.forEach((row, j) => {
      const rw = `${where}.sizes[${j}]`;
      if (!Array.isArray(row) || row.length !== expected.length) {
        errors.push(`${rw}: verwacht ${expected.length} kolommen (${expected.join(', ')})`);
        return;
      }
      const [name, ...nums] = row;
      if (typeof name !== 'string' || !name.trim()) errors.push(`${rw}: designation ontbreekt`);
      if (names.has(name)) errors.push(`${rw}: dubbele designation "${name}"`);
      names.add(name);
      if (name === f.defaultSize) hasDefault = true;
      if (nums.some(n => typeof n !== 'number' || !Number.isFinite(n) || n <= 0)) {
        errors.push(`${rw}: alle maten moeten positieve getallen (mm) zijn`);
        return;
      }
      // Fysische sanity per vorm: wanddiktes moeten binnen de buitenmaten passen.
      if (f.shape === 'i' || f.shape === 'u' || f.shape === 'tee') {
        const [h, b, tw, tf] = nums;
        if (tw >= b) errors.push(`${rw}: tw (${tw}) >= b (${b})`);
        if (2 * tf >= h) errors.push(`${rw}: 2×tf (${2 * tf}) >= h (${h})`);
      } else if (f.shape === 'box') {
        const [h, b, t] = nums;
        if (2 * t >= Math.min(h, b)) errors.push(`${rw}: 2×t (${2 * t}) >= min(h, b)`);
      } else if (f.shape === 'angle') {
        const [h, b, t] = nums;
        if (t >= Math.min(h, b)) errors.push(`${rw}: t (${t}) >= min(h, b)`);
      } else if (f.shape === 'pipe') {
        const [d, t] = nums;
        if (2 * t >= d) errors.push(`${rw}: 2×t (${2 * t}) >= d (${d})`);
      }
    });
    if (!hasDefault) errors.push(`${where}: defaultSize "${f.defaultSize}" komt niet voor in sizes`);
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
        const parametricPath = join(collectionsDir, dir, 'parametric.json');
        if (data.types.includes('parametric') && existsSync(parametricPath)) {
          try {
            errors.push(...validateParametricJson(loadJson(parametricPath), `${dir}/parametric.json`));
          } catch (e) {
            errors.push(`${dir}/parametric.json: ongeldige JSON — ${e.message}`);
          }
        }
        const hatchesPath = join(collectionsDir, dir, 'hatches.json');
        if (data.types.includes('hatches') && existsSync(hatchesPath)) {
          try {
            errors.push(...validateHatchesJson(loadJson(hatchesPath), `${dir}/hatches.json`));
          } catch (e) {
            errors.push(`${dir}/hatches.json: ongeldige JSON — ${e.message}`);
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

  const indexPath = join(root, 'index.json');
  if (existsSync(indexPath)) {
    try {
      errors.push(...validateIndexJson(loadJson(indexPath), 'index.json'));
    } catch (e) {
      errors.push(`index.json: ongeldige JSON — ${e.message}`);
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
