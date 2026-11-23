import { describe, expect, it, vi } from 'vitest';
import { go, parseRoute, startRouter, toHash, type Route } from '../src/router';

const ROUTES: Route[] = [
  { name: 'home' },
  { name: 'setup' },
  { name: 'parent' },
  { name: 'colorPick' },
  { name: 'color', picture: 'apple' },
  { name: 'tracePick' },
  { name: 'trace', item: 'heart' },
  { name: 'gallery' },
  { name: 'galleryView', id: 'abc-123' },
];

describe('router', () => {
  it('round-trips every route', () => {
    for (const r of ROUTES) expect(parseRoute(toHash(r))).toEqual(r);
  });

  it('uses the documented hashes', () => {
    expect(ROUTES.map(toHash)).toEqual([
      '#/', '#/setup', '#/parent', '#/color', '#/color/apple', '#/trace', '#/trace/heart', '#/gallery', '#/gallery/abc-123',
    ]);
  });

  it('unknown hash goes home', () => {
    expect(parseRoute('#/nope')).toEqual({ name: 'home' });
    expect(parseRoute('')).toEqual({ name: 'home' });
  });

  it('trailing slash is the picker', () => {
    expect(parseRoute('#/color/')).toEqual({ name: 'colorPick' });
  });

  it('go replace does not grow history and still triggers the handler', async () => {
    location.hash = '#/';
    const seen: string[] = [];
    const stop = startRouter((r) => seen.push(r.name));
    const before = history.length;
    go({ name: 'gallery' }, { replace: true });
    await vi.waitFor(() => expect(seen).toContain('gallery'));
    expect(history.length).toBe(before);
    stop();
  });
});
