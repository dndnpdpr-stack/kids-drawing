import { outlines, poly, type Picture, type Region } from './types';

type P = [number, number];
const O: P[] = [[50, 9], [91.8, 39.4], [75.9, 88.6], [24.1, 88.6], [8.2, 39.4]];
const I: P[] = [[60.6, 38.4], [67.1, 58.6], [50, 71], [32.9, 58.6], [39.4, 38.4]];

/** 위 꼭짓점에서 시작해 시계 방향으로 별 테두리 */
export const OUTLINE: P[] = [...O.flatMap((o, k) => [o, I[k]]), O[0]];

const regions: Region[] = [
  ...O.map((o, k) => ({ id: `tip${k + 1}`, d: poly([I[(k + 4) % 5], o, I[k]]) })),
  { id: 'center', d: poly(I) },
];

export const star: Picture = { id: 'star', name: '별', emoji: '⭐', level: 1, regions, lines: outlines(regions) };
