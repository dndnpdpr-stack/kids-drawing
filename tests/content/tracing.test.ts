import { describe, expect, it } from 'vitest';
import { getPicture } from '../../src/content/pictures';
import { getTraceItem, nextTraceItem, TRACE_ITEMS } from '../../src/content/tracing';

describe('tracing items', () => {
  it('has the thirteen planned items in order', () => {
    expect(TRACE_ITEMS.map((t) => `${t.group}:${t.id}`)).toEqual([
      'line:hline', 'line:vline', 'line:zigzag', 'line:wave',
      'shape:circle', 'shape:triangle', 'shape:square', 'shape:heart', 'shape:star',
      'picture:fish', 'picture:apple', 'picture:house', 'picture:balloon',
    ]);
  });

  it('links exactly the six shapes that have coloring pictures', () => {
    const linked = TRACE_ITEMS.filter((t) => t.picture).map((t) => t.id);
    expect(linked.sort()).toEqual(['apple', 'balloon', 'fish', 'heart', 'house', 'star']);
    for (const t of TRACE_ITEMS) if (t.picture) expect(getPicture(t.picture), t.id).toBeDefined();
  });

  for (const t of TRACE_ITEMS) {
    it(`${t.id}: points inside 0..1, at least 2 per stroke, gaps <= 0.25`, () => {
      expect(t.strokes.length).toBeGreaterThan(0);
      for (const s of t.strokes) {
        expect(s.points.length).toBeGreaterThanOrEqual(2);
        for (const p of s.points) {
          expect(p.x).toBeGreaterThanOrEqual(0);
          expect(p.x).toBeLessThanOrEqual(1);
          expect(p.y).toBeGreaterThanOrEqual(0);
          expect(p.y).toBeLessThanOrEqual(1);
        }
        for (let i = 1; i < s.points.length; i++) {
          const a = s.points[i - 1];
          const b = s.points[i];
          expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeLessThanOrEqual(0.25);
        }
      }
    });
  }

  it('closed shapes start both strokes at the same point', () => {
    for (const id of ['circle', 'heart', 'star', 'apple', 'balloon']) {
      const [a, b] = getTraceItem(id)!.strokes;
      expect(a.points[0], id).toEqual(b.points[0]);
    }
  });

  it('linked shapes follow the coloring picture outline', () => {
    // 하트 윤곽 첫 점 (50,30) → 0.1 + 50*0.008 = 0.5, 0.1 + 30*0.008 = 0.34
    expect(getTraceItem('heart')!.strokes[0].points[0]).toEqual({ x: 0.5, y: 0.34 });
  });

  it('nextTraceItem wraps around', () => {
    expect(nextTraceItem('hline').id).toBe('vline');
    expect(nextTraceItem('balloon').id).toBe('hline');
  });

  it('getTraceItem unknown is undefined', () => {
    expect(getTraceItem('nope')).toBeUndefined();
  });
});
