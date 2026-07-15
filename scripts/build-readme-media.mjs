// Genereert de preview-sheets (docs/media/*.svg) uit de echte repo-content.
// Zonder argumenten worden bestanden geschreven; --check vergelijkt alleen.
import {
  readFileSync,
  readdirSync,
  writeFileSync,
  mkdirSync,
  existsSync,
  unlinkSync
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const FONT = 'font-family="system-ui, -apple-system, Segoe UI, sans-serif"';

export function escapeXmlText(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function symbolSheet(root, colId) {
  const dir = join(root, 'collections', colId, 'symbols');
  const files = readdirSync(dir).filter(f => f.endsWith('.svg')).sort();
  const COLS = 8, CELL = 84, SYM = 52, PAD = 12;
  const rows = Math.ceil(files.length / COLS);
  const W = COLS * CELL + PAD * 2;
  const H = rows * (CELL + 14) + PAD * 2;
  let body = `<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#ffffff" stroke="#d6d3cd"/>`;
  files.forEach((f, i) => {
    const col = i % COLS, row = Math.floor(i / COLS);
    const x = PAD + col * CELL + (CELL - SYM) / 2;
    const y = PAD + row * (CELL + 14) + 6;
    const inner = readFileSync(join(dir, f), 'utf8').trim()
      .replace('<svg ', `<svg x="${x}" y="${y}" width="${SYM}" height="${SYM}" `);
    const id = escapeXmlText(f.replace(/\.svg$/, ''));
    body += inner;
    body += `<text x="${PAD + col * CELL + CELL / 2}" y="${y + SYM + 13}" font-size="7.5" ${FONT} text-anchor="middle" fill="#78716c">${id}</text>`;
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg">${body}</svg>\n`;
}

function stampSheet(root, cols) {
  const ROWH = 46, PAD = 16, W = 860;
  function measureRows(stamps, maxW) {
    const out = [[]];
    let x = 0;
    for (const stamp of stamps) {
      const w = stamp.text.length * 8.4 + 34;
      if (x + w > maxW && out[out.length - 1].length) {
        out.push([]);
        x = 0;
      }
      out[out.length - 1].push({ ...stamp, w });
      x += w + 10;
    }
    return out;
  }

  let H = PAD;
  const layout = cols.map(c => {
    const stamps = JSON.parse(
      readFileSync(join(root, `collections/${c.id}/stamps.json`), 'utf8')
    ).stamps;
    const lines = measureRows(stamps, W - PAD * 2);
    H += 24 + lines.length * ROWH + 8;
    return { label: c.label, stamps, lines };
  });
  H += PAD - 8;

  let body = `<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#ffffff" stroke="#d6d3cd"/>`;
  let y = PAD;
  for (const row of layout) {
    body += `<text x="${PAD}" y="${y + 14}" font-size="12" font-weight="700" ${FONT} fill="#44403c">${escapeXmlText(row.label)}</text>`;
    y += 24;
    for (const line of row.lines) {
      let x = PAD;
      for (const stamp of line) {
        body += `<g transform="rotate(-2 ${x + stamp.w / 2} ${y + 16})">`
          + `<rect x="${x}" y="${y}" width="${stamp.w}" height="32" rx="6" fill="none" stroke="${stamp.color}" stroke-width="3"/>`
          + `<text x="${x + stamp.w / 2}" y="${y + 21}" font-size="13" font-weight="700" letter-spacing="0.5" ${FONT} text-anchor="middle" fill="${stamp.color}">${escapeXmlText(stamp.text)}</text>`
          + '</g>';
        x += stamp.w + 10;
      }
      y += ROWH;
    }
    y += 8;
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg">${body}</svg>\n`;
}

function banner(root, picks) {
  const collectionsDir = join(root, 'collections');
  const CELL = 62, SYM = 50, PAD = 10;
  const W = picks.length * CELL + PAD * 2, H = SYM + PAD * 2;
  let body = `<rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="#ffffff" stroke="#d6d3cd"/>`;
  picks.forEach(([colId, sym], i) => {
    const x = PAD + i * CELL + (CELL - SYM) / 2;
    body += readFileSync(join(collectionsDir, colId, 'symbols', `${sym}.svg`), 'utf8').trim()
      .replace('<svg ', `<svg x="${x}" y="${PAD}" width="${SYM}" height="${SYM}" `);
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg">${body}</svg>\n`;
}

export function buildMediaFiles(root = ROOT) {
  const output = new Map();
  const collectionsDir = join(root, 'collections');

  for (const dir of readdirSync(collectionsDir).sort()) {
    const jsonPath = join(collectionsDir, dir, 'collection.json');
    if (!existsSync(jsonPath) || !existsSync(join(collectionsDir, dir, 'symbols'))) continue;
    const collection = JSON.parse(readFileSync(jsonPath, 'utf8'));
    if (collection.status !== 'available') continue;
    output.set(`preview-${dir}.svg`, symbolSheet(root, dir));
  }

  output.set('banner.svg', banner(root, [
    ['iso7010-safety', 'escape-exit-right'],
    ['nen1414-fire', 'brandslanghaspel'],
    ['nl-wall-types', 'metselwerk'],
    ['nfpa170-fire', 'smoke-detector'],
    ['din14034-fire', 'ueberflurhydrant'],
    ['uk-fire-symbols', 'hose-reel'],
    ['en-steel-profiles', 'heb'],
    ['aisc-steel-shapes', 'w-shape'],
    ['jis-steel-shapes', 'h-shape-wide'],
    ['iec60617-electrical', 'switch-two-way'],
    ['iso10628-pid', 'control-valve'],
    ['common-hvac-symbols', 'supply-diffuser'],
    ['common-north-arrows', 'north-arrow-classic']
  ]));

  const stampCols = readdirSync(collectionsDir)
    .filter(dir => existsSync(join(collectionsDir, dir, 'stamps.json')))
    .map(dir => JSON.parse(readFileSync(join(collectionsDir, dir, 'collection.json'), 'utf8')))
    .filter(collection => collection.status === 'available')
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(collection => ({
      id: collection.id,
      label: `${collection.id} — ${collection.name.en}`
    }));
  output.set('preview-stamps.svg', stampSheet(root, stampCols));
  return output;
}

export function checkMediaFiles(root, expected) {
  const mediaDir = join(root, 'docs', 'media');
  const existing = existsSync(mediaDir)
    ? readdirSync(mediaDir).filter(file => file.endsWith('.svg')).sort()
    : [];
  const changed = [];
  const missing = [];
  const orphaned = [];

  for (const [name, content] of expected) {
    const path = join(mediaDir, name);
    if (!existsSync(path)) missing.push(`missing: docs/media/${name}`);
    else if (readFileSync(path, 'utf8') !== content) changed.push(`changed: docs/media/${name}`);
  }
  for (const name of existing) {
    if (!expected.has(name)) orphaned.push(`orphaned: docs/media/${name}`);
  }
  return [...changed.sort(), ...missing.sort(), ...orphaned.sort()];
}

function writeMediaFiles(root, expected) {
  const mediaDir = join(root, 'docs', 'media');
  mkdirSync(mediaDir, { recursive: true });
  for (const [name, content] of expected) {
    writeFileSync(join(mediaDir, name), content);
    console.log(`${name} geschreven`);
  }
  for (const error of checkMediaFiles(root, expected)) {
    if (!error.startsWith('orphaned: ')) continue;
    const relative = error.slice('orphaned: '.length);
    unlinkSync(join(root, ...relative.split('/')));
    console.log(`${relative} verwijderd`);
  }
}

function main() {
  const expected = buildMediaFiles(ROOT);
  if (process.argv.includes('--check')) {
    const errors = checkMediaFiles(ROOT, expected);
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exit(1);
    }
    console.log('README-media actueel');
    return;
  }
  writeMediaFiles(ROOT, expected);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
