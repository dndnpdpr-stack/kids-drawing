import { BG, circle, type Picture, type Region } from './types';

const PETALS: [number, number][] = [[50, 22], [65.2, 33.1], [59.4, 50.9], [40.6, 50.9], [34.8, 33.1]];

const regions: Region[] = [
  BG,
  { id: 'grass', d: 'M0 86Q50 80 100 86L100 100L0 100Z' },
  { id: 'stem', d: 'M46 48L54 48L54 90L46 90Z' },
  { id: 'leaf', d: 'M54 72C62 58 76 58 81 62C75 72 64 77 54 72Z' },
  ...PETALS.map(([x, y], i) => ({ id: `petal${i + 1}`, d: circle(x, y, 12) })),
  { id: 'center', d: circle(50, 38, 10) },
];

export const flower: Picture = { id: 'flower', name: '꽃', emoji: '🌸', level: 2, regions, lines: [] };
