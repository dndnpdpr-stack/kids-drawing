import type { Pt, Stroke } from '../core/trace';
import { OUTLINE as APPLE } from './pictures/apple';
import { OUTLINE as BALLOON } from './pictures/balloon';
import { OUTLINE as FISH } from './pictures/fish';
import { OUTLINE as HEART } from './pictures/heart';
import { OUTLINE as HOUSE } from './pictures/house';
import { OUTLINE as ICECREAM } from './pictures/icecream';
import { OUTLINE as MUSHROOM } from './pictures/mushroom';
import { OUTLINE as STAR } from './pictures/star';

/** picture 테두리를 따라 그리는 그림 · multi 여러 획으로 완성하는 그림 */
export type TraceGroup = 'picture' | 'multi';

export interface TraceItem {
  id: string;
  name: string;
  emoji: string;
  group: TraceGroup;
  strokes: Stroke[];
  /** 다 그리면 바로 칠하러 갈 수 있는 색칠 그림 id */
  picture?: string;
}

/** 이웃 체크포인트 사이 최대 거리. 허용 거리보다 촘촘히 채워 끊기지 않고 따라가지게 한다. */
const MAX_GAP = 0.15;

const r3 = (n: number) => Math.round(n * 1000) / 1000;
const r1 = (n: number) => Math.round(n * 10) / 10;

function densify(pts: Pt[]): Pt[] {
  const out: Pt[] = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / MAX_GAP);
    for (let k = 1; k <= n; k++) out.push({ x: r3(a.x + ((b.x - a.x) * k) / n), y: r3(a.y + ((b.y - a.y) * k) / n) });
  }
  return out;
}

const stroke = (list: [number, number][]): Stroke => ({ points: densify(list.map(([x, y]) => ({ x, y }))) });

/** 색칠 그림 좌표(0~100) → 따라 그리기 좌표(0.1~0.9) */
const fromPicture = (list: [number, number][]): [number, number][] =>
  list.map(([x, y]) => [r3(0.1 + x * 0.008), r3(0.1 + y * 0.008)]);

/**
 * 닫힌 윤곽을 두 획으로: 시작점에서 반 바퀴씩 양쪽으로 내려간다.
 * 두 획 모두 같은 점에서 시작하고, 가운데 점(보통 맨 아래)에서 만난다.
 */
function halves(list: [number, number][]): Stroke[] {
  const mid = Math.floor((list.length - 1) / 2);
  return [stroke(list.slice(0, mid + 1)), stroke(list.slice(mid).reverse())];
}

/** 그림 좌표로 적은 열린 획 하나 */
const pic = (list: [number, number][]): Stroke => stroke(fromPicture(list));
/** 그림 좌표로 적은 닫힌 윤곽 (두 획) */
const closed = (list: [number, number][]): Stroke[] => halves(fromPicture(list));

/** 위에서 시작해 시계 방향으로 도는 호. 각도는 위=0°, 오른쪽=90° (그림 좌표) */
function arc(cx: number, cy: number, rx: number, ry: number, from: number, to: number, n: number): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = ((from + ((to - from) * i) / n) * Math.PI) / 180;
    return [r1(cx + rx * Math.sin(t)), r1(cy - ry * Math.cos(t))];
  });
}

/** 위에서 시작하는 동그라미 (그림 좌표) */
const ring = (cx: number, cy: number, r: number, n = 16) => arc(cx, cy, r, r, 0, 360, n);
/** 위에서 시작하는 타원 (그림 좌표) */
const oval = (cx: number, cy: number, rx: number, ry: number, n = 16) => arc(cx, cy, rx, ry, 0, 360, n);

/** 꽃잎·나뭇잎처럼 울퉁불퉁한 동그라미 (그림 좌표) */
function bumpy(cx: number, cy: number, r: number, bump: number, k: number, n = 40): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / n;
    const rr = r + bump * Math.cos(k * t);
    return [r1(cx - rr * Math.sin(t)), r1(cy - rr * Math.cos(t))];
  });
}

/** 햇살 8개: 해 가까이에서 바깥으로 */
const sunRays: Stroke[] = Array.from({ length: 8 }, (_, i) => {
  const t = (Math.PI * i) / 4;
  const at = (r: number): [number, number] => [r1(50 + r * Math.sin(t)), r1(50 - r * Math.cos(t))];
  return pic([at(28), at(40)]);
});

/* ---------- 한 획 그림의 윤곽 (그림 좌표). 위 가운데에서 시작해 가운데 점이 맨 아래 ---------- */

/** 우산: 둥근 지붕 → 물결 모양 아랫단 */
const UMBRELLA: [number, number][] = [
  [50, 14], [68, 17], [80, 26], [86, 38], [88, 52], [81, 46], [75, 52], [69, 46], [63, 52], [56, 46],
  [50, 52],
  [44, 46], [37, 52], [31, 46], [25, 52], [19, 46], [12, 52], [14, 38], [20, 26], [32, 17], [50, 14],
];

/** 거북이 등딱지 */
const SHELL: [number, number][] = [
  [50, 32], [66, 35], [76, 44], [81, 56], [82, 70], [50, 70], [16, 70], [17, 56], [22, 44], [34, 35], [50, 32],
];

/** 고양이 얼굴: 오른쪽 귀 → 얼굴 아래로 한 바퀴 → 왼쪽 귀 */
const CAT: [number, number][] = [[50, 18], [56, 19], [69, 10], ...arc(50, 40, 22, 22, 64, 296, 8), [31, 10], [44, 19], [50, 18]];

export const TRACE_ITEMS: TraceItem[] = [
  // 한 획 그림: 테두리를 따라 한 바퀴 (반 바퀴씩 두 획)
  { id: 'fish', name: '물고기', emoji: '🐟', group: 'picture', strokes: closed(FISH), picture: 'fish' },
  { id: 'apple', name: '사과', emoji: '🍎', group: 'picture', strokes: closed(APPLE), picture: 'apple' },
  { id: 'balloon', name: '풍선', emoji: '🎈', group: 'picture', strokes: closed(BALLOON), picture: 'balloon' },
  { id: 'heart', name: '하트', emoji: '❤️', group: 'picture', strokes: closed(HEART), picture: 'heart' },
  { id: 'star', name: '별', emoji: '⭐', group: 'picture', strokes: closed(STAR), picture: 'star' },
  { id: 'house', name: '집', emoji: '🏠', group: 'picture', strokes: closed(HOUSE), picture: 'house' },
  { id: 'icecream', name: '아이스크림', emoji: '🍦', group: 'picture', strokes: closed(ICECREAM), picture: 'icecream' },
  { id: 'mushroom', name: '버섯', emoji: '🍄', group: 'picture', strokes: closed(MUSHROOM), picture: 'mushroom' },
  {
    id: 'umbrella',
    name: '우산',
    emoji: '☂️',
    group: 'picture',
    strokes: [...closed(UMBRELLA), pic([[50, 52], [50, 84], [46, 89], [40, 84]])],
    picture: 'umbrella',
  },
  {
    id: 'turtle',
    name: '거북이',
    emoji: '🐢',
    group: 'picture',
    strokes: [...closed(SHELL), pic([[82, 64], [83, 52], [92, 51], [95, 61], [88, 69], [82, 68]])],
    picture: 'turtle',
  },
  { id: 'cat', name: '고양이', emoji: '🐱', group: 'picture', strokes: closed(CAT), picture: 'cat' },

  // 여러 획: 큰 모양 먼저, 세부는 나중
  {
    id: 'face',
    name: '웃는 얼굴',
    emoji: '😊',
    group: 'multi',
    strokes: [
      ...closed(ring(50, 50, 36)),
      pic([[38, 36], [38, 48]]),
      pic([[62, 36], [62, 48]]),
      pic([[32, 60], [41, 69], [50, 72], [59, 69], [68, 60]]),
    ],
  },
  { id: 'sunM', name: '해', emoji: '☀️', group: 'multi', strokes: [...closed(ring(50, 50, 20)), ...sunRays], picture: 'sun' },
  {
    id: 'flowerM',
    name: '꽃',
    emoji: '🌸',
    group: 'multi',
    strokes: [
      ...closed(bumpy(50, 34, 19, 6, 5)),
      ...closed(ring(50, 34, 7, 12)),
      pic([[50, 47], [50, 90]]),
      pic([[50, 76], [62, 66], [74, 64]]),
    ],
    picture: 'flower',
  },
  {
    id: 'houseM',
    name: '집',
    emoji: '🏠',
    group: 'multi',
    strokes: [
      pic([[22, 50], [22, 86], [78, 86], [78, 50]]),
      pic([[16, 52], [50, 18], [84, 52]]),
      pic([[44, 86], [44, 66], [56, 66], [56, 86]]),
      pic([[28, 58], [38, 58], [38, 68], [28, 68], [28, 58]]),
    ],
    picture: 'house',
  },
  {
    id: 'snowmanM',
    name: '눈사람',
    emoji: '⛄',
    group: 'multi',
    strokes: [
      ...closed(ring(50, 70, 20)),
      ...closed(ring(50, 38, 12)),
      pic([[32, 64], [18, 54]]),
      pic([[68, 64], [82, 54]]),
    ],
    picture: 'snowman',
  },
  {
    id: 'treeM',
    name: '나무',
    emoji: '🌳',
    group: 'multi',
    strokes: [
      ...closed(bumpy(50, 40, 24, 4, 6)),
      pic([[43, 67], [43, 90]]),
      pic([[57, 67], [57, 90]]),
      pic([[12, 90], [88, 90]]),
    ],
    picture: 'tree',
  },
  {
    id: 'boatM',
    name: '배',
    emoji: '⛵',
    group: 'multi',
    strokes: [
      pic([[12, 66], [88, 66], [76, 82], [24, 82], [12, 66]]),
      pic([[50, 66], [50, 10]]),
      pic([[52, 16], [80, 64], [52, 64]]),
      pic([[48, 24], [24, 64], [48, 64]]),
      pic([[10, 90], [22, 86], [34, 90], [46, 86], [58, 90], [70, 86], [82, 90], [90, 88]]),
    ],
    picture: 'boat',
  },
  {
    id: 'carM',
    name: '자동차',
    emoji: '🚗',
    group: 'multi',
    strokes: [
      ...closed([
        [51, 34], [66, 34], [76, 50], [88, 50], [94, 57], [94, 72], [51, 72],
        [8, 72], [8, 58], [12, 51], [28, 50], [36, 34], [51, 34],
      ]),
      ...closed(ring(28, 72, 10, 12)),
      ...closed(ring(74, 72, 10, 12)),
      pic([[51, 34], [51, 50]]),
    ],
    picture: 'car',
  },
  {
    id: 'butterflyM',
    name: '나비',
    emoji: '🦋',
    group: 'multi',
    strokes: [
      pic([[50, 30], [50, 78]]),
      pic([[48, 46], [36, 26], [22, 16], [10, 22], [8, 34], [18, 46], [34, 51], [48, 50]]),
      pic([[52, 46], [64, 26], [78, 16], [90, 22], [92, 34], [82, 46], [66, 51], [52, 50]]),
      pic([[48, 54], [30, 56], [18, 68], [22, 82], [34, 84], [44, 74], [48, 60]]),
      pic([[52, 54], [70, 56], [82, 68], [78, 82], [66, 84], [56, 74], [52, 60]]),
      pic([[48, 30], [40, 16]]),
      pic([[52, 30], [60, 16]]),
    ],
    picture: 'butterfly',
  },
  {
    id: 'rocketM',
    name: '로켓',
    emoji: '🚀',
    group: 'multi',
    strokes: [
      ...closed([[50, 8], [60, 18], [64, 40], [64, 70], [50, 70], [36, 70], [36, 40], [40, 18], [50, 8]]),
      ...closed(ring(50, 43, 8, 12)),
      pic([[37, 52], [21, 76], [37, 70]]),
      pic([[63, 52], [79, 76], [63, 70]]),
      pic([[40, 70], [44, 88], [50, 80], [56, 88], [60, 70]]),
    ],
    picture: 'rocket',
  },
  {
    id: 'rabbitM',
    name: '토끼',
    emoji: '🐰',
    group: 'multi',
    strokes: [
      ...closed(ring(50, 48, 16)),
      pic([[37, 36], [34, 20], [36, 8], [40, 4], [44, 8], [46, 20], [44, 33]]),
      pic([[63, 36], [66, 20], [64, 8], [60, 4], [56, 8], [54, 20], [56, 33]]),
      ...closed(oval(50, 76, 20, 14)),
    ],
    picture: 'rabbit',
  },
  {
    id: 'owlM',
    name: '부엉이',
    emoji: '🦉',
    group: 'multi',
    strokes: [
      ...closed(oval(50, 58, 26, 30)),
      ...closed(ring(39, 42, 9, 12)),
      ...closed(ring(61, 42, 9, 12)),
      pic([[46, 53], [50, 60], [54, 53]]),
      pic([[28, 36], [28, 14], [42, 28]]),
      pic([[72, 36], [72, 14], [58, 28]]),
      pic([[8, 90], [92, 90]]),
    ],
    picture: 'owl',
  },
];

export function getTraceItem(id: string): TraceItem | undefined {
  return TRACE_ITEMS.find((t) => t.id === id);
}

export function nextTraceItem(id: string): TraceItem {
  const i = TRACE_ITEMS.findIndex((t) => t.id === id);
  return TRACE_ITEMS[(i + 1) % TRACE_ITEMS.length];
}
