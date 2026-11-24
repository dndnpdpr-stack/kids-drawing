import type { Pt, Stroke } from '../core/trace';
import { OUTLINE as APPLE } from './pictures/apple';
import { OUTLINE as BALLOON } from './pictures/balloon';
import { OUTLINE as FISH } from './pictures/fish';
import { OUTLINE as HEART } from './pictures/heart';
import { OUTLINE as HOUSE } from './pictures/house';
import { OUTLINE as ICECREAM } from './pictures/icecream';
import { OUTLINE as MUSHROOM } from './pictures/mushroom';
import { OUTLINE as STAR } from './pictures/star';

/** line 선 · shape 도형 · picture 한 획 그림 · multi 여러 획으로 완성하는 그림 */
export type TraceGroup = 'line' | 'shape' | 'picture' | 'multi';

export interface TraceItem {
  id: string;
  name: string;
  emoji: string;
  group: TraceGroup;
  strokes: Stroke[];
  /** 다 그리면 바로 칠하러 갈 수 있는 색칠 그림 id */
  picture?: string;
}

/** 이웃 체크포인트 사이 최대 거리. 허용 거리(0.12)로 끊기지 않고 따라가지게 촘촘히 채운다. */
const MAX_GAP = 0.15;

const r3 = (n: number) => Math.round(n * 1000) / 1000;

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

const pts = (list: [number, number][]): Pt[] => list.map(([x, y]) => ({ x, y }));
const stroke = (list: [number, number][]): Stroke => ({ points: densify(pts(list)) });

/** 색칠 그림 좌표(0~100) → 따라 그리기 좌표(0.1~0.9) */
const fromPicture = (list: [number, number][]): [number, number][] =>
  list.map(([x, y]) => [r3(0.1 + x * 0.008), r3(0.1 + y * 0.008)]);

/**
 * 닫힌 윤곽을 두 획으로: 시작점에서 반 바퀴씩 양쪽으로 내려간다.
 * 아이가 중간에 손을 떼도 다시 그릴 거리가 짧고, 두 획 모두 같은 점에서 시작한다.
 */
function halves(list: [number, number][]): Stroke[] {
  const mid = Math.floor((list.length - 1) / 2);
  return [stroke(list.slice(0, mid + 1)), stroke(list.slice(mid).reverse())];
}

function ellipsePts(cx: number, cy: number, rx: number, ry: number, n = 16): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / n;
    return [r3(cx - rx * Math.sin(t)), r3(cy - ry * Math.cos(t))];
  });
}

const wave: [number, number][] = Array.from({ length: 13 }, (_, i) => {
  const x = 0.12 + (0.76 * i) / 12;
  return [r3(x), r3(0.5 - 0.15 * Math.sin((i / 12) * Math.PI * 3))];
});

/** 계단: 왼쪽 아래에서 오른쪽 위로 */
const stairs: [number, number][] = [
  [0.15, 0.8], [0.3, 0.8], [0.3, 0.65], [0.45, 0.65], [0.45, 0.5], [0.6, 0.5], [0.6, 0.35], [0.75, 0.35], [0.75, 0.2], [0.85, 0.2],
];

/** 꼬불꼬불: 고리 세 개 (trochoid) */
const loops: [number, number][] = Array.from({ length: 49 }, (_, i) => {
  const t = (Math.PI * i) / 8;
  return [r3(0.14 + 0.038 * t - 0.12 * Math.sin(t)), r3(0.62 - 0.12 * (1 - Math.cos(t)))];
});

/** 초승달: 위 끝에서 바깥 호, 안쪽 호 두 획. 두 획 모두 위 끝에서 시작한다. */
const moonOuter: [number, number][] = Array.from({ length: 13 }, (_, i) => {
  const a0 = Math.atan2(-0.36, 0.12);
  const a = a0 - ((2 * Math.PI - 2 * Math.abs(a0)) * i) / 12;
  return [r3(0.5 + 0.38 * Math.cos(a)), r3(0.5 + 0.38 * Math.sin(a))];
});
const moonInner: [number, number][] = (() => {
  const [tx, ty] = moonOuter[0];
  const [, by] = moonOuter[moonOuter.length - 1];
  return Array.from({ length: 11 }, (_, i) => {
    const k = i / 10;
    return [r3(tx - 0.24 * Math.sin(Math.PI * k)), r3(ty + (by - ty) * k)] as [number, number];
  });
})();

/* ---------- 여러 획 그림: 그림 좌표(0~100)로 적고 fromPicture로 바꾼다 ---------- */

const pic = (list: [number, number][]): Stroke => stroke(fromPicture(list));
const r1 = (n: number) => Math.round(n * 10) / 10;

/** 위에서 시작하는 동그라미 (그림 좌표) */
function ring(cx: number, cy: number, r: number, n = 16): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / n;
    return [r1(cx - r * Math.sin(t)), r1(cy - r * Math.cos(t))];
  });
}

/** 꽃잎·나뭇잎처럼 울퉁불퉁한 동그라미 (그림 좌표) */
function bumpy(cx: number, cy: number, r: number, bump: number, k: number, n = 40): [number, number][] {
  return Array.from({ length: n + 1 }, (_, i) => {
    const t = (2 * Math.PI * i) / n;
    const rr = r + bump * Math.cos(k * t);
    return [r1(cx - rr * Math.sin(t)), r1(cy - rr * Math.cos(t))];
  });
}

const closed = (list: [number, number][]): Stroke[] => halves(fromPicture(list));

/** 햇살 8개: 해 가까이에서 바깥으로 */
const sunRays: Stroke[] = Array.from({ length: 8 }, (_, i) => {
  const t = (Math.PI * i) / 4;
  const at = (r: number): [number, number] => [r1(50 + r * Math.sin(t)), r1(50 - r * Math.cos(t))];
  return pic([at(28), at(40)]);
});

export const TRACE_ITEMS: TraceItem[] = [
  { id: 'hline', name: '가로줄', emoji: '➖', group: 'line', strokes: [stroke([[0.15, 0.5], [0.85, 0.5]])] },
  { id: 'vline', name: '세로줄', emoji: '⬇️', group: 'line', strokes: [stroke([[0.5, 0.15], [0.5, 0.85]])] },
  {
    id: 'zigzag',
    name: '번개줄',
    emoji: '⚡',
    group: 'line',
    strokes: [stroke([[0.12, 0.65], [0.25, 0.35], [0.38, 0.65], [0.5, 0.35], [0.62, 0.65], [0.75, 0.35], [0.88, 0.65]])],
  },
  { id: 'wave', name: '물결', emoji: '🌊', group: 'line', strokes: [stroke(wave)] },
  { id: 'stairs', name: '계단', emoji: '🪜', group: 'line', strokes: [stroke(stairs)] },
  { id: 'loops', name: '꼬불꼬불', emoji: '➰', group: 'line', strokes: [stroke(loops)] },
  { id: 'circle', name: '동그라미', emoji: '⚪', group: 'shape', strokes: halves(ellipsePts(0.5, 0.5, 0.32, 0.32)) },
  {
    id: 'triangle',
    name: '세모',
    emoji: '🔺',
    group: 'shape',
    strokes: halves([[0.5, 0.15], [0.325, 0.485], [0.15, 0.82], [0.5, 0.82], [0.85, 0.82], [0.675, 0.485], [0.5, 0.15]]),
  },
  {
    id: 'square',
    name: '네모',
    emoji: '🟦',
    group: 'shape',
    strokes: halves([[0.5, 0.18], [0.18, 0.18], [0.18, 0.82], [0.5, 0.82], [0.82, 0.82], [0.82, 0.18], [0.5, 0.18]]),
  },
  { id: 'heart', name: '하트', emoji: '❤️', group: 'shape', strokes: halves(fromPicture(HEART)), picture: 'heart' },
  { id: 'star', name: '별', emoji: '⭐', group: 'shape', strokes: halves(fromPicture(STAR)), picture: 'star' },
  {
    id: 'diamond',
    name: '마름모',
    emoji: '🔷',
    group: 'shape',
    strokes: halves([[0.5, 0.12], [0.66, 0.31], [0.82, 0.5], [0.66, 0.69], [0.5, 0.88], [0.34, 0.69], [0.18, 0.5], [0.34, 0.31], [0.5, 0.12]]),
  },
  { id: 'moon', name: '초승달', emoji: '🌙', group: 'shape', strokes: [stroke(moonOuter), stroke(moonInner)] },
  { id: 'fish', name: '물고기', emoji: '🐟', group: 'picture', strokes: halves(fromPicture(FISH)), picture: 'fish' },
  { id: 'apple', name: '사과', emoji: '🍎', group: 'picture', strokes: halves(fromPicture(APPLE)), picture: 'apple' },
  { id: 'house', name: '집', emoji: '🏠', group: 'picture', strokes: halves(fromPicture(HOUSE)), picture: 'house' },
  { id: 'balloon', name: '풍선', emoji: '🎈', group: 'picture', strokes: halves(fromPicture(BALLOON)), picture: 'balloon' },
  { id: 'icecream', name: '아이스크림', emoji: '🍦', group: 'picture', strokes: closed(ICECREAM), picture: 'icecream' },
  { id: 'mushroom', name: '버섯', emoji: '🍄', group: 'picture', strokes: closed(MUSHROOM), picture: 'mushroom' },
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
];

export function getTraceItem(id: string): TraceItem | undefined {
  return TRACE_ITEMS.find((t) => t.id === id);
}

export function nextTraceItem(id: string): TraceItem {
  const i = TRACE_ITEMS.findIndex((t) => t.id === id);
  return TRACE_ITEMS[(i + 1) % TRACE_ITEMS.length];
}
