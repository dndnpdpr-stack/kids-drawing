import { BG, circle, type Picture, type Region } from './types';

const regions: Region[] = [
  BG,
  { id: 'handle', d: 'M48 50L52 50L52 82Q52 90 44 90Q36 90 36 82L40 82Q40 86 44 86Q48 86 48 82Z' },
  {
    id: 'canopy',
    d: 'M12 52Q14 16 50 14Q86 16 88 52Q81 46 75 52Q69 46 63 52Q56 46 50 52Q44 46 37 52Q31 46 25 52Q19 46 12 52Z',
  },
  { id: 'middle', d: 'M50 14Q38 30 37 52Q44 46 50 52Q56 46 63 52Q62 30 50 14Z' },
  { id: 'tip', d: circle(50, 12, 3) },
];

export const umbrella: Picture = { id: 'umbrella', name: '우산', emoji: '☂️', level: 1, regions, lines: [] };
