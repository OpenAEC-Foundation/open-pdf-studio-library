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

test('quality gate scripts and accurate coverage copy are present', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  assert.equal(pkg.scripts['check-media'], 'node scripts/build-readme-media.mjs --check');
  assert.equal(pkg.scripts['check-versions'], 'node scripts/check-collection-versions.mjs');
  assert.doesNotMatch(readme, /all of Europe/i);
  assert.doesNotMatch(readme, /complete national symbol sets/i);
  assert.match(readme, /all EU countries/i);
  assert.match(readme, /production-ready core collections/i);
});
