import { apple } from './apple';
import { balloon } from './balloon';
import { butterfly } from './butterfly';
import { car } from './car';
import { cat } from './cat';
import { dino } from './dino';
import { fish } from './fish';
import { flower } from './flower';
import { heart } from './heart';
import { house } from './house';
import { rocket } from './rocket';
import { star } from './star';
import type { Picture } from './types';

export type { Picture, Region } from './types';

/** 쉬운 것부터 (level 오름차순) */
export const PICTURES: Picture[] = [
  apple, balloon, heart, star, fish, house,
  flower, car, cat,
  butterfly, dino, rocket,
];

export function getPicture(id: string): Picture | undefined {
  return PICTURES.find((p) => p.id === id);
}
