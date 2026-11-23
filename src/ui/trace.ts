import { getTraceItem, nextTraceItem } from '../content/tracing';
import { advanceTrace, endStroke, newTrace, type Pt, type TraceState } from '../core/trace';
import { go, type Route } from '../router';
import { celebrate } from './celebrate';
import { button, el, say, topBar, type Cleanup, type ScreenDeps } from './dom';

const COLORS = { shadow: '#eef0f7', guide: '#c9cee3', ink: '#ff8fab', dot: '#c3c8dc', next: '#ffb703' };

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
  const screen = el('section', 'screen trace', [topBar({ name: 'tracePick' }), area, actions]);
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
    // 굵은 연한 길 + 점선 안내
    c.strokeStyle = COLORS.shadow;
    c.lineWidth = side * 0.09;
    strokes.forEach((s) => polyline(c, s.points));
    c.strokeStyle = COLORS.guide;
    c.lineWidth = side * 0.02;
    c.setLineDash([side * 0.03, side * 0.03]);
    strokes.forEach((s) => polyline(c, s.points));
    c.setLineDash([]);
    // 그린 부분
    c.strokeStyle = COLORS.ink;
    c.lineWidth = side * 0.06;
    strokes.slice(0, state.strokeIndex).forEach((s) => polyline(c, s.points));
    const cur = strokes[state.strokeIndex];
    if (cur && !state.done) {
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
