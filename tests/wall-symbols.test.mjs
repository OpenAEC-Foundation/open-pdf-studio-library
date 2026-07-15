import test from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyWallSymbol,
  generateWallSymbols,
  renderWallSymbol
} from '../scripts/wall-symbols.mjs';
import { validateSvgPolicy } from '../scripts/svg-policy.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('wall filenames map to distinct material and function patterns', () => {
  const cases = {
    'beton.svg': 'concrete',
    'gewapend-beton.svg': 'reinforced-concrete',
    'porenbeton.svg': 'cellular-concrete',
    'brickwork.svg': 'masonry',
    'timber-stud-wall.svg': 'timber-stud',
    'metal-stud-wall.svg': 'metal-stud',
    'shaft-wall.svg': 'shaft',
    'fire-wall-30min.svg': 'fire-single',
    'brandwand-f90.svg': 'fire-double',
    'cavity-wall.svg': 'cavity'
  };
  for (const [file, expected] of Object.entries(cases)) {
    assert.equal(classifyWallSymbol(file), expected, file);
  }
});

test('wall renderings are text-free, safe and use the shared line profile', () => {
  for (const kind of ['concrete', 'reinforced-concrete', 'cellular-concrete', 'masonry', 'timber-stud', 'metal-stud', 'shaft', 'fire-single', 'fire-double', 'cavity']) {
    const svg = renderWallSymbol(kind, { title: kind });
    assert.match(svg, /^<svg viewBox="0 0 64 64"/);
    assert.doesNotMatch(svg, /<text\b/i);
    assert.match(svg, /stroke-width="1.6"/);
    assert.match(svg, /stroke-width="0.75"/);
    assert.deepEqual(validateSvgPolicy(svg, kind), [], kind);
  }
});

test('all wall geometry coordinates stay inside the drawing canvas', () => {
  const generated = generateWallSymbols(ROOT);
  assert.equal(generated.size, 35);
  for (const [file, svg] of generated) {
    const attributes = [...svg.matchAll(/\b(?:x|y|x1|y1|x2|y2|cx|cy)="(-?[\d.]+)"/g)];
    for (const match of attributes) {
      const value = Number(match[1]);
      assert.ok(value >= 0 && value <= 64, `${file}: coordinaat ${value} buiten viewBox`);
    }
  }
});

test('single and double fire barriers remain geometrically distinguishable', () => {
  const single = renderWallSymbol('fire-single');
  const double = renderWallSymbol('fire-double');
  assert.equal((single.match(/stroke-dasharray="6 3"/g) || []).length, 1);
  assert.equal((double.match(/stroke-dasharray="6 3"/g) || []).length, 2);
});
