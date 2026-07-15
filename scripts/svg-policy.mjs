import { SaxesParser } from 'saxes';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export const ALLOWED_ELEMENTS = new Set([
  'svg', 'g', 'path', 'line', 'polyline', 'polygon', 'rect', 'circle',
  'ellipse', 'text', 'tspan', 'title', 'desc'
]);

export const ALLOWED_ATTRIBUTES = new Set([
  'xmlns', 'viewBox', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'cx', 'cy', 'r',
  'rx', 'ry', 'width', 'height', 'd', 'points', 'transform', 'fill',
  'fill-rule', 'stroke', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'fill-opacity',
  'stroke-opacity', 'font-size', 'font-weight', 'font-family', 'text-anchor',
  'dominant-baseline', 'letter-spacing'
]);

const ACTIVE_VALUE = /(?:javascript:|data:|url\s*\()/i;
const DECLARATION = /<!(?:DOCTYPE|ENTITY)\b/i;

export function validateSvgPolicy(svg, label) {
  const errors = [];
  let rootCount = 0;
  let depth = 0;

  if (DECLARATION.test(svg)) {
    errors.push(`${label}: DOCTYPE- en entiteitsdeclaraties zijn niet toegestaan`);
  }

  const parser = new SaxesParser({ xmlns: true });
  parser.on('error', error => {
    errors.push(`${label}: ongeldige XML — ${error.message}`);
  });
  parser.on('opentag', node => {
    depth += 1;
    const element = node.local || node.name;
    if (depth === 1) {
      rootCount += 1;
      if (element !== 'svg') errors.push(`${label}: root-element moet <svg> zijn`);
    }

    if (!ALLOWED_ELEMENTS.has(element)) {
      errors.push(`${label}: element <${node.name}> is niet toegestaan`);
    }
    if (node.prefix || (node.uri && node.uri !== SVG_NAMESPACE)) {
      errors.push(`${label}: namespace op <${node.name}> is niet toegestaan`);
    }

    for (const attribute of Object.values(node.attributes)) {
      const name = attribute.local || attribute.name;
      const value = attribute.value;

      if (attribute.name === 'xmlns') {
        if (value !== SVG_NAMESPACE) {
          errors.push(`${label}: alleen de SVG-namespace is toegestaan`);
        }
        continue;
      }
      if (attribute.prefix || attribute.uri) {
        errors.push(`${label}: attribuutnamespace "${attribute.name}" is niet toegestaan`);
        continue;
      }
      if (/^on/i.test(name)) {
        errors.push(`${label}: event-attribuut "${name}" is niet toegestaan`);
        continue;
      }
      if (!ALLOWED_ATTRIBUTES.has(name)) {
        errors.push(`${label}: attribuut "${name}" is niet toegestaan`);
        continue;
      }
      if (ACTIVE_VALUE.test(value)) {
        errors.push(`${label}: actieve of externe attribuutwaarde is niet toegestaan`);
      }
    }
  });
  parser.on('closetag', () => {
    depth -= 1;
  });

  try {
    parser.write(svg).close();
  } catch (error) {
    errors.push(`${label}: ongeldige XML — ${error.message}`);
  }

  if (rootCount !== 1) {
    errors.push(`${label}: verwacht precies één <svg>-root`);
  }
  return [...new Set(errors)];
}
