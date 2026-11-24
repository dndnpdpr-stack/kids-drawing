import { BG, circle, ellipse, poly, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'tail', d: 'M18 64L8 69L18 72Z' },
  { id: 'legBack', d: ellipse(28, 74, 7, 9) },
  { id: 'legFront', d: ellipse(68, 74, 7, 9) },
  { id: 'head', d: circle(84, 60, 10) },
  { id: 'shell', d: 'M16 70Q18 34 50 32Q80 34 82 70Z' },
  { id: 'spot', d: poly([[50, 44], [57, 48], [57, 56], [50, 60], [43, 56], [43, 48]]) },
  { id: 'spotL', d: circle(31, 58, 5) },
  { id: 'spotR', d: circle(69, 58, 5) },
];

export const turtle: Picture = {
  id: 'turtle',
  name: '거북이',
  emoji: '🐢',
  level: 2,
  regions,
  lines: [circle(87, 57, 1.2), 'M84 64Q87 66 90 63'],
};
