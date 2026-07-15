import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { buildIndex } from '../scripts/build-index.mjs';

const collections = [
  {
    id: 'zz-set',
    name: { en: 'ZZ set' },
    sector: 'aec',
    types: ['symbols'],
    scope: 'national',
    status: 'planned',
    version: '0.1.0',
    license: 'repository'
  },
  {
    id: 'aa-set',
    name: { en: 'AA set' },
    sector: 'aec',
    types: ['symbols'],
    standard: 'ISO 7010',
    scope: 'international',
    status: 'available',
    version: '1.0.0',
    license: 'repository',
    symbolCount: 4
  }
];

const countries = [
  {
    id: 'us',
    name: { en: 'United States' },
    flag: '🇺🇸',
    region: 'north-america',
    wave: 1,
    sectors: { aec: { collections: ['aa-set'] } }
  },
  {
    id: 'nl',
    name: { en: 'Netherlands', nl: 'Nederland' },
    flag: '🇳🇱',
    region: 'europe',
    wave: 1,
    sectors: { aec: { collections: ['aa-set', 'zz-set'] } }
  }
];

test('index groups countries by region, europe first', () => {
  const idx = buildIndex(countries, collections);
  assert.equal(idx.formatVersion, 1);
  assert.deepEqual(idx.regions.map(r => r.id), ['europe', 'north-america']);
  assert.equal(idx.regions[0].countries[0].id, 'nl');
});

test('collections map is sorted and carries path + metadata', () => {
  const idx = buildIndex(countries, collections);
  assert.deepEqual(Object.keys(idx.collections), ['aa-set', 'zz-set']);
  assert.equal(idx.collections['aa-set'].path, 'collections/aa-set/');
  assert.equal(idx.collections['aa-set'].standard, 'ISO 7010');
  assert.equal(idx.collections['aa-set'].symbolCount, 4);
  assert.equal(idx.collections['zz-set'].standard, undefined);
});

test('collection entries expose license, description and deterministic integrity', () => {
  const input = [{
    ...collections[1],
    description: { en: 'Available set' },
    files: ['symbols/a.svg'],
    fileContents: { 'symbols/a.svg': '<svg />' }
  }];
  const idx = buildIndex([], input);
  const entry = idx.collections['aa-set'];
  const expected = createHash('sha256').update('<svg />').digest('hex');

  assert.equal(entry.license, 'repository');
  assert.deepEqual(entry.description, { en: 'Available set' });
  assert.deepEqual(entry.files, ['symbols/a.svg']);
  assert.deepEqual(entry.integrity, {
    'symbols/a.svg': `sha256-${expected}`
  });
});

test('integrity keys match files exactly', () => {
  const idx = buildIndex([], [{
    ...collections[1],
    files: ['stamps.json'],
    fileContents: { 'stamps.json': '{"stamps":[]}' }
  }]);
  assert.deepEqual(
    Object.keys(idx.collections['aa-set'].integrity),
    idx.collections['aa-set'].files
  );
});

test('collection provenance metadata is preserved in the index', () => {
  const metadata = {
    standardEdition: '2025',
    jurisdiction: ['NL'],
    references: [{ title: 'Public overview', identifier: 'Example 123' }],
    review: {
      status: 'market-verified',
      verifiedAt: '2026-07-15',
      verifiedBy: ['reviewer']
    }
  };
  const idx = buildIndex([], [{ ...collections[0], ...metadata }]);
  const entry = idx.collections['zz-set'];

  for (const [key, value] of Object.entries(metadata)) {
    assert.deepEqual(entry[key], value, key);
  }
});

test('output is deterministic for same input', () => {
  const a = JSON.stringify(buildIndex(countries, collections));
  const b = JSON.stringify(buildIndex([...countries].reverse(), [...collections].reverse()));
  assert.equal(a, b);
});
