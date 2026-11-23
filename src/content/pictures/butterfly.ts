import { BG, circle, ellipse, outlines, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'wingTL', d: 'M48 46C30 14 6 12 8 32C10 46 28 52 48 50Z' },
  { id: 'wingTR', d: 'M52 46C70 14 94 12 92 32C90 46 72 52 52 50Z' },
  { id: 'wingBL', d: 'M48 52C28 54 14 66 20 80C28 92 44 80 48 60Z' },
  { id: 'wingBR', d: 'M52 52C72 54 86 66 80 80C72 92 56 80 52 60Z' },
  { id: 'spotTL', d: circle(26, 32, 7) },
  { id: 'spotTR', d: circle(74, 32, 7) },
  { id: 'spotBL', d: circle(31, 72, 6) },
  { id: 'spotBR', d: circle(69, 72, 6) },
  { id: 'body', d: ellipse(50, 56, 5, 22) },
  { id: 'head', d: circle(50, 29, 6) },
];

export const butterfly: Picture = {
  id: 'butterfly',
  name: '나비',
  emoji: '🦋',
  level: 3,
  regions,
  lines: outlines(regions, 'M48 24Q42 13 38 10', 'M52 24Q58 13 62 10'),
};
