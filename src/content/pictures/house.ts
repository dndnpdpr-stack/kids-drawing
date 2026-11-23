import { BG, type Picture, type Region } from './types';

/** 왼쪽 아래에서 시작해 벽 → 지붕 → 벽 → 바닥 */
export const OUTLINE: [number, number][] = [
  [22, 86], [22, 68], [22, 50], [36, 33], [50, 16], [64, 33], [78, 50], [78, 68], [78, 86],
  [64, 86], [50, 86], [36, 86], [22, 86],
];

const regions: Region[] = [
  BG,
  { id: 'ground', d: 'M0 82L100 82L100 100L0 100Z' },
  { id: 'wall', d: 'M22 48L78 48L78 86L22 86Z' },
  { id: 'roof', d: 'M16 52L50 16L84 52Z' },
  { id: 'door', d: 'M52 62L66 62L66 86L52 86Z' },
  { id: 'window', d: 'M29 58L44 58L44 72L29 72Z' },
];

export const house: Picture = {
  id: 'house',
  name: '집',
  emoji: '🏠',
  level: 1,
  regions,
  lines: ['M36.5 58L36.5 72', 'M29 65L44 65'],
};
