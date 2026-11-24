import { BG, circle, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'smoke1', d: circle(30, 16, 6) },
  { id: 'smoke2', d: circle(20, 8, 4) },
  { id: 'rail', d: 'M0 88L100 88L100 92L0 92Z' },
  { id: 'chimney', d: 'M22 28L34 28L31 46L25 46Z' },
  { id: 'dome', d: circle(44, 44, 5) },
  { id: 'boiler', d: 'M14 44L58 44L58 72L14 72Z' },
  { id: 'cab', d: 'M58 28L88 28L88 72L58 72Z' },
  { id: 'roof', d: 'M54 22L92 22L92 28L54 28Z' },
  { id: 'window', d: 'M64 34L82 34L82 48L64 48Z' },
  { id: 'cow', d: 'M6 84L14 64L14 84Z' },
  { id: 'wheel1', d: circle(26, 78, 8) },
  { id: 'wheel2', d: circle(48, 78, 8) },
  { id: 'wheel3', d: circle(74, 76, 10) },
];

export const train: Picture = { id: 'train', name: '기차', emoji: '🚂', level: 3, regions, lines: ['M26 78L48 78'] };
