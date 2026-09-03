import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function catalog(id) {
  return JSON.parse(readFileSync(new URL(`../collections/${id}/parametric.json`, import.meta.url), 'utf8'));
}

function findSize(source, familyId, designation) {
  const family = source.families.find(entry => entry.id === familyId);
  assert.ok(family, `familie ${familyId} ontbreekt`);
  const row = family.sizes.find(entry => entry[0] === designation);
  assert.ok(row, `maat ${designation} ontbreekt in ${familyId}`);
  return row;
}

test('known international steel dimensions remain intact', () => {
  assert.deepEqual(findSize(catalog('en-steel-profiles'), 'hea', 'HEA 200'), ['HEA 200', 190, 200, 6.5, 10, 18]);
  assert.deepEqual(findSize(catalog('en-steel-profiles'), 'ipe', 'IPE 300'), ['IPE 300', 300, 150, 7.1, 10.7, 15]);
  assert.deepEqual(findSize(catalog('aisc-steel-shapes'), 'w-shapes', 'W12x26').slice(1, 5), [310, 165, 5.8, 9.7]);
  assert.deepEqual(findSize(catalog('uk-steel-sections'), 'ub', 'UB 305x165x40').slice(1, 5), [303.4, 165, 6, 10.2]);
  assert.deepEqual(findSize(catalog('jis-steel-shapes'), 'h-wide', 'H 300x300x10x15').slice(1, 5), [300, 300, 10, 15]);
  assert.deepEqual(findSize(catalog('is-steel-shapes'), 'ismb', 'ISMB 300').slice(1, 5), [300, 140, 7.5, 12.4]);
});

test('required national catalogs retain their family order', () => {
  const expected = {
    'aisc-steel-shapes': ['w-shapes', 's-shapes', 'c-channels', 'l-angles', 'hss'],
    'uk-steel-sections': ['ub', 'uc', 'pfc', 'uka'],
    'jis-steel-shapes': ['h-wide', 'h-middle', 'h-narrow', 'channels'],
    'gb-steel-shapes': ['hw', 'hm', 'hn', 'i-beams'],
    'is-steel-shapes': ['ismb', 'ishb', 'ismc', 'isa'],
    'au-steel-sections': ['ub', 'uc', 'pfc'],
    'gost-steel-shapes': ['i-beams', 'channels'],
    'en-steel-profiles': ['hea', 'heb', 'hem', 'ipe', 'upn', 'angle', 'tee', 'hollow', 'chs'],
    'ks-steel-shapes': ['h-wide', 'h-narrow'],
    'br-steel-shapes': ['w-beams', 'w-columns']
  };
  for (const [id, families] of Object.entries(expected)) {
    assert.deepEqual(catalog(id).families.map(family => family.id), families, id);
  }
});
