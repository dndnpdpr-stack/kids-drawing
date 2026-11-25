import type { Picture } from '../content/pictures';
import { pensOf, viewOf, type ColoringState, type PenStroke, type Pt, type RegionView } from './coloring';

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
 * 칸 하나: 채우기(없으면 흰색) → 그 칸 모양으로 잘라 붓 자국과 펜 → 테두리 (배경 칸은 테두리 없음).
 * 펜은 모든 칸에서 그 칸 모양으로 잘라 그리므로, 합치면 그림 위 어디에나 보이고 검은 선은 펜 위에 남는다.
 * 칸마다 자기 차례에 테두리까지 그리므로 위에 겹친 칸이 아래 칸의 테두리도 가린다.
 * ctx는 0~100 좌표로 맞춰져 있어야 한다.
 */
function drawRegion(
  ctx: CanvasRenderingContext2D,
  id: string,
  path: Path2D,
  v: RegionView | undefined,
  pens: PenStroke[],
): void {
  ctx.fillStyle = v?.fill ?? BLANK;
  ctx.fill(path);
  const brushes = v?.brushes ?? [];
  if (brushes.length > 0 || pens.length > 0) {
    ctx.save();
    ctx.clip(path);
    for (const b of brushes) strokePoints(ctx, b.color, b.points);
    for (const p of pens) strokePoints(ctx, p.color, p.points);
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
  pens: PenStroke[] = [],
): void {
  const paths = regionPaths(picture);
  ctx.save();
  ctx.scale(size / 100, size / 100);
  ctx.fillStyle = BLANK;
  ctx.fillRect(0, 0, 100, 100);
  for (const r of picture.regions) drawRegion(ctx, r.id, paths.get(r.id)!, view[r.id], pens);
  drawExtraLines(ctx, picture);
  ctx.restore();
}

/**
 * 진행 중인 펜 한 마디를 그린다 (전체를 다시 그리지 않고).
 * 그 마디를 감싸는 작은 사각형만 잘라, 그 안에 닿을 수 있는 칸을 뒤에서 앞 순서로 다시 그린다.
 * pens에는 지금 그리는 획(지금까지의 점)도 들어 있어야 한다.
 */
export function drawPenSegment(
  ctx: CanvasRenderingContext2D,
  picture: Picture,
  view: Record<string, RegionView>,
  pens: PenStroke[],
  from: Pt,
  to: Pt,
  size: number,
): void {
  const paths = regionPaths(picture);
  const boxes = regionBoxes(picture);
  const pad = BRUSH_WIDTH / 2 + LINE_WIDTH;
  const seg: BBox = {
    x0: Math.min(from.x, to.x) - pad,
    y0: Math.min(from.y, to.y) - pad,
    x1: Math.max(from.x, to.x) + pad,
    y1: Math.max(from.y, to.y) + pad,
  };
  ctx.save();
  ctx.scale(size / 100, size / 100);
  // 잘라 낼 사각형을 화면 픽셀 경계에 맞춘다 (어긋나면 가장자리에 옅은 줄이 남는다)
  const k = ctx.getTransform?.().a || size / 100;
  seg.x0 = Math.floor(seg.x0 * k) / k;
  seg.y0 = Math.floor(seg.y0 * k) / k;
  seg.x1 = Math.ceil(seg.x1 * k) / k;
  seg.y1 = Math.ceil(seg.y1 * k) / k;
  ctx.beginPath();
  ctx.rect(seg.x0, seg.y0, seg.x1 - seg.x0, seg.y1 - seg.y0);
  ctx.clip();
  ctx.fillStyle = BLANK;
  ctx.fillRect(seg.x0, seg.y0, seg.x1 - seg.x0, seg.y1 - seg.y0);
  for (const r of picture.regions) {
    const b = boxes.get(r.id)!;
    if (b.x1 < seg.x0 || b.x0 > seg.x1 || b.y1 < seg.y0 || b.y0 > seg.y1) continue;
    drawRegion(ctx, r.id, paths.get(r.id)!, view[r.id], pens);
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
  if (ctx) drawColoring(ctx, picture, viewOf(state), size, pensOf(state));
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
  if (ctx) drawColoring(ctx, picture, state ? viewOf(state) : {}, size, state ? pensOf(state) : []);
  return c;
}
