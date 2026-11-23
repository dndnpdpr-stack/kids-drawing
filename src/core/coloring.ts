import type { Picture } from '../content/pictures';

/** 그림 좌표 (0~100) */
export type Pt = { x: number; y: number };

export type Op =
  | { kind: 'fill'; region: string; color: string }
  | { kind: 'brush'; region: string; color: string; points: Pt[] };

/** 색칠 상태 = 지금까지 한 동작 목록. 되돌리기는 마지막 동작을 빼는 것. */
export interface ColoringState {
  pictureId: string;
  ops: Op[];
}

export interface RegionView {
  /** 마지막 채우기 색. 없으면 null */
  fill: string | null;
  /** 마지막 채우기 이후의 붓 획들 */
  brushes: { color: string; points: Pt[] }[];
}

export function newColoring(pictureId: string): ColoringState {
  return { pictureId, ops: [] };
}

export function fill(s: ColoringState, region: string, color: string): ColoringState {
  const v = viewOf(s)[region];
  if (v && v.fill === color && v.brushes.length === 0) return s;
  return { ...s, ops: [...s.ops, { kind: 'fill', region, color }] };
}

export function addBrush(s: ColoringState, region: string, color: string, points: Pt[]): ColoringState {
  if (points.length === 0) return s;
  return { ...s, ops: [...s.ops, { kind: 'brush', region, color, points }] };
}

export function undo(s: ColoringState): ColoringState {
  return s.ops.length === 0 ? s : { ...s, ops: s.ops.slice(0, -1) };
}

export function canUndo(s: ColoringState): boolean {
  return s.ops.length > 0;
}

export function viewOf(s: ColoringState): Record<string, RegionView> {
  const out: Record<string, RegionView> = {};
  for (const op of s.ops) {
    const v = (out[op.region] ??= { fill: null, brushes: [] });
    if (op.kind === 'fill') {
      v.fill = op.color;
      v.brushes = [];
    } else {
      v.brushes.push({ color: op.color, points: op.points });
    }
  }
  return out;
}

export function isComplete(s: ColoringState, picture: Picture): boolean {
  const v = viewOf(s);
  return picture.regions.every((r) => {
    const rv = v[r.id];
    return !!rv && (rv.fill !== null || rv.brushes.length > 0);
  });
}

/** 직전에 남긴 점과 minDist보다 가까운 점은 버린다. 마지막 점은 항상 남긴다. */
export function simplify(points: Pt[], minDist = 0.8): Pt[] {
  if (points.length <= 1) return points.slice();
  const out: Pt[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const last = out[out.length - 1];
    if (Math.hypot(points[i].x - last.x, points[i].y - last.y) >= minDist) out.push(points[i]);
  }
  out.push(points[points.length - 1]);
  return out;
}

const isStr = (v: unknown): v is string => typeof v === 'string';
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function isOp(v: unknown): v is Op {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  if (!isStr(o.region) || !isStr(o.color)) return false;
  if (o.kind === 'fill') return true;
  if (o.kind !== 'brush' || !Array.isArray(o.points)) return false;
  return o.points.every((p) => typeof p === 'object' && p !== null && isNum(p.x) && isNum(p.y));
}

export function isColoringState(v: unknown): v is ColoringState {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return isStr(o.pictureId) && Array.isArray(o.ops) && o.ops.every(isOp);
}
