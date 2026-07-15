import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as media from '../scripts/build-readme-media.mjs';

test('escapeXmlText escapes all XML-sensitive characters', () => {
  assert.equal(typeof media.escapeXmlText, 'function');
  assert.equal(
    media.escapeXmlText(`A&B<"quote">'`),
    'A&amp;B&lt;&quot;quote&quot;&gt;&apos;'
  );
});

test('media check reports missing, changed and orphaned files', () => {
  assert.equal(typeof media.checkMediaFiles, 'function');
  const root = mkdtempSync(join(tmpdir(), 'library-media-'));
  mkdirSync(join(root, 'docs', 'media'), { recursive: true });
  writeFileSync(join(root, 'docs', 'media', 'changed.svg'), 'old');
  writeFileSync(join(root, 'docs', 'media', 'orphan.svg'), 'orphan');
  const expected = new Map([
    ['changed.svg', 'new'],
    ['missing.svg', 'new']
  ]);
  assert.deepEqual(media.checkMediaFiles(root, expected), [
    'changed: docs/media/changed.svg',
    'missing: docs/media/missing.svg',
    'orphaned: docs/media/orphan.svg'
  ]);
});
