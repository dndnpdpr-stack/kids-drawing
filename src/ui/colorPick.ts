import { PICTURES } from '../content/pictures';
import { renderThumb } from '../core/paint';
import { go, type Route } from '../router';
import { button, el, say, topBar, type Cleanup, type ScreenDeps } from './dom';

/** 색칠할 그림 고르기. 칠하던 그림은 칠한 모습으로 보인다. */
export function render(root: HTMLElement, _route: Route, deps: ScreenDeps): Cleanup {
  let alive = true;
  const slots = new Map<string, HTMLButtonElement>();
  const grid = el(
    'div',
    'pick-grid',
    PICTURES.map((p) => {
      const b = button([renderThumb(p, null)], () => go({ name: 'color', picture: p.id }), `pick-card level-${p.level}`, {
        'data-testid': `pick-${p.id}`,
        'aria-label': p.name,
      });
      slots.set(p.id, b);
      return b;
    }),
  );
  root.append(el('section', 'screen color-pick', [topBar(null, el('span', 'screen-title', ['🎨'])), grid]));
  void say(deps, '어떤 그림을 칠할까?');

  void deps.db.allProgress().then((all) => {
    if (!alive) return;
    for (const s of all) {
      const p = PICTURES.find((x) => x.id === s.pictureId);
      const slot = slots.get(s.pictureId);
      if (p && slot && s.ops.length > 0) slot.replaceChildren(renderThumb(p, s));
    }
  });

  return () => {
    alive = false;
  };
}
