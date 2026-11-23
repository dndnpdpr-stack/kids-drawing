import { BG, type Picture, type Region } from './types';

export const OUTLINE: [number, number][] = [
  [50, 10], [32, 14], [20, 28], [18, 46], [26, 62], [38, 73], [50, 78],
  [62, 73], [74, 62], [82, 46], [80, 28], [68, 14], [50, 10],
];

const regions: Region[] = [
  BG,
  { id: 'grass', d: 'M0 88Q50 76 100 88L100 100L0 100Z' },
  { id: 'balloon', d: 'M50 10C74 10 84 30 82 46C80 64 62 76 50 78C38 76 20 64 18 46C16 30 26 10 50 10Z' },
  { id: 'shine', d: 'M29 32C31 22 39 17 47 17C41 23 37 30 35 39C31 39 28 36 29 32Z' },
  { id: 'knot', d: 'M45 77L55 77L58 85L42 85Z' },
];

export const balloon: Picture = {
  id: 'balloon',
  name: '풍선',
  emoji: '🎈',
  level: 1,
  regions,
  lines: ['M50 85C45 89 55 92 50 96'],
};
