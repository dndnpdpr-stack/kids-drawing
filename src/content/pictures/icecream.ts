import { BG, circle, type Picture, type Region } from './types';

/** 아이스크림 위에서 시작해 오른쪽 → 콘 끝 → 왼쪽으로 한 바퀴 */
export const OUTLINE: [number, number][] = [
  [50, 18], [60, 20.7], [67.3, 28], [70, 38], [67.3, 48], [59, 71], [50, 92],
  [41, 71], [32.7, 48], [30, 38], [32.7, 28], [40, 20.7], [50, 18],
];

const regions: Region[] = [
  BG,
  { id: 'scoop', d: circle(50, 38, 20) },
  { id: 'cone', d: 'M32 50L68 50L50 92Z' },
  { id: 'cherry', d: circle(50, 15, 5) },
];

export const icecream: Picture = {
  id: 'icecream',
  name: '아이스크림',
  emoji: '🍦',
  level: 1,
  regions,
  lines: ['M40 56L54 76', 'M60 56L46 76'],
};
