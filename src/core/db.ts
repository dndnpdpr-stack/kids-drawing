import { isColoringState, type ColoringState } from './coloring';

export interface GalleryItem {
  id: string;
  pictureId: string;
  createdAt: number;
  image: Blob;
}

export interface DrawDb {
  loadProgress(pictureId: string): Promise<ColoringState | null>;
  saveProgress(s: ColoringState): Promise<void>;
  clearProgress(pictureId: string): Promise<void>;
  allProgress(): Promise<ColoringState[]>;
  addGallery(pictureId: string, image: Blob): Promise<GalleryItem>;
  /** 최신 먼저 */
  listGallery(): Promise<GalleryItem[]>;
  getGallery(id: string): Promise<GalleryItem | null>;
  deleteGallery(id: string): Promise<void>;
  clearAll(): Promise<void>;
}

export const DB_NAME = 'kidsdraw';
const PROGRESS = 'progress';
const GALLERY = 'gallery';

/** 저장 형태: Blob 대신 바이트로 둔다 (어떤 IndexedDB 구현에서도 복제되게). */
interface GalleryRecord {
  id: string;
  pictureId: string;
  createdAt: number;
  type: string;
  bytes: ArrayBuffer;
}

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  }
}

function req<T>(r: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

function done(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

function isGalleryRecord(v: unknown): v is GalleryRecord {
  if (typeof v !== 'object' || v === null) return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.id === 'string' &&
    typeof o.pictureId === 'string' &&
    typeof o.createdAt === 'number' &&
    typeof o.type === 'string' &&
    Object.prototype.toString.call(o.bytes) === '[object ArrayBuffer]'
  );
}

const toItem = (r: GalleryRecord): GalleryItem => ({
  id: r.id,
  pictureId: r.pictureId,
  createdAt: r.createdAt,
  image: new Blob([r.bytes], { type: r.type }),
});

/** 저장이 안 되는 환경용: 읽으면 빈 값, 쓰면 무시. */
function emptyDb(): DrawDb {
  return {
    loadProgress: async () => null,
    saveProgress: async () => {},
    clearProgress: async () => {},
    allProgress: async () => [],
    addGallery: async (pictureId, image) => ({ id: newId(), pictureId, createdAt: Date.now(), image }),
    listGallery: async () => [],
    getGallery: async () => null,
    deleteGallery: async () => {},
    clearAll: async () => {},
  };
}

function openRaw(factory: IDBFactory): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = factory.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains(PROGRESS)) db.createObjectStore(PROGRESS, { keyPath: 'pictureId' });
      if (!db.objectStoreNames.contains(GALLERY)) {
        db.createObjectStore(GALLERY, { keyPath: 'id' }).createIndex('createdAt', 'createdAt');
      }
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.onblocked = () => reject(new Error('blocked'));
  });
}

/** 실패해도 reject하지 않고 기본값을 돌려준다 (아이 화면이 멈추지 않게). */
async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

function defaultFactory(): IDBFactory | null {
  try {
    return typeof indexedDB === 'undefined' ? null : indexedDB;
  } catch {
    return null;
  }
}

/** 열기가 이 시간 안에 끝나지 않으면 저장 없이 진행한다 (앱이 멈춘 채로 뜨지 않게). */
export const OPEN_TIMEOUT_MS = 3000;

export async function openDrawDb(
  factory: IDBFactory | null = defaultFactory(),
  timeoutMs = OPEN_TIMEOUT_MS,
): Promise<DrawDb> {
  if (!factory) return emptyDb();
  let db: IDBDatabase;
  try {
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
      openRaw(factory).then(
        (d) => {
          clearTimeout(timer);
          resolve(d);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        },
      );
    });
  } catch {
    return emptyDb();
  }

  const store = (name: string, mode: IDBTransactionMode) => {
    const tx = db.transaction(name, mode);
    return { tx, s: tx.objectStore(name) };
  };

  return {
    loadProgress: (pictureId) =>
      safe(async () => {
        const v: unknown = await req(store(PROGRESS, 'readonly').s.get(pictureId));
        return isColoringState(v) ? v : null;
      }, null),
    saveProgress: (s) =>
      safe(async () => {
        const { tx, s: st } = store(PROGRESS, 'readwrite');
        st.put(s);
        await done(tx);
      }, undefined),
    clearProgress: (pictureId) =>
      safe(async () => {
        const { tx, s } = store(PROGRESS, 'readwrite');
        s.delete(pictureId);
        await done(tx);
      }, undefined),
    allProgress: () =>
      safe(async () => {
        const all: unknown[] = await req(store(PROGRESS, 'readonly').s.getAll());
        return all.filter(isColoringState);
      }, []),
    addGallery: async (pictureId, image) => {
      const item: GalleryItem = { id: newId(), pictureId, createdAt: Date.now(), image };
      await safe(async () => {
        const rec: GalleryRecord = { ...item, type: image.type, bytes: await image.arrayBuffer() };
        delete (rec as Partial<GalleryItem>).image;
        const { tx, s } = store(GALLERY, 'readwrite');
        s.put(rec);
        await done(tx);
      }, undefined);
      return item;
    },
    listGallery: () =>
      safe(async () => {
        const all: unknown[] = await req(store(GALLERY, 'readonly').s.getAll());
        return all
          .filter(isGalleryRecord)
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(toItem);
      }, []),
    getGallery: (id) =>
      safe(async () => {
        const v: unknown = await req(store(GALLERY, 'readonly').s.get(id));
        return isGalleryRecord(v) ? toItem(v) : null;
      }, null),
    deleteGallery: (id) =>
      safe(async () => {
        const { tx, s } = store(GALLERY, 'readwrite');
        s.delete(id);
        await done(tx);
      }, undefined),
    clearAll: () =>
      safe(async () => {
        const tx = db.transaction([PROGRESS, GALLERY], 'readwrite');
        tx.objectStore(PROGRESS).clear();
        tx.objectStore(GALLERY).clear();
        await done(tx);
      }, undefined),
  };
}

/** 열리는 중인 db를 바로 쓸 수 있게 감싼다. 각 호출은 열기가 끝난 뒤 실행된다. */
export function lazyDrawDb(opening: Promise<DrawDb>): DrawDb {
  return {
    loadProgress: async (id) => (await opening).loadProgress(id),
    saveProgress: async (st) => (await opening).saveProgress(st),
    clearProgress: async (id) => (await opening).clearProgress(id),
    allProgress: async () => (await opening).allProgress(),
    addGallery: async (id, image) => (await opening).addGallery(id, image),
    listGallery: async () => (await opening).listGallery(),
    getGallery: async (id) => (await opening).getGallery(id),
    deleteGallery: async (id) => (await opening).deleteGallery(id),
    clearAll: async () => (await opening).clearAll(),
  };
}
