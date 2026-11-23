import { vi } from 'vitest';
import type { DrawDb } from '../src/core/db';
import type { ScreenDeps } from '../src/ui/dom';

/** 포인터 이벤트 흉내 (jsdom에는 PointerEvent가 없다). 좌표는 clientX/Y. */
export function ptr(node: Element | Window, type: string, opts: { id?: number; x?: number; y?: number } = {}) {
  const e = new Event(type, { bubbles: true, cancelable: true }) as Event & {
    pointerId: number;
    clientX: number;
    clientY: number;
  };
  e.pointerId = opts.id ?? 1;
  e.clientX = opts.x ?? 0;
  e.clientY = opts.y ?? 0;
  node.dispatchEvent(e);
  return e;
}

export function makeDeps(over: Partial<ScreenDeps> = {}): ScreenDeps {
  return {
    settings: { volume: 0.5 },
    saveSettings: vi.fn(),
    speak: vi.fn(() => Promise.resolve()),
    childName: '민지',
    saveName: vi.fn(),
    announce: null,
    testMode: false,
    db: {} as DrawDb,
    ...over,
  } as ScreenDeps;
}
