import { apple } from './apple';
import { balloon } from './balloon';
import { boat } from './boat';
import { butterfly } from './butterfly';
import { car } from './car';
import { castle } from './castle';
import { cat } from './cat';
import { dino } from './dino';
import { fish } from './fish';
import { flower } from './flower';
import { heart } from './heart';
import { house } from './house';
import { icecream } from './icecream';
import { mushroom } from './mushroom';
import { owl } from './owl';
import { rabbit } from './rabbit';
import { rocket } from './rocket';
import { snowman } from './snowman';
import { star } from './star';
import { sun } from './sun';
import { train } from './train';
import { tree } from './tree';
import { turtle } from './turtle';
import { umbrella } from './umbrella';
import type { Picture } from './types';

export type { Picture, Region } from './types';

/** 쉬운 것부터 (level 오름차순) */
export const PICTURES: Picture[] = [
  apple, balloon, heart, star, fish, house, sun, icecream, umbrella, mushroom,
  flower, car, cat, boat, tree, snowman, turtle,
  butterfly, dino, rocket, train, castle, rabbit, owl,
];

export function getPicture(id: string): Picture | undefined {
  return PICTURES.find((p) => p.id === id);
}
