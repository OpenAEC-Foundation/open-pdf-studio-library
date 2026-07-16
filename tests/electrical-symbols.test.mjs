import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ELECTRICAL_COLLECTIONS,
  checkElectricalSymbols,
  classifyElectricalSymbol,
  generateElectricalSymbols,
  renderElectricalSymbol
} from '../scripts/electrical-symbols.mjs';
import { validateSvgPolicy } from '../scripts/svg-policy.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('electrical contract contains six collections and 114 unique files', () => {
  assert.equal(Object.keys(ELECTRICAL_COLLECTIONS).length, 6);
  const paths = Object.entries(ELECTRICAL_COLLECTIONS).flatMap(([collection, config]) =>
    config.files.map(file => `${collection}/${file}`)
  );
  assert.equal(paths.length, 114);
  assert.equal(new Set(paths).size, 114);
  assert.equal(ELECTRICAL_COLLECTIONS['iec60617-electrical'].files.length, 36);
});

test('every managed electrical filename has a semantic classification', () => {
  for (const [collection, config] of Object.entries(ELECTRICAL_COLLECTIONS)) {
    const sorted = [...config.files].sort();
    assert.deepEqual(config.files, sorted, `${collection}: bestanden zijn niet gesorteerd`);
    for (const file of config.files) {
      const classification = classifyElectricalSymbol(file);
      assert.ok(classification?.kind, `${collection}/${file}: classificatie ontbreekt`);
      assert.ok(Array.isArray(classification.qualifiers), `${collection}/${file}: qualifiers ontbreken`);
    }
  }
});

test('specific electrical variants classify without text labels', () => {
  assert.deepEqual(classifyElectricalSymbol('socket-earthed.svg'), {
    kind: 'socket', qualifiers: ['single', 'earthed']
  });
  assert.deepEqual(classifyElectricalSymbol('gfci-receptacle.svg'), {
    kind: 'socket', qualifiers: ['double', 'protected']
  });
  assert.deepEqual(classifyElectricalSymbol('switch-three-way.svg'), {
    kind: 'switch', qualifiers: ['three-way']
  });
  assert.deepEqual(classifyElectricalSymbol('motor-three-phase.svg'), {
    kind: 'motor', qualifiers: ['three-phase']
  });
  assert.deepEqual(classifyElectricalSymbol('smoke-detector.svg'), {
    kind: 'detector', qualifiers: ['smoke']
  });
  assert.deepEqual(classifyElectricalSymbol('visual-alarm-device.svg'), {
    kind: 'alarm', qualifiers: ['visual']
  });
});

test('every managed electrical symbol renders with the shared safe drawing profile', () => {
  for (const [collection, config] of Object.entries(ELECTRICAL_COLLECTIONS)) {
    for (const file of config.files) {
      const svg = renderElectricalSymbol(classifyElectricalSymbol(file), {
        profile: config.profile,
        title: `${collection}: ${file}`,
        fileName: file
      });
      assert.match(svg, /^<svg viewBox="0 0 64 64"/i, `${collection}/${file}`);
      assert.doesNotMatch(svg, /<text\b/i, `${collection}/${file}`);
      assert.match(svg, /stroke-width="1.6"/, `${collection}/${file}: hoofdcontour`);
      assert.match(svg, /stroke-width="0.8"/, `${collection}/${file}: detaillijn`);
      assert.match(svg, /stroke-linecap="round"/, `${collection}/${file}: lijnuiteinden`);
      assert.deepEqual(validateSvgPolicy(svg, `${collection}/${file}`), []);
      for (const match of svg.matchAll(/\b(?:x|y|x1|y1|x2|y2|cx|cy)="(-?[\d.]+)"/g)) {
        const value = Number(match[1]);
        assert.ok(value >= 4 && value <= 60, `${collection}/${file}: coordinaat ${value}`);
      }
    }
  }
});

test('geometric qualifiers distinguish sockets without letter labels', () => {
  const render = qualifiers => renderElectricalSymbol({ kind: 'socket', qualifiers }, {
    profile: 'iec', title: 'socket', fileName: 'socket.svg'
  });
  const single = render(['single']);
  const earthed = render(['single', 'earthed']);
  const protectedSocket = render(['double', 'protected']);

  assert.notEqual(single, earthed);
  assert.notEqual(single, protectedSocket);
  assert.match(earthed, /stroke-dasharray="1 2"/);
  assert.equal((protectedSocket.match(/r="1\.5" fill="#000" stroke="none"/g) || []).length, 2);
});

test('switch ways and motor phases have distinct countable geometry', () => {
  const render = (kind, qualifiers) => renderElectricalSymbol({ kind, qualifiers }, {
    profile: 'iec', title: kind, fileName: `${kind}.svg`
  });
  const oneWay = render('switch', ['one-way']);
  const threeWay = render('switch', ['three-way']);
  const singlePhase = render('motor', ['single-phase']);
  const threePhase = render('motor', ['three-phase']);

  assert.equal((oneWay.match(/r="2\.2"/g) || []).length, 1);
  assert.equal((threeWay.match(/r="2\.2"/g) || []).length, 3);
  assert.equal((singlePhase.match(/stroke-width="0\.8"/g) || []).length, 1);
  assert.equal((threePhase.match(/<line x1="(?:27|32|37)" y1="27"/g) || []).length, 3);
});

test('generator produces the complete 114-file electrical corpus', () => {
  const generated = generateElectricalSymbols(ROOT);
  assert.equal(generated.size, 114);
  for (const file of [
    'battery.svg', 'circuit-breaker.svg', 'earth.svg', 'emergency-light.svg',
    'fire-alarm-call-point.svg', 'fused-switch.svg', 'generator.svg',
    'heat-detector.svg', 'isolator.svg', 'motor-single-phase.svg',
    'motor-three-phase.svg', 'residual-current-device.svg', 'siren.svg',
    'smoke-detector.svg', 'transformer.svg', 'visual-alarm-device.svg'
  ]) {
    assert.ok(generated.has(`collections/iec60617-electrical/symbols/${file}`), file);
  }
});

test('electrical check reports missing, changed and orphaned files', () => {
  const root = mkdtempSync(join(tmpdir(), 'electrical-check-'));
  const symbolDir = join(root, 'collections', 'iec60617-electrical', 'symbols');
  mkdirSync(symbolDir, { recursive: true });
  const expected = new Map([
    ['collections/iec60617-electrical/symbols/a.svg', '<svg/>\n'],
    ['collections/iec60617-electrical/symbols/missing.svg', '<svg/>\n']
  ]);
  writeFileSync(join(symbolDir, 'a.svg'), '<changed/>\n');
  writeFileSync(join(symbolDir, 'orphan.svg'), '<svg/>\n');

  assert.deepEqual(checkElectricalSymbols(root, expected), [
    'changed: collections/iec60617-electrical/symbols/a.svg',
    'missing: collections/iec60617-electrical/symbols/missing.svg',
    'orphaned: collections/iec60617-electrical/symbols/orphan.svg'
  ]);
});
