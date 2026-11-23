export interface Settings {
  /** 음성 볼륨 0~1 */
  volume: number;
}

export const SETTINGS_KEY = 'kidsdraw.settings.v1';

function defaults(): Settings {
  return { volume: 1 };
}

function resolve(storage?: Storage | null): Storage | null {
  if (storage !== undefined) return storage;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadSettings(storage?: Storage | null): Settings {
  try {
    const raw = resolve(storage)?.getItem(SETTINGS_KEY);
    if (!raw) return defaults();
    const v: unknown = JSON.parse(raw);
    const volume = (v as { volume?: unknown } | null)?.volume;
    if (typeof volume !== 'number' || !(volume >= 0 && volume <= 1)) return defaults();
    return { volume };
  } catch {
    return defaults();
  }
}

export function saveSettings(s: Settings, storage?: Storage | null): void {
  try {
    resolve(storage)?.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch {
    // 저장 실패는 무시한다
  }
}
