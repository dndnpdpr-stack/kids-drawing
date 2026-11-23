import { BG, circle, outlines, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'moon', d: circle(82, 18, 9) },
  { id: 'planet', d: circle(18, 80, 10) },
  { id: 'flameOuter', d: 'M38 70L62 70L56 90L50 82L44 90Z' },
  { id: 'flameInner', d: 'M43 70L57 70L53 81L50 78L47 81Z' },
  { id: 'finL', d: 'M37 52L21 76L37 70Z' },
  { id: 'finR', d: 'M63 52L79 76L63 70Z' },
  { id: 'body', d: 'M50 8C64 20 66 40 64 70L36 70C34 40 36 20 50 8Z' },
  { id: 'nose', d: 'M50 8C57 14 61 21 62 28L38 28C39 21 43 14 50 8Z' },
  { id: 'band', d: 'M35 58L65 58L64.5 66L35.5 66Z' },
  { id: 'window', d: circle(50, 43, 8) },
];

export const rocket: Picture = {
  id: 'rocket',
  name: '로켓',
  emoji: '🚀',
  level: 3,
  regions,
  lines: outlines(regions, 'M12 20L16 20M14 18L14 22', 'M66 88L70 88M68 86L68 90', 'M28 40L32 40M30 38L30 42'),
};
