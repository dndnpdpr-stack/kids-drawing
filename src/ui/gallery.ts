import { getPicture } from '../content/pictures';
import { go, type Route } from '../router';
import { button, el, say, topBar, type Cleanup, type ScreenDeps } from './dom';

/** 내 그림첩: 완성한 그림 격자 (gallery), 한 장 크게 보기 (galleryView). 아이 화면이라 지우기는 없다. */
export function render(root: HTMLElement, route: Route, deps: ScreenDeps): Cleanup {
  let alive = true;
  const urls: string[] = [];
  const urlOf = (b: Blob) => {
    const u = URL.createObjectURL(b);
    urls.push(u);
    return u;
  };
  const cleanup = () => {
    alive = false;
    urls.forEach((u) => URL.revokeObjectURL(u));
  };

  if (route.name === 'galleryView') {
    const body = el('div', 'gallery-view');
    root.append(el('section', 'screen gallery', [topBar({ name: 'gallery' }), body]));
    void deps.db.getGallery(route.id).then((item) => {
      if (!alive) return;
      if (!item) {
        go({ name: 'gallery' }, { replace: true });
        return;
      }
      const picture = getPicture(item.pictureId);
      body.append(el('img', 'gallery-big', [], { src: urlOf(item.image), alt: picture?.name ?? '' }));
      if (picture) {
        body.append(
          button(['🎨'], () => go({ name: 'color', picture: picture.id }), 'color-again', {
            'data-testid': 'color-again',
            'aria-label': '또 칠하기',
          }),
        );
        void say(deps, `${picture.name} 그림이야!`);
      }
    });
    return cleanup;
  }

  const grid = el('div', 'gallery-grid');
  root.append(el('section', 'screen gallery', [topBar(null, el('span', 'screen-title', ['📒'])), grid]));
  void deps.db.listGallery().then((list) => {
    if (!alive) return;
    if (list.length === 0) {
      grid.classList.add('empty');
      grid.append(
        button([el('span', 'mode-emoji', ['🎨'])], () => go({ name: 'colorPick' }), 'gallery-empty', {
          'data-testid': 'gallery-empty',
          'aria-label': '색칠하러 가기',
        }),
      );
      void say(deps, '아직 그림이 없어. 색칠하러 가자!');
      return;
    }
    for (const item of list) {
      grid.append(
        button([el('img', '', [], { src: urlOf(item.image), alt: '' })], () => go({ name: 'galleryView', id: item.id }), 'gallery-card', {
          'data-testid': 'gallery-item',
          'aria-label': getPicture(item.pictureId)?.name ?? '그림',
        }),
      );
    }
    void say(deps, '내 그림첩이야!');
  });
  return cleanup;
}
