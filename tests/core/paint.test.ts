import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Picture } from '../../src/content/pictures';
import { drawColoring, pathBBox, makeHitTest } from '../../src/core/paint';

// jsdom에는 Path2D가 없다. d 문자열만 들고 있는 가짜로 대신한다.
class FakePath2D {
  constructor(public d: string) {}
}
beforeEach(() => vi.stubGlobal('Path2D', FakePath2D));
afterEach(() => vi.unstubAllGlobals());

const pic: Picture = {
  id: 't',
  name: 't',
  emoji: 't',
  level: 1,
  regions: [
    { id: 'back', d: 'M0 0H100V100H0Z' },
    { id: 'front', d: 'M20 20L80 20L80 80L20 80Z' },
  ],
  lines: [],
};

/** 점이 어느 path 안인지 직접 정해 주는 가짜 ctx */
function fakeCtx(inside: (d: string, x: number, y: number) => boolean) {
  return {
    save: vi.fn(),
    restore: vi.fn(),
    setTransform: vi.fn(),
    isPointInPath: (p: FakePath2D, x: number, y: number) => inside(p.d, x, y),
  } as unknown as CanvasRenderingContext2D;
}

describe('makeHitTest', () => {
  it('returns the topmost (later) region when regions overlap', () => {
    const hit = makeHitTest(fakeCtx(() => true), pic);
    expect(hit({ x: 50, y: 50 })).toBe('front');
  });

  it('falls through to a lower region', () => {
    const hit = makeHitTest(fakeCtx((d) => d.startsWith('M0')), pic);
    expect(hit({ x: 5, y: 5 })).toBe('back');
  });

  it('returns null outside every region', () => {
    const hit = makeHitTest(fakeCtx(() => false), pic);
    expect(hit({ x: 50, y: 50 })).toBeNull();
  });
});

describe('pathBBox', () => {
  it('covers a polygon', () => {
    expect(pathBBox('M20 20L80 20L80 80L20 80Z')).toEqual({ x0: 20, y0: 20, x1: 80, y1: 80 });
  });
  it('covers H and V commands', () => {
    expect(pathBBox('M0 0H100V50H0Z')).toEqual({ x0: 0, y0: 0, x1: 100, y1: 50 });
  });
  it('contains a circle drawn with two arcs', () => {
    const b = pathBBox('M40 50A10 10 0 1 1 60 50A10 10 0 1 1 40 50Z');
    expect(b.x0).toBeLessThanOrEqual(40);
    expect(b.x1).toBeGreaterThanOrEqual(60);
    expect(b.y0).toBeLessThanOrEqual(40);
    expect(b.y1).toBeGreaterThanOrEqual(60);
  });
  it('contains curve control points', () => {
    const b = pathBBox('M10 50Q50 0 90 50Z');
    expect(b.y0).toBeLessThanOrEqual(25);
  });
});

describe('drawColoring layering', () => {
  /** fill/stroke 호출을 순서대로 기록하는 가짜 ctx */
  function recorder() {
    const log: string[] = [];
    const ctx = new Proxy(
      {},
      {
        get: (_t, k) => {
          if (k === 'fill') return (p?: FakePath2D) => p && log.push(`fill ${p.d}`);
          if (k === 'stroke') return (p?: FakePath2D) => log.push(p ? `stroke ${p.d}` : 'pen');
          return () => {};
        },
        set: () => true,
      },
    ) as unknown as CanvasRenderingContext2D;
    return { ctx, log };
  }
  const BACK = 'M0 0H100V100H0Z';
  const FRONT = 'M20 20L80 20L80 80L20 80Z';

  it('strokes each region outline right after the region so later regions cover it', () => {
    const p: Picture = { ...pic, regions: [{ id: 'a', d: BACK }, { id: 'front', d: FRONT }], lines: ['M1 1L2 2'] };
    const { ctx, log } = recorder();
    drawColoring(ctx, p, {}, 100);
    expect(log).toEqual([`fill ${BACK}`, `stroke ${BACK}`, `fill ${FRONT}`, `stroke ${FRONT}`, 'stroke M1 1L2 2']);
  });

  it('draws pen strokes inside every region, before that region outline', () => {
    const p: Picture = { ...pic, regions: [{ id: 'bg', d: BACK }, { id: 'front', d: FRONT }], lines: ['M1 1L2 2'] };
    const { ctx, log } = recorder();
    drawColoring(ctx, p, {}, 100, [{ color: '#000', points: [{ x: 10, y: 10 }, { x: 50, y: 50 }] }]);
    expect(log).toEqual([`fill ${BACK}`, 'pen', `fill ${FRONT}`, 'pen', `stroke ${FRONT}`, 'stroke M1 1L2 2']);
  });

  it('does not outline the bg region', () => {
    const p: Picture = { ...pic, regions: [{ id: 'bg', d: BACK }, { id: 'front', d: FRONT }] };
    const { ctx, log } = recorder();
    drawColoring(ctx, p, {}, 100);
    expect(log).toEqual([`fill ${BACK}`, `fill ${FRONT}`, `stroke ${FRONT}`]);
  });
});
