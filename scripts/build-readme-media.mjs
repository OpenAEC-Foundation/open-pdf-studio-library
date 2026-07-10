// Genereert de preview-sheets (docs/media/*.svg) voor de README uit de
// echte repo-content. Draaien na content-wijzigingen in de getoonde
// collecties: node scripts/build-readme-media.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MEDIA = join(ROOT, 'docs', 'media');
mkdirSync(MEDIA, { recursive: true });

const FONT = 'font-family="system-ui, -apple-system, Segoe UI, sans-serif"';

function symbolSheet(colId, outName) {
  const dir = join(ROOT, 'collections', colId, 'symbols');
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
    const id = f.replace(/\.svg$/, '');
    body += inner;
    body += `<text x="${PAD + col * CELL + CELL / 2}" y="${y + SYM + 13}" font-size="7.5" ${FONT} text-anchor="middle" fill="#78716c">${id}</text>`;
  });
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg">${body}</svg>\n`;
  writeFileSync(join(MEDIA, outName), svg);
  console.log(`${outName}: ${files.length} symbolen`);
}

function stampSheet(cols, outName) {
  const ROWH = 46, PAD = 16, W = 860;
  function measureRows(stamps, maxW) {
    const out = [[]];
    let x = 0;
    for (const s of stamps) {
      const w = s.text.length * 8.4 + 34;
      if (x + w > maxW && out[out.length - 1].length) { out.push([]); x = 0; }
      out[out.length - 1].push({ ...s, w });
      x += w + 10;
    }
    return out;
  }
  let H = PAD;
  const layout = cols.map(c => {
    const stamps = JSON.parse(readFileSync(join(ROOT, `collections/${c.id}/stamps.json`), 'utf8')).stamps;
    const lines = measureRows(stamps, W - PAD * 2);
    H += 24 + lines.length * ROWH + 8;
    return { label: c.label, stamps, lines };
  });
  H += PAD - 8;
  let body = `<rect x="0" y="0" width="${W}" height="${H}" rx="8" fill="#ffffff" stroke="#d6d3cd"/>`;
  let y = PAD;
  for (const r of layout) {
    body += `<text x="${PAD}" y="${y + 14}" font-size="12" font-weight="700" ${FONT} fill="#44403c">${r.label}</text>`;
    y += 24;
    for (const line of r.lines) {
      let x = PAD;
      for (const s of line) {
        body += `<g transform="rotate(-2 ${x + s.w / 2} ${y + 16})">`
          + `<rect x="${x}" y="${y}" width="${s.w}" height="32" rx="6" fill="none" stroke="${s.color}" stroke-width="3"/>`
          + `<text x="${x + s.w / 2}" y="${y + 21}" font-size="13" font-weight="700" letter-spacing="0.5" ${FONT} text-anchor="middle" fill="${s.color}">${s.text}</text>`
          + `</g>`;
        x += s.w + 10;
      }
      y += ROWH;
    }
    y += 8;
  }
  const svg = `<svg viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg">${body}</svg>\n`;
  writeFileSync(join(MEDIA, outName), svg);
  console.log(`${outName}: ${layout.reduce((n, r) => n + r.stamps.length, 0)} stempels`);
}

// Symboolsheets: auto-discovery — elke beschikbare collectie met symbols/
// krijgt automatisch een preview-<id>.svg.
const collectionsDir = join(ROOT, 'collections');
for (const d of readdirSync(collectionsDir).sort()) {
  const jsonPath = join(collectionsDir, d, 'collection.json');
  if (!existsSync(jsonPath) || !existsSync(join(collectionsDir, d, 'symbols'))) continue;
  const c = JSON.parse(readFileSync(jsonPath, 'utf8'));
  if (c.status !== 'available') continue;
  symbolSheet(d, `preview-${d}.svg`);
}

// Banner-collage: één strip met representatieve symbolen uit meerdere collecties.
function banner(picks, outName) {
  const CELL = 62, SYM = 50, PAD = 10;
  const W = picks.length * CELL + PAD * 2, H = SYM + PAD * 2;
  let body = `<rect x="0" y="0" width="${W}" height="${H}" rx="10" fill="#ffffff" stroke="#d6d3cd"/>`;
  picks.forEach(([colId, sym], i) => {
    const x = PAD + i * CELL + (CELL - SYM) / 2;
    body += readFileSync(join(collectionsDir, colId, 'symbols', sym + '.svg'), 'utf8').trim()
      .replace('<svg ', `<svg x="${x}" y="${PAD}" width="${SYM}" height="${SYM}" `);
  });
  writeFileSync(join(MEDIA, outName), `<svg viewBox="0 0 ${W} ${H}" width="${W}" xmlns="http://www.w3.org/2000/svg">${body}</svg>\n`);
  console.log(`${outName}: ${picks.length} symbolen`);
}
banner([
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
], 'banner.svg');

// Stempelsheet: auto-discovery van alle beschikbare stempel-collecties.
const stampCols = readdirSync(collectionsDir)
  .filter(d => existsSync(join(collectionsDir, d, 'stamps.json')))
  .map(d => JSON.parse(readFileSync(join(collectionsDir, d, 'collection.json'), 'utf8')))
  .filter(c => c.status === 'available')
  .sort((a, b) => a.id.localeCompare(b.id))
  .map(c => ({ id: c.id, label: `${c.id} — ${c.name.en}` }));
stampSheet(stampCols, 'preview-stamps.svg');
