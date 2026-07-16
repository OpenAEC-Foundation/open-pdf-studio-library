import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const IEC_FILES = [
  'battery.svg',
  'circuit-breaker.svg',
  'data-outlet.svg',
  'dimmer.svg',
  'distribution-board.svg',
  'doorbell.svg',
  'earth.svg',
  'emergency-light.svg',
  'fire-alarm-call-point.svg',
  'fluorescent-luminaire.svg',
  'fused-switch.svg',
  'generator.svg',
  'heat-detector.svg',
  'isolator.svg',
  'junction-box.svg',
  'light-point.svg',
  'motion-detector.svg',
  'motor-single-phase.svg',
  'motor-three-phase.svg',
  'phone-outlet.svg',
  'push-button.svg',
  'residual-current-device.svg',
  'siren.svg',
  'smoke-detector.svg',
  'socket-double.svg',
  'socket-earthed.svg',
  'socket-single.svg',
  'spotlight.svg',
  'switch-double.svg',
  'switch-single.svg',
  'switch-two-way.svg',
  'thermostat.svg',
  'transformer.svg',
  'tv-outlet.svg',
  'visual-alarm-device.svg',
  'wall-light.svg'
];

export const ELECTRICAL_COLLECTIONS = {
  'au-electrical': {
    profile: 'au',
    files: [
      'ceiling-fan.svg', 'data-outlet.svg', 'downlight.svg', 'exhaust-fan.svg',
      'fan-isolator.svg', 'gpo-double.svg', 'gpo-single.svg',
      'gpo-weatherproof.svg', 'light-point.svg', 'smoke-alarm.svg', 'switch-2way.svg',
      'switch.svg', 'switchboard.svg'
    ]
  },
  'iec60617-electrical': { profile: 'iec', files: IEC_FILES },
  'jp-electrical': {
    profile: 'jp',
    files: [
      'aircon-outlet.svg', 'ceiling-light.svg', 'distribution-board.svg',
      'doorbell.svg', 'downlight.svg', 'fluorescent.svg', 'junction-box.svg',
      'outlet-double.svg', 'outlet-earthed.svg', 'outlet.svg', 'phone-outlet.svg',
      'switch-3way.svg', 'switch.svg', 'tv-outlet.svg'
    ]
  },
  'nl-electrical': {
    profile: 'nl',
    files: [
      'beldrukker.svg', 'cai-aansluiting.svg', 'data-aansluiting.svg', 'dimmer.svg',
      'krachtaansluiting.svg', 'kruisschakelaar.svg', 'lichtpunt-plafond.svg',
      'lichtpunt-wand.svg', 'loze-leiding.svg', 'meterkast.svg',
      'schakelaar-enkelpolig.svg', 'schel.svg', 'serieschakelaar.svg',
      'tl-armatuur.svg', 'wcd-dubbel.svg', 'wcd-enkel.svg', 'wcd-randaarde.svg',
      'wcd-spatwaterdicht.svg', 'wisselschakelaar.svg'
    ]
  },
  'uk-electrical': {
    profile: 'uk',
    files: [
      'consumer-unit.svg', 'cooker-point.svg', 'data-outlet.svg',
      'fused-connection-unit.svg', 'pendant-light.svg', 'shaver-socket.svg',
      'socket-13a-double.svg', 'socket-13a-single.svg', 'switch-1way.svg',
      'switch-2way.svg', 'switch-intermediate.svg', 'switched-socket.svg',
      'tv-outlet.svg'
    ]
  },
  'us-electrical': {
    profile: 'us',
    files: [
      'ceiling-light.svg', 'data-outlet.svg', 'duplex-receptacle.svg',
      'floor-receptacle.svg', 'fluorescent-fixture.svg', 'gfci-receptacle.svg',
      'junction-box.svg', 'panelboard.svg', 'phone-outlet.svg',
      'quadplex-receptacle.svg', 'receptacle-240v.svg', 'recessed-downlight.svg',
      'switch-dimmer.svg', 'switch-four-way.svg', 'switch-three-way.svg',
      'switch.svg', 'thermostat.svg', 'tv-outlet.svg', 'wall-sconce.svg'
    ]
  }
};

function result(kind, ...qualifiers) {
  return { kind, qualifiers };
}

export function classifyElectricalSymbol(fileName) {
  const stem = fileName.toLowerCase().replace(/\.svg$/, '');

  if (stem === 'battery') return result('supply', 'battery');
  if (stem === 'generator') return result('supply', 'generator');
  if (stem === 'transformer') return result('supply', 'transformer');
  if (stem === 'earth') return result('earth');
  if (stem === 'circuit-breaker') return result('protection', 'circuit-breaker');
  if (stem === 'residual-current-device') return result('protection', 'residual-current');
  if (stem === 'fire-alarm-call-point') return result('alarm', 'manual-call');
  if (stem === 'visual-alarm-device') return result('alarm', 'visual');
  if (stem === 'siren' || stem === 'schel' || stem === 'doorbell') return result('alarm', 'audible');
  if (stem === 'smoke-detector' || stem === 'smoke-alarm') return result('detector', 'smoke');
  if (stem === 'heat-detector') return result('detector', 'heat');
  if (stem === 'motion-detector') return result('detector', 'motion');
  if (stem === 'motor-single-phase') return result('motor', 'single-phase');
  if (stem === 'motor-three-phase') return result('motor', 'three-phase');

  if (/gfci/.test(stem)) return result('socket', 'double', 'protected');
  if (/quadplex/.test(stem)) return result('socket', 'quadruple');
  if (/duplex|socket-13a-double|socket-double|outlet-double|wcd-dubbel|gpo-double/.test(stem)) {
    return result('socket', 'double');
  }
  if (/socket-earthed|wcd-randaarde|outlet-earthed/.test(stem)) return result('socket', 'single', 'earthed');
  if (/weatherproof|spatwaterdicht/.test(stem)) return result('socket', 'single', 'weatherproof');
  if (/floor-receptacle/.test(stem)) return result('socket', 'single', 'floor');
  if (/240v|krachtaansluiting|cooker-point/.test(stem)) return result('connection', 'high-power');
  if (/shaver-socket/.test(stem)) return result('socket', 'single', 'shaver');
  if (/switched-socket/.test(stem)) return result('socket', 'single', 'switched');
  if (/socket-13a-single|socket-single|wcd-enkel|gpo-single|^outlet$/.test(stem)) return result('socket', 'single');
  if (/aircon-outlet/.test(stem)) return result('connection', 'air-conditioning');

  if (/data-outlet|data-aansluiting/.test(stem)) return result('communication', 'data');
  if (/phone-outlet/.test(stem)) return result('communication', 'phone');
  if (/tv-outlet|cai-aansluiting/.test(stem)) return result('communication', 'television');

  if (/switch-three-way|switch-3way/.test(stem)) return result('switch', 'three-way');
  if (/switch-four-way|switch-intermediate|kruisschakelaar/.test(stem)) return result('switch', 'four-way');
  if (/switch-two-way|switch-2way|wisselschakelaar/.test(stem)) return result('switch', 'two-way');
  if (/switch-double|serieschakelaar/.test(stem)) return result('switch', 'double');
  if (/switch-dimmer|^dimmer$/.test(stem)) return result('switch', 'dimmer');
  if (/fused-switch|fused-connection-unit/.test(stem)) return result('isolator', 'fused');
  if (/fan-isolator/.test(stem)) return result('isolator', 'fan');
  if (stem === 'isolator') return result('isolator');
  if (/switch-1way|switch-single|schakelaar-enkelpolig|^switch$/.test(stem)) return result('switch', 'one-way');
  if (/push-button|beldrukker/.test(stem)) return result('switch', 'push-button');

  if (/emergency-light/.test(stem)) return result('light', 'emergency');
  if (/fluorescent|tl-armatuur/.test(stem)) return result('light', 'linear');
  if (/wall-light|wall-sconce|lichtpunt-wand/.test(stem)) return result('light', 'wall');
  if (/spotlight/.test(stem)) return result('light', 'spot');
  if (/downlight|recessed-downlight/.test(stem)) return result('light', 'recessed');
  if (/pendant-light/.test(stem)) return result('light', 'pendant');
  if (/ceiling-light|light-point|lichtpunt-plafond/.test(stem)) return result('light', 'ceiling');
  if (/ceiling-fan/.test(stem)) return result('fan', 'ceiling');
  if (/exhaust-fan/.test(stem)) return result('fan', 'exhaust');

  if (/distribution-board|consumer-unit|panelboard|switchboard|meterkast/.test(stem)) return result('board');
  if (/junction-box/.test(stem)) return result('junction');
  if (/loze-leiding/.test(stem)) return result('conduit', 'spare');
  if (/thermostat/.test(stem)) return result('control', 'thermostat');

  return null;
}

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function line(x1, y1, x2, y2, extra = '') {
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"${extra}/>`;
}

function circle(cx, cy, r, extra = '') {
  return `<circle cx="${cx}" cy="${cy}" r="${r}"${extra}/>`;
}

function rect(x, y, width, height, extra = '') {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}"${extra}/>`;
}

function detail(body) {
  return `<g stroke-width="0.8">${body}</g>`;
}

function has(qualifiers, value) {
  return qualifiers.includes(value);
}

function renderSupply(qualifiers) {
  if (has(qualifiers, 'battery')) {
    return `${line(18, 25, 18, 39)}${line(27, 20, 27, 44)}${line(37, 25, 37, 39)}${line(46, 20, 46, 44)}${detail(`${line(8, 32, 18, 32)}${line(46, 32, 56, 32)}`)}`;
  }
  if (has(qualifiers, 'transformer')) {
    return `<path d="M8 32 H18 C18 22 28 22 28 32 C28 42 18 42 18 32 M56 32 H46 C46 22 36 22 36 32 C36 42 46 42 46 32"/>${detail(`${line(30, 18, 30, 46)}${line(34, 18, 34, 46)}`)}`;
  }
  return `${circle(32, 32, 18)}<path d="M23 36 A10 10 0 1 1 41 28"/>${detail(`<path d="M39 23 L43 28 L37 29"/>`)}`;
}

function renderEarth() {
  return `${line(32, 10, 32, 34)}${line(18, 34, 46, 34)}${detail(`${line(22, 40, 42, 40)}${line(27, 46, 37, 46)}${line(30, 52, 34, 52)}`)}`;
}

function renderProtection(qualifiers) {
  if (has(qualifiers, 'residual-current')) {
    return `${rect(14, 16, 36, 32, ' rx="4"')}${circle(32, 32, 9)}${detail(`${line(20, 22, 44, 42)}${circle(42, 22, 2, ' fill="#000" stroke="none"')}`)}`;
  }
  return `${rect(12, 20, 40, 24, ' rx="3"')}${line(20, 38, 44, 26)}${detail(`${circle(20, 38, 2)}${circle(44, 26, 2)}`)}`;
}

function renderAlarm(qualifiers) {
  if (has(qualifiers, 'manual-call')) {
    return `${rect(14, 14, 36, 36, ' rx="3"')}${circle(32, 32, 10)}${detail(`<path d="M26 32 H38 M32 26 V38"/>`)}`;
  }
  if (has(qualifiers, 'visual')) {
    return `${circle(32, 32, 9, ' fill="#000"')}${detail(`${line(32, 8, 32, 18)}${line(32, 46, 32, 56)}${line(8, 32, 18, 32)}${line(46, 32, 56, 32)}<path d="M15 15 L22 22 M42 42 L49 49 M49 15 L42 22 M22 42 L15 49"/>`)}`;
  }
  return `<path d="M14 38 H23 L38 48 V16 L23 26 H14 Z"/>${detail(`<path d="M43 24 A11 11 0 0 1 43 40 M48 19 A18 18 0 0 1 48 45"/>`)}`;
}

function renderDetector(qualifiers) {
  if (has(qualifiers, 'heat')) {
    return `${circle(32, 32, 18)}${circle(32, 32, 5, ' fill="#000"')}${detail(`${line(32, 18, 32, 24)}${line(32, 40, 32, 46)}${line(18, 32, 24, 32)}${line(40, 32, 46, 32)}`)}`;
  }
  if (has(qualifiers, 'motion')) {
    return `${circle(22, 32, 5, ' fill="#000"')}${detail(`<path d="M29 24 A12 12 0 0 1 29 40 M34 19 A19 19 0 0 1 34 45 M40 14 A26 26 0 0 1 40 50"/>`)}`;
  }
  return `${circle(32, 32, 18)}${detail(`<path d="M20 29 C24 24 28 34 32 29 C36 24 40 34 44 29 M20 37 C24 32 28 42 32 37 C36 32 40 42 44 37"/>`)}`;
}

function renderMotor(qualifiers) {
  if (has(qualifiers, 'three-phase')) {
    return `${circle(32, 32, 20)}${detail(`${line(27, 27, 27, 37)}${line(32, 27, 32, 37)}${line(37, 27, 37, 37)}`)}`;
  }
  return `${circle(32, 32, 20)}${detail('<path d="M21 32 C25 22 29 42 33 32 C37 22 41 42 45 32"/>')}`;
}

function renderSocket(qualifiers, profile) {
  const roundProfile = profile === 'us' || profile === 'jp';
  const count = has(qualifiers, 'quadruple') ? 4 : has(qualifiers, 'double') ? 2 : 1;
  let main = roundProfile ? circle(32, 32, 15) : '<path d="M16 39 A16 16 0 0 1 48 39"/>';
  const positions = count === 4 ? [23, 29, 35, 41] : count === 2 ? [28, 36] : [32];
  main += positions.map(x => line(x, roundProfile ? 25 : 24, x, roundProfile ? 39 : 12)).join('');
  let details = '';
  if (has(qualifiers, 'earthed')) {
    details += `${line(24, 14, 40, 14)}${line(27, 18, 37, 18, ' stroke-dasharray="1 2"')}`;
  }
  if (has(qualifiers, 'protected')) {
    details += `${circle(27, 45, 1.5, ' fill="#000" stroke="none"')}${circle(37, 45, 1.5, ' fill="#000" stroke="none"')}`;
  }
  if (has(qualifiers, 'weatherproof')) details += '<path d="M14 43 A20 20 0 0 0 50 43"/>';
  if (has(qualifiers, 'floor')) details += rect(10, 10, 44, 44, ' rx="3"');
  if (has(qualifiers, 'shaver')) details += '<path d="M32 45 L38 52 L32 59 L26 52 Z"/>';
  if (has(qualifiers, 'switched')) details += `${circle(48, 18, 2)}${line(46, 20, 40, 26)}`;
  return `${main}${detail(details || line(24, 47, 40, 47))}`;
}

function renderConnection(qualifiers) {
  if (has(qualifiers, 'air-conditioning')) {
    return `${rect(12, 18, 40, 28, ' rx="4"')}<path d="M20 32 H44"/>${detail('<path d="M25 25 L32 32 L25 39 M39 25 L32 32 L39 39"/>')}`;
  }
  return `${circle(32, 32, 19)}${line(20, 32, 44, 32)}${detail(`${line(25, 25, 25, 39)}${line(32, 25, 32, 39)}${line(39, 25, 39, 39)}`)}`;
}

function renderCommunication(qualifiers) {
  if (has(qualifiers, 'phone')) {
    return `${circle(32, 32, 20)}<path d="M22 20 C18 26 18 38 22 44 L27 39 C25 35 25 29 27 25 Z M42 20 C46 26 46 38 42 44 L37 39 C39 35 39 29 37 25 Z"/>${detail(line(27, 32, 37, 32))}`;
  }
  if (has(qualifiers, 'television')) {
    return `${circle(32, 32, 20)}${circle(32, 32, 8)}${detail(`${line(26, 14, 32, 24)}${line(38, 14, 32, 24)}`)}`;
  }
  return `${rect(14, 18, 36, 28, ' rx="3"')}${detail(`${rect(20, 24, 24, 14, ' rx="2"')}${line(24, 38, 24, 42)}${line(29, 38, 29, 42)}${line(35, 38, 35, 42)}${line(40, 38, 40, 42)}`)}`;
}

function switchTargets(qualifier) {
  if (qualifier === 'four-way') return [[40, 18], [48, 26], [48, 38], [40, 46]];
  if (qualifier === 'three-way') return [[42, 20], [48, 26], [42, 32]];
  if (qualifier === 'two-way' || qualifier === 'double') return [[44, 22], [48, 30]];
  return [[44, 22]];
}

function renderSwitch(qualifiers, profile) {
  const mode = qualifiers.find(value => ['one-way', 'two-way', 'three-way', 'four-way', 'double'].includes(value)) ?? 'one-way';
  const targets = switchTargets(mode);
  const origin = circle(18, 44, 3, profile === 'jp' ? ' fill="#000"' : '');
  const points = targets.map(([x, y]) => circle(x, y, 2.2)).join('');
  let details = line(21, 41, targets[0][0] - 3, targets[0][1] + 3);
  if (has(qualifiers, 'dimmer')) details += '<path d="M25 50 A14 14 0 0 0 46 42 M43 38 L46 42 L41 44"/>';
  if (has(qualifiers, 'push-button')) details += `${line(18, 20, 18, 35)}${line(12, 20, 24, 20)}`;
  return `${origin}${points}${detail(details)}`;
}

function renderIsolator(qualifiers) {
  const fuse = has(qualifiers, 'fused') ? rect(25, 27, 14, 8, ' rx="2"') : circle(32, 32, 6);
  return `${rect(12, 14, 40, 36, ' rx="4"')}${fuse}${detail(`${line(18, 32, 25, 32)}${line(39, 32, 46, 32)}${has(qualifiers, 'fan') ? '<path d="M32 20 L36 27 L28 27 Z"/>' : ''}`)}`;
}

function renderLight(qualifiers) {
  if (has(qualifiers, 'linear')) {
    return `${rect(9, 25, 46, 14, ' rx="2"')}${detail(`${line(14, 29, 50, 29)}${line(14, 35, 50, 35)}`)}`;
  }
  if (has(qualifiers, 'wall')) {
    return `<path d="M18 42 A14 14 0 0 1 46 42"/>${line(18, 42, 46, 42)}${detail(`${line(32, 18, 32, 28)}${line(25, 21, 28, 29)}${line(39, 21, 36, 29)}`)}`;
  }
  if (has(qualifiers, 'spot')) {
    return `${circle(22, 32, 7)}<path d="M29 27 L52 18 V46 L29 37 Z"/>${detail(line(36, 25, 36, 39))}`;
  }
  if (has(qualifiers, 'pendant')) {
    return `${line(32, 8, 32, 24)}${circle(32, 35, 11)}${detail('<path d="M24 42 H40 M27 46 H37"/>')}`;
  }
  const double = has(qualifiers, 'recessed') ? circle(32, 32, 21) : '';
  const emergency = has(qualifiers, 'emergency')
    ? `${line(12, 32, 20, 32)}${line(16, 28, 12, 32)}${line(16, 36, 12, 32)}${line(52, 32, 44, 32)}${line(48, 28, 52, 32)}${line(48, 36, 52, 32)}`
    : '';
  return `${circle(32, 32, 15)}${double}${detail(`${line(22, 22, 42, 42)}${line(42, 22, 22, 42)}${emergency}`)}`;
}

function renderFan(qualifiers) {
  const exhaust = has(qualifiers, 'exhaust');
  return `${circle(32, 32, 20)}${circle(32, 32, 3, ' fill="#000"')}${detail(`<path d="M32 29 C25 18 18 24 28 33 M35 32 C46 25 40 18 31 28 M32 35 C39 46 46 40 36 31 M29 32 C18 39 24 46 33 36"/>${exhaust ? rect(8, 8, 48, 48, ' rx="4"') : ''}`)}`;
}

function renderBoard() {
  return `${rect(12, 12, 40, 40, ' rx="3"')}${line(32, 12, 32, 52)}${detail(`${line(18, 21, 46, 21)}${line(18, 28, 46, 28)}${line(18, 36, 46, 36)}${line(18, 43, 46, 43)}`)}`;
}

function renderJunction() {
  return `${circle(32, 32, 18)}${circle(32, 32, 4, ' fill="#000"')}${detail(`${line(20, 20, 44, 44)}${line(44, 20, 20, 44)}`)}`;
}

function renderConduit() {
  return `<path d="M10 44 C20 18 44 18 54 44" stroke-dasharray="5 3"/>${detail(`${circle(10, 44, 3)}${circle(54, 44, 3)}${line(28, 28, 36, 28)}`)}`;
}

function renderControl() {
  return `${circle(32, 32, 20)}${line(28, 18, 28, 39)}${circle(28, 43, 5, ' fill="#000"')}${detail(`${line(34, 22, 43, 22)}${line(34, 29, 40, 29)}${line(34, 36, 43, 36)}`)}`;
}

function renderBody(classification, profile) {
  const { kind, qualifiers } = classification;
  if (kind === 'supply') return renderSupply(qualifiers);
  if (kind === 'earth') return renderEarth();
  if (kind === 'protection') return renderProtection(qualifiers);
  if (kind === 'alarm') return renderAlarm(qualifiers);
  if (kind === 'detector') return renderDetector(qualifiers);
  if (kind === 'motor') return renderMotor(qualifiers);
  if (kind === 'socket') return renderSocket(qualifiers, profile);
  if (kind === 'connection') return renderConnection(qualifiers);
  if (kind === 'communication') return renderCommunication(qualifiers);
  if (kind === 'switch') return renderSwitch(qualifiers, profile);
  if (kind === 'isolator') return renderIsolator(qualifiers);
  if (kind === 'light') return renderLight(qualifiers);
  if (kind === 'fan') return renderFan(qualifiers);
  if (kind === 'board') return renderBoard();
  if (kind === 'junction') return renderJunction();
  if (kind === 'conduit') return renderConduit();
  if (kind === 'control') return renderControl();
  throw new Error(`Onbekend elektrisch symbooltype: ${kind}`);
}

export function renderElectricalSymbol(classification, options = {}) {
  if (!classification?.kind) throw new Error('Elektrische classificatie ontbreekt');
  const profile = options.profile ?? 'iec';
  const title = options.title ?? options.fileName ?? classification.kind;
  const qualifiers = classification.qualifiers.join(', ') || 'basis';
  const body = renderBody(classification, profile);
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#000" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><title>${esc(title)}</title><desc>Elektrisch symbool; profiel ${esc(profile)}; type ${esc(classification.kind)}; variant ${esc(qualifiers)}.</desc>${body}</svg>\n`;
}

export function generateElectricalSymbols(root) {
  const output = new Map();
  for (const [collectionId, config] of Object.entries(ELECTRICAL_COLLECTIONS)) {
    const collectionPath = join(root, 'collections', collectionId, 'collection.json');
    const collection = JSON.parse(readFileSync(collectionPath, 'utf8'));
    for (const file of config.files) {
      const classification = classifyElectricalSymbol(file);
      if (!classification) throw new Error(`${collectionId}/${file}: classificatie ontbreekt`);
      const title = `${collection.name.en}: ${file.slice(0, -4)}`;
      output.set(
        `collections/${collectionId}/symbols/${file}`,
        renderElectricalSymbol(classification, {
          profile: config.profile,
          title,
          fileName: file
        })
      );
    }
  }
  return output;
}

export function checkElectricalSymbols(root, expected = generateElectricalSymbols(root)) {
  const errors = [];
  const expectedPaths = new Set(expected.keys());
  const managedDirs = new Set();

  for (const [file, svg] of expected) {
    const absolute = join(root, ...file.split('/'));
    managedDirs.add(file.slice(0, file.lastIndexOf('/')));
    if (!existsSync(absolute)) errors.push(`missing: ${file}`);
    else if (readFileSync(absolute, 'utf8') !== svg) errors.push(`changed: ${file}`);
  }

  for (const directory of managedDirs) {
    const absoluteDir = join(root, ...directory.split('/'));
    if (!existsSync(absoluteDir)) continue;
    for (const file of readdirSync(absoluteDir).filter(name => name.endsWith('.svg'))) {
      const relative = `${directory}/${file}`;
      if (!expectedPaths.has(relative)) errors.push(`orphaned: ${relative}`);
    }
  }
  return errors.sort();
}

function writeElectricalSymbols(root, expected) {
  let changed = 0;
  for (const [file, svg] of expected) {
    const absolute = join(root, ...file.split('/'));
    if (!existsSync(absolute) || readFileSync(absolute, 'utf8') !== svg) {
      writeFileSync(absolute, svg);
      changed += 1;
    }
  }
  return changed;
}

const scriptPath = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === resolve(scriptPath)) {
  const root = resolve(dirname(scriptPath), '..');
  const expected = generateElectricalSymbols(root);
  if (process.argv.includes('--check')) {
    const errors = checkElectricalSymbols(root, expected);
    if (errors.length) {
      for (const error of errors) console.error(error);
      process.exitCode = 1;
    } else {
      console.log(`Elektra-SVG's actueel (${expected.size} bestanden).`);
    }
  } else {
    const changed = writeElectricalSymbols(root, expected);
    console.log(`Elektra-SVG's gebouwd (${changed} gewijzigd, ${expected.size} totaal).`);
  }
}
