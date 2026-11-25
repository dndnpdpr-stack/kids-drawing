import { describe, expect, it } from 'vitest';
import { advanceTrace, endStroke, newTrace, TRACE_TOLERANCE } from '../../src/core/trace';
import type { Stroke } from '../../src/core/trace';

const strokes: Stroke[] = [
  { points: [{ x: 0.2, y: 0.2 }, { x: 0.5, y: 0.2 }, { x: 0.8, y: 0.2 }] },
  { points: [{ x: 0.8, y: 0.5 }, { x: 0.8, y: 0.8 }] },
];

const CONSONANTS = 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ';
const VOWELS = 'ㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ';
const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';
const supported = [...CONSONANTS, ...VOWELS, ...LETTERS, ...DIGITS];

describe('trace judge', () => {
  it('completes when checkpoints are passed in order', () => {
    let s = newTrace();
    for (const st of strokes) for (const p of st.points) s = advanceTrace(s, strokes, p);
    expect(s.done).toBe(true);
  });

  it('moves to the next stroke at pointIndex 0 after finishing a stroke', () => {
    let s = newTrace();
    for (const p of strokes[0].points) s = advanceTrace(s, strokes, p);
    expect(s).toEqual({ strokeIndex: 1, pointIndex: 0, done: false });
  });

  it('is forgiving enough for small fingers', () => {
    expect(TRACE_TOLERANCE).toBeGreaterThanOrEqual(0.16);
  });

  it('catches up when the finger already passed one checkpoint', () => {
    const s = advanceTrace(newTrace(), strokes, strokes[0].points[1]);
    expect(s).toEqual({ strokeIndex: 0, pointIndex: 2, done: false });
  });

  it('passes every nearby checkpoint at once', () => {
    const near: Stroke[] = [{ points: [{ x: 0.2, y: 0.2 }, { x: 0.3, y: 0.2 }, { x: 0.6, y: 0.2 }] }];
    expect(advanceTrace(newTrace(), near, { x: 0.25, y: 0.2 })).toEqual({ strokeIndex: 0, pointIndex: 2, done: false });
  });

  it('ignores points two checkpoints ahead', () => {
    const s = advanceTrace(newTrace(), strokes, strokes[0].points[2]);
    expect(s).toEqual(newTrace());
  });

  it('ignores points outside tolerance', () => {
    const p = { x: 0.2, y: 0.2 + TRACE_TOLERANCE + 0.01 }; // 선에서 벗어난 곳
    expect(advanceTrace(newTrace(), strokes, p)).toEqual(newTrace());
  });

  it('accepts a point within tolerance and advances only one checkpoint', () => {
    const s = advanceTrace(newTrace(), strokes, { x: 0.25, y: 0.25 });
    expect(s.pointIndex).toBe(1);
  });

  it('lifting the finger mid-stroke keeps what was drawn', () => {
    let s = newTrace();
    for (const p of strokes[0].points) s = advanceTrace(s, strokes, p);
    s = advanceTrace(s, strokes, strokes[1].points[0]);
    expect(s).toEqual({ strokeIndex: 1, pointIndex: 1, done: false });
    expect(endStroke(s, strokes)).toEqual(s);
  });

  it('endStroke at pointIndex 0 is a no-op', () => {
    const s = newTrace();
    expect(endStroke(s, strokes)).toEqual(s);
  });

  it('does not change state after done', () => {
    let s = newTrace();
    for (const st of strokes) for (const p of st.points) s = advanceTrace(s, strokes, p);
    expect(advanceTrace(s, strokes, strokes[0].points[0])).toEqual(s);
    expect(endStroke(s, strokes)).toEqual(s);
  });

  it('is pure', () => {
    const s0 = newTrace();
    const s1 = advanceTrace(s0, strokes, strokes[0].points[0]);
    expect(s0).toEqual(newTrace());
    expect(s1).not.toBe(s0);
  });
});
