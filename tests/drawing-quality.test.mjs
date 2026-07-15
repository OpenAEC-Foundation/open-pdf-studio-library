import test from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  validateDrawingQuality,
  validateSteelDrawing,
  validateWallDrawing
} from '../scripts/drawing-quality.mjs';
import { generateSteelSymbols } from '../scripts/steel-symbols.mjs';
import { generateWallSymbols } from '../scripts/wall-symbols.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('steel quality rejects labels, wrong viewboxes and missing root arcs', () => {
  const bad = '<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M0 0 L1 1"/><text x="1" y="1">I</text></svg>';
  const errors = validateSteelDrawing(bad, 'bad.svg', { rounded: true, elevation: false });
  assert.ok(errors.some(error => error.includes('viewBox')));
  assert.ok(errors.some(error => error.includes('<text>')));
  assert.ok(errors.some(error => error.includes('boogcommando')));
  assert.ok(errors.some(error => error.includes('hartlijnen')));
});

test('steel quality rejects a four-depth elevation whose ratio drifted', () => {
  const bad = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="6" y="24" width="52" height="16"/><g stroke-dasharray="5 2 1 2"><line x1="6" y1="32" x2="58" y2="32"/><line x1="32" y1="6" x2="32" y2="58"/></g></svg>';
  const errors = validateSteelDrawing(bad, 'bad-elevation.svg', { rounded: false, elevation: true });
  assert.ok(errors.some(error => error.includes('4h-verhouding')));
});

test('wall quality rejects embedded labels and missing line profiles', () => {
  const bad = '<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><text x="1" y="1">wall</text></svg>';
  const errors = validateWallDrawing(bad, 'wall.svg');
  assert.ok(errors.some(error => error.includes('<text>')));
  assert.ok(errors.some(error => error.includes('contourlijn')));
  assert.ok(errors.some(error => error.includes('hatchlijn')));
});

test('the complete generated steel and wall corpus meets the drawing contract', () => {
  const errors = validateDrawingQuality(ROOT, {
    steel: generateSteelSymbols(ROOT),
    walls: generateWallSymbols(ROOT)
  });
  assert.deepEqual(errors, []);
});
