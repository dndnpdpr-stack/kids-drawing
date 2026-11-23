import { apple } from './apple';
import { balloon } from './balloon';
import { fish } from './fish';
import { heart } from './heart';
import { house } from './house';
import { star } from './star';
import type { Picture } from './types';

export type { Picture, Region } from './types';

/** 쉬운 것부터 (level 오름차순) */
export const PICTURES: Picture[] = [apple, balloon, heart, star, fish, house];

export function getPicture(id: string): Picture | undefined {
  return PICTURES.find((p) => p.id === id);
}
