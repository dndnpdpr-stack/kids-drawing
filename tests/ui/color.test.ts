import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fill, newColoring } from '../../src/core/coloring';
import { openDrawDb, type DrawDb } from '../../src/core/db';
import * as paint from '../../src/core/paint';
import { render } from '../../src/ui/color';
import { render as renderPick } from '../../src/ui/colorPick';
import { makeDeps, ptr } from '../helpers';

vi.mock('../../src/core/paint', async (orig) => {
  const actual = await orig<typeof import('../../src/core/paint')>();
  return {
    ...actual,
    drawColoring: vi.fn(),
    drawBrushSegment: vi.fn(),
    exportPng: vi.fn(async () => new Blob(['png'], { type: 'image/png' })),
    renderThumb: vi.fn(() => document.createElement('canvas')),
  };
});

const BLUE = '#1982c4';
const RED = '#ff595e';
/** 가짜 칸 찾기: 아래쪽 가장자리는 칸 없음, 왼쪽 절반은 body, 오른쪽은 leaf */
const hitTest: paint.HitTest = (p) => (p.y > 95 ? null : p.x < 50 ? 'body' : 'leaf');

let root: HTMLElement;
let db: DrawDb;
let cleanup: () => void = () => {};

beforeEach(async () => {
  db = await openDrawDb(new IDBFactory());
  root = document.createElement('div');
  document.body.append(root);
  location.hash = '#/color/apple';
  // 그림 영역을 100×100으로: 화면 좌표 = 그림 좌표
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    left: 0, top: 0, right: 100, bottom: 100, width: 100, height: 100, x: 0, y: 0, toJSON: () => ({}),
  } as DOMRect);
  const fakeCtx = new Proxy({}, { get: () => () => {} });
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCtx as CanvasRenderingContext2D);
});
afterEach(() => {
  cleanup();
  cleanup = () => {};
  root.remove();
  vi.clearAllMocks();
  vi.restoreAllMocks();
});

const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid=${id}]`)!;
const stage = () => q('stage');
const open = (pictureId = 'apple') => {
  cleanup = render(root, { name: 'color', picture: pictureId }, makeDeps({ db }), { hitTest });
};
const tap = (x: number, y: number, id = 1) => {
  ptr(stage(), 'pointerdown', { id, x, y });
  ptr(stage(), 'pointerup', { id, x, y });
};
const saved = () => db.loadProgress('apple');
const flushSave = () => {
  cleanup();
  cleanup = () => {};
};

describe('color screen', () => {
  it('tap fills region with selected color', async () => {
    open();
    q('swatch-blue').click();
    tap(20, 20);
    flushSave();
    await vi.waitFor(async () => expect((await saved())?.ops).toEqual([{ kind: 'fill', region: 'body', color: BLUE }]));
  });

  it('starts with red in fill mode', async () => {
    open();
    tap(20, 20);
    flushSave();
    await vi.waitFor(async () => expect((await saved())?.ops).toEqual([{ kind: 'fill', region: 'body', color: RED }]));
  });

  it('tap outside any region does nothing', async () => {
    open();
    expect(() => tap(20, 99)).not.toThrow();
    expect(q('undo').hasAttribute('disabled')).toBe(true);
  });

  it('undo removes last op', async () => {
    open();
    tap(20, 20);
    tap(80, 20);
    q('undo').click();
    flushSave();
    await vi.waitFor(async () => expect((await saved())?.ops).toEqual([{ kind: 'fill', region: 'body', color: RED }]));
  });

  it('pointer leaving region keeps painting the start region', async () => {
    open();
    q('mode').click();
    ptr(stage(), 'pointerdown', { x: 20, y: 20 });
    ptr(stage(), 'pointermove', { x: 50, y: 20 });
    ptr(stage(), 'pointermove', { x: 80, y: 20 });
    ptr(stage(), 'pointerup', { x: 80, y: 20 });
    flushSave();
    await vi.waitFor(async () => {
      const ops = (await saved())?.ops ?? [];
      expect(ops).toHaveLength(1);
      expect(ops[0]).toMatchObject({ kind: 'brush', region: 'body', color: RED });
    });
    expect(vi.mocked(paint.drawBrushSegment).mock.calls.every((c) => c[3] === 'body')).toBe(true);
  });

  it('brush that starts outside every region paints nothing', async () => {
    open();
    q('mode').click();
    ptr(stage(), 'pointerdown', { x: 20, y: 99 });
    ptr(stage(), 'pointermove', { x: 20, y: 20 });
    ptr(stage(), 'pointerup', { x: 20, y: 20 });
    expect(q('undo').hasAttribute('disabled')).toBe(true);
  });

  it('second pointer is ignored while drawing', async () => {
    open();
    q('mode').click();
    ptr(stage(), 'pointerdown', { id: 1, x: 20, y: 20 });
    ptr(stage(), 'pointerdown', { id: 2, x: 80, y: 20 });
    ptr(stage(), 'pointermove', { id: 2, x: 85, y: 30 });
    ptr(stage(), 'pointerup', { id: 2, x: 85, y: 30 });
    ptr(stage(), 'pointermove', { id: 1, x: 30, y: 30 });
    ptr(stage(), 'pointerup', { id: 1, x: 30, y: 30 });
    flushSave();
    await vi.waitFor(async () => {
      const ops = (await saved())?.ops ?? [];
      expect(ops).toHaveLength(1);
      expect(ops[0].region).toBe('body');
    });
  });

  it('pointercancel drops the stroke', async () => {
    open();
    q('mode').click();
    ptr(stage(), 'pointerdown', { x: 20, y: 20 });
    ptr(stage(), 'pointermove', { x: 30, y: 30 });
    ptr(stage(), 'pointercancel', { x: 30, y: 30 });
    expect(q('undo').hasAttribute('disabled')).toBe(true);
  });

  it('progress resumes', async () => {
    await db.saveProgress(fill(newColoring('apple'), 'body', BLUE));
    open();
    await vi.waitFor(() => expect(q('undo').hasAttribute('disabled')).toBe(false));
  });

  it('done saves to gallery and clears progress', async () => {
    open();
    tap(20, 20);
    q('done').click();
    await vi.waitFor(
      async () => {
        const list = await db.listGallery();
        expect(list).toHaveLength(1);
        expect(list[0].pictureId).toBe('apple');
        expect(location.hash).toBe(`#/gallery/${list[0].id}`);
      },
      { timeout: 4000 },
    );
    expect(await saved()).toBeNull();
  });

  it('done with no ops does nothing', async () => {
    open();
    q('done').click();
    await new Promise((r) => setTimeout(r, 50));
    expect(paint.exportPng).not.toHaveBeenCalled();
    expect(await db.listGallery()).toEqual([]);
  });

  it('done lights up when every region is colored', () => {
    // 사과 칸 5개를 x 구간으로 나눠 찾는 가짜
    const ids = ['bg', 'stem', 'leaf', 'body', 'shine'];
    cleanup = render(root, { name: 'color', picture: 'apple' }, makeDeps({ db }), {
      hitTest: (p) => ids[Math.min(4, Math.floor(p.x / 20))],
    });
    for (const x of [10, 30, 50, 70]) tap(x, 50);
    expect(q('done').classList.contains('ready')).toBe(false);
    tap(90, 50);
    expect(q('done').classList.contains('ready')).toBe(true);
  });

  it('resize re-renders from ops', () => {
    open();
    q('swatch-blue').click();
    tap(20, 20);
    vi.mocked(paint.drawColoring).mockClear();
    window.dispatchEvent(new Event('resize'));
    const last = vi.mocked(paint.drawColoring).mock.calls.at(-1)!;
    expect(last[2]).toEqual({ body: { fill: BLUE, brushes: [] } });
  });

  it('unknown picture goes back to the picker', () => {
    open('nope');
    expect(location.hash).toBe('#/color');
  });
});

describe('color picker', () => {
  it('lists all twelve pictures and opens one', () => {
    cleanup = renderPick(root, { name: 'colorPick' }, makeDeps({ db }));
    expect(root.querySelectorAll('[data-testid^=pick-]')).toHaveLength(12);
    q('pick-fish').click();
    expect(location.hash).toBe('#/color/fish');
  });

  it('draws thumbnails with saved progress', async () => {
    const s = fill(newColoring('fish'), 'body', BLUE);
    await db.saveProgress(s);
    cleanup = renderPick(root, { name: 'colorPick' }, makeDeps({ db }));
    await vi.waitFor(() =>
      expect(vi.mocked(paint.renderThumb).mock.calls.some((c) => c[0].id === 'fish' && c[1] !== null)).toBe(true),
    );
  });
});
