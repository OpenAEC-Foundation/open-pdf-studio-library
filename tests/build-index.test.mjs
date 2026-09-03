import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'opsl-index-'));
  mkdirSync(join(root, 'build'));
  mkdirSync(join(root, 'collections', 'zz-set'), { recursive: true });
  mkdirSync(join(root, 'collections', 'aa-set', 'symbols'), { recursive: true });
  mkdirSync(join(root, 'countries'));
  cpSync(new URL('../build/build-index', import.meta.url), join(root, 'build', 'build-index'));
  const base = {
    name: { en: 'Set' }, sector: 'aec', types: ['symbols'], scope: 'international',
    status: 'available', version: '1.0.0', license: 'repository'
  };
  writeFileSync(join(root, 'collections', 'aa-set', 'collection.json'), JSON.stringify({ id: 'aa-set', ...base, standard: 'ISO 7010' }));
  writeFileSync(join(root, 'collections', 'aa-set', 'symbols', 'b.svg'), '<svg/>');
  writeFileSync(join(root, 'collections', 'aa-set', 'symbols', 'a.svg'), '<svg/>');
  writeFileSync(join(root, 'collections', 'zz-set', 'collection.json'), JSON.stringify({ id: 'zz-set', ...base, status: 'planned' }));
  writeFileSync(join(root, 'countries', 'us.json'), JSON.stringify({ id: 'us', name: { en: 'US' }, flag: 'US', region: 'north-america', wave: 1, sectors: {} }));
  writeFileSync(join(root, 'countries', 'nl.json'), JSON.stringify({ id: 'nl', name: { en: 'NL' }, flag: 'NL', region: 'europe', wave: 1, sectors: {} }));
  return root;
}

test('Dynlex index builder is sorted, deterministic, and checkable', () => {
  const root = fixture();
  execFileSync(join(root, 'build', 'build-index'));
  const first = readFileSync(join(root, 'index.json'), 'utf8');
  const index = JSON.parse(first);
  assert.deepEqual(index.regions.map(region => region.id), ['europe', 'north-america']);
  assert.deepEqual(Object.keys(index.collections), ['aa-set', 'zz-set']);
  assert.deepEqual(index.collections['aa-set'].files, ['symbols/a.svg', 'symbols/b.svg']);
  assert.equal(index.collections['aa-set'].symbolCount, 2);
  execFileSync(join(root, 'build', 'build-index'), ['--check']);
  execFileSync(join(root, 'build', 'build-index'));
  assert.equal(readFileSync(join(root, 'index.json'), 'utf8'), first);
});
