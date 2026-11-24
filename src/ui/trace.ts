import { getTraceItem, nextTraceItem } from '../content/tracing';
import { PALETTE, type PaletteColor } from '../core/palette';
import { advanceTrace, endStroke, newTrace, type Pt, type TraceState } from '../core/trace';
import { go, type Route } from '../router';
import { celebrate } from './celebrate';
import { button, el, say, topBar, type Cleanup, type ScreenDeps } from './dom';

const COLORS = {
  shadow: '#eef0f7',
  guide: '#8f96b8',
  guideLater: '#dde1ee',
  dot: '#c3c8dc',
  next: '#ffb703',
};

/** 따라 그리기 색: 색칠 팔레트에서 흰색만 뺀다 (흰 바탕에서 안 보이므로) */
export const TRACE_INKS: readonly PaletteColor[] = PALETTE.filter((c) => c.id !== 'white');

/** 고른 색은 다음 항목으로 넘어가도 유지 (앱을 다시 열면 분홍) */
let ink = PALETTE.find((c) => c.id === 'pink')!.hex;

/** 다 그린 획(doneCount개)의 색을 고정한다. 이미 정해진 획 색은 바꾸지 않는다. */
export function lockInks(inks: string[], doneCount: number, current: string): string[] {
  const out = inks.slice();
  for (let i = 0; i < doneCount; i++) if (out[i] === undefined) out[i] = current;
  return out;
}

export type StrokeRole = 'done' | 'current' | 'future';

/** 획 i가 다 그린 획인지, 지금 그릴 획인지, 아직 남은 획인지 */
export function strokeRole(i: number, state: TraceState): StrokeRole {
  if (state.done || i < state.strokeIndex) return 'done';
  return i === state.strokeIndex ? 'current' : 'future';
}

/** 따라 그리기 한 항목. 다 그리면 ▶️(다음)과, 색칠 그림이 있으면 🎨(바로 칠하기)를 보여 준다. */
export function render(root: HTMLElement, route: Route, deps: ScreenDeps): Cleanup {
  if (route.name !== 'trace') return () => {};
  const item = getTraceItem(route.item);
  if (!item) {
    go({ name: 'tracePick' }, { replace: true });
    return () => {};
  }
  const strokes = item.strokes;

  const canvas = el('canvas', 'trace-canvas');
  const area = el('div', 'trace-area', [canvas]);
  const actions = el('div', 'trace-actions');
  const swatches = TRACE_INKS.map((c) => {
    const b = button('', () => selectInk(c.hex), 'swatch', {
      'data-testid': `ink-${c.id}`,
      'aria-label': c.name,
    });
    b.style.setProperty('--swatch', c.hex);
    return b;
  });
  const palette = el('div', 'trace-palette', swatches);
  const screen = el('section', 'screen trace', [
    topBar({ name: 'tracePick' }),
    el('div', 'trace-body', [area, palette]),
    actions,
  ]);
  root.append(screen);

  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }
  let state: TraceState = newTrace();
  let active: number | null = null;
  let finger: Pt | null = null;
  let side = 1;
  let frame = 0;
  let stopCelebrate: (() => void) | null = null;
  let inks: string[] = []; // 다 그린 획마다 그때 고른 색

  function selectInk(hex: string) {
    ink = hex;
    swatches.forEach((b, i) => b.classList.toggle('selected', TRACE_INKS[i].hex === hex));
  }
  selectInk(ink);

  function lock() {
    inks = lockInks(inks, state.done ? strokes.length : state.strokeIndex, ink);
  }

  function resize() {
    const r = area.getBoundingClientRect();
    side = Math.max(1, Math.floor(Math.min(r.width, r.height)));
    const dpr = window.devicePixelRatio || 1;
    canvas.style.width = canvas.style.height = `${side}px`;
    canvas.width = Math.round(side * dpr);
    canvas.height = Math.round(side * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function polyline(c: CanvasRenderingContext2D, pts: Pt[]) {
    if (pts.length < 2) return;
    // 점 사이 가운데를 지나는 곡선으로 부드럽게 (꺾인 선처럼 보이지 않게)
    const X = (p: Pt) => p.x * side;
    const Y = (p: Pt) => p.y * side;
    c.beginPath();
    c.moveTo(X(pts[0]), Y(pts[0]));
    for (let i = 1; i < pts.length - 1; i++) {
      const mx = (X(pts[i]) + X(pts[i + 1])) / 2;
      const my = (Y(pts[i]) + Y(pts[i + 1])) / 2;
      c.quadraticCurveTo(X(pts[i]), Y(pts[i]), mx, my);
    }
    const last = pts[pts.length - 1];
    c.lineTo(X(last), Y(last));
    c.stroke();
  }

  function dot(c: CanvasRenderingContext2D, p: Pt, radius: number, color: string) {
    c.fillStyle = color;
    c.beginPath();
    c.arc(p.x * side, p.y * side, radius, 0, Math.PI * 2);
    c.fill();
  }

  function draw(now: number) {
    if (!ctx) return;
    const c = ctx;
    c.clearRect(0, 0, side, side);
    c.lineCap = 'round';
    c.lineJoin = 'round';
    // 굵은 연한 길 + 점선 안내. 여러 획일 때 지금 그릴 획만 진하게, 남은 획은 흐리게.
    c.strokeStyle = COLORS.shadow;
    c.lineWidth = side * 0.09;
    strokes.forEach((s) => polyline(c, s.points));
    c.lineWidth = side * 0.02;
    c.setLineDash([side * 0.03, side * 0.03]);
    strokes.forEach((s, i) => {
      const role = strokeRole(i, state);
      if (role === 'done') return;
      c.strokeStyle = role === 'current' ? COLORS.guide : COLORS.guideLater;
      polyline(c, s.points);
    });
    c.setLineDash([]);
    // 그린 부분
    c.lineWidth = side * 0.06;
    strokes.forEach((s, i) => {
      if (inks[i] === undefined) return;
      c.strokeStyle = inks[i];
      polyline(c, s.points);
    });
    const cur = strokes[state.strokeIndex];
    if (cur && !state.done) {
      c.strokeStyle = ink;
      const reached = cur.points.slice(0, state.pointIndex);
      polyline(c, finger && reached.length > 0 ? [...reached, finger] : reached);
      const next = cur.points[state.pointIndex];
      const pulse = 1 + 0.3 * Math.sin(now / 180);
      dot(c, next, side * 0.035 * pulse, COLORS.next);
    }
  }

  function loop(now: number) {
    draw(now);
    frame = requestAnimationFrame(loop);
  }

  function toPt(e: PointerEvent): Pt {
    const r = canvas.getBoundingClientRect();
    return { x: (e.clientX - r.left) / (r.width || 1), y: (e.clientY - r.top) / (r.height || 1) };
  }

  function feed(e: PointerEvent) {
    const samples = e.getCoalescedEvents?.() ?? [];
    for (const s of samples.length > 0 ? samples : [e]) {
      if (state.done) break;
      finger = toPt(s);
      state = advanceTrace(state, strokes, finger);
    }
    lock();
    if (state.done) complete();
  }

  function complete() {
    active = null;
    finger = null;
    stopCelebrate = celebrate(screen, { big: true, mascot: item!.emoji });
    void say(deps, `잘 그렸어! ${item!.name}!`);
    const next = nextTraceItem(item!.id);
    const buttons = [
      button('▶️', () => go({ name: 'trace', item: next.id }), 'icon-btn next-btn', {
        'data-testid': 'next',
        'aria-label': '다음',
      }),
    ];
    if (item!.picture) {
      const picture = item!.picture;
      buttons.unshift(
        button('🎨', () => go({ name: 'color', picture }), 'icon-btn to-color-btn', {
          'data-testid': 'to-color',
          'aria-label': '색칠하기',
        }),
      );
    }
    actions.replaceChildren(...buttons);
  }

  const onDown = (e: PointerEvent) => {
    if (state.done || active !== null) return;
    active = e.pointerId;
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    feed(e);
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== active) return;
    feed(e);
  };
  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== active) return;
    active = null;
    finger = null;
    state = endStroke(state, strokes);
    lock();
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  window.addEventListener('resize', resize);

  resize();
  void say(deps, `${item.name} 따라 그려 보자`);
  frame = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(frame);
    window.removeEventListener('resize', resize);
    stopCelebrate?.();
  };
}
