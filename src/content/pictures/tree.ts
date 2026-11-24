import { BG, circle, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'ground', d: 'M0 84Q50 78 100 84L100 100L0 100Z' },
  { id: 'trunk', d: 'M44 54L56 54L58 88L42 88Z' },
  { id: 'crownL', d: circle(34, 48, 16) },
  { id: 'crownR', d: circle(66, 48, 16) },
  { id: 'crownTop', d: circle(50, 32, 20) },
  { id: 'apple1', d: circle(38, 52, 4) },
  { id: 'apple2', d: circle(58, 30, 4) },
  { id: 'apple3', d: circle(66, 54, 4) },
];

export const tree: Picture = { id: 'tree', name: '나무', emoji: '🌳', level: 2, regions, lines: [] };
