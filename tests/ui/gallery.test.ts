import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openDrawDb, type DrawDb } from '../../src/core/db';
import { render } from '../../src/ui/gallery';
import { makeDeps } from '../helpers';

let root: HTMLElement;
let db: DrawDb;
let cleanup: () => void = () => {};

beforeEach(async () => {
  db = await openDrawDb(new IDBFactory());
  root = document.createElement('div');
  document.body.append(root);
  location.hash = '#/gallery';
  // jsdom에는 object URL이 없다
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  cleanup = () => {};
  root.remove();
  vi.restoreAllMocks();
});

const png = () => new Blob(['x'], { type: 'image/png' });
const items = () => [...root.querySelectorAll<HTMLElement>('[data-testid=gallery-item]')];

describe('gallery grid', () => {
  it('shows saved pictures newest first', async () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1);
    await db.addGallery('apple', png());
    now.mockReturnValue(3);
    const newest = await db.addGallery('fish', png());
    now.mockReturnValue(2);
    await db.addGallery('cat', png());
    cleanup = render(root, { name: 'gallery' }, makeDeps({ db }));
    await vi.waitFor(() => expect(items()).toHaveLength(3));
    items()[0].click();
    expect(location.hash).toBe(`#/gallery/${newest.id}`);
  });

  it('empty gallery offers coloring', async () => {
    cleanup = render(root, { name: 'gallery' }, makeDeps({ db }));
    await vi.waitFor(() => expect(root.querySelector('[data-testid=gallery-empty]')).not.toBeNull());
    root.querySelector<HTMLElement>('[data-testid=gallery-empty]')!.click();
    expect(location.hash).toBe('#/color');
  });

  it('has no delete control for the child', async () => {
    await db.addGallery('apple', png());
    cleanup = render(root, { name: 'gallery' }, makeDeps({ db }));
    await vi.waitFor(() => expect(items()).toHaveLength(1));
    expect(root.querySelector('[data-testid*=delete]')).toBeNull();
  });

  it('releases object URLs on leave', async () => {
    await db.addGallery('apple', png());
    cleanup = render(root, { name: 'gallery' }, makeDeps({ db }));
    await vi.waitFor(() => expect(items()).toHaveLength(1));
    cleanup();
    cleanup = () => {};
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fake');
  });
});

describe('gallery view', () => {
  it('unknown id goes back to the grid', async () => {
    location.hash = '#/gallery/unknown';
    cleanup = render(root, { name: 'galleryView', id: 'unknown' }, makeDeps({ db }));
    await vi.waitFor(() => expect(location.hash).toBe('#/gallery'));
  });

  it('color-again opens the same picture fresh', async () => {
    const item = await db.addGallery('fish', png());
    location.hash = `#/gallery/${item.id}`;
    cleanup = render(root, { name: 'galleryView', id: item.id }, makeDeps({ db }));
    await vi.waitFor(() => expect(root.querySelector('[data-testid=color-again]')).not.toBeNull());
    root.querySelector<HTMLElement>('[data-testid=color-again]')!.click();
    expect(location.hash).toBe('#/color/fish');
  });

  it('shows the big image', async () => {
    const item = await db.addGallery('fish', png());
    cleanup = render(root, { name: 'galleryView', id: item.id }, makeDeps({ db }));
    await vi.waitFor(() => expect(root.querySelector('img.gallery-big')?.getAttribute('src')).toBe('blob:fake'));
  });
});
