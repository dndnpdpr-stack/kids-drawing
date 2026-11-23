import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fill, newColoring } from '../../src/core/coloring';
import { openDrawDb, type DrawDb } from '../../src/core/db';
import type { Settings } from '../../src/core/settings';
import { render } from '../../src/ui/parent';
import { makeDeps } from '../helpers';

let root: HTMLElement;
let db: DrawDb;
let cleanup: () => void = () => {};

beforeEach(async () => {
  db = await openDrawDb(new IDBFactory());
  root = document.createElement('div');
  document.body.append(root);
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
});
afterEach(() => {
  cleanup();
  cleanup = () => {};
  root.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

const q = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`[data-testid=${id}]`);
const png = () => new Blob(['x'], { type: 'image/png' });

describe('parent menu', () => {
  it('saves the volume', () => {
    const saveSettings = vi.fn<(s: Settings) => void>();
    cleanup = render(root, { name: 'parent' }, makeDeps({ db, saveSettings }));
    const slider = q<HTMLInputElement>('volume')!;
    slider.value = '0.3';
    slider.dispatchEvent(new Event('change'));
    expect(saveSettings).toHaveBeenCalledWith({ volume: 0.3 });
  });

  it('renames the child', () => {
    const saveName = vi.fn();
    cleanup = render(root, { name: 'parent' }, makeDeps({ db, saveName }));
    q<HTMLInputElement>('parent-name')!.value = '  하늘 ';
    q('parent-name-save')!.click();
    expect(saveName).toHaveBeenCalledWith('하늘');
  });

  it('deletes a gallery picture only on the second tap', async () => {
    const a = await db.addGallery('apple', png());
    await db.addGallery('fish', png());
    cleanup = render(root, { name: 'parent' }, makeDeps({ db }));
    await vi.waitFor(() => expect(q(`delete-${a.id}`)).not.toBeNull());
    q(`delete-${a.id}`)!.click();
    expect(await db.listGallery()).toHaveLength(2);
    q(`delete-${a.id}`)!.click();
    await vi.waitFor(async () => expect((await db.listGallery()).map((g) => g.pictureId)).toEqual(['fish']));
    await vi.waitFor(() => expect(q(`delete-${a.id}`)).toBeNull());
  });

  it('a delete confirmation expires after 3 seconds', async () => {
    const a = await db.addGallery('apple', png());
    cleanup = render(root, { name: 'parent' }, makeDeps({ db }));
    await vi.waitFor(() => expect(q(`delete-${a.id}`)).not.toBeNull());
    vi.useFakeTimers();
    q(`delete-${a.id}`)!.click();
    vi.advanceTimersByTime(3100);
    q(`delete-${a.id}`)!.click();
    vi.useRealTimers();
    await new Promise((r) => setTimeout(r, 30));
    expect(await db.listGallery()).toHaveLength(1);
  });

  it('reset clears drawings but keeps name and volume', async () => {
    await db.addGallery('apple', png());
    await db.saveProgress(fill(newColoring('apple'), 'body', '#ff595e'));
    const saveName = vi.fn();
    const saveSettings = vi.fn();
    cleanup = render(root, { name: 'parent' }, makeDeps({ db, saveName, saveSettings }));
    q('reset')!.click();
    expect(await db.listGallery()).toHaveLength(1);
    q('reset')!.click();
    await vi.waitFor(async () => {
      expect(await db.listGallery()).toEqual([]);
      expect(await db.allProgress()).toEqual([]);
    });
    expect(saveName).not.toHaveBeenCalled();
    expect(saveSettings).not.toHaveBeenCalled();
  });
});
