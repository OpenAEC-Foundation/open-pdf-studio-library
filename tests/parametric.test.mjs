import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateParametricJson } from '../scripts/validate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const COLLECTIONS = join(ROOT, 'collections');

function loadJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function steelCollections() {
  return readdirSync(COLLECTIONS).filter(dir => {
    const p = join(COLLECTIONS, dir, 'collection.json');
    if (!existsSync(p)) return false;
    const c = loadJson(p);
    // *-drafting-parametric-collecties zijn nog 'planned' zonder content.
    return c.types.includes('parametric') && c.status === 'available';
  });
}

function findSize(catalog, familyId, designation) {
  const fam = catalog.families.find(f => f.id === familyId);
  assert.ok(fam, `familie ${familyId} ontbreekt`);
  const row = fam.sizes.find(s => s[0] === designation);
  assert.ok(row, `maat ${designation} ontbreekt in ${familyId}`);
  return row;
}

test('every parametric collection ships a valid steel-sections catalog', () => {
  const dirs = steelCollections();
  assert.ok(dirs.length >= 10, `verwacht >= 10 parametrische collecties, kreeg ${dirs.length}`);
  for (const dir of dirs) {
    const p = join(COLLECTIONS, dir, 'parametric.json');
    assert.ok(existsSync(p), `${dir}: parametric.json ontbreekt`);
    assert.deepEqual(validateParametricJson(loadJson(p), dir), []);
  }
});

test('good catalog passes, broken catalogs are rejected', () => {
  const good = {
    format: 'steel-sections',
    formatVersion: 1,
    units: 'mm',
    label: { en: 'Test steel' },
    families: [{
      id: 'test',
      name: { en: 'Test' },
      shape: 'i',
      columns: ['designation', 'h', 'b', 'tw', 'tf', 'r'],
      defaultSize: 'T 100',
      sizes: [['T 100', 100, 100, 6, 8, 10]]
    }]
  };
  assert.deepEqual(validateParametricJson(good, 't'), []);

  const clone = () => JSON.parse(JSON.stringify(good));
  let bad = clone(); bad.format = 'other';
  assert.ok(validateParametricJson(bad, 't').length > 0, 'onbekend format');
  bad = clone(); bad.families[0].columns = ['designation', 'h', 'b', 't'];
  assert.ok(validateParametricJson(bad, 't').length > 0, 'kolommen passen niet bij vorm');
  bad = clone(); bad.families[0].sizes = [['T 100', 100, 100, 6]];
  assert.ok(validateParametricJson(bad, 't').length > 0, 'rijlengte fout');
  bad = clone(); bad.families[0].sizes = [['T 100', 100, 100, 120, 8, 10]];
  assert.ok(validateParametricJson(bad, 't').length > 0, 'tw >= b afgekeurd');
  bad = clone(); bad.families[0].defaultSize = 'T 999';
  assert.ok(validateParametricJson(bad, 't').length > 0, 'defaultSize moet bestaan');
  bad = clone(); bad.families[0].sizes = [['T 100', 100, -5, 6, 8, 10]];
  assert.ok(validateParametricJson(bad, 't').length > 0, 'negatieve maat afgekeurd');
  bad = clone(); bad.families.push(clone().families[0]);
  assert.ok(validateParametricJson(bad, 't').length > 0, 'dubbele familie-id afgekeurd');
});

test('known AISC W12x26 dimensions', () => {
  const cat = loadJson(join(COLLECTIONS, 'aisc-steel-shapes', 'parametric.json'));
  const [, h, b, tw, tf] = findSize(cat, 'w-shapes', 'W12x26');
  assert.equal(h, 310);
  assert.equal(b, 165);
  assert.equal(tw, 5.8);
  assert.equal(tf, 9.7);
});

test('known UK UB 305x165x40 dimensions', () => {
  const cat = loadJson(join(COLLECTIONS, 'uk-steel-sections', 'parametric.json'));
  const [, h, b, tw, tf] = findSize(cat, 'ub', 'UB 305x165x40');
  assert.equal(h, 303.4);
  assert.equal(b, 165);
  assert.equal(tw, 6);
  assert.equal(tf, 10.2);
});

test('known JIS H 300x300 dimensions', () => {
  const cat = loadJson(join(COLLECTIONS, 'jis-steel-shapes', 'parametric.json'));
  const [, h, b, tw, tf] = findSize(cat, 'h-wide', 'H 300x300x10x15');
  assert.equal(h, 300);
  assert.equal(b, 300);
  assert.equal(tw, 10);
  assert.equal(tf, 15);
});

test('known ISMB 300 dimensions', () => {
  const cat = loadJson(join(COLLECTIONS, 'is-steel-shapes', 'parametric.json'));
  const [, h, b, tw, tf] = findSize(cat, 'ismb', 'ISMB 300');
  assert.equal(h, 300);
  assert.equal(b, 140);
  assert.equal(tw, 7.5);
  assert.equal(tf, 12.4);
});

test('EN catalog matches the built-in NL app tables for HEA 200 and IPE 300', () => {
  const cat = loadJson(join(COLLECTIONS, 'en-steel-profiles', 'parametric.json'));
  assert.deepEqual(findSize(cat, 'hea', 'HEA 200'), ['HEA 200', 190, 200, 6.5, 10, 18]);
  assert.deepEqual(findSize(cat, 'ipe', 'IPE 300'), ['IPE 300', 300, 150, 7.1, 10.7, 15]);
});

test('required national catalogs carry their main families', () => {
  const expect = {
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
  for (const [cid, fams] of Object.entries(expect)) {
    const cat = loadJson(join(COLLECTIONS, cid, 'parametric.json'));
    const have = cat.families.map(f => f.id);
    assert.deepEqual(have, fams, `${cid}: families`);
  }
});
