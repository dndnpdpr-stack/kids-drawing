import { describe, expect, it } from 'vitest';
import { getPicture, PICTURES } from '../../src/content/pictures';
import { PALETTE } from '../../src/core/palette';

const nums = (d: string) => (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
const RANGE: Record<1 | 2 | 3, [number, number]> = { 1: [4, 6], 2: [7, 10], 3: [10, 15] };

describe('pictures', () => {
  it('have unique ids', () => {
    const ids = PICTURES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('include the six easy pictures at level 1', () => {
    for (const id of ['apple', 'balloon', 'heart', 'star', 'fish', 'house']) {
      expect(getPicture(id)?.level, id).toBe(1);
    }
  });

  it('has twenty-four pictures with the planned levels', () => {
    expect(PICTURES).toHaveLength(24);
    for (const id of ['sun', 'icecream', 'umbrella', 'mushroom']) expect(getPicture(id)?.level, id).toBe(1);
    for (const id of ['flower', 'car', 'cat', 'boat', 'tree', 'snowman', 'turtle']) expect(getPicture(id)?.level, id).toBe(2);
    for (const id of ['butterfly', 'dino', 'rocket', 'train', 'castle', 'rabbit', 'owl']) expect(getPicture(id)?.level, id).toBe(3);
  });

  it('is sorted easiest first', () => {
    const levels = PICTURES.map((p) => p.level);
    expect(levels).toEqual([...levels].sort());
  });

  it('getPicture returns undefined for unknown ids', () => {
    expect(getPicture('nope')).toBeUndefined();
  });

  for (const p of PICTURES) {
    describe(p.id, () => {
      it('has unique region ids', () => {
        const ids = p.regions.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
      });
      it('has closed region paths', () => {
        for (const r of p.regions) expect(r.d.trim(), r.id).toMatch(/[Zz]$/);
      });
      it('stays inside 0..100', () => {
        for (const d of [...p.regions.map((r) => r.d), ...p.lines]) {
          for (const n of nums(d)) {
            expect(n).toBeGreaterThanOrEqual(0);
            expect(n).toBeLessThanOrEqual(100);
          }
        }
      });
      it('has a region count matching its level', () => {
        const [lo, hi] = RANGE[p.level];
        expect(p.regions.length).toBeGreaterThanOrEqual(lo);
        expect(p.regions.length).toBeLessThanOrEqual(hi);
      });
    });
  }
});

describe('palette', () => {
  it('has the ten fixed colors in order', () => {
    expect(PALETTE.map((c) => c.hex)).toEqual([
      '#ff595e', '#ff924c', '#ffca3a', '#8ac926', '#1982c4', '#6a4c93', '#ff8fab', '#a0522d', '#333333', '#ffffff',
    ]);
    expect(PALETTE.map((c) => c.id)).toEqual([
      'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white',
    ]);
  });
});
