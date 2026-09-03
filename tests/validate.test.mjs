import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'opsl-validate-'));
  mkdirSync(join(root, 'build'));
  mkdirSync(join(root, 'collections', 'test-set'), { recursive: true });
  mkdirSync(join(root, 'countries'));
  cpSync(new URL('../build/validate', import.meta.url), join(root, 'build', 'validate'));
  writeFileSync(join(root, 'collections', 'test-set', 'collection.json'), JSON.stringify({
    id: 'test-set', name: { en: 'Test set' }, sector: 'aec', types: ['symbols'],
    scope: 'international', status: 'planned', version: '1.0.0', license: 'repository'
  }));
  writeFileSync(join(root, 'countries', 'nl.json'), JSON.stringify({
    id: 'nl', name: { en: 'Netherlands' }, flag: 'NL', region: 'europe', wave: 1,
    sectors: { aec: { collections: ['test-set'] } }
  }));
  return root;
}

test('Dynlex validator accepts a valid repository', () => {
  const root = fixture();
  assert.equal(spawnSync(join(root, 'build', 'validate')).status, 0);
});

test('Dynlex validator rejects unknown collection references', () => {
  const root = fixture();
  writeFileSync(join(root, 'countries', 'nl.json'), JSON.stringify({
    id: 'nl', name: { en: 'Netherlands' }, flag: 'NL', region: 'europe', wave: 1,
    sectors: { aec: { collections: ['missing-set'] } }
  }));
  const result = spawnSync(join(root, 'build', 'validate'), { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /onbekende collectie/);
});

test('Dynlex validator rejects unsafe SVG content', () => {
  const root = fixture();
  const collection = join(root, 'collections', 'test-set');
  mkdirSync(join(collection, 'symbols'));
  writeFileSync(join(collection, 'collection.json'), JSON.stringify({
    id: 'test-set', name: { en: 'Test set' }, sector: 'aec', types: ['symbols'],
    scope: 'international', status: 'available', version: '1.0.0', license: 'repository'
  }));
  writeFileSync(join(collection, 'symbols', 'bad.svg'), '<svg viewBox="0 0 64 64"><script/></svg>');
  const result = spawnSync(join(root, 'build', 'validate'), { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /script niet toegestaan/);
});

test('Dynlex validator rejects malformed versions and stamp colors', () => {
  const root = fixture();
  const collection = join(root, 'collections', 'test-set');
  writeFileSync(join(collection, 'collection.json'), JSON.stringify({
    id: 'test-set', name: { en: 'Test set' }, sector: 'aec', types: ['stamps'],
    scope: 'international', status: 'available', version: 'one', license: 'repository'
  }));
  writeFileSync(join(collection, 'stamps.json'), JSON.stringify({
    stamps: [{ id: 'approved', text: 'APPROVED', color: 'green' }]
  }));
  const result = spawnSync(join(root, 'build', 'validate'), { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /version moet x\.y\.z/);
  assert.match(result.stderr, /kleur moet #rrggbb/);
});

test('Dynlex validator rejects malformed hatch line families', () => {
  const root = fixture();
  const collection = join(root, 'collections', 'test-set');
  writeFileSync(join(collection, 'collection.json'), JSON.stringify({
    id: 'test-set', name: { en: 'Test set' }, sector: 'aec', types: ['hatches'],
    scope: 'international', status: 'available', version: '1.0.0', license: 'repository'
  }));
  writeFileSync(join(collection, 'hatches.json'), JSON.stringify({
    hatches: [{ id: 'diagonal', name: { en: 'Diagonal' }, lineFamilies: [{ angle: 'bad' }] }]
  }));
  const result = spawnSync(join(root, 'build', 'validate'), { encoding: 'utf8' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /lijnfamilie bevat geen geldige getallen/);
});
