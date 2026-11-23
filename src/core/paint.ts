import type { Picture } from '../content/pictures';
import { viewOf, type ColoringState, type Pt, type RegionView } from './coloring';

/** 붓 굵기 (그림 좌표 0~100 기준 = 한 변의 4%) */
export const BRUSH_WIDTH = 4;
export const LINE_WIDTH = 2.2;
export const LINE_COLOR = '#333333';
const BLANK = '#ffffff';

export type HitTest = (p: Pt) => string | null;
export interface BBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

// ---------- path 캐시 ----------

const pathCache = new WeakMap<Picture, Map<string, Path2D>>();
function regionPaths(picture: Picture): Map<string, Path2D> {
  let m = pathCache.get(picture);
  if (!m) {
    m = new Map(picture.regions.map((r) => [r.id, new Path2D(r.d)]));
    pathCache.set(picture, m);
  }
  return m;
}

const bboxCache = new WeakMap<Picture, Map<string, BBox>>();
function regionBoxes(picture: Picture): Map<string, BBox> {
  let m = bboxCache.get(picture);
  if (!m) {
    m = new Map(picture.regions.map((r) => [r.id, pathBBox(r.d)]));
    bboxCache.set(picture, m);
  }
  return m;
}

/**
 * path를 감싸는 상자 (넉넉하게). 절대 좌표 명령 M L H V C Q A Z만 쓴다고 가정한다.
 * 곡선은 조절점까지, 호는 반지름만큼 넓혀서 실제 모양을 반드시 포함한다.
 */
export function pathBBox(d: string): BBox {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+/g) ?? [];
  const b: BBox = { x0: Infinity, y0: Infinity, x1: -Infinity, y1: -Infinity };
  const add = (x: number, y: number) => {
    b.x0 = Math.min(b.x0, x);
    b.y0 = Math.min(b.y0, y);
    b.x1 = Math.max(b.x1, x);
    b.y1 = Math.max(b.y1, y);
  };
  let i = 0;
  let cmd = 'M';
  let cx = 0;
  let cy = 0;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++].toUpperCase();
    if (cmd === 'Z') continue;
    if (cmd === 'M' || cmd === 'L') {
      cx = num();
      cy = num();
      add(cx, cy);
    } else if (cmd === 'H') {
      cx = num();
      add(cx, cy);
    } else if (cmd === 'V') {
      cy = num();
      add(cx, cy);
    } else if (cmd === 'C' || cmd === 'Q') {
      const n = cmd === 'C' ? 3 : 2;
      for (let k = 0; k < n; k++) {
        cx = num();
        cy = num();
        add(cx, cy);
      }
    } else if (cmd === 'A') {
      const rx = num();
      const ry = num();
      i += 3; // 회전, large-arc, sweep
      const x = num();
      const y = num();
      for (const [px, py] of [[cx, cy], [x, y]]) {
        add(px - rx, py - ry);
        add(px + rx, py + ry);
      }
      cx = x;
      cy = y;
    } else {
      i++; // 모르는 명령: 건너뛴다
    }
  }
  return b;
}

// ---------- 그리기 ----------

function strokePoints(ctx: CanvasRenderingContext2D, color: string, points: Pt[]): void {
  if (points.length === 0) return;
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = BRUSH_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (points.length === 1) {
    ctx.beginPath();
    ctx.arc(points[0].x, points[0].y, BRUSH_WIDTH / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let k = 1; k < points.length; k++) ctx.lineTo(points[k].x, points[k].y);
  ctx.stroke();
}

function outlineStyle(ctx: CanvasRenderingContext2D): void {
  ctx.strokeStyle = LINE_COLOR;
  ctx.lineWidth = LINE_WIDTH;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
}

/**
 * 칸 하나: 채우기(없으면 흰색) → 그 칸 모양으로 잘라 붓 자국 → 테두리 (배경 칸은 테두리 없음).
 * 칸마다 자기 차례에 테두리까지 그리므로 위에 겹친 칸이 아래 칸의 테두리도 가린다.
 * ctx는 0~100 좌표로 맞춰져 있어야 한다.
 */
function drawRegion(ctx: CanvasRenderingContext2D, id: string, path: Path2D, v: RegionView | undefined): void {
  ctx.fillStyle = v?.fill ?? BLANK;
  ctx.fill(path);
  if (v && v.brushes.length > 0) {
    ctx.save();
    ctx.clip(path);
    for (const b of v.brushes) strokePoints(ctx, b.color, b.points);
    ctx.restore();
  }
  if (id === 'bg') return;
  outlineStyle(ctx);
  ctx.stroke(path);
}

const linesCache = new WeakMap<Picture, Path2D[]>();
/** 덧그림 선 (수염 등): 맨 위에 */
function drawExtraLines(ctx: CanvasRenderingContext2D, picture: Picture): void {
  let ls = linesCache.get(picture);
  if (!ls) {
    ls = picture.lines.map((l) => new Path2D(l));
    linesCache.set(picture, ls);
  }
  if (ls.length === 0) return;
  outlineStyle(ctx);
  for (const l of ls) ctx.stroke(l);
}

/** 그림 전체(선 포함)를 size×size(CSS px) 크기로 그린다. 칸은 뒤에서 앞 순서로 겹쳐 그린다. */
export function drawColoring(
  ctx: CanvasRenderingContext2D,
  picture: Picture,
  view: Record<string, RegionView>,
  size: number,
): void {
  const paths = regionPaths(picture);
  ctx.save();
  ctx.scale(size / 100, size / 100);
  ctx.fillStyle = BLANK;
  ctx.fillRect(0, 0, 100, 100);
  for (const r of picture.regions) drawRegion(ctx, r.id, paths.get(r.id)!, view[r.id]);
  drawExtraLines(ctx, picture);
  ctx.restore();
}

/**
 * 진행 중인 붓 한 마디를 그린다 (전체를 다시 그리지 않고).
 * 그 칸 모양으로 잘라 그린 뒤 그 칸 테두리를 다시 긋고, 위에 겹친 칸 중 이 마디와 닿을 수 있는 칸만
 * 다시 그려서 덮는다. 마지막으로 덧그림 선을 다시 긋는다.
 */
export function drawBrushSegment(
  ctx: CanvasRenderingContext2D,
  picture: Picture,
  view: Record<string, RegionView>,
  region: string,
  color: string,
  from: Pt,
  to: Pt,
  size: number,
): void {
  const paths = regionPaths(picture);
  const path = paths.get(region);
  if (!path) return;
  ctx.save();
  ctx.scale(size / 100, size / 100);
  ctx.save();
  ctx.clip(path);
  strokePoints(ctx, color, from.x === to.x && from.y === to.y ? [from] : [from, to]);
  ctx.restore();
  if (region !== 'bg') {
    outlineStyle(ctx);
    ctx.stroke(path);
  }
  const pad = BRUSH_WIDTH / 2;
  const seg: BBox = {
    x0: Math.min(from.x, to.x) - pad,
    y0: Math.min(from.y, to.y) - pad,
    x1: Math.max(from.x, to.x) + pad,
    y1: Math.max(from.y, to.y) + pad,
  };
  const boxes = regionBoxes(picture);
  const start = picture.regions.findIndex((r) => r.id === region);
  for (const r of picture.regions.slice(start + 1)) {
    const b = boxes.get(r.id)!;
    if (b.x1 < seg.x0 || b.x0 > seg.x1 || b.y1 < seg.y0 || b.y0 > seg.y1) continue;
    drawRegion(ctx, r.id, paths.get(r.id)!, view[r.id]);
  }
  drawExtraLines(ctx, picture);
  ctx.restore();
}

/** 누른 점(0~100)이 어느 칸인지. 겹치면 가장 앞(나중) 칸. */
export function makeHitTest(ctx: CanvasRenderingContext2D, picture: Picture): HitTest {
  const paths = regionPaths(picture);
  const order = [...picture.regions].reverse();
  return (p) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    try {
      for (const r of order) if (ctx.isPointInPath(paths.get(r.id)!, p.x, p.y)) return r.id;
      return null;
    } finally {
      ctx.restore();
    }
  };
}

// ---------- 이미지 ----------

function makeCanvas(size: number): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

/** 완성 그림 한 장 (선 포함) */
export function exportPng(picture: Picture, state: ColoringState, size = 1024): Promise<Blob> {
  const c = makeCanvas(size);
  const ctx = c.getContext('2d');
  if (ctx) drawColoring(ctx, picture, viewOf(state), size);
  return new Promise((resolve) => {
    if (!ctx || typeof c.toBlob !== 'function') return resolve(new Blob([], { type: 'image/png' }));
    c.toBlob((b) => resolve(b ?? new Blob([], { type: 'image/png' })), 'image/png');
  });
}

/** 고르기 화면용 작은 그림 (선 포함) */
export function renderThumb(picture: Picture, state: ColoringState | null, size = 240): HTMLCanvasElement {
  const c = makeCanvas(size);
  c.className = 'thumb';
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = c.getContext('2d');
  } catch {
    ctx = null;
  }
  if (ctx) drawColoring(ctx, picture, state ? viewOf(state) : {}, size);
  return c;
}
