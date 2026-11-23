import { BG, circle, ellipse, outlines, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'tail', d: 'M70 80C90 76 93 58 85 49C80 55 83 67 69 71Z' },
  { id: 'body', d: ellipse(50, 74, 26, 18) },
  { id: 'belly', d: ellipse(50, 79, 12, 10) },
  { id: 'earL', d: 'M28 32L31 10L45 24Z' },
  { id: 'earR', d: 'M72 32L69 10L55 24Z' },
  { id: 'head', d: circle(50, 40, 22) },
  { id: 'eyeL', d: circle(41, 37, 5) },
  { id: 'eyeR', d: circle(59, 37, 5) },
];

export const cat: Picture = {
  id: 'cat',
  name: '고양이',
  emoji: '🐱',
  level: 2,
  regions,
  lines: outlines(
    regions,
    'M47 46L53 46L50 50Z',
    'M50 50Q46 55 43 52',
    'M50 50Q54 55 57 52',
    'M38 48L24 46',
    'M38 51L25 54',
    'M62 48L76 46',
    'M62 51L75 54',
  ),
};
