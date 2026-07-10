// Genereert de preview-sheets (docs/media/*.svg) voor de README uit de
// echte repo-content. Draaien na content-wijzigingen in de getoonde
// collecties: node scripts/build-readme-media.mjs
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
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

symbolSheet('nfpa170-fire', 'preview-nfpa170-fire.svg');
symbolSheet('din14034-fire', 'preview-din14034-fire.svg');
symbolSheet('uk-fire-symbols', 'preview-uk-fire-symbols.svg');
symbolSheet('aisc-steel-shapes', 'preview-aisc-steel-shapes.svg');
symbolSheet('us-wall-types', 'preview-us-wall-types.svg');
symbolSheet('common-north-arrows', 'preview-north-arrows.svg');
stampSheet(
  [
    { id: 'us-stamps', label: 'us-stamps (United States)' },
    { id: 'de-stamps', label: 'de-stamps (Deutschland)' },
    { id: 'uk-stamps', label: 'uk-stamps (United Kingdom)' },
    { id: 'fr-stamps', label: 'fr-stamps (France)' },
    { id: 'it-stamps', label: 'it-stamps (Italia)' },
    { id: 'es-stamps', label: 'es-stamps (España)' },
    { id: 'pt-stamps', label: 'pt-stamps (Portugal)' },
    { id: 'tr-stamps', label: 'tr-stamps (Türkiye)' },
    { id: 'il-stamps', label: 'il-stamps (ישראל)' },
    { id: 'in-stamps', label: 'in-stamps (India)' },
    { id: 'br-stamps', label: 'br-stamps (Brasil)' },
    { id: 'cn-stamps', label: 'cn-stamps (中国)' },
    { id: 'ru-stamps', label: 'ru-stamps (Россия)' },
    { id: 'jp-stamps', label: 'jp-stamps (日本)' },
    { id: 'kr-stamps', label: 'kr-stamps (대한민국)' },
    { id: 'au-stamps', label: 'au-stamps (Australia)' }
  ],
  'preview-stamps.svg'
);
