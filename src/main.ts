import '@fontsource/jua';
// 부모 메뉴(어른용 화면)는 읽기 편한 고딕체를 쓴다.
import '@fontsource/noto-sans-kr/400.css';
import '@fontsource/noto-sans-kr/700.css';
import './styles.css';
import { Capacitor } from '@capacitor/core';
import { speak, stopSpeaking } from './core/audio';
import { installAutoFullscreen } from './core/fullscreen';
import { captureInstallPrompt } from './core/install';
import { installBackButton } from './core/backButton';
import { lazyDrawDb, openDrawDb } from './core/db';
import { isTestMode } from './core/devFlags';
import { useNativeTtsInApp } from './core/nativeTts';
import { setupOffline } from './core/offline';
import { loadChildName, saveChildName } from './core/profile';
import { loadSettings, saveSettings } from './core/settings';
import { startRouter, type Route } from './router';
import { say, type Cleanup, type ScreenDeps } from './ui/dom';
import * as color from './ui/color';
import * as colorPick from './ui/colorPick';
import * as gallery from './ui/gallery';
import * as home from './ui/home';
import * as parent from './ui/parent';
import * as setup from './ui/setup';
import * as trace from './ui/trace';
import * as tracePick from './ui/tracePick';

type Screen = (root: HTMLElement, route: Route, deps: ScreenDeps) => Cleanup;

const SCREENS: Record<Route['name'], Screen> = {
  home: home.render,
  setup: setup.render,
  parent: parent.render,
  colorPick: colorPick.render,
  color: (root, route, deps) => color.render(root, route, deps),
  tracePick: tracePick.render,
  trace: trace.render,
  gallery: gallery.render,
  galleryView: gallery.render,
};

function boot(root: HTMLElement): void {
  useNativeTtsInApp();
  void setupOffline({
    isNative: Capacitor.isNativePlatform(),
    sw: 'serviceWorker' in navigator ? navigator.serviceWorker : undefined,
    caches: 'caches' in window ? window.caches : undefined,
    reload: () => location.reload(),
  }).catch(() => {});
  // 저장소가 늦게 열려도 화면은 바로 뜬다.
  const db = lazyDrawDb(openDrawDb());
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
  let current: Route = { name: 'home' };
  installBackButton(() => current);
  captureInstallPrompt(window);
  // 폰 브라우저: 처음 누를 때 전체화면 (부모 메뉴에서는 다시 켜지 않음)
  installAutoFullscreen(document, { isNative: Capacitor.isNativePlatform(), skip: () => current.name === 'parent' });
  startRouter((route) => {
    cleanup();
    stopSpeaking();
    root.replaceChildren();
    // 이름이 없으면(첫 실행) 어떤 주소로 들어와도 이름 입력 화면을 먼저 보여 준다.
    const r: Route = deps.childName ? route : { name: 'setup' };
    current = r;
    cleanup = SCREENS[r.name](root, r, deps);
    const text = deps.announce;
    deps.announce = null;
    if (text) void say(deps, text);
  });
}

const root = document.getElementById('app');
if (root) boot(root);
