import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  generateSteelSymbols,
  renderSteelElevation,
  renderSteelSection,
  rowToSection
} from '../scripts/steel-symbols.mjs';
import { validateSvgPolicy } from '../scripts/svg-policy.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadCatalog(id) {
  return JSON.parse(readFileSync(join(ROOT, 'collections', id, 'parametric.json'), 'utf8'));
}

function defaultFamily(catalog, id) {
  const family = catalog.families.find(candidate => candidate.id === id);
  assert.ok(family, `familie ${id} ontbreekt`);
  return family;
}

test('HEA 200 is read from the catalog without losing dimensions', () => {
  const family = defaultFamily(loadCatalog('en-steel-profiles'), 'hea');
  assert.deepEqual(rowToSection(family), {
    designation: 'HEA 200',
    shape: 'i',
    h: 190,
    b: 200,
    tw: 6.5,
    tf: 10,
    r: 18
  });
});

test('rounded steel cross-sections use arcs, bounded centrelines and no labels', () => {
  const family = defaultFamily(loadCatalog('en-steel-profiles'), 'hea');
  const svg = renderSteelSection(rowToSection(family), { title: 'HEA 200' });

  assert.match(svg, /<path d="[^"]* A[\d.]+ [\d.]+ /);
  assert.match(svg, /<g stroke-width="0.7" stroke-dasharray="5 2 1 2">/);
  assert.doesNotMatch(svg, /<text\b/i);
  assert.match(svg, /<line x1="6" y1="32" x2="58" y2="32"/);
  assert.match(svg, /<line x1="32" y1="6" x2="32" y2="58"/);
  assert.deepEqual(validateSvgPolicy(svg, 'hea'), []);
});

test('fallback elevation uses an explicit four-depth exemplar length', () => {
  const family = defaultFamily(loadCatalog('en-steel-profiles'), 'hea');
  const svg = renderSteelElevation(rowToSection(family), { title: 'HEA 200 elevation' });
  const outline = svg.match(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/);

  assert.ok(outline, 'aanzicht bevat een buitencontour');
  assert.equal(Number(outline[3]) / Number(outline[4]), 4);
  assert.doesNotMatch(svg, /<text\b/i);
  assert.deepEqual(validateSvgPolicy(svg, 'hea-elevation'), []);
});

test('all steel source files have a deterministic generated counterpart', () => {
  const generated = generateSteelSymbols(ROOT);
  assert.ok(generated.size >= 150, `verwacht minimaal 150 staal-SVG's, kreeg ${generated.size}`);
  assert.ok(generated.has('collections/en-steel-profiles/symbols/hea.svg'));
  assert.ok(generated.has('collections/aisc-steel-shapes/symbols/w-shape.svg'));
  assert.ok(generated.has('collections/uk-steel-sections/symbols/i-beam-elevation.svg'));

  for (const [file, svg] of generated) {
    assert.doesNotMatch(svg, /<text\b/i, file);
    assert.match(svg, /^<svg viewBox="0 0 64 64"/, file);
    assert.deepEqual(validateSvgPolicy(svg, file), [], file);
  }
});
