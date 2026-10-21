import {IRIS_COLORS, LIP_COLORS} from './avatarParts';

// Curated subsets of the avataaars parts: only the flattering, friendly ones are offered.
export const SKIN_TONES = [
  {value: '#F5D0B0', label: 'Fair'},
  {value: '#E8B58F', label: 'Light'},
  {value: '#D4A079', label: 'Wheatish'},
  {value: '#B98059', label: 'Medium'},
  {value: '#9A6440', label: 'Brown'},
  {value: '#6E4630', label: 'Deep'},
];

const FEMALE_HAIR = [
  {value: 'straight02', label: 'Side part'},
  {value: 'straight01', label: 'Long straight'},
  {value: 'straightAndStrand', label: 'With strand'},
  {value: 'longButNotTooLong', label: 'Shoulder length'},
  {value: 'curvy', label: 'Wavy'},
  {value: 'curly', label: 'Curly'},
  {value: 'bob', label: 'Bob'},
  {value: 'miaWallace', label: 'Blunt bob'},
  {value: 'bun', label: 'Bun'},
  {value: 'frida', label: 'Flower crown'},
  {value: 'hijab', label: 'Hijab', headwear: true},
];
const MALE_HAIR = [
  {value: 'shortFlat', label: 'Classic'},
  {value: 'shortWaved', label: 'Wavy'},
  {value: 'theCaesarAndSidePart', label: 'Side part'},
  {value: 'theCaesar', label: 'Crew cut'},
  {value: 'shortCurly', label: 'Curly'},
  {value: 'frizzle', label: 'Textured'},
  {value: 'shortRound', label: 'Rounded'},
  {value: 'shavedSides', label: 'Undercut'},
  {value: 'shaggy', label: 'Messy'},
  {value: 'dreads01', label: 'Long'},
  {value: 'sides', label: 'Bald'},
  {value: 'turban', label: 'Turban', headwear: true},
];
export const hairStylesFor = gender =>
  gender === 'male' ? MALE_HAIR : gender === 'female' ? FEMALE_HAIR : [...FEMALE_HAIR, ...MALE_HAIR];

export const HAIR_COLORS = ['#1A1110', '#2C1B18', '#4A312C', '#724133', '#A55728', '#B58143', '#D6B370', '#C9C4C4'];
export const HEADWEAR_COLORS = ['#25557C', '#5199E4', '#E6E6E6', '#262E33', '#FF5C5C', '#FF9F43', '#B07CFF', '#3F9E7A'];

export const EYES = [
  {value: 'bright', label: 'Lashes'},
  {value: 'soft', label: 'Natural'},
  {value: 'default', label: 'Classic'},
  {value: 'happy', label: 'Smiling'},
  {value: 'wink', label: 'Wink'},
  {value: 'squint', label: 'Squint'},
];
export {IRIS_COLORS, LIP_COLORS};

export const BROWS = [
  {value: 'defaultNatural', label: 'Natural'},
  {value: 'flatNatural', label: 'Straight'},
  {value: 'raisedExcitedNatural', label: 'Arched'},
  {value: 'upDownNatural', label: 'Expressive'},
  {value: 'default', label: 'Bold'},
];

export const MOUTHS = [
  {value: 'lipsSmile', label: 'Smile'},
  {value: 'lips', label: 'Full lips'},
  {value: 'lipsGrin', label: 'Grin'},
  {value: 'smile', label: 'Laugh'},
  {value: 'twinkle', label: 'Soft smile'},
  {value: 'default', label: 'Open'},
];

export const FACIAL_HAIR = [
  {value: 'none', label: 'None'},
  {value: 'beardLight', label: 'Stubble'},
  {value: 'beardMedium', label: 'Beard'},
  {value: 'beardMajestic', label: 'Full beard'},
  {value: 'moustacheFancy', label: 'Moustache'},
  {value: 'moustacheMagnum', label: 'Thick moustache'},
];

export const GLASSES = [
  {value: 'none', label: 'None'},
  {value: 'prescription02', label: 'Rectangle'},
  {value: 'round', label: 'Round'},
  {value: 'prescription01', label: 'Thin'},
  {value: 'wayfarers', label: 'Sunglasses'},
];

export const OUTFITS = [
  {value: 'shirtScoopNeck', label: 'Scoop neck'},
  {value: 'shirtCrewNeck', label: 'T-shirt'},
  {value: 'shirtVNeck', label: 'V-neck'},
  {value: 'hoodie', label: 'Hoodie'},
  {value: 'collarAndSweater', label: 'Sweater'},
  {value: 'blazerAndShirt', label: 'Blazer'},
];
export const OUTFIT_COLORS = ['#FF488E', '#E56D9A', '#A45EEB', '#5199E4', '#25557C', '#3F9E7A', '#FF9F43', '#262E33', '#E6E6E6'];
export const BACKGROUNDS = ['#B996FF', '#FFD67B', '#82C8FF', '#FF9FC6', '#8EE0C7', '#FFAFA5', '#E3AAFF', '#9BD2D0', '#C4B2FF', '#F5D991'];

/* eslint-disable no-bitwise -- string hash */
const hash = text => {
  let value = 2166136261;
  for (let index = 0; index < text.length; index += 1) value = Math.imul(value ^ text.charCodeAt(index), 16777619);
  return value >>> 0;
};
/* eslint-enable no-bitwise */
const pick = (list, seed, salt) => list[hash(`${seed}:${salt}`) % list.length];
const values = list => list.map(item => item.value ?? item);

// Builds a pleasant, deterministic avatar for a seed. Headwear is never picked automatically.
export function generateAvatar(gender = 'female', seed = `milo-${Date.now()}-${Math.random()}`) {
  const male = gender === 'male' || (gender !== 'female' && hash(seed) % 2 === 0);
  const hair = values(hairStylesFor(male ? 'male' : 'female').filter(item => !item.headwear && item.value !== 'sides' && item.value !== 'frida'));
  const beardRoll = hash(`${seed}:beard`) % 10;
  return {
    v: 2,
    seed,
    gender,
    skin: pick(values(SKIN_TONES).slice(1, 5), seed, 'skin'),
    top: pick(hair, seed, 'top'),
    hairColor: pick(HAIR_COLORS.slice(0, 4), seed, 'hair'),
    hatColor: pick(HEADWEAR_COLORS, seed, 'hat'),
    eyes: male ? 'soft' : 'bright',
    iris: pick(IRIS_COLORS.slice(0, 3), seed, 'iris'),
    brows: male ? 'defaultNatural' : pick(['defaultNatural', 'raisedExcitedNatural'], seed, 'brows'),
    mouth: male ? pick(['lipsSmile', 'smile'], seed, 'mouth') : pick(['lipsSmile', 'lips', 'lipsGrin'], seed, 'mouth'),
    lips: male ? '#8C5A48' : pick(LIP_COLORS.slice(0, 5), seed, 'lips'),
    facialHair: male && beardRoll < 4 ? pick(['beardLight', 'beardMedium'], seed, 'beardStyle') : 'none',
    glasses: hash(`${seed}:glasses`) % 8 === 0 ? 'prescription02' : 'none',
    clothes: pick(values(OUTFITS).slice(0, 4), seed, 'clothes'),
    clothesColor: pick(OUTFIT_COLORS, seed, 'clothesColor'),
    background: pick(BACKGROUNDS, seed, 'background'),
  };
}

// Accepts both the new avatar config and the older {avatarSeed, background, hair, shirt, bun, glasses}
// shape still stored for existing users and demo profiles.
export function normalizeAvatar(style, name = 'Milo') {
  const input = style || {};
  const seed = input.seed || input.avatarSeed || `milo-${name}`;
  const gender = input.gender || 'female';
  const base = generateAvatar(gender, seed);
  if (input.v === 2) return {...base, ...input, seed};
  return {
    ...base,
    top: input.bun && gender !== 'male' ? 'bun' : base.top,
    hairColor: input.hair || base.hairColor,
    clothesColor: input.shirt || base.clothesColor,
    background: input.background || base.background,
    glasses: input.glasses ? 'prescription02' : 'none',
  };
}

// The value saved on the server: a full config plus the legacy avatarSeed key used elsewhere.
export const toStoredAvatar = config => ({...config, v: 2, avatarSeed: config.seed});

const hex = color => String(color).replace('#', '').toLowerCase();

export function toDiceBearOptions(config, size = 160) {
  const glasses = config.glasses && config.glasses !== 'none';
  const beard = config.facialHair && config.facialHair !== 'none';
  return {
    seed: String(config.seed),
    size,
    backgroundColor: [hex(config.background)],
    skinColor: [hex(config.skin)],
    topVariant: [config.top],
    topProbability: 100,
    hairColor: [hex(config.hairColor)],
    hatColor: [hex(config.hatColor)],
    eyesVariant: [config.eyes],
    irisColor: [hex(config.iris)],
    eyebrowsVariant: [config.brows],
    mouthVariant: [config.mouth],
    lipsColor: [hex(config.lips)],
    facialHairProbability: beard ? 100 : 0,
    ...(beard && {facialHairVariant: [config.facialHair]}),
    facialHairColor: [hex(config.hairColor)],
    accessoriesProbability: glasses ? 100 : 0,
    ...(glasses && {accessoriesVariant: [config.glasses]}),
    accessoriesColor: ['262e33'],
    clothesVariant: [config.clothes],
    clothesColor: [hex(config.clothesColor)],
  };
}
