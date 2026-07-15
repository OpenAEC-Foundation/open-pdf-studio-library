// Controleert dat gewijzigde bestaande collecties een strikt hogere semver
// hebben dan in de opgegeven Git-basisref.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

function parseSemver(value) {
  const match = SEMVER.exec(value);
  if (!match) throw new Error(`ongeldige semver: ${value}`);
  return match.slice(1).map(Number);
}

export function compareSemver(previous, current) {
  const before = parseSemver(previous);
  const after = parseSemver(current);
  for (let i = 0; i < before.length; i += 1) {
    if (after[i] > before[i]) return 1;
    if (after[i] < before[i]) return -1;
  }
  return 0;
}

export function checkVersionBumps(previousById, currentById, changedIds) {
  const errors = [];
  for (const id of [...changedIds].sort()) {
    if (!previousById.has(id) || !currentById.has(id)) continue;
    const previous = previousById.get(id);
    const current = currentById.get(id);
    if (compareSemver(previous, current) <= 0) {
      errors.push(`${id}: version ${current} moet hoger zijn dan ${previous}`);
    }
  }
  return errors;
}

function git(args, cwd = ROOT) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
  });
}

function readVersionFromWorktree(root, id) {
  const path = join(root, 'collections', id, 'collection.json');
  if (!existsSync(path)) return undefined;
  return JSON.parse(readFileSync(path, 'utf8')).version;
}

function readVersionFromRef(root, base, id) {
  try {
    const json = git(['show', `${base}:collections/${id}/collection.json`], root);
    return JSON.parse(json).version;
  } catch {
    return undefined;
  }
}

function main() {
  const args = process.argv.slice(2);
  const baseIndex = args.indexOf('--base');
  const base = baseIndex >= 0 ? args[baseIndex + 1] : undefined;
  if (!base) {
    console.error('Gebruik: node scripts/check-collection-versions.mjs --base <git-ref>');
    process.exit(1);
  }

  let changedOutput;
  try {
    changedOutput = git(['diff', '--name-only', base, '--', 'collections']);
  } catch (error) {
    console.error(`Basisref "${base}" kan niet worden vergeleken: ${error.message}`);
    process.exit(1);
  }

  const changedIds = new Set(
    changedOutput
      .split(/\r?\n/)
      .map(path => path.replaceAll('\\', '/'))
      .map(path => /^collections\/([^/]+)\//.exec(path)?.[1])
      .filter(Boolean)
  );
  const previousById = new Map();
  const currentById = new Map();
  for (const id of changedIds) {
    const previous = readVersionFromRef(ROOT, base, id);
    const current = readVersionFromWorktree(ROOT, id);
    if (previous !== undefined) previousById.set(id, previous);
    if (current !== undefined) currentById.set(id, current);
  }

  const errors = checkVersionBumps(previousById, currentById, changedIds);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exit(1);
  }
  console.log(`Collectieversies OK (${changedIds.size} gewijzigd)`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
