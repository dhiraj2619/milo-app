/* eslint-disable no-bitwise -- hashing and base64 decoding */
import decodeJpeg from 'jpeg-js/lib/decoder';
import {SKIN_TONES} from './avatarConfig';

const BASE64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64ToBytes(input) {
  const clean = input.replace(/^data:[^,]*,/, '').replace(/[^A-Za-z0-9+/]/g, '');
  const bytes = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let buffer = 0;
  let bits = 0;
  let offset = 0;
  for (let index = 0; index < clean.length; index += 1) {
    buffer = (buffer << 6) | BASE64.indexOf(clean[index]);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      bytes[offset] = (buffer >> bits) & 0xff;
      offset += 1;
    }
  }
  return bytes.subarray(0, offset);
}

const luma = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b;
const hexToRgb = hex => [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));

// Estimates the user's skin tone from a selfie (base64 JPEG) and returns the closest SKIN_TONES value.
// The face is assumed to fill the centre of the frame; only pixels that fall inside a standard
// YCbCr skin range are averaged, so hair, background and clothing are mostly ignored.
// Returns null when too little skin is visible (no face, very dark photo, or non-JPEG data).
export function detectSkinTone(base64) {
  let image;
  try {
    image = decodeJpeg(base64ToBytes(base64), {useTArray: true, formatAsRGBA: true, maxResolutionInMP: 4});
  } catch (_) {
    return null;
  }
  const {width, height, data} = image;
  const samples = [];
  for (let y = Math.floor(height * 0.3); y < height * 0.7; y += 1) {
    for (let x = Math.floor(width * 0.3); x < width * 0.7; x += 1) {
      const offset = (y * width + x) * 4;
      const r = data[offset];
      const g = data[offset + 1];
      const b = data[offset + 2];
      const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
      const y8 = luma(r, g, b);
      if (cr >= 135 && cr <= 180 && cb >= 77 && cb <= 127 && y8 > 35 && y8 < 245) samples.push([r, g, b]);
    }
  }
  const regionSize = Math.max(1, Math.round(width * 0.4) * Math.round(height * 0.4));
  if (samples.length < regionSize * 0.12) return null;

  // Use the middle of the brightness range so shine and shadows don't skew the result.
  samples.sort((a, b) => luma(...a) - luma(...b));
  const middle = samples.slice(Math.floor(samples.length * 0.25), Math.ceil(samples.length * 0.75));
  const average = [0, 1, 2].map(channel => middle.reduce((sum, pixel) => sum + pixel[channel], 0) / middle.length);
  const brightness = luma(...average);

  // Match mainly on brightness, with warmth (red vs blue) as a tiebreaker.
  let best = SKIN_TONES[0];
  let bestScore = Infinity;
  SKIN_TONES.forEach(tone => {
    const rgb = hexToRgb(tone.value);
    const hueGap = Math.abs((rgb[0] - rgb[2]) / Math.max(1, luma(...rgb)) - (average[0] - average[2]) / Math.max(1, brightness));
    const score = Math.abs(luma(...rgb) - brightness) + hueGap * 8;
    if (score < bestScore) {
      bestScore = score;
      best = tone;
    }
  });
  return best;
}
