import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateSvgPolicy } from './svg-policy.mjs';
import { checkSteelSymbols, generateSteelSymbols } from './steel-symbols.mjs';
import { checkWallSymbols, generateWallSymbols } from './wall-symbols.mjs';

const EXPECTED_VIEWBOX = /<svg\b[^>]*\bviewBox="0 0 64 64"/;
const HORIZONTAL_CENTRELINE = /<line x1="6" y1="32" x2="58" y2="32"\/>/;
const VERTICAL_CENTRELINE = /<line x1="32" y1="6" x2="32" y2="58"\/>/;

function coordinateErrors(svg, label) {
  const errors = [];
  for (const match of svg.matchAll(/\b(?:x|y|x1|y1|x2|y2|cx|cy)="(-?[\d.]+)"/g)) {
    const value = Number(match[1]);
    if (value < 0 || value > 64) errors.push(`${label}: coordinaat ${value} valt buiten de viewBox`);
  }
  return errors;
}

function commonErrors(svg, label) {
  const errors = validateSvgPolicy(svg, label);
  if (!EXPECTED_VIEWBOX.test(svg)) errors.push(`${label}: viewBox moet exact "0 0 64 64" zijn`);
  if (/<text\b/i.test(svg)) errors.push(`${label}: geometrie mag geen <text> bevatten`);
  errors.push(...coordinateErrors(svg, label));
  return errors;
}

export function validateSteelDrawing(svg, label, options = {}) {
  const errors = commonErrors(svg, label);
  if (!HORIZONTAL_CENTRELINE.test(svg) || !VERTICAL_CENTRELINE.test(svg)) {
    errors.push(`${label}: twee begrensde hartlijnen ontbreken`);
  }
  if (options.rounded && !/<path\b[^>]*\bd="[^"]* A[\d.]+ [\d.]+ /.test(svg)) {
    errors.push(`${label}: afgerond profiel mist een SVG-boogcommando`);
  }
  if (options.elevation) {
    const outline = svg.match(/<rect x="[\d.]+" y="[\d.]+" width="([\d.]+)" height="([\d.]+)"/);
    if (!outline || Math.abs(Number(outline[1]) / Number(outline[2]) - 4) > 0.001) {
      errors.push(`${label}: aanzicht wijkt af van de 4h-verhouding`);
    }
  }
  return [...new Set(errors)];
}

export function validateWallDrawing(svg, label) {
  const errors = commonErrors(svg, label);
  if (!/stroke-width="1\.6"/.test(svg)) errors.push(`${label}: contourlijn van 1.6 ontbreekt`);
  if (!/stroke-width="0\.75"/.test(svg)) errors.push(`${label}: hatchlijn van 0.75 ontbreekt`);
  return [...new Set(errors)];
}

export function validateDrawingQuality(root, sources = {}) {
  const steel = sources.steel ?? generateSteelSymbols(root);
  const walls = sources.walls ?? generateWallSymbols(root);
  const errors = [];

  for (const [file, svg] of steel) {
    const elevation = file.endsWith('-elevation.svg');
    const rounded = !elevation && /<desc>Catalogusgedreven doorsnede; vorm (?:i|u|tee|angle)\.<\/desc>/.test(svg);
    errors.push(...validateSteelDrawing(svg, file, { elevation, rounded }));
  }
  for (const [file, svg] of walls) errors.push(...validateWallDrawing(svg, file));
  return errors;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath)) {
  const root = resolve(dirname(scriptPath), '..');
  const steel = generateSteelSymbols(root);
  const walls = generateWallSymbols(root);
  const errors = [
    ...checkSteelSymbols(root, steel),
    ...checkWallSymbols(root, walls),
    ...validateDrawingQuality(root, { steel, walls })
  ];
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else {
    console.log(`Tekenkwaliteit OK (${steel.size} staal- en ${walls.size} wand-SVG's).`);
  }
}
