import { describe, expect, it, vi } from 'vitest';
import { handleBack } from '../../src/core/backButton';
import type { Route } from '../../src/router';

describe('handleBack', () => {
  it.each<Route>([{ name: 'home' }, { name: 'setup' }])('ignores back on %j (never leaves the app)', (r) => {
    const history = { back: vi.fn() };
    expect(handleBack(r, history)).toBe('ignore');
    expect(history.back).not.toHaveBeenCalled();
  });

  it.each<Route>([{ name: 'color', picture: 'apple' }, { name: 'gallery' }, { name: 'parent' }])('goes back from %j', (r) => {
    const history = { back: vi.fn() };
    expect(handleBack(r, history)).toBe('back');
    expect(history.back).toHaveBeenCalledTimes(1);
  });
});
