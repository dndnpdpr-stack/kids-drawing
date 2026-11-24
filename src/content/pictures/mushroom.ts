import { BG, circle, type Picture, type Region } from './types';

/** 갓 꼭대기에서 시작해 오른쪽 → 기둥 아래 → 왼쪽으로 한 바퀴 */
export const OUTLINE: [number, number][] = [
  [50, 16], [72, 21], [84, 36], [86, 60], [62, 62], [63, 86], [50, 88],
  [37, 86], [38, 62], [14, 60], [16, 36], [28, 21], [50, 16],
];

const regions: Region[] = [
  BG,
  { id: 'stem', d: 'M38 56Q36 84 40 88L60 88Q64 84 62 56Z' },
  { id: 'cap', d: 'M14 60Q14 18 50 16Q86 18 86 60Q50 68 14 60Z' },
  { id: 'spotL', d: circle(34, 42, 7) },
  { id: 'spotR', d: circle(62, 33, 8) },
];

export const mushroom: Picture = { id: 'mushroom', name: '버섯', emoji: '🍄', level: 1, regions, lines: [] };
