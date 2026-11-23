import '@fontsource/jua';
// 부모 메뉴(어른용 화면)는 읽기 편한 고딕체를 쓴다.
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/700.css';
import './styles.css';
import { Capacitor } from '@capacitor/core';
import { speak, stopSpeaking } from './core/audio';
import { openDrawDb } from './core/db';
import { isTestMode } from './core/devFlags';
import { useNativeTtsInApp } from './core/nativeTts';
import { setupOffline } from './core/offline';
import { loadChildName, saveChildName } from './core/profile';
import { loadSettings, saveSettings } from './core/settings';
import { go, startRouter, type Route } from './router';
import { say, type Cleanup, type ScreenDeps } from './ui/dom';
import * as home from './ui/home';
import * as setup from './ui/setup';

type Screen = (root: HTMLElement, route: Route, deps: ScreenDeps) => Cleanup;

// 아직 만들지 않은 화면은 홈으로 보낸다.
const toHome: Screen = () => {
  go({ name: 'home' }, { replace: true });
  return () => {};
};

const SCREENS: Record<Route['name'], Screen> = {
  home: home.render,
  setup: setup.render,
  parent: toHome,
  colorPick: toHome,
  color: toHome,
  tracePick: toHome,
  trace: toHome,
  gallery: toHome,
  galleryView: toHome,
};

async function boot(root: HTMLElement): Promise<void> {
  useNativeTtsInApp();
  void setupOffline({
    isNative: Capacitor.isNativePlatform(),
    sw: 'serviceWorker' in navigator ? navigator.serviceWorker : undefined,
    caches: 'caches' in window ? window.caches : undefined,
    reload: () => location.reload(),
  }).catch(() => {});
  const db = await openDrawDb();
  const deps: ScreenDeps = {
    settings: loadSettings(),
    saveSettings: (s) => {
      deps.settings = s;
      saveSettings(s);
    },
    speak,
    childName: loadChildName(),
    saveName: (name) => {
      saveChildName(name);
      deps.childName = name;
    },
    announce: null,
    testMode: isTestMode(import.meta.env),
    db,
  };
  let cleanup: Cleanup = () => {};
  startRouter((route) => {
    cleanup();
    stopSpeaking();
    root.replaceChildren();
    // 이름이 없으면(첫 실행) 어떤 주소로 들어와도 이름 입력 화면을 먼저 보여 준다.
    const r: Route = deps.childName ? route : { name: 'setup' };
    cleanup = SCREENS[r.name](root, r, deps);
    const text = deps.announce;
    deps.announce = null;
    if (text) void say(deps, text);
  });
}

const root = document.getElementById('app');
if (root) void boot(root);
