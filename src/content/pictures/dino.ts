import { BG, circle, ellipse, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'ground', d: 'M0 86L100 86L100 100L0 100Z' },
  { id: 'tail', d: 'M32 64C18 64 8 70 4 80C16 78 26 76 36 76Z' },
  { id: 'legBack', d: 'M34 70L46 70L46 90L34 90Z' },
  { id: 'legFront', d: 'M58 70L70 70L70 90L58 90Z' },
  { id: 'spike1', d: 'M34 56L38 41L46 52Z' },
  { id: 'spike2', d: 'M46 51L52 37L58 51Z' },
  { id: 'spike3', d: 'M58 52L63 40L68 54Z' },
  { id: 'neck', d: 'M62 58C66 44 66 34 69 27L80 29C76 39 76 50 75 61Z' },
  { id: 'body', d: ellipse(52, 64, 22, 16) },
  { id: 'belly', d: ellipse(54, 70, 13, 7) },
  { id: 'head', d: ellipse(80, 24, 12, 9) },
];

export const dino: Picture = {
  id: 'dino',
  name: '공룡',
  emoji: '🦖',
  level: 3,
  regions,
  lines: [circle(84, 21, 1.8), 'M80 29Q86 31 90 27'],
};
