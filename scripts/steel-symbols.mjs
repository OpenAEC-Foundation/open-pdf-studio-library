import {
  existsSync,
  readFileSync,
  readdirSync,
  writeFileSync
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const VIEW_SIZE = 64;
const MARGIN = 6;
const DRAW_SIZE = VIEW_SIZE - MARGIN * 2;
const ELEVATION_LENGTH_FACTOR = 4;

const FAMILY_BY_SYMBOL = {
  'aisc-steel-shapes': {
    'w-shape': 'w-shapes', 'hp-shape': 'w-shapes', 'i-beam-elevation': 'w-shapes',
    's-shape': 's-shapes', 'c-channel': 'c-channels', 'channel-elevation': 'c-channels',
    'l-angle-equal': 'l-angles', 'angle-elevation': 'l-angles', 'hss-square': 'hss',
    'hollow-section-elevation': 'hss'
  },
  'en-steel-profiles': {
    hea: 'hea', heb: 'heb', hem: 'hem', ipe: 'ipe', upn: 'upn',
    'l-equal': 'angle', 't-profile': 'tee', shs: 'hollow', rhs: 'hollow', chs: 'chs',
    'i-beam-elevation': 'hea', 'channel-elevation': 'upn', 'angle-elevation': 'angle',
    'tee-elevation': 'tee', 'hollow-section-elevation': 'hollow'
  },
  'uk-steel-sections': {
    ub: 'ub', uc: 'uc', pfc: 'pfc', 'rsa-equal': 'uka',
    'i-beam-elevation': 'ub', 'channel-elevation': 'pfc', 'angle-elevation': 'uka'
  },
  'jis-steel-shapes': {
    'h-shape-wide': 'h-wide', 'h-shape-narrow': 'h-narrow', 'i-beam': 'h-middle',
    channel: 'channels', 'i-beam-elevation': 'h-wide', 'channel-elevation': 'channels'
  },
  'ks-steel-shapes': {
    'h-shape-wide': 'h-wide', 'h-shape-narrow': 'h-narrow', 'i-beam': 'h-narrow',
    'i-beam-elevation': 'h-wide'
  },
  'gb-steel-shapes': {
    'hw-shape': 'hw', 'hm-shape': 'hm', 'hn-shape': 'hn', 'i-beam': 'i-beams',
    'i-beam-elevation': 'hw'
  },
  'is-steel-shapes': {
    ismb: 'ismb', ishb: 'ishb', ismc: 'ismc', 'isa-equal': 'isa',
    'i-beam-elevation': 'ismb', 'channel-elevation': 'ismc', 'angle-elevation': 'isa'
  },
  'au-steel-sections': {
    ub: 'ub', uc: 'uc', pfc: 'pfc', 'i-beam-elevation': 'ub', 'channel-elevation': 'pfc'
  },
  'gost-steel-shapes': {
    'dvutavr-b': 'i-beams', 'dvutavr-k': 'i-beams', 'dvutavr-sh': 'i-beams',
    shveller: 'channels', 'i-beam-elevation': 'i-beams', 'channel-elevation': 'channels'
  },
  'br-steel-shapes': {
    'w-beam': 'w-beams', 'w-column': 'w-columns', 'i-beam-elevation': 'w-beams'
  }
};

function n(value) {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function defaultRow(family) {
  return family.sizes.find(row => row[0] === family.defaultSize);
}

export function rowToSection(family, designation = family.defaultSize) {
  const row = family.sizes.find(candidate => candidate[0] === designation);
  if (!row) throw new Error(`${family.id}: maat ${designation} ontbreekt`);
  const section = { shape: family.shape };
  family.columns.forEach((column, index) => {
    section[column] = row[index];
  });
  return { designation: section.designation, shape: section.shape, ...Object.fromEntries(
    family.columns.slice(1).map(column => [column, section[column]])
  ) };
}

function dimensions(section) {
  const h = section.h ?? section.d;
  const b = section.b ?? section.d;
  if (!(h > 0) || !(b > 0)) throw new Error(`${section.designation}: ongeldige hoofdafmetingen`);
  return { h, b };
}

function scaleFor(section) {
  const { h, b } = dimensions(section);
  return DRAW_SIZE / Math.max(h, b);
}

function point(scale, x, y) {
  return `${n(VIEW_SIZE / 2 + x * scale)} ${n(VIEW_SIZE / 2 + y * scale)}`;
}

function arc(scale, radius) {
  return `${n(radius * scale)} ${n(radius * scale)}`;
}

function clampedRadius(section, h, b, webOrWall, flangeOrWall) {
  const availableX = Math.max((b - webOrWall) / 2, 0.5);
  const availableY = Math.max((h - 2 * flangeOrWall) / 2, 0.5);
  const proposed = section.r ?? Math.min(webOrWall, flangeOrWall) * 0.8;
  return Math.max(0.5, Math.min(proposed, availableX * 0.9, availableY * 0.45));
}

function iPath(section, scale) {
  const { h, b } = dimensions(section);
  const tw = section.tw;
  const tf = section.tf;
  const r = clampedRadius(section, h, b, tw, tf);
  const xL = -b / 2, xR = b / 2, webL = -tw / 2, webR = tw / 2;
  const yT = -h / 2, yB = h / 2, yTI = yT + tf, yBI = yB - tf;
  const p = (x, y) => point(scale, x, y);
  const a = arc(scale, r);
  return [
    `M${p(xL, yT)}`, `L${p(xR, yT)}`, `L${p(xR, yTI)}`,
    `L${p(webR + r, yTI)}`, `A${a} 0 0 0 ${p(webR, yTI + r)}`,
    `L${p(webR, yBI - r)}`, `A${a} 0 0 0 ${p(webR + r, yBI)}`,
    `L${p(xR, yBI)}`, `L${p(xR, yB)}`, `L${p(xL, yB)}`, `L${p(xL, yBI)}`,
    `L${p(webL - r, yBI)}`, `A${a} 0 0 0 ${p(webL, yBI - r)}`,
    `L${p(webL, yTI + r)}`, `A${a} 0 0 0 ${p(webL - r, yTI)}`,
    `L${p(xL, yTI)}`, 'Z'
  ].join(' ');
}

function uPath(section, scale) {
  const { h, b } = dimensions(section);
  const tw = section.tw;
  const tf = section.tf;
  const r = clampedRadius(section, h, b, tw, tf);
  const xL = -b / 2, xR = b / 2, webR = xL + tw;
  const yT = -h / 2, yB = h / 2, yTI = yT + tf, yBI = yB - tf;
  const p = (x, y) => point(scale, x, y);
  const a = arc(scale, r);
  return [
    `M${p(xL, yT)}`, `L${p(xR, yT)}`, `L${p(xR, yTI)}`,
    `L${p(webR + r, yTI)}`, `A${a} 0 0 0 ${p(webR, yTI + r)}`,
    `L${p(webR, yBI - r)}`, `A${a} 0 0 0 ${p(webR + r, yBI)}`,
    `L${p(xR, yBI)}`, `L${p(xR, yB)}`, `L${p(xL, yB)}`, 'Z'
  ].join(' ');
}

function teePath(section, scale) {
  const { h, b } = dimensions(section);
  const tw = section.tw;
  const tf = section.tf;
  const r = Math.max(0.5, Math.min(section.r ?? Math.min(tw, tf) * 0.8, (b - tw) * 0.45, (h - tf) * 0.35));
  const xL = -b / 2, xR = b / 2, webL = -tw / 2, webR = tw / 2;
  const yT = -h / 2, yFI = yT + tf, yB = h / 2;
  const p = (x, y) => point(scale, x, y);
  const a = arc(scale, r);
  return [
    `M${p(xL, yT)}`, `L${p(xR, yT)}`, `L${p(xR, yFI)}`,
    `L${p(webR + r, yFI)}`, `A${a} 0 0 0 ${p(webR, yFI + r)}`,
    `L${p(webR, yB)}`, `L${p(webL, yB)}`, `L${p(webL, yFI + r)}`,
    `A${a} 0 0 0 ${p(webL - r, yFI)}`, `L${p(xL, yFI)}`, 'Z'
  ].join(' ');
}

function anglePath(section, scale) {
  const { h, b } = dimensions(section);
  const t = section.t;
  const r = Math.max(0.5, Math.min(section.r ?? t * 0.8, h - t, b - t));
  const xL = -b / 2, xR = b / 2, yT = -h / 2, yB = h / 2;
  const p = (x, y) => point(scale, x, y);
  const a = arc(scale, r);
  return [
    `M${p(xL, yT)}`, `L${p(xL + t, yT)}`, `L${p(xL + t, yB - t - r)}`,
    `A${a} 0 0 0 ${p(xL + t + r, yB - t)}`, `L${p(xR, yB - t)}`,
    `L${p(xR, yB)}`, `L${p(xL, yB)}`, 'Z'
  ].join(' ');
}

function sectionGeometry(section, scale) {
  const { h, b } = dimensions(section);
  const x = VIEW_SIZE / 2 - b * scale / 2;
  const y = VIEW_SIZE / 2 - h * scale / 2;
  if (section.shape === 'i') return `<path d="${iPath(section, scale)}"/>`;
  if (section.shape === 'u') return `<path d="${uPath(section, scale)}"/>`;
  if (section.shape === 'tee') return `<path d="${teePath(section, scale)}"/>`;
  if (section.shape === 'angle') return `<path d="${anglePath(section, scale)}"/>`;
  if (section.shape === 'box') {
    const t = section.t;
    const outerR = Math.min(section.r ?? t * 2, h / 5, b / 5);
    const innerR = Math.max(outerR - t, t * 0.35);
    return `<rect x="${n(x)}" y="${n(y)}" width="${n(b * scale)}" height="${n(h * scale)}" rx="${n(outerR * scale)}"/><rect x="${n(x + t * scale)}" y="${n(y + t * scale)}" width="${n((b - 2 * t) * scale)}" height="${n((h - 2 * t) * scale)}" rx="${n(innerR * scale)}"/>`;
  }
  if (section.shape === 'pipe') {
    const radius = h * scale / 2;
    const inner = Math.max(radius - section.t * scale, 0.5);
    return `<circle cx="32" cy="32" r="${n(radius)}"/><circle cx="32" cy="32" r="${n(inner)}"/>`;
  }
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(b * scale)}" height="${n(h * scale)}"/>`;
}

function svgShell(title, description, body) {
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><title>${esc(title)}</title><desc>${esc(description)}</desc>${body}</svg>\n`;
}

function centrelines() {
  return '<g stroke-width="0.7" stroke-dasharray="5 2 1 2"><line x1="6" y1="32" x2="58" y2="32"/><line x1="32" y1="6" x2="32" y2="58"/></g>';
}

export function renderSteelSection(section, options = {}) {
  const scale = scaleFor(section);
  const title = options.title ?? section.designation;
  const body = `${centrelines()}${sectionGeometry(section, scale)}`;
  return svgShell(title, `Catalogusgedreven doorsnede; vorm ${section.shape}.`, body);
}

export function renderSteelElevation(section, options = {}) {
  const { h } = dimensions(section);
  const width = DRAW_SIZE;
  const height = DRAW_SIZE / ELEVATION_LENGTH_FACTOR;
  const x = MARGIN;
  const y = (VIEW_SIZE - height) / 2;
  const modelScale = width / (h * ELEVATION_LENGTH_FACTOR);
  const title = options.title ?? `${section.designation} elevation`;
  let details = '';
  const wall = Math.max(0.7, (section.tf ?? section.t ?? h * 0.06) * modelScale);

  if (['i', 'u'].includes(section.shape)) {
    details = `<line x1="${n(x)}" y1="${n(y + wall)}" x2="${n(x + width)}" y2="${n(y + wall)}"/><line x1="${n(x)}" y1="${n(y + height - wall)}" x2="${n(x + width)}" y2="${n(y + height - wall)}"/>`;
  } else if (section.shape === 'tee' || section.shape === 'angle') {
    details = `<line x1="${n(x)}" y1="${n(y + wall)}" x2="${n(x + width)}" y2="${n(y + wall)}"/>`;
  } else if (['box', 'pipe'].includes(section.shape)) {
    details = `<rect x="${n(x + wall)}" y="${n(y + wall)}" width="${n(width - 2 * wall)}" height="${n(height - 2 * wall)}"/>`;
  }

  const body = `<rect x="${n(x)}" y="${n(y)}" width="${n(width)}" height="${n(height)}"/>${details}<g stroke-width="0.7" stroke-dasharray="5 2 1 2"><line x1="6" y1="32" x2="58" y2="32"/><line x1="32" y1="6" x2="32" y2="58"/></g>`;
  return svgShell(title, `Schematisch aanzicht met voorbeeldlengte ${ELEVATION_LENGTH_FACTOR} maal de profielhoogte.`, body);
}

function inferShape(stem) {
  const base = stem.replace('-elevation', '');
  if (/hss-round|\bchs\b|pipe/.test(base)) return 'pipe';
  if (/hss|\bshs\b|\brhs\b|hollow/.test(base)) return 'box';
  if (/angle|\brsa\b|\bisa\b|ugolok/.test(base)) return 'angle';
  if (/tee|t-profile|bt-tee|ct-tee|isnt-tee/.test(base)) return 'tee';
  if (/channel|\bpfc\b|\bupn\b|\bismc\b|shveller/.test(base)) return 'u';
  if (/plate|flat/.test(base)) return 'plate';
  return 'i';
}

function canonicalSection(shape, stem) {
  if (shape === 'i') return { designation: stem, shape, h: 300, b: 180, tw: 8, tf: 14, r: 16 };
  if (shape === 'u') return { designation: stem, shape, h: 240, b: 90, tw: 8, tf: 13, r: 12 };
  if (shape === 'tee') return { designation: stem, shape, h: 180, b: 160, tw: 10, tf: 14, r: 10 };
  if (shape === 'angle') {
    const unequal = /unequal/.test(stem);
    return { designation: stem, shape, h: 160, b: unequal ? 105 : 160, t: 14, r: 11 };
  }
  if (shape === 'box') {
    const rectangular = /rect|\brhs\b/.test(stem);
    return { designation: stem, shape, h: rectangular ? 120 : 160, b: 160, t: 10, r: 18 };
  }
  if (shape === 'pipe') return { designation: stem, shape, d: 160, t: 9 };
  return { designation: stem, shape: 'plate', h: /flat/.test(stem) ? 24 : 18, b: 180, t: 18 };
}

function sectionForSymbol(collectionId, catalog, stem) {
  const familyId = FAMILY_BY_SYMBOL[collectionId]?.[stem];
  const family = familyId ? catalog.families.find(candidate => candidate.id === familyId) : null;
  if (family && defaultRow(family)) return rowToSection(family);
  return canonicalSection(inferShape(stem), stem);
}

function steelCollectionIds(root) {
  const collections = join(root, 'collections');
  return readdirSync(collections).filter(id => {
    const collectionPath = join(collections, id, 'collection.json');
    const catalogPath = join(collections, id, 'parametric.json');
    if (!existsSync(collectionPath) || !existsSync(catalogPath)) return false;
    const collection = JSON.parse(readFileSync(collectionPath, 'utf8'));
    return collection.status === 'available' && collection.types.includes('parametric');
  }).sort();
}

export function generateSteelSymbols(root) {
  const output = new Map();
  for (const collectionId of steelCollectionIds(root)) {
    const collectionDir = join(root, 'collections', collectionId);
    const catalog = JSON.parse(readFileSync(join(collectionDir, 'parametric.json'), 'utf8'));
    const collection = JSON.parse(readFileSync(join(collectionDir, 'collection.json'), 'utf8'));
    const symbolDir = join(collectionDir, 'symbols');
    for (const file of readdirSync(symbolDir).filter(name => name.endsWith('.svg')).sort()) {
      const stem = file.slice(0, -4);
      const section = sectionForSymbol(collectionId, catalog, stem);
      const title = `${collection.name.en}: ${stem}`;
      const svg = stem.endsWith('-elevation')
        ? renderSteelElevation(section, { title })
        : renderSteelSection(section, { title });
      output.set(`collections/${collectionId}/symbols/${file}`, svg);
    }
  }
  return output;
}

export function checkSteelSymbols(root, expected = generateSteelSymbols(root)) {
  const errors = [];
  for (const [file, svg] of expected) {
    const absolute = join(root, ...file.split('/'));
    if (!existsSync(absolute)) errors.push(`missing: ${file}`);
    else if (readFileSync(absolute, 'utf8') !== svg) errors.push(`changed: ${file}`);
  }
  return errors;
}

function writeSteelSymbols(root, expected) {
  let changed = 0;
  for (const [file, svg] of expected) {
    const absolute = join(root, ...file.split('/'));
    if (!existsSync(absolute) || readFileSync(absolute, 'utf8') !== svg) {
      writeFileSync(absolute, svg);
      changed += 1;
    }
  }
  return changed;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath)) {
  const root = resolve(dirname(scriptPath), '..');
  const expected = generateSteelSymbols(root);
  if (process.argv.includes('--check')) {
    const errors = checkSteelSymbols(root, expected);
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
    } else {
      console.log(`Staal-SVG's actueel (${expected.size} bestanden).`);
    }
  } else {
    const changed = writeSteelSymbols(root, expected);
    console.log(`Staal-SVG's gebouwd (${changed} gewijzigd, ${expected.size} totaal).`);
  }
}

