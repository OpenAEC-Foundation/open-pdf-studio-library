import test from 'node:test';
import assert from 'node:assert/strict';
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

test('output is deterministic for same input', () => {
  const a = JSON.stringify(buildIndex(countries, collections));
  const b = JSON.stringify(buildIndex([...countries].reverse(), [...collections].reverse()));
  assert.equal(a, b);
});
