import { BG, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'ground', d: 'M0 88L100 88L100 100L0 100Z' },
  {
    id: 'wall',
    d: 'M26 88L26 40L33 40L33 46L40 46L40 40L47 40L47 46L53 46L53 40L60 40L60 46L67 46L67 40L74 40L74 88Z',
  },
  { id: 'towerL', d: 'M10 36L28 36L28 88L10 88Z' },
  { id: 'towerR', d: 'M72 36L90 36L90 88L72 88Z' },
  { id: 'roofL', d: 'M8 36L19 14L30 36Z' },
  { id: 'roofR', d: 'M70 36L81 14L92 36Z' },
  { id: 'flagL', d: 'M19 4L28 7L19 10Z' },
  { id: 'flagR', d: 'M81 4L90 7L81 10Z' },
  { id: 'gate', d: 'M42 88L42 72Q50 60 58 72L58 88Z' },
  { id: 'winL', d: 'M15 62L15 54Q19 48 23 54L23 62Z' },
  { id: 'winR', d: 'M77 62L77 54Q81 48 85 54L85 62Z' },
  { id: 'winC', d: 'M46 58L46 52Q50 47 54 52L54 58Z' },
];

export const castle: Picture = {
  id: 'castle',
  name: '성',
  emoji: '🏰',
  level: 3,
  regions,
  lines: ['M19 14L19 4', 'M81 14L81 4'],
};
