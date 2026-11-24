import { BG, circle, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'sun', d: circle(84, 18, 8) },
  { id: 'sailBig', d: 'M52 16L52 64L80 64Z' },
  { id: 'sailSmall', d: 'M48 24L48 64L24 64Z' },
  { id: 'flag', d: 'M52 8L64 12L52 16Z' },
  { id: 'mast', d: 'M48 8L52 8L52 68L48 68Z' },
  { id: 'hull', d: 'M12 66L88 66L76 82L24 82Z' },
  { id: 'sea', d: 'M0 80Q12 74 25 80Q37 86 50 80Q62 74 75 80Q87 86 100 80L100 100L0 100Z' },
];

export const boat: Picture = { id: 'boat', name: '배', emoji: '⛵', level: 2, regions, lines: [] };
