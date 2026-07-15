import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WALL_COLLECTIONS = ['de-wall-types', 'nl-wall-types', 'uk-wall-types', 'us-wall-types'];

function n(value) {
  const rounded = Math.round(value * 1000) / 1000;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&apos;');
}

export function classifyWallSymbol(fileName) {
  const stem = fileName.toLowerCase().replace(/\.svg$/, '');
  if (/cavity|veneer/.test(stem)) return 'cavity';
  if (/brandwand|fire-wall/.test(stem)) return /(?:60|90|2hr)/.test(stem) ? 'fire-double' : 'fire-single';
  if (/gewapend|stahlbeton/.test(stem)) return 'reinforced-concrete';
  if (/cellen|poren/.test(stem)) return 'cellular-concrete';
  if (/metal-stud/.test(stem)) return 'metal-stud';
  if (/hsb|holz|timber|wood-stud/.test(stem)) return 'timber-stud';
  if (/shaft|schacht|trockenbau/.test(stem)) return 'shaft';
  if (/metsel|mauer|brickwork|blockwork|cmu|kalkzand/.test(stem)) return 'masonry';
  if (/beton|concrete/.test(stem)) return 'concrete';
  return null;
}

function boundaries(yTop = 18, yBottom = 46) {
  return `<g stroke-width="1.6"><line x1="4" y1="${n(yTop)}" x2="60" y2="${n(yTop)}"/><line x1="4" y1="${n(yBottom)}" x2="60" y2="${n(yBottom)}"/></g>`;
}

function clippedDiagonalHatch(yTop = 18, yBottom = 46, xMin = 4, xMax = 60, spacing = 10) {
  const riseX = 14;
  const lines = [];
  for (let start = xMin - riseX; start <= xMax; start += spacing) {
    const t0 = Math.max(0, (xMin - start) / riseX);
    const t1 = Math.min(1, (xMax - start) / riseX);
    if (t0 > t1) continue;
    lines.push(`<line x1="${n(start + riseX * t0)}" y1="${n(yBottom - (yBottom - yTop) * t0)}" x2="${n(start + riseX * t1)}" y2="${n(yBottom - (yBottom - yTop) * t1)}"/>`);
  }
  return lines.join('');
}

function concreteAggregate() {
  return '<g fill="#000" stroke="none"><circle cx="11" cy="27" r="1.2"/><circle cx="24" cy="38" r="1.4"/><circle cx="35" cy="25" r="1.1"/><circle cx="50" cy="36" r="1.3"/><circle cx="56" cy="25" r="0.9"/></g><g stroke-width="0.75"><polygon points="17,37 21,31 24,37"/><polygon points="39,39 43,33 47,39"/><polyline points="27,25 30,29 33,25"/></g>';
}

function masonryPattern(yTop = 18, yMid = 32, yBottom = 46) {
  const upper = [12, 24, 36, 48].map(x => `<line x1="${x}" y1="${yTop}" x2="${x}" y2="${yMid}"/>`).join('');
  const lower = [18, 30, 42, 54].map(x => `<line x1="${x}" y1="${yMid}" x2="${x}" y2="${yBottom}"/>`).join('');
  return `<g stroke-width="0.75"><line x1="4" y1="${yMid}" x2="60" y2="${yMid}"/>${upper}${lower}</g>`;
}

function timberPattern() {
  const studs = [10, 28, 46].map(x => `<rect x="${x}" y="20" width="4" height="24"/>`).join('');
  return `<g stroke-width="0.75">${studs}<polyline points="4,42 18,22 32,42 46,22 60,42"/></g>`;
}

function metalPattern() {
  return '<g stroke-width="0.75"><polyline points="8,42 8,22 14,22 14,27 11,27 11,42"/><polyline points="28,42 28,22 34,22 34,27 31,27 31,42"/><polyline points="48,42 48,22 54,22 54,27 51,27 51,42"/><line x1="4" y1="21" x2="60" y2="21"/><line x1="4" y1="43" x2="60" y2="43"/></g>';
}

function firePattern(double) {
  const ys = double ? [29, 35] : [32];
  const ratedLines = ys.map(y => `<line x1="4" y1="${y}" x2="60" y2="${y}" stroke-dasharray="6 3"/>`).join('');
  const diamonds = [16, 32, 48].map(x => `<polygon points="${x},27 ${x + 3},32 ${x},37 ${x - 3},32"/>`).join('');
  return `<g stroke-width="0.75">${ratedLines}${diamonds}</g>`;
}

function cavityPattern() {
  return `<g stroke-width="1.6"><line x1="4" y1="14" x2="60" y2="14"/><line x1="4" y1="24" x2="60" y2="24"/><line x1="4" y1="40" x2="60" y2="40"/><line x1="4" y1="50" x2="60" y2="50"/></g><g stroke-width="0.75">${clippedDiagonalHatch(14, 24, 4, 60, 12)}<line x1="4" y1="32" x2="60" y2="32" stroke-dasharray="2 4"/></g>${masonryPattern(40, 45, 50)}`;
}

function bodyFor(kind) {
  if (kind === 'concrete') return `${boundaries()}${concreteAggregate()}`;
  if (kind === 'reinforced-concrete') return `${boundaries()}${concreteAggregate()}<g stroke-width="0.75"><line x1="9" y1="42" x2="25" y2="22"/><line x1="27" y1="42" x2="43" y2="22"/><line x1="45" y1="42" x2="59" y2="24"/></g>`;
  if (kind === 'cellular-concrete') return `${boundaries()}<g stroke-width="0.75">${clippedDiagonalHatch()}<circle cx="16" cy="32" r="2.2"/><circle cx="34" cy="27" r="1.7"/><circle cx="49" cy="37" r="2.4"/></g>`;
  if (kind === 'masonry') return `${boundaries()}${masonryPattern()}`;
  if (kind === 'timber-stud') return `${boundaries()}${timberPattern()}`;
  if (kind === 'metal-stud') return `${boundaries()}${metalPattern()}`;
  if (kind === 'shaft') return `${boundaries()}<g stroke-width="0.75"><line x1="4" y1="29" x2="60" y2="29" stroke-dasharray="8 4"/><line x1="4" y1="35" x2="60" y2="35" stroke-dasharray="2 3"/></g>`;
  if (kind === 'fire-single') return `${boundaries()}${firePattern(false)}`;
  if (kind === 'fire-double') return `${boundaries()}${firePattern(true)}`;
  if (kind === 'cavity') return cavityPattern();
  throw new Error(`Onbekend wandpatroon: ${kind}`);
}

export function renderWallSymbol(kind, options = {}) {
  const title = options.title ?? kind;
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-linecap="round" stroke-linejoin="round"><title>${esc(title)}</title><desc>Tekstvrij wandpatroon: ${esc(kind)}.</desc>${bodyFor(kind)}</svg>\n`;
}

export function generateWallSymbols(root) {
  const output = new Map();
  for (const collectionId of WALL_COLLECTIONS) {
    const collectionDir = join(root, 'collections', collectionId);
    const collection = JSON.parse(readFileSync(join(collectionDir, 'collection.json'), 'utf8'));
    const symbolDir = join(collectionDir, 'symbols');
    for (const file of readdirSync(symbolDir).filter(name => name.endsWith('.svg')).sort()) {
      const kind = classifyWallSymbol(file);
      if (!kind) throw new Error(`${collectionId}/${file}: geen wandclassificatie`);
      const title = `${collection.name.en}: ${file.slice(0, -4)}`;
      output.set(`collections/${collectionId}/symbols/${file}`, renderWallSymbol(kind, { title }));
    }
  }
  return output;
}

export function checkWallSymbols(root, expected = generateWallSymbols(root)) {
  const errors = [];
  for (const [file, svg] of expected) {
    const absolute = join(root, ...file.split('/'));
    if (!existsSync(absolute)) errors.push(`missing: ${file}`);
    else if (readFileSync(absolute, 'utf8') !== svg) errors.push(`changed: ${file}`);
  }
  return errors;
}

function writeWallSymbols(root, expected) {
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
  const expected = generateWallSymbols(root);
  if (process.argv.includes('--check')) {
    const errors = checkWallSymbols(root, expected);
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
    } else console.log(`Wand-SVG's actueel (${expected.size} bestanden).`);
  } else {
    const changed = writeWallSymbols(root, expected);
    console.log(`Wand-SVG's gebouwd (${changed} gewijzigd, ${expected.size} totaal).`);
  }
}

