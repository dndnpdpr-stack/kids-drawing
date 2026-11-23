import { BG, circle, outlines, type Picture, type Region } from './types';

export const OUTLINE: [number, number][] = [
  [50, 30], [40, 18], [26, 16], [14, 26], [13, 40], [20, 56], [34, 72], [50, 88],
  [66, 72], [80, 56], [87, 40], [86, 26], [74, 16], [60, 18], [50, 30],
];

const regions: Region[] = [
  BG,
  { id: 'heart', d: 'M50 88C20 68 8 48 12 32C16 16 38 12 50 30C62 12 84 16 88 32C92 48 80 68 50 88Z' },
  { id: 'inner', d: 'M50 75C30 61 23 49 26 39C29 29 42 26 50 40C58 26 71 29 74 39C77 49 70 61 50 75Z' },
  { id: 'shine', d: circle(37, 42, 6) },
];

export const heart: Picture = { id: 'heart', name: '하트', emoji: '❤️', level: 1, regions, lines: outlines(regions) };
