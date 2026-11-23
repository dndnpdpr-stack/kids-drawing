import { BG, type Picture, type Region } from './types';

/** 따라 그리기용 바깥 윤곽 (꼭지 아래 가운데에서 시작해 왼쪽으로) */
export const OUTLINE: [number, number][] = [
  [50, 30], [38, 22], [24, 24], [15, 38], [15, 56], [22, 74], [36, 88], [50, 86],
  [64, 88], [78, 74], [85, 56], [85, 38], [76, 24], [62, 22], [50, 30],
];

const regions: Region[] = [
  BG,
  { id: 'stem', d: 'M47 32L45 13L53 12L54 32Z' },
  { id: 'leaf', d: 'M54 22C60 9 74 7 80 11C74 21 64 26 54 22Z' },
  { id: 'body', d: 'M50 30C36 18 13 26 14 50C15 74 33 92 50 86C67 92 85 74 86 50C87 26 64 18 50 30Z' },
  { id: 'shine', d: 'M23 48C22 37 31 30 40 32C34 38 32 46 31 55C27 56 23 53 23 48Z' },
];

export const apple: Picture = { id: 'apple', name: '사과', emoji: '🍎', level: 1, regions, lines: [] };
