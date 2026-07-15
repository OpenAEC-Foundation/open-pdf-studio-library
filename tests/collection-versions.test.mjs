import test from 'node:test';
import assert from 'node:assert/strict';
import {
  compareSemver,
  checkVersionBumps
} from '../scripts/check-collection-versions.mjs';

test('compareSemver compares numeric major, minor and patch segments', () => {
  assert.equal(compareSemver('1.2.3', '1.2.4'), 1);
  assert.equal(compareSemver('1.2.9', '1.3.0'), 1);
  assert.equal(compareSemver('1.9.9', '2.0.0'), 1);
  assert.equal(compareSemver('1.2.3', '1.2.3'), 0);
  assert.equal(compareSemver('2.0.0', '1.9.9'), -1);
});

test('unchanged version is rejected for a changed collection', () => {
  assert.deepEqual(checkVersionBumps(
    new Map([['a', '1.0.0']]),
    new Map([['a', '1.0.0']]),
    new Set(['a'])
  ), ['a: version 1.0.0 moet hoger zijn dan 1.0.0']);
});

test('lower version is rejected and errors are sorted by collection id', () => {
  assert.deepEqual(checkVersionBumps(
    new Map([['z', '2.0.0'], ['a', '1.0.0']]),
    new Map([['z', '1.9.9'], ['a', '0.9.9']]),
    new Set(['z', 'a'])
  ), [
    'a: version 0.9.9 moet hoger zijn dan 1.0.0',
    'z: version 1.9.9 moet hoger zijn dan 2.0.0'
  ]);
});

test('new collections and valid bumps pass', () => {
  assert.deepEqual(checkVersionBumps(
    new Map([['existing', '1.0.0']]),
    new Map([['existing', '1.1.0'], ['new-set', '0.1.0']]),
    new Set(['existing', 'new-set'])
  ), []);
});
