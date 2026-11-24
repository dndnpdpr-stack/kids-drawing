import { BG, circle, poly, type Picture, type Region } from './types';

const r1 = (n: number) => Math.round(n * 10) / 10;
/** 햇살: 뾰족한 16각 별 (해 얼굴 뒤에 깔린다) */
const RAYS: [number, number][] = Array.from({ length: 16 }, (_, i) => {
  const r = i % 2 ? 28 : 44;
  const t = (Math.PI * i) / 8;
  return [r1(50 + r * Math.sin(t)), r1(50 - r * Math.cos(t))];
});

const regions: Region[] = [
  BG,
  { id: 'rays', d: poly(RAYS) },
  { id: 'face', d: circle(50, 50, 24) },
  { id: 'cheekL', d: circle(38, 57, 4) },
  { id: 'cheekR', d: circle(62, 57, 4) },
];

export const sun: Picture = {
  id: 'sun',
  name: '해',
  emoji: '☀️',
  level: 1,
  regions,
  lines: [circle(42, 44, 1.5), circle(58, 44, 1.5), 'M42 58Q50 65 58 58'],
};
