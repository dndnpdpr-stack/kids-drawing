import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { addBrush, fill, newColoring } from '../../src/core/coloring';
import { lazyDrawDb, openDrawDb, type DrawDb } from '../../src/core/db';

let factory: IDBFactory;
let db: DrawDb;

beforeEach(async () => {
  factory = new IDBFactory();
  db = await openDrawDb(factory);
});
afterEach(() => vi.restoreAllMocks());

const png = (text = 'x') => new Blob([text], { type: 'image/png' });

describe('progress', () => {
  it('round-trips', async () => {
    const s = addBrush(fill(newColoring('apple'), 'body', '#ff595e'), 'leaf', '#8ac926', [{ x: 1, y: 2 }]);
    await db.saveProgress(s);
    expect(await db.loadProgress('apple')).toEqual(s);
  });

  it('unknown picture loads null', async () => {
    expect(await db.loadProgress('nope')).toBeNull();
  });

  it('clearProgress removes', async () => {
    await db.saveProgress(fill(newColoring('apple'), 'body', '#ff595e'));
    await db.clearProgress('apple');
    expect(await db.loadProgress('apple')).toBeNull();
  });

  it('allProgress lists saved', async () => {
    await db.saveProgress(fill(newColoring('apple'), 'body', '#ff595e'));
    await db.saveProgress(fill(newColoring('fish'), 'body', '#1982c4'));
    expect((await db.allProgress()).map((s) => s.pictureId).sort()).toEqual(['apple', 'fish']);
  });

  it('load returns empty on corrupt record', async () => {
    await new Promise<void>((resolve, reject) => {
      const req = factory.open('kidsdraw', 1);
      req.onsuccess = () => {
        const tx = req.result.transaction('progress', 'readwrite');
        tx.objectStore('progress').put({ pictureId: 'apple', ops: 'x' });
        tx.oncomplete = () => {
          req.result.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
    });
    expect(await db.loadProgress('apple')).toBeNull();
    expect(await db.allProgress()).toEqual([]);
  });
});

describe('gallery', () => {
  it('lists newest first', async () => {
    const now = vi.spyOn(Date, 'now');
    now.mockReturnValue(1000);
    const a = (await db.addGallery('apple', png('a')))!;
    now.mockReturnValue(3000);
    const c = (await db.addGallery('fish', png('c')))!;
    now.mockReturnValue(2000);
    const b = (await db.addGallery('heart', png('b')))!;
    expect((await db.listGallery()).map((g) => g.id)).toEqual([c.id, b.id, a.id]);
  });

  it('keeps the image bytes and type', async () => {
    const item = (await db.addGallery('apple', png('hello')))!;
    const got = await db.getGallery(item.id);
    expect(got?.pictureId).toBe('apple');
    expect(got?.image.type).toBe('image/png');
    expect(await got?.image.text()).toBe('hello');
  });

  it('getGallery unknown is null', async () => {
    expect(await db.getGallery('nope')).toBeNull();
  });

  it('deleteGallery removes one', async () => {
    const a = (await db.addGallery('apple', png()))!;
    const b = (await db.addGallery('fish', png()))!;
    await db.deleteGallery(a.id);
    expect((await db.listGallery()).map((g) => g.id)).toEqual([b.id]);
  });
});

describe('clearAll', () => {
  it('empties progress and gallery', async () => {
    await db.saveProgress(fill(newColoring('apple'), 'body', '#ff595e'));
    await db.addGallery('apple', png());
    await db.clearAll();
    expect(await db.allProgress()).toEqual([]);
    expect(await db.listGallery()).toEqual([]);
  });
});

describe('unavailable', () => {
  it('db unavailable resolves to empty', async () => {
    const none = await openDrawDb(null);
    expect(await none.listGallery()).toEqual([]);
    expect(await none.loadProgress('apple')).toBeNull();
    await expect(none.saveProgress(newColoring('apple'))).resolves.toBeUndefined();
    await expect(none.addGallery('apple', png())).resolves.toBeNull();
  });

  it('a factory whose open throws also resolves to empty', async () => {
    const broken = { open: () => { throw new Error('denied'); } } as unknown as IDBFactory;
    const none = await openDrawDb(broken);
    expect(await none.allProgress()).toEqual([]);
  });
});

describe('slow or stuck open', () => {
  /** open 요청이 끝나지 않는 factory */
  const stuck = { open: () => ({}) } as unknown as IDBFactory;

  it('falls back to an empty db after the timeout', async () => {
    vi.useFakeTimers();
    try {
      const p = openDrawDb(stuck, 50);
      await vi.advanceTimersByTimeAsync(60);
      const none = await p;
      expect(await none.listGallery()).toEqual([]);
    } finally {
      vi.useRealTimers();
    }
  });

  it('lazyDrawDb answers calls once the db opens', async () => {
    const lazy = lazyDrawDb(openDrawDb(factory));
    await lazy.saveProgress(fill(newColoring('apple'), 'body', '#ff595e'));
    expect((await lazy.loadProgress('apple'))?.ops).toHaveLength(1);
  });
});
