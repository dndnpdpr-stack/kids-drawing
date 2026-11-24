import { TRACE_ITEMS, type TraceGroup, type TraceItem } from '../content/tracing';
import { go, type Route } from '../router';
import { button, el, say, topBar, type Cleanup, type ScreenDeps } from './dom';

const SVG_NS = 'http://www.w3.org/2000/svg';
const GROUPS: { id: TraceGroup; label: string }[] = [
  { id: 'line', label: '〰️' },
  { id: 'shape', label: '🔺' },
  { id: 'picture', label: '🖼️' },
  { id: 'multi', label: '✨' },
];

/** 획 모양을 작은 그림으로 */
function preview(item: TraceItem): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 1 1');
  svg.setAttribute('class', 'trace-thumb');
  svg.setAttribute('aria-hidden', 'true');
  for (const s of item.strokes) {
    const pl = document.createElementNS(SVG_NS, 'polyline');
    pl.setAttribute('points', s.points.map((p) => `${p.x},${p.y}`).join(' '));
    svg.append(pl);
  }
  return svg;
}

/** 따라 그리기 고르기: 선 / 도형 / 그림 / 여러 획 그림 네 줄 (잠금 없음) */
export function render(root: HTMLElement, _route: Route, deps: ScreenDeps): Cleanup {
  const rows = GROUPS.map((g) =>
    el('div', 'trace-row', [
      el('span', 'trace-row-label', [g.label]),
      el(
        'div',
        'trace-row-items',
        TRACE_ITEMS.filter((t) => t.group === g.id).map((t) =>
          button([preview(t)], () => go({ name: 'trace', item: t.id }), 'trace-card', {
            'data-testid': `trace-${t.id}`,
            'aria-label': t.name,
          }),
        ),
      ),
    ]),
  );
  root.append(el('section', 'screen trace-pick', [topBar(null, el('span', 'screen-title', ['✏️'])), el('div', 'trace-rows', rows)]));
  void say(deps, '무엇을 따라 그릴까?');
  return () => {};
}
