import { go, type Route } from '../router';
import { attachLongPress } from './longPress';
import { button, callName, el, say, type Cleanup, type ScreenDeps } from './dom';

export const APP_NAME = '그림 놀이';

export function render(root: HTMLElement, _route: Route, deps: ScreenDeps): Cleanup {
  let leaving = false;
  const goOnce = (r: Route) => () => {
    if (leaving) return;
    leaving = true;
    go(r);
  };

  const card = (emoji: string, label: string, r: Route, id: string, cls: string) =>
    button([el('span', 'mode-emoji', [emoji]), el('span', 'mode-label', [label])], goOnce(r), `mode-card ${cls}`, {
      'data-testid': id,
      'aria-label': label,
    });

  // 평소엔 3초 길게 눌러야 열린다. 테스트 모드에서는 한 번 눌러도 바로 연다.
  const lock = button('🔒', () => deps.testMode && go({ name: 'parent' }), 'icon-btn parent-btn', {
    'data-testid': 'parent-lock',
    'aria-label': '부모',
  });
  const detach = attachLongPress(lock, 3000, () => go({ name: 'parent' }));

  root.append(
    el('section', 'screen home', [
      el('div', 'home-top', [
        el('span'),
        ...(deps.testMode ? [el('div', 'test-badge', ['🧪 테스트'], { 'data-testid': 'test-badge' })] : []),
        lock,
      ]),
      el('h1', 'app-title', [deps.childName ? `${deps.childName}의 ${APP_NAME}` : APP_NAME]),
      el('div', 'mode-list', [
        card('🎨', '색칠하기', { name: 'colorPick' }, 'go-color', 'mode-color'),
        card('✏️', '따라 그리기', { name: 'tracePick' }, 'go-trace', 'mode-trace'),
        card('📄', '그림판', { name: 'color', picture: 'blank' }, 'go-paper', 'mode-paper'),
      ]),
      card('📒', '그림첩', { name: 'gallery' }, 'go-gallery', 'mode-gallery'),
    ]),
  );
  if (!deps.announce && deps.childName) void say(deps, `${callName(deps.childName)}, 뭐 하고 놀까?`);

  return () => detach();
}
