import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAll } from '../scripts/validate.mjs';
import { buildIndex, loadData } from '../scripts/build-index.mjs';
import * as validation from '../scripts/validate.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('repo content validates clean', () => {
  assert.deepEqual(runAll(ROOT), []);
});

test('index.json exists and matches generated output', () => {
  assert.ok(existsSync(join(ROOT, 'index.json')), 'index.json ontbreekt — draai build-index');
  const { countries, collections } = loadData(ROOT);
  const expected = JSON.stringify(buildIndex(countries, collections), null, 2) + '\n';
  assert.equal(readFileSync(join(ROOT, 'index.json'), 'utf8'), expected);
});

test('generated index satisfies its public schema', () => {
  assert.equal(typeof validation.validateIndexJson, 'function');
  const data = JSON.parse(readFileSync(join(ROOT, 'index.json'), 'utf8'));
  assert.deepEqual(validation.validateIndexJson(data, 'index.json'), []);
});
