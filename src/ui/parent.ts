import { getPicture } from '../content/pictures';
import { NAME_MAX, normalizeName } from '../core/profile';
import type { GalleryItem } from '../core/db';
import type { Route } from '../router';
import { button, el, say, timers, topBar, type Cleanup, type ScreenDeps } from './dom';

const CONFIRM_MS = 3000;
const RESET_LABEL = '모든 그림 기록 지우기';
const DELETE_LABEL = '삭제';
const CONFIRM_LABEL = '한 번 더 누르면 지워져요';

/**
 * 두 번 눌러야 실행되는 버튼. 첫 번째 누름 뒤 3초 안에 다시 눌러야 한다.
 * 반환: 버튼과, 남은 확인 타이머를 지우는 함수.
 */
function confirmButton(label: string, onConfirm: () => void, cls: string, testid: string) {
  const t = timers();
  let armed = false;
  const reset = () => {
    armed = false;
    b.textContent = label;
    b.classList.remove('armed');
  };
  const b = button(
    label,
    () => {
      if (!armed) {
        armed = true;
        b.textContent = CONFIRM_LABEL;
        b.classList.add('armed');
        t.after(CONFIRM_MS, reset);
        return;
      }
      t.clear();
      reset();
      onConfirm();
    },
    cls,
    { 'data-testid': testid },
  );
  return { b, clear: () => t.clear() };
}

/** 부모용 화면. 어른이 읽는 화면이라 글자를 쓴다. */
export function render(root: HTMLElement, _route: Route, deps: ScreenDeps): Cleanup {
  let alive = true;
  const clears: (() => void)[] = [];
  const urls: string[] = [];

  // 볼륨
  const slider = el('input', 'volume-slider', [], {
    type: 'range',
    min: '0',
    max: '1',
    step: '0.1',
    'aria-label': '볼륨',
    'data-testid': 'volume',
  });
  slider.value = String(deps.settings.volume);
  slider.addEventListener('change', () => {
    deps.saveSettings({ ...deps.settings, volume: Number(slider.value) });
    void say(deps, '안녕!');
  });

  // 이름
  const nameInput = el('input', 'parent-name', [], {
    type: 'text',
    maxlength: String(NAME_MAX),
    'aria-label': '아이 이름',
    'data-testid': 'parent-name',
  });
  nameInput.value = deps.childName ?? '';
  const nameSave = button(
    '이름 저장',
    () => {
      const n = normalizeName(nameInput.value);
      if (!n) {
        nameInput.value = deps.childName ?? '';
        return;
      }
      deps.saveName(n);
      nameInput.value = n;
    },
    'name-save-btn',
    { 'data-testid': 'parent-name-save' },
  );

  // 그림첩 관리
  const list = el('div', 'parent-gallery');
  const count = el('p', 'parent-count');
  function showGallery(items: GalleryItem[]) {
    clears.splice(0).forEach((c) => c());
    urls.splice(0).forEach((u) => URL.revokeObjectURL(u));
    count.textContent = `그림첩: ${items.length}장`;
    list.replaceChildren(
      ...items.map((item) => {
        const url = URL.createObjectURL(item.image);
        urls.push(url);
        const del = confirmButton(DELETE_LABEL, () => void remove(item.id), 'delete-btn', `delete-${item.id}`);
        clears.push(del.clear);
        const when = new Date(item.createdAt).toLocaleDateString('ko-KR');
        return el('div', 'parent-gallery-item', [
          el('img', '', [], { src: url, alt: getPicture(item.pictureId)?.name ?? '' }),
          el('span', 'parent-gallery-date', [when]),
          del.b,
        ]);
      }),
    );
  }
  async function reload() {
    const items = await deps.db.listGallery();
    if (alive) showGallery(items);
  }
  async function remove(id: string) {
    await deps.db.deleteGallery(id);
    await reload();
  }

  const reset = confirmButton(
    RESET_LABEL,
    () =>
      void deps.db.clearAll().then(() => reload()),
    'reset-btn',
    'reset',
  );

  root.append(
    el('section', 'screen parent', [
      topBar(null, el('label', 'parent-volume', [el('span', 'parent-key', ['🔊 볼륨']), slider])),
      el('div', 'parent-panel', [
        el('label', 'parent-row parent-name-row', [el('span', 'parent-key', ['아이 이름']), nameInput, nameSave]),
        count,
        list,
        reset.b,
        el('p', 'parent-note', ['그림과 기록은 이 기기에만 저장돼요. 이름과 볼륨은 지워지지 않아요.']),
      ]),
    ]),
  );
  void reload();

  return () => {
    alive = false;
    reset.clear();
    clears.forEach((c) => c());
    urls.forEach((u) => URL.revokeObjectURL(u));
  };
}
