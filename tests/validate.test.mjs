import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCollectionJson, validateCountryJson, validateSvg, validateStampsJson, validateHatchesJson } from '../scripts/validate.mjs';

const goodCollection = {
  id: 'test-set',
  name: { en: 'Test set' },
  sector: 'aec',
  types: ['symbols'],
  scope: 'international',
  status: 'planned',
  version: '0.1.0',
  license: 'repository'
};

const goodCountry = {
  id: 'nl',
  name: { en: 'Netherlands', nl: 'Nederland' },
  flag: '🇳🇱',
  region: 'europe',
  wave: 1,
  sectors: { aec: { collections: ['test-set'] } }
};

test('valid collection passes', () => {
  assert.deepEqual(validateCollectionJson(goodCollection, 'test-set'), []);
});

test('collection id must match directory name', () => {
  assert.ok(validateCollectionJson(goodCollection, 'other-dir').length > 0);
});

test('collection with unknown sector is rejected', () => {
  assert.ok(validateCollectionJson({ ...goodCollection, sector: 'nope' }, 'test-set').length > 0);
});

test('collection without english name is rejected', () => {
  assert.ok(validateCollectionJson({ ...goodCollection, name: { nl: 'Testset' } }, 'test-set').length > 0);
});

test('market-verified collection requires date and reviewer', () => {
  const data = { ...goodCollection, review: { status: 'market-verified' } };
  const errors = validateCollectionJson(data, 'test-set');
  assert.ok(errors.some(error => error.includes('verifiedAt')));
  assert.ok(errors.some(error => error.includes('verifiedBy')));
});

test('valid provenance and review metadata passes', () => {
  const data = {
    ...goodCollection,
    standardEdition: '2025',
    jurisdiction: ['NL'],
    references: [{ title: 'Public overview', identifier: 'Example 123' }],
    review: {
      status: 'market-verified',
      verifiedAt: '2026-07-15',
      verifiedBy: ['reviewer']
    }
  };
  assert.deepEqual(validateCollectionJson(data, 'test-set'), []);
});

test('valid country passes', () => {
  assert.deepEqual(validateCountryJson(goodCountry, 'nl', new Set(['test-set'])), []);
});

test('country id must match file name', () => {
  assert.ok(validateCountryJson(goodCountry, 'us', new Set(['test-set'])).length > 0);
});

test('country referencing unknown collection is rejected', () => {
  assert.ok(validateCountryJson(goodCountry, 'nl', new Set()).length > 0);
});

test('valid svg passes (xmlns http is allowed)', () => {
  const svg = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="2"><circle cx="32" cy="32" r="20"/></svg>';
  assert.deepEqual(validateSvg(svg, 'a.svg'), []);
});

test('svg without 64x64 viewBox is rejected', () => {
  const svg = '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="20"/></svg>';
  assert.ok(validateSvg(svg, 'a.svg').length > 0);
});

test('svg with external href is rejected', () => {
  const svg = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><image href="https://example.com/x.png"/></svg>';
  assert.ok(validateSvg(svg, 'a.svg').length > 0);
});

test('svg with script tag is rejected', () => {
  const svg = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>';
  assert.ok(validateSvg(svg, 'a.svg').length > 0);
});

for (const [name, body] of [
  ['event handler', '<svg viewBox="0 0 64 64" onload="alert(1)"/>'],
  ['javascript href', '<svg viewBox="0 0 64 64"><a href="javascript:alert(1)">x</a></svg>'],
  ['foreignObject', '<svg viewBox="0 0 64 64"><foreignObject/></svg>'],
  ['doctype', '<!DOCTYPE svg [<!ENTITY x "boom">]><svg viewBox="0 0 64 64"/>'],
  ['animation', '<svg viewBox="0 0 64 64"><animate attributeName="x"/></svg>'],
  ['unknown attribute', '<svg viewBox="0 0 64 64" mystery="x"/>']
]) {
  test(`svg rejects ${name}`, () => {
    assert.ok(validateSvg(body, 'attack.svg').length > 0);
  });
}

const goodStamps = {
  stamps: [
    { id: 'approved', text: 'APPROVED', color: '#22c55e' },
    { id: 'draft', text: 'DRAFT', color: '#3b82f6' }
  ]
};

test('valid stamps.json passes', () => {
  assert.deepEqual(validateStampsJson(goodStamps, 'x/stamps.json'), []);
});

test('stamps.json without stamps array is rejected', () => {
  assert.ok(validateStampsJson({}, 'x/stamps.json').length > 0);
  assert.ok(validateStampsJson({ stamps: [] }, 'x/stamps.json').length > 0);
});

test('stamp with bad id is rejected', () => {
  const bad = { stamps: [{ id: 'Bad ID', text: 'X', color: '#000000' }] };
  assert.ok(validateStampsJson(bad, 'x/stamps.json').length > 0);
});

test('stamp with bad color is rejected', () => {
  const bad = { stamps: [{ id: 'ok', text: 'X', color: 'red' }] };
  assert.ok(validateStampsJson(bad, 'x/stamps.json').length > 0);
});

test('stamp without text is rejected', () => {
  const bad = { stamps: [{ id: 'ok', color: '#000000' }] };
  assert.ok(validateStampsJson(bad, 'x/stamps.json').length > 0);
});

const goodHatches = {
  hatches: [
    { id: 'solid-fill', name: { en: 'Solid' }, lineFamilies: [] },
    { id: 'diag', name: { en: 'Diagonal' }, lineFamilies: [{ angle: 45, originX: 0, originY: 0, deltaX: 0, deltaY: 10 }] }
  ]
};

test('valid hatches.json passes', () => {
  assert.deepEqual(validateHatchesJson(goodHatches, 'x/hatches.json'), []);
});

test('hatches.json without hatches array is rejected', () => {
  assert.ok(validateHatchesJson({}, 'x/hatches.json').length > 0);
  assert.ok(validateHatchesJson({ hatches: [] }, 'x/hatches.json').length > 0);
});

test('hatch without english name is rejected', () => {
  const bad = { hatches: [{ id: 'a', name: {}, lineFamilies: [] }] };
  assert.ok(validateHatchesJson(bad, 'x/hatches.json').length > 0);
});

test('hatch line family with non-numeric angle is rejected', () => {
  const bad = { hatches: [{ id: 'a', name: { en: 'A' }, lineFamilies: [{ angle: 'x', originX: 0, originY: 0, deltaX: 0, deltaY: 10 }] }] };
  assert.ok(validateHatchesJson(bad, 'x/hatches.json').length > 0);
});

test('duplicate hatch ids are rejected', () => {
  const bad = { hatches: [
    { id: 'dup', name: { en: 'A' }, lineFamilies: [] },
    { id: 'dup', name: { en: 'B' }, lineFamilies: [] }
  ] };
  assert.ok(validateHatchesJson(bad, 'x/hatches.json').length > 0);
});

test('duplicate stamp ids are rejected', () => {
  const bad = {
    stamps: [
      { id: 'dup', text: 'A', color: '#000000' },
      { id: 'dup', text: 'B', color: '#111111' }
    ]
  };
  assert.ok(validateStampsJson(bad, 'x/stamps.json').length > 0);
});
