import { describe, expect, it } from 'vitest';
import type { Picture } from '../../src/content/pictures';
import {
  addBrush,
  canClear,
  clearAll,
  addPen,
  pensOf,
  canUndo,
  fill,
  isColoringState,
  isComplete,
  newColoring,
  simplify,
  undo,
  viewOf,
} from '../../src/core/coloring';

const RED = '#ff595e';
const BLUE = '#1982c4';
const pic: Picture = {
  id: 't',
  name: 't',
  emoji: 't',
  level: 1,
  regions: ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => ({ id, d: 'M0 0L1 0L1 1Z' })),
  lines: [],
};

describe('coloring state', () => {
  it('fill then undo returns to empty', () => {
    const s = fill(newColoring('t'), 'a', RED);
    expect(s.ops).toHaveLength(1);
    expect(undo(s).ops).toEqual([]);
  });

  it('undo on empty is a no-op', () => {
    const s = newColoring('t');
    expect(canUndo(s)).toBe(false);
    expect(undo(s)).toEqual(s);
  });

  it('refilling with the same color adds no op', () => {
    const s = fill(newColoring('t'), 'a', RED);
    expect(fill(s, 'a', RED)).toBe(s);
    expect(fill(s, 'a', BLUE).ops).toHaveLength(2);
  });

  it('refilling the same color after a brush in that region adds an op', () => {
    const s = addBrush(fill(newColoring('t'), 'a', RED), 'a', BLUE, [{ x: 1, y: 1 }]);
    expect(fill(s, 'a', RED).ops).toHaveLength(3);
  });

  it('fill hides earlier brushes in that region only', () => {
    let s = addBrush(newColoring('t'), 'a', BLUE, [{ x: 1, y: 1 }]);
    s = addBrush(s, 'b', BLUE, [{ x: 2, y: 2 }]);
    s = fill(s, 'a', RED);
    const v = viewOf(s);
    expect(v.a.fill).toBe(RED);
    expect(v.a.brushes).toEqual([]);
    expect(v.b.brushes).toHaveLength(1);
  });

  it('brush after fill shows on top', () => {
    const s = addBrush(fill(newColoring('t'), 'a', RED), 'a', BLUE, [{ x: 1, y: 1 }]);
    const v = viewOf(s);
    expect(v.a.fill).toBe(RED);
    expect(v.a.brushes[0].color).toBe(BLUE);
  });

  it('brush stroke stays in its starting region', () => {
    const s = addBrush(newColoring('t'), 'a', RED, [{ x: 10, y: 10 }, { x: 90, y: 90 }]);
    expect(s.ops[0]).toMatchObject({ region: 'a' });
    expect(Object.keys(viewOf(s))).toEqual(['a']);
  });

  it('empty brush adds nothing', () => {
    const s = newColoring('t');
    expect(addBrush(s, 'a', RED, [])).toBe(s);
  });

  it('25 ops can all be undone one by one', () => {
    let s = newColoring('t');
    for (let i = 0; i < 25; i++) s = fill(s, 'a', i % 2 ? RED : BLUE);
    for (let i = 0; i < 25; i++) {
      expect(canUndo(s)).toBe(true);
      s = undo(s);
    }
    expect(s.ops).toEqual([]);
  });

  it('isComplete needs every region colored by fill or brush', () => {
    let s = newColoring('t');
    for (const id of ['a', 'b', 'c', 'd', 'e']) s = fill(s, id, RED);
    expect(isComplete(s, pic)).toBe(false);
    s = addBrush(s, 'f', BLUE, [{ x: 1, y: 1 }]);
    expect(isComplete(s, pic)).toBe(true);
  });

  it('does not mutate the input state', () => {
    const s = newColoring('t');
    fill(s, 'a', RED);
    expect(s.ops).toEqual([]);
  });
});

describe('simplify', () => {
  it('drops points closer than minDist, keeps first and last', () => {
    expect(simplify([{ x: 0, y: 0 }, { x: 0.1, y: 0 }, { x: 0.5, y: 0 }, { x: 2, y: 0 }])).toEqual([
      { x: 0, y: 0 },
      { x: 2, y: 0 },
    ]);
  });
  it('keeps the last point even when close', () => {
    expect(simplify([{ x: 0, y: 0 }, { x: 0.3, y: 0 }])).toEqual([
      { x: 0, y: 0 },
      { x: 0.3, y: 0 },
    ]);
  });
  it('keeps a single point', () => {
    expect(simplify([{ x: 3, y: 4 }])).toEqual([{ x: 3, y: 4 }]);
  });
});

describe('isColoringState', () => {
  it('accepts a valid state', () => {
    const s = addBrush(fill(newColoring('t'), 'a', RED), 'b', BLUE, [{ x: 1, y: 2 }]);
    expect(isColoringState(JSON.parse(JSON.stringify(s)))).toBe(true);
  });
  it.each([
    null,
    'x',
    { pictureId: 't' },
    { pictureId: 't', ops: 'x' },
    { pictureId: 't', ops: [{ kind: 'erase', region: 'a', color: RED }] },
    { pictureId: 't', ops: [{ kind: 'brush', region: 'a', color: RED, points: [{ x: 'a', y: 1 }] }] },
    { pictureId: 't', ops: [{ kind: 'fill', region: 1, color: RED }] },
    { pictureId: 't', ops: [{ kind: 'pen', color: RED, points: [{ x: 1 }] }] },
  ])('rejects %j', (v) => {
    expect(isColoringState(v)).toBe(false);
  });
});

describe('free pen', () => {
  it('pen strokes belong to no region and keep their order', () => {
    let s = addPen(newColoring('t'), RED, [{ x: 10, y: 10 }, { x: 90, y: 90 }]);
    s = addPen(s, BLUE, [{ x: 5, y: 5 }]);
    expect(pensOf(s)).toEqual([
      { color: RED, points: [{ x: 10, y: 10 }, { x: 90, y: 90 }] },
      { color: BLUE, points: [{ x: 5, y: 5 }] },
    ]);
    expect(viewOf(s)).toEqual({});
  });

  it('a later fill does not hide pen strokes', () => {
    const s = fill(addPen(newColoring('t'), RED, [{ x: 1, y: 1 }]), 'a', BLUE);
    expect(pensOf(s)).toHaveLength(1);
  });

  it('empty pen adds nothing; undo removes a pen stroke', () => {
    const s = newColoring('t');
    expect(addPen(s, RED, [])).toBe(s);
    expect(pensOf(undo(addPen(s, RED, [{ x: 1, y: 1 }])))).toEqual([]);
  });

  it('pen strokes do not count toward completion', () => {
    expect(isComplete(addPen(newColoring('t'), RED, [{ x: 1, y: 1 }]), pic)).toBe(false);
  });

  it('saved pen strokes are a valid state', () => {
    const s = addPen(newColoring('t'), RED, [{ x: 1, y: 2 }]);
    expect(isColoringState(JSON.parse(JSON.stringify(s)))).toBe(true);
  });
});

describe('clear all', () => {
  it('wipes pens and fills, and undo brings them back', () => {
    const before = fill(addPen(newColoring('t'), RED, [{ x: 1, y: 1 }]), 'a', BLUE);
    const cleared = clearAll(before);
    expect(pensOf(cleared)).toEqual([]);
    expect(viewOf(cleared)).toEqual({});
    expect(canClear(cleared)).toBe(false);
    expect(pensOf(undo(cleared))).toHaveLength(1);
    expect(viewOf(undo(cleared)).a.fill).toBe(BLUE);
  });

  it('drawing after a clear shows only the new strokes', () => {
    const s = addPen(clearAll(addPen(newColoring('t'), RED, [{ x: 1, y: 1 }])), BLUE, [{ x: 2, y: 2 }]);
    expect(pensOf(s)).toEqual([{ color: BLUE, points: [{ x: 2, y: 2 }] }]);
    expect(canClear(s)).toBe(true);
  });

  it('clearing an empty page does nothing', () => {
    const s = newColoring('t');
    expect(canClear(s)).toBe(false);
    expect(clearAll(s)).toBe(s);
  });

  it('a saved clear is a valid state', () => {
    const s = clearAll(addPen(newColoring('t'), RED, [{ x: 1, y: 1 }]));
    expect(isColoringState(JSON.parse(JSON.stringify(s)))).toBe(true);
  });
});
