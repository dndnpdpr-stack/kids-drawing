import type { speak } from '../core/audio';
import type { DrawDb } from '../core/db';
import type { Settings } from '../core/settings';
import { go, type Route } from '../router';

export interface ScreenDeps {
  settings: Settings;
  saveSettings(s: Settings): void;
  speak: typeof speak;
  /** 아이 이름 (첫 실행 때 입력). 없으면 null. */
  childName: string | null;
  /** 이름을 저장하고 childName을 갱신한다. */
  saveName(name: string): void;
  /** 다음 화면이 그려진 직후 말할 문장. */
  announce: string | null;
  /** 개발용 테스트 모드 (npm run dev:test). 부모 메뉴 한 번 눌러 열기. */
  testMode: boolean;
  /** 색칠 진행과 그림첩 저장소 */
  db: DrawDb;
}

export type Cleanup = () => void;

type Child = Node | string;

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = '',
  children: Child[] = [],
  attrs: Record<string, string> = {},
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

export function button(
  content: Child | Child[],
  onClick: () => void,
  cls = '',
  attrs: Record<string, string> = {},
): HTMLButtonElement {
  const b = el('button', `btn ${cls}`.trim(), Array.isArray(content) ? content : [content], {
    type: 'button',
    ...attrs,
  });
  b.addEventListener('click', onClick);
  return b;
}

/** 화면 위쪽 아이콘 버튼 줄: 🏠, back이 주어지면 ⬅, 그리고 덧붙일 것들. */
export function topBar(back: Route | null, ...extra: HTMLElement[]): HTMLElement {
  const items = [button('🏠', () => go({ name: 'home' }), 'icon-btn', { 'aria-label': '처음으로' })];
  if (back) items.push(button('⬅', () => go(back), 'icon-btn', { 'aria-label': '뒤로' }));
  return el('nav', 'topbar', [...items, el('span', 'topbar-gap'), ...extra]);
}

function hasBatchim(word: string): boolean {
  const code = word.charCodeAt(word.length - 1);
  if (!(code >= 0xac00 && code <= 0xd7a3)) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** 부르는 말: 받침 있으면 "아", 없으면 "야" (한글이 아니면 그대로). */
export function callName(name: string): string {
  const code = name.charCodeAt(name.length - 1);
  if (!(code >= 0xac00 && code <= 0xd7a3)) return name;
  return `${name}${hasBatchim(name) ? '아' : '야'}`;
}

export function say(deps: ScreenDeps, text: string): Promise<void> {
  return Promise.resolve(deps.speak(text, { lang: 'ko-KR', volume: deps.settings.volume }));
}

/** 정리 함수가 한꺼번에 지울 수 있는 setTimeout 모음. */
export function timers() {
  const ids = new Set<ReturnType<typeof setTimeout>>();
  return {
    after(ms: number, fn: () => void) {
      const id = setTimeout(() => {
        ids.delete(id);
        fn();
      }, ms);
      ids.add(id);
    },
    clear() {
      ids.forEach(clearTimeout);
      ids.clear();
    },
  };
}
