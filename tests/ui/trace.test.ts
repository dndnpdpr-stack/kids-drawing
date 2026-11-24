import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getTraceItem } from '../../src/content/tracing';
import { lockInks, render, strokeRole, TRACE_INKS } from '../../src/ui/trace';
import { render as renderPick } from '../../src/ui/tracePick';
import { makeDeps, ptr } from '../helpers';

let root: HTMLElement;
let cleanup: () => void = () => {};

beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect);
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});
afterEach(() => {
  cleanup();
  cleanup = () => {};
  root.remove();
  vi.restoreAllMocks();
});

const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid=${id}]`);

/** 항목의 모든 획을 체크포인트대로 따라 그린다 (좌표 0~1 → 화면 0~100) */
function traceAll(itemId: string) {
  const canvas = root.querySelector('canvas')!;
  for (const s of getTraceItem(itemId)!.strokes) {
    const [first, ...rest] = s.points;
    ptr(canvas, 'pointerdown', { x: first.x * 100, y: first.y * 100 });
    for (const p of rest) ptr(canvas, 'pointermove', { x: p.x * 100, y: p.y * 100 });
    const last = s.points[s.points.length - 1];
    ptr(canvas, 'pointerup', { x: last.x * 100, y: last.y * 100 });
  }
}

const open = (item: string) => {
  location.hash = `#/trace/${item}`;
  cleanup = render(root, { name: 'trace', item }, makeDeps());
};

describe('trace screen', () => {
  it('shows next after tracing every stroke', () => {
    open('hline');
    expect(q('next')).toBeNull();
    traceAll('hline');
    expect(q('next')).not.toBeNull();
  });

  it('lifting the finger mid-stroke does not finish', () => {
    open('heart');
    const canvas = root.querySelector('canvas')!;
    const s = getTraceItem('heart')!.strokes[0];
    ptr(canvas, 'pointerdown', { x: s.points[0].x * 100, y: s.points[0].y * 100 });
    ptr(canvas, 'pointerup', { x: 0, y: 0 });
    expect(q('next')).toBeNull();
  });

  it('linked shapes offer coloring, lines do not', () => {
    open('heart');
    traceAll('heart');
    expect(q('to-color')).not.toBeNull();
    q('to-color')!.click();
    expect(location.hash).toBe('#/color/heart');
  });

  it('lines have no coloring button', () => {
    open('hline');
    traceAll('hline');
    expect(q('to-color')).toBeNull();
  });

  it('next goes to the following item', () => {
    open('balloon');
    traceAll('balloon');
    q('next')!.click();
    expect(location.hash).toBe('#/trace/icecream');
  });

  it('the last item wraps to the first', () => {
    open('treeM');
    traceAll('treeM');
    q('next')!.click();
    expect(location.hash).toBe('#/trace/hline');
  });

  for (const id of ['face', 'sunM', 'flowerM', 'houseM', 'snowmanM', 'treeM']) {
    it(`multi-stroke ${id} can be finished`, () => {
      open(id);
      traceAll(id);
      expect(q('next')).not.toBeNull();
    });
  }

  it('unknown item goes to the picker', () => {
    open('nope');
    expect(location.hash).toBe('#/trace');
  });
});

describe('trace picker', () => {
  it('lists the four groups and all items', () => {
    cleanup = renderPick(root, { name: 'tracePick' }, makeDeps());
    expect(root.querySelectorAll('.trace-row')).toHaveLength(4);
    expect(root.querySelectorAll('[data-testid^=trace-]')).toHaveLength(25);
    q('trace-star')!.click();
    expect(location.hash).toBe('#/trace/star');
  });
});

describe('stroke roles', () => {
  it('marks finished, current and upcoming strokes', () => {
    const st = { strokeIndex: 1, pointIndex: 3, done: false };
    expect([0, 1, 2].map((i) => strokeRole(i, st))).toEqual(['done', 'current', 'future']);
  });

  it('everything is done once the item is finished', () => {
    const st = { strokeIndex: 3, pointIndex: 0, done: true };
    expect([0, 1, 2].map((i) => strokeRole(i, st))).toEqual(['done', 'done', 'done']);
  });
});

describe('trace inks', () => {
  it('offers every palette color except white', () => {
    expect(TRACE_INKS).toHaveLength(9);
    expect(TRACE_INKS.map((c) => c.id)).not.toContain('white');
  });

  it('locks the color of each finished stroke only once', () => {
    expect(lockInks([], 1, 'R')).toEqual(['R']);
    expect(lockInks(['R'], 2, 'B')).toEqual(['R', 'B']);
    expect(lockInks(['R'], 1, 'B')).toEqual(['R']);
  });

  it('starts pink, switches on tap, and keeps the choice for the next item', () => {
    open('hline');
    const selected = () => [...root.querySelectorAll('.swatch.selected')].map((b) => b.getAttribute('data-testid'));
    expect(root.querySelectorAll('[data-testid^=ink-]')).toHaveLength(9);
    expect(selected()).toEqual(['ink-pink']);
    q('ink-blue')!.click();
    expect(selected()).toEqual(['ink-blue']);
    cleanup();
    root.replaceChildren();
    open('vline');
    expect(selected()).toEqual(['ink-blue']);
    q('ink-pink')!.click(); // 다른 테스트를 위해 되돌림
  });
});
