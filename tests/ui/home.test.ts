import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '../../src/ui/home';
import { makeDeps, ptr } from '../helpers';

let root: HTMLElement;
let cleanup: () => void = () => {};
beforeEach(() => {
  root = document.createElement('div');
  document.body.append(root);
  location.hash = '#/';
});
afterEach(() => {
  cleanup();
  root.remove();
  vi.useRealTimers();
});

const q = (id: string) => root.querySelector<HTMLElement>(`[data-testid=${id}]`)!;

describe('home', () => {
  it('shows the child name in the title', () => {
    cleanup = render(root, { name: 'home' }, makeDeps({ childName: '민지' }));
    expect(root.querySelector('h1')!.textContent).toBe('민지의 그림 놀이');
  });

  it.each([
    ['go-color', '#/color'],
    ['go-trace', '#/trace'],
    ['go-gallery', '#/gallery'],
  ])('%s goes to %s', (id, hash) => {
    cleanup = render(root, { name: 'home' }, makeDeps());
    q(id).click();
    expect(location.hash).toBe(hash);
  });

  it('opens the parent menu after a 3 second hold', () => {
    vi.useFakeTimers();
    cleanup = render(root, { name: 'home' }, makeDeps());
    ptr(q('parent-lock'), 'pointerdown');
    vi.advanceTimersByTime(2900);
    expect(location.hash).toBe('#/');
    vi.advanceTimersByTime(200);
    expect(location.hash).toBe('#/parent');
  });

  it('a single tap does not open the parent menu', () => {
    cleanup = render(root, { name: 'home' }, makeDeps());
    q('parent-lock').click();
    expect(location.hash).toBe('#/');
  });
});
