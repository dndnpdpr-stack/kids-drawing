export type Route =
  | { name: 'home' }
  | { name: 'setup' }
  | { name: 'parent' }
  | { name: 'colorPick' }
  | { name: 'color'; picture: string }
  | { name: 'tracePick' }
  | { name: 'trace'; item: string }
  | { name: 'gallery' }
  | { name: 'galleryView'; id: string };

export function parseRoute(hash: string): Route {
  const parts = hash.replace(/^#?\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  const [a, b] = parts;
  if (parts.length === 1) {
    if (a === 'setup') return { name: 'setup' };
    if (a === 'parent') return { name: 'parent' };
    if (a === 'color') return { name: 'colorPick' };
    if (a === 'trace') return { name: 'tracePick' };
    if (a === 'gallery') return { name: 'gallery' };
  }
  if (parts.length === 2) {
    if (a === 'color') return { name: 'color', picture: b };
    if (a === 'trace') return { name: 'trace', item: b };
    if (a === 'gallery') return { name: 'galleryView', id: b };
  }
  return { name: 'home' };
}

export function toHash(r: Route): string {
  switch (r.name) {
    case 'home':
      return '#/';
    case 'setup':
      return '#/setup';
    case 'parent':
      return '#/parent';
    case 'colorPick':
      return '#/color';
    case 'color':
      return `#/color/${encodeURIComponent(r.picture)}`;
    case 'tracePick':
      return '#/trace';
    case 'trace':
      return `#/trace/${encodeURIComponent(r.item)}`;
    case 'gallery':
      return '#/gallery';
    case 'galleryView':
      return `#/gallery/${encodeURIComponent(r.id)}`;
  }
}

let activeHandler: (() => void) | null = null;

export function go(r: Route, opts?: { replace?: boolean }): void {
  const hash = toHash(r);
  if (opts?.replace && location.hash !== hash) {
    // 리다이렉트는 기록을 쌓지 않는다(뒤로 가기 버튼이 되돌아오지 않게).
    location.replace(hash);
    return;
  }
  if (location.hash === hash) {
    // 주소가 같으면 hashchange가 오지 않는다. 직접 다시 그린다.
    activeHandler?.();
    return;
  }
  location.hash = hash;
}

/** 해시가 바뀔 때마다(그리고 처음 한 번) onRoute를 부른다. 리스너 해제 함수를 돌려준다. */
export function startRouter(onRoute: (r: Route) => void): () => void {
  const handler = () => onRoute(parseRoute(location.hash));
  activeHandler = handler;
  window.addEventListener('hashchange', handler);
  handler();
  return () => {
    window.removeEventListener('hashchange', handler);
    if (activeHandler === handler) activeHandler = null;
  };
}
