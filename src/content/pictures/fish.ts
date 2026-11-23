import { BG, circle, ellipse, type Picture, type Region } from './types';

/** 코에서 시작해 위쪽 → 꼬리 → 아래쪽 */
export const OUTLINE: [number, number][] = [
  [15, 50], [19, 38], [30, 31], [45, 30], [60, 31], [71, 38], [75, 46], [92, 30], [92, 50],
  [92, 70], [75, 54], [71, 62], [60, 69], [45, 70], [30, 69], [19, 62], [15, 50],
];

const regions: Region[] = [
  BG,
  { id: 'tail', d: 'M68 50L92 30L92 70Z' },
  { id: 'fin', d: 'M36 34Q48 16 62 34Z' },
  { id: 'body', d: ellipse(45, 50, 30, 20) },
  { id: 'stripe', d: 'M47 33Q53 50 47 67L59 66Q65 50 59 34Z' },
  { id: 'eye', d: circle(28, 46, 6) },
];

export const fish: Picture = {
  id: 'fish',
  name: '물고기',
  emoji: '🐟',
  level: 1,
  regions,
  lines: ['M18 56Q22 60 26 58', circle(80, 18, 3), circle(86, 10, 2)],
};
