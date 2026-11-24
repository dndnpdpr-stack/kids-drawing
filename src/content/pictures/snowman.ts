import { BG, circle, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'ground', d: 'M0 86Q50 80 100 86L100 100L0 100Z' },
  { id: 'body', d: circle(50, 70, 20) },
  { id: 'head', d: circle(50, 40, 14) },
  { id: 'scarf', d: 'M36 50Q50 58 64 50L66 56Q50 64 34 56Z' },
  { id: 'hatTop', d: 'M40 12L60 12L60 28L40 28Z' },
  { id: 'hatBrim', d: 'M33 27L67 27L67 31L33 31Z' },
  { id: 'nose', d: 'M50 40L60 43L50 45Z' },
  { id: 'button1', d: circle(50, 68, 2.5) },
  { id: 'button2', d: circle(50, 78, 2.5) },
];

export const snowman: Picture = {
  id: 'snowman',
  name: '눈사람',
  emoji: '⛄',
  level: 2,
  regions,
  lines: [circle(44, 36, 1.2), circle(56, 36, 1.2), 'M45 48Q50 51 55 48', 'M31 66L18 56', 'M69 66L82 56'],
};
