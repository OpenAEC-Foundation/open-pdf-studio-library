import test from 'node:test';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const validate = fileURLToPath(new URL('../build/validate', import.meta.url));
const buildIndex = fileURLToPath(new URL('../build/build-index', import.meta.url));

test('repository content passes the Dynlex validator', () => {
  execFileSync(validate);
});

test('index.json matches the Dynlex generator', () => {
  execFileSync(buildIndex, ['--check']);
});
