import { BG, circle, ellipse, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'grass', d: 'M0 90Q50 86 100 90L100 100L0 100Z' },
  { id: 'tail', d: circle(72, 82, 6) },
  { id: 'body', d: ellipse(50, 74, 20, 16) },
  { id: 'earL', d: ellipse(40, 22, 7, 18) },
  { id: 'earR', d: ellipse(60, 22, 7, 18) },
  { id: 'innerL', d: ellipse(40, 22, 3.5, 13) },
  { id: 'innerR', d: ellipse(60, 22, 3.5, 13) },
  { id: 'head', d: circle(50, 48, 16) },
  { id: 'cheekL', d: circle(40, 55, 3.5) },
  { id: 'cheekR', d: circle(60, 55, 3.5) },
  { id: 'footL', d: ellipse(40, 90, 8, 4) },
  { id: 'footR', d: ellipse(60, 90, 8, 4) },
];

export const rabbit: Picture = {
  id: 'rabbit',
  name: '토끼',
  emoji: '🐰',
  level: 3,
  regions,
  lines: [
    circle(44, 45, 1.2),
    circle(56, 45, 1.2),
    'M48 51L52 51L50 53Z',
    'M50 53Q48 57 45 56',
    'M50 53Q52 57 55 56',
  ],
};
