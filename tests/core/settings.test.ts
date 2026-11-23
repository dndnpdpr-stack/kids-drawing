import { describe, expect, it } from 'vitest';
import { loadSettings, saveSettings, SETTINGS_KEY } from '../../src/core/settings';

function mem(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k) => m.get(k) ?? null,
    setItem: (k, v) => void m.set(k, v),
    removeItem: (k) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    get length() {
      return m.size;
    },
  };
}

describe('settings', () => {
  it('uses the kidsdraw key', () => expect(SETTINGS_KEY).toBe('kidsdraw.settings.v1'));
  it('defaults to full volume', () => expect(loadSettings(mem())).toEqual({ volume: 1 }));
  it('round-trips', () => {
    const s = mem();
    saveSettings({ volume: 0.4 }, s);
    expect(loadSettings(s).volume).toBe(0.4);
  });
  it('rejects out-of-range or broken data', () => {
    const s = mem();
    s.setItem(SETTINGS_KEY, JSON.stringify({ volume: 3 }));
    expect(loadSettings(s)).toEqual({ volume: 1 });
    s.setItem(SETTINGS_KEY, '{oops');
    expect(loadSettings(s)).toEqual({ volume: 1 });
  });
});
