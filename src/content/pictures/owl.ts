import { BG, circle, ellipse, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'branch', d: 'M4 86L96 86L96 92L4 92Z' },
  { id: 'earL', d: 'M27 42L28 14L46 30Z' },
  { id: 'earR', d: 'M73 42L72 14L54 30Z' },
  { id: 'body', d: ellipse(50, 58, 26, 30) },
  { id: 'wingL', d: 'M25 48Q12 66 28 82Q31 66 25 48Z' },
  { id: 'wingR', d: 'M75 48Q88 66 72 82Q69 66 75 48Z' },
  { id: 'belly', d: ellipse(50, 68, 15, 17) },
  { id: 'eyeL', d: circle(39, 42, 10) },
  { id: 'eyeR', d: circle(61, 42, 10) },
  { id: 'pupilL', d: circle(39, 42, 4) },
  { id: 'pupilR', d: circle(61, 42, 4) },
  { id: 'beak', d: 'M46 52L54 52L50 60Z' },
  { id: 'footL', d: 'M36 92L40 84L44 92Z' },
  { id: 'footR', d: 'M56 92L60 84L64 92Z' },
];

export const owl: Picture = { id: 'owl', name: '부엉이', emoji: '🦉', level: 3, regions, lines: [] };
