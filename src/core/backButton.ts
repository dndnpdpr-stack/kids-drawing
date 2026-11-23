import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { Route } from '../router';

/**
 * Android 뒤로 가기 버튼. 앱 안에서는 이전 화면으로 가고,
 * 첫 화면(과 이름 입력)에서는 아무것도 하지 않는다 — 아이가 실수로 앱을 끄지 않게.
 */
export function handleBack(current: Route, history: { back(): void }): 'back' | 'ignore' {
  if (current.name === 'home' || current.name === 'setup') return 'ignore';
  history.back();
  return 'back';
}

/** 앱(Capacitor)에서만 연결한다. 브라우저에서는 아무것도 하지 않는다. */
export function installBackButton(getRoute: () => Route): void {
  if (!Capacitor.isNativePlatform()) return;
  void App.addListener('backButton', () => {
    handleBack(getRoute(), window.history);
  }).catch(() => {});
}
