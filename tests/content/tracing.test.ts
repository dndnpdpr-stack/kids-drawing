import { describe, expect, it } from 'vitest';
import { getPicture } from '../../src/content/pictures';
import { getTraceItem, nextTraceItem, TRACE_ITEMS } from '../../src/content/tracing';

describe('tracing items', () => {
  it('has only pictures: eleven one-stroke and twelve multi-stroke, in order', () => {
    expect(TRACE_ITEMS.map((t) => `${t.group}:${t.id}`)).toEqual([
      'picture:fish', 'picture:apple', 'picture:balloon', 'picture:heart', 'picture:star', 'picture:house',
      'picture:icecream', 'picture:mushroom', 'picture:umbrella', 'picture:turtle', 'picture:cat',
      'multi:face', 'multi:sunM', 'multi:flowerM', 'multi:houseM', 'multi:snowmanM', 'multi:treeM',
      'multi:boatM', 'multi:carM', 'multi:butterflyM', 'multi:rocketM', 'multi:rabbitM', 'multi:owlM',
    ]);
  });

  it('links every item that has a coloring picture', () => {
    const linked = Object.fromEntries(TRACE_ITEMS.filter((t) => t.picture).map((t) => [t.id, t.picture]));
    expect(linked).toEqual({
      fish: 'fish', apple: 'apple', balloon: 'balloon', heart: 'heart', star: 'star', house: 'house',
      icecream: 'icecream', mushroom: 'mushroom', umbrella: 'umbrella', turtle: 'turtle', cat: 'cat',
      sunM: 'sun', flowerM: 'flower', houseM: 'house', snowmanM: 'snowman', treeM: 'tree',
      boatM: 'boat', carM: 'car', butterflyM: 'butterfly', rocketM: 'rocket', rabbitM: 'rabbit', owlM: 'owl',
    });
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
    for (const id of ['heart', 'star', 'apple', 'balloon', 'icecream', 'mushroom', 'umbrella', 'turtle', 'cat']) {
      const [a, b] = getTraceItem(id)!.strokes;
      expect(a.points[0], id).toEqual(b.points[0]);
    }
  });

  it('linked shapes follow the coloring picture outline', () => {
    // 하트 윤곽 첫 점 (50,30) → 0.1 + 50*0.008 = 0.5, 0.1 + 30*0.008 = 0.34
    expect(getTraceItem('heart')!.strokes[0].points[0]).toEqual({ x: 0.5, y: 0.34 });
  });

  it('nextTraceItem wraps around', () => {
    expect(nextTraceItem('fish').id).toBe('apple');
    expect(nextTraceItem('owlM').id).toBe('fish');
  });

  it('multi-stroke pictures have at least three strokes, none too short to trace', () => {
    for (const t of TRACE_ITEMS.filter((x) => x.group === 'multi')) {
      expect(t.strokes.length, t.id).toBeGreaterThanOrEqual(3);
      for (const s of t.strokes) {
        const a = s.points[0];
        const b = s.points[s.points.length - 1];
        let len = 0;
        for (let i = 1; i < s.points.length; i++) len += Math.hypot(s.points[i].x - s.points[i - 1].x, s.points[i].y - s.points[i - 1].y);
        expect(len, `${t.id} ${a.x},${a.y}->${b.x},${b.y}`).toBeGreaterThanOrEqual(0.06);
      }
    }
  });

  it('getTraceItem unknown is undefined', () => {
    expect(getTraceItem('nope')).toBeUndefined();
  });
});
