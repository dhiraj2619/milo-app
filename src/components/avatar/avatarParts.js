// Extra hand-drawn parts layered onto the DiceBear "avataaars" definition:
// detailed eyes (white, coloured iris, catch-light, lashes) and full lips with a colour.
// Coordinates follow avataaars' own component boxes (eyes: 84x36, mouth: 92x38).

const el = (name, attributes) => ({
  name,
  type: 'element',
  attributes: Object.fromEntries(Object.entries(attributes).map(([key, value]) => [key, typeof value === 'number' ? String(+value.toFixed(2)) : value])),
});
const iris = {type: 'color', name: 'iris'};
const lips = {type: 'color', name: 'lips'};
const INK = '#1F1714';

// One eye centred on (cx, 14); `side` is -1 for the left eye, 1 for the right.
const eye = (cx, side, {lashes, lid}) => {
  const outer = cx + side * 13.5;
  const inner = cx - side * 12.5;
  const parts = [
    el('path', {d: `M${inner} 14.5Q${cx} 2.5 ${outer} 13.5Q${cx} 23 ${inner} 14.5Z`, fill: 'white'}),
    el('circle', {cx, cy: 13.2, r: 5.4, fill: iris}),
    el('circle', {cx, cy: 13.2, r: 2.7, fill: INK}),
    el('circle', {cx: cx + 2, cy: 11.2, r: 1.6, fill: 'white'}),
    el('circle', {cx: cx - 1.8, cy: 15, r: 0.7, fill: 'white', 'fill-opacity': '.7'}),
    el('path', {d: `M${inner - side * 0.5} 14.3Q${cx} ${lid} ${outer + side * 0.6} 13.2`, fill: 'none', stroke: INK, 'stroke-width': lashes ? 2.4 : 1.8, 'stroke-linecap': 'round'}),
    el('path', {d: `M${inner} 15Q${cx} 22.4 ${outer} 14`, fill: 'none', stroke: INK, 'stroke-opacity': '.25', 'stroke-width': 0.9}),
  ];
  if (lashes) {
    parts.push(el('path', {d: `M${outer} 12.8l${side * 3.4} -2.6M${outer - side * 2.6} 9.6l${side * 2.4} -2.9M${outer - side * 6} 7.4l${side * 1.4} -3`, fill: 'none', stroke: INK, 'stroke-width': 1.3, 'stroke-linecap': 'round'}));
  }
  return parts;
};

// Full lips centred on x=46. `upper`/`lower` are the top and bottom edges, `corner` the mouth corners
// and `seam` the parting line at the centre (a seam lower than the corners reads as a smile).
const lipsShape = ({upper, lower, corner, seam, w = 19}) => {
  const L = 46 - w;
  const R = 46 + w;
  const x = f => 46 + w * f;
  const upperLip = `M${L} ${corner}C${x(-0.75)} ${upper + 3.5} ${x(-0.4)} ${upper - 1} ${x(-0.17)} ${upper}C${x(-0.08)} ${upper + 0.4} ${x(-0.03)} ${upper + 1.8} 46 ${upper + 1.8}C${x(0.03)} ${upper + 1.8} ${x(0.08)} ${upper + 0.4} ${x(0.17)} ${upper}C${x(0.4)} ${upper - 1} ${x(0.75)} ${upper + 3.5} ${R} ${corner}`;
  const seamLine = `C${x(0.6)} ${seam - 0.4} ${x(0.25)} ${seam} 46 ${seam}C${x(-0.25)} ${seam} ${x(-0.6)} ${seam - 0.4} ${L} ${corner}`;
  return [
    // Upper lip with a cupid's bow, then the fuller lower lip.
    el('path', {d: `${upperLip}${seamLine}Z`, fill: lips}),
    el('path', {d: `M${L} ${corner}C${x(-0.6)} ${seam - 0.4} ${x(-0.25)} ${seam} 46 ${seam}C${x(0.25)} ${seam} ${x(0.6)} ${seam - 0.4} ${R} ${corner}C${x(0.75)} ${lower - 3} ${x(0.4)} ${lower} 46 ${lower}C${x(-0.4)} ${lower} ${x(-0.75)} ${lower - 3} ${L} ${corner}Z`, fill: lips}),
    // Shade the upper lip, draw the parting line and add a soft gloss on the lower lip.
    el('path', {d: `${upperLip}${seamLine}Z`, fill: 'black', 'fill-opacity': '.16'}),
    el('path', {d: `M${L + 0.5} ${corner}C${x(-0.6)} ${seam - 0.4} ${x(-0.25)} ${seam} 46 ${seam}C${x(0.25)} ${seam} ${x(0.6)} ${seam - 0.4} ${R - 0.5} ${corner}`, fill: 'none', stroke: INK, 'stroke-opacity': '.5', 'stroke-width': 1.1, 'stroke-linecap': 'round'}),
    el('ellipse', {cx: 48, cy: (seam + lower) / 2 + 0.6, rx: w * 0.3, ry: 1.7, fill: 'white', 'fill-opacity': '.3'}),
  ];
};

export const EXTRA_EYES = {
  bright: {elements: [...eye(16, -1, {lashes: true, lid: 2}), ...eye(68, 1, {lashes: true, lid: 2})]},
  soft: {elements: [...eye(16, -1, {lashes: false, lid: 3}), ...eye(68, 1, {lashes: false, lid: 3})]},
};

export const EXTRA_MOUTHS = {
  lips: {elements: lipsShape({upper: 5.5, lower: 21, corner: 12, seam: 13})},
  lipsSmile: {elements: lipsShape({upper: 6.5, lower: 21.5, corner: 9.5, seam: 13.5, w: 20})},
  lipsGrin: {elements: [
    el('path', {d: 'M28 9C34 9.6 40 8.8 46 9.6C52 8.8 58 9.6 64 9C61 19 53 23.5 46 23.5C39 23.5 31 19 28 9Z', fill: lips}),
    el('path', {d: 'M31.5 11C37 11.6 41 10.8 46 11.4C51 10.8 55 11.6 60.5 11C58 17.5 52 20.2 46 20.2C40 20.2 34 17.5 31.5 11Z', fill: '#3A1416'}),
    el('path', {d: 'M32.5 11.2C37 11.7 41 10.9 46 11.5C51 10.9 55 11.7 59.5 11.2L58.6 13.6C54 14.3 50 14.4 46 14.4C42 14.4 38 14.3 33.4 13.6Z', fill: 'white'}),
    el('ellipse', {cx: 47.5, cy: 21.6, rx: 5.5, ry: 1.2, fill: 'white', 'fill-opacity': '.28'}),
  ]},
};

export const IRIS_COLORS = ['#3B2416', '#5A3A22', '#7A5230', '#3D6B45', '#3A5F8A', '#141414'];
export const LIP_COLORS = ['#B06A5E', '#C47A72', '#D2556E', '#B3223A', '#8A3445', '#8C5A48'];

export function extendDefinition(base) {
  const definition = JSON.parse(JSON.stringify(base));
  Object.assign(definition.components.eyes.variants, EXTRA_EYES);
  Object.assign(definition.components.mouth.variants, EXTRA_MOUTHS);
  definition.colors.iris = {notEqualTo: [], values: IRIS_COLORS};
  definition.colors.lips = {notEqualTo: [], values: LIP_COLORS};
  return definition;
}
