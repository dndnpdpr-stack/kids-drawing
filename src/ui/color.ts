import { getPicture } from '../content/pictures';
import {
  addBrush,
  canUndo,
  fill,
  isComplete,
  newColoring,
  simplify,
  undo,
  viewOf,
  type ColoringState,
  type Pt,
} from '../core/coloring';
import { PALETTE } from '../core/palette';
import { drawBrushSegment, drawColoring, exportPng, makeHitTest, type HitTest } from '../core/paint';
import { go, type Route } from '../router';
import { CELEBRATE_BIG_MS, celebrate } from './celebrate';
import { button, el, say, timers, topBar, type Cleanup, type ScreenDeps } from './dom';

const SAVE_DELAY_MS = 300;

type Mode = 'fill' | 'brush';

export interface ColorOptions {
  /** 테스트용: 칸 찾기를 바꿔 끼운다 (jsdom에는 캔버스가 없다) */
  hitTest?: HitTest;
}

export function render(root: HTMLElement, route: Route, deps: ScreenDeps, opts: ColorOptions = {}): Cleanup {
  if (route.name !== 'color') return () => {};
  const picture = getPicture(route.picture);
  if (!picture) {
    go({ name: 'colorPick' }, { replace: true });
    return () => {};
  }

  const t = timers();
  let state: ColoringState = newColoring(picture.id);
  let color = PALETTE[0].hex;
  let mode: Mode = 'fill';
  let finished = false;
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  let stopCelebrate: (() => void) | null = null;

  // ---------- 화면 ----------
  const canvas = el('canvas', 'color-canvas');
  const stage = el('div', 'color-stage', [canvas], { 'data-testid': 'stage' });
  const area = el('div', 'color-area', [stage]);

  const undoBtn = button('↩️', () => commit(undo(state)), 'icon-btn undo-btn', {
    'data-testid': 'undo',
    'aria-label': '되돌리기',
  });
  const doneBtn = button('✅', () => void finish(), 'icon-btn done-btn', {
    'data-testid': 'done',
    'aria-label': '다 했어요',
  });

  const swatches = PALETTE.map((c) => {
    const b = button('', () => selectColor(c.hex), 'swatch', {
      'data-testid': `swatch-${c.id}`,
      'aria-label': c.name,
    });
    b.style.setProperty('--swatch', c.hex);
    return b;
  });
  const modeBtn = button('', () => setMode(mode === 'fill' ? 'brush' : 'fill'), 'mode-btn', {
    'data-testid': 'mode',
  });
  const palette = el('div', 'palette', [el('div', 'swatches', swatches), modeBtn]);

  const screen = el('section', 'screen color', [
    topBar({ name: 'colorPick' }, undoBtn, doneBtn),
    el('div', 'color-body', [area, palette]),
  ]);
  root.append(screen);

  // ---------- 그리기 ----------
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    ctx = null;
  }
  const hit: HitTest = opts.hitTest ?? (ctx ? makeHitTest(ctx, picture) : () => null);
  let side = 1;

  function redraw() {
    if (ctx) drawColoring(ctx, picture!, viewOf(state), side);
  }

  function resize() {
    const r = area.getBoundingClientRect();
    side = Math.max(1, Math.floor(Math.min(r.width, r.height)));
    const dpr = window.devicePixelRatio || 1;
    stage.style.width = stage.style.height = `${side}px`;
    canvas.width = Math.round(side * dpr);
    canvas.height = Math.round(side * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    redraw();
  }

  function refreshButtons() {
    if (canUndo(state)) undoBtn.removeAttribute('disabled');
    else undoBtn.setAttribute('disabled', '');
    doneBtn.classList.toggle('ready', isComplete(state, picture!));
  }

  function selectColor(hex: string) {
    color = hex;
    swatches.forEach((b, i) => b.classList.toggle('selected', PALETTE[i].hex === hex));
  }

  function setMode(m: Mode) {
    mode = m;
    modeBtn.textContent = m === 'fill' ? '👆' : '🖌️';
    modeBtn.setAttribute('aria-label', m === 'fill' ? '눌러서 채우기' : '손가락 붓');
    modeBtn.classList.toggle('brush', m === 'brush');
  }

  // ---------- 저장 ----------
  function saveNow() {
    if (saveTimer !== null) clearTimeout(saveTimer);
    saveTimer = null;
    if (!finished) void deps.db.saveProgress(state);
  }
  function scheduleSave() {
    if (saveTimer !== null) clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, SAVE_DELAY_MS);
  }

  function commit(next: ColoringState) {
    if (next === state || finished) return;
    state = next;
    redraw();
    refreshButtons();
    scheduleSave();
  }

  /** 누른 자리에 동그란 물결 (채우기 했다는 표시) */
  function ripple(p: Pt) {
    const r = el('span', 'tap-ripple', [], { 'aria-hidden': 'true' });
    r.style.left = `${p.x}%`;
    r.style.top = `${p.y}%`;
    r.style.setProperty('--c', color);
    stage.append(r);
    t.after(500, () => r.remove());
  }

  // ---------- 손가락 ----------
  let active: number | null = null;
  let brushRegion: string | null = null;
  let points: Pt[] = [];

  function toPic(e: PointerEvent): Pt {
    const r = stage.getBoundingClientRect();
    const w = r.width || 1;
    const h = r.height || 1;
    return { x: ((e.clientX - r.left) / w) * 100, y: ((e.clientY - r.top) / h) * 100 };
  }

  const onDown = (e: PointerEvent) => {
    if (active !== null || finished) return;
    active = e.pointerId;
    try {
      stage.setPointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    if (mode !== 'brush') return;
    const p = toPic(e);
    brushRegion = hit(p);
    points = [p];
    if (brushRegion && ctx) drawBrushSegment(ctx, picture, viewOf(state), brushRegion, color, p, p, side);
  };

  const onMove = (e: PointerEvent) => {
    if (e.pointerId !== active || mode !== 'brush' || !brushRegion) return;
    const p = toPic(e);
    const last = points[points.length - 1];
    points.push(p);
    if (ctx) drawBrushSegment(ctx, picture, viewOf(state), brushRegion, color, last, p, side);
  };

  const onUp = (e: PointerEvent) => {
    if (e.pointerId !== active) return;
    active = null;
    if (mode === 'fill') {
      const p = toPic(e);
      const region = hit(p);
      if (region) {
        commit(fill(state, region, color));
        ripple(p);
      }
      return;
    }
    const region = brushRegion;
    brushRegion = null;
    if (region) commit(addBrush(state, region, color, simplify(points)));
    points = [];
  };

  const onCancel = (e: PointerEvent) => {
    if (e.pointerId !== active) return;
    active = null;
    brushRegion = null;
    points = [];
    redraw(); // 그리던 자국 지우기
  };

  stage.addEventListener('pointerdown', onDown);
  stage.addEventListener('pointermove', onMove);
  stage.addEventListener('pointerup', onUp);
  stage.addEventListener('pointercancel', onCancel);
  window.addEventListener('resize', resize);

  // ---------- 완성 ----------
  async function finish() {
    if (finished || !canUndo(state)) return;
    finished = true;
    if (saveTimer !== null) clearTimeout(saveTimer);
    saveTimer = null;
    const image = await exportPng(picture!, state);
    const item = await deps.db.addGallery(picture!.id, image);
    await deps.db.clearProgress(picture!.id);
    stopCelebrate = celebrate(screen, { big: true, mascot: picture!.emoji });
    void say(deps, `우와, 멋진 ${picture!.name}!`);
    t.after(CELEBRATE_BIG_MS, () => go({ name: 'galleryView', id: item.id }));
  }

  // ---------- 시작 ----------
  selectColor(color);
  setMode('fill');
  resize();
  refreshButtons();
  void say(deps, `${picture.name} 색칠하자!`);
  void deps.db.loadProgress(picture.id).then((saved) => {
    // 불러오기 전에 이미 칠하기 시작했으면 그대로 둔다.
    if (!saved || state.ops.length > 0 || finished) return;
    state = saved;
    redraw();
    refreshButtons();
  });

  return () => {
    saveNow();
    t.clear();
    stopCelebrate?.();
    stage.removeEventListener('pointerdown', onDown);
    stage.removeEventListener('pointermove', onMove);
    stage.removeEventListener('pointerup', onUp);
    stage.removeEventListener('pointercancel', onCancel);
    window.removeEventListener('resize', resize);
  };
}
