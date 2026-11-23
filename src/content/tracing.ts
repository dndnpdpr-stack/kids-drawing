import type { Pt, Stroke } from '../core/trace';
import { OUTLINE as APPLE } from './pictures/apple';
import { OUTLINE as BALLOON } from './pictures/balloon';
import { OUTLINE as FISH } from './pictures/fish';
import { OUTLINE as HEART } from './pictures/heart';
import { OUTLINE as HOUSE } from './pictures/house';
import { OUTLINE as STAR } from './pictures/star';

export type TraceGroup = 'line' | 'shape' | 'picture';

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
  { id: 'fish', name: '물고기', emoji: '🐟', group: 'picture', strokes: halves(fromPicture(FISH)), picture: 'fish' },
  { id: 'apple', name: '사과', emoji: '🍎', group: 'picture', strokes: halves(fromPicture(APPLE)), picture: 'apple' },
  { id: 'house', name: '집', emoji: '🏠', group: 'picture', strokes: halves(fromPicture(HOUSE)), picture: 'house' },
  { id: 'balloon', name: '풍선', emoji: '🎈', group: 'picture', strokes: halves(fromPicture(BALLOON)), picture: 'balloon' },
];

export function getTraceItem(id: string): TraceItem | undefined {
  return TRACE_ITEMS.find((t) => t.id === id);
}

export function nextTraceItem(id: string): TraceItem {
  const i = TRACE_ITEMS.findIndex((t) => t.id === id);
  return TRACE_ITEMS[(i + 1) % TRACE_ITEMS.length];
}
