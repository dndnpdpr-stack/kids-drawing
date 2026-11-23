import { BG, circle, outlines, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'road', d: 'M0 82L100 82L100 100L0 100Z' },
  { id: 'sun', d: circle(86, 16, 9) },
  { id: 'body', d: 'M8 72L8 58Q10 50 18 50L28 50L36 34L66 34L76 50L88 50Q94 50 94 58L94 72Z' },
  { id: 'windowL', d: 'M38 38L50 38L50 50L31 50Z' },
  { id: 'windowR', d: 'M54 38L64 38L71 50L54 50Z' },
  { id: 'wheelL', d: circle(28, 72, 10) },
  { id: 'wheelR', d: circle(74, 72, 10) },
];

export const car: Picture = {
  id: 'car',
  name: '자동차',
  emoji: '🚗',
  level: 2,
  regions,
  lines: outlines(regions, circle(28, 72, 3.5), circle(74, 72, 3.5), 'M10 90L22 90', 'M44 90L56 90', 'M78 90L90 90'),
};
