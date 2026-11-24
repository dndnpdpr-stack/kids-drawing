# 따라 그리기 색 고르기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 따라 그리기 화면에 9색 팔레트를 넣고, 획마다 그때 고른 색이 남게 한다.

**Architecture:** `src/ui/trace.ts`만 바꾼다. 팔레트는 `PALETTE`에서 흰색을 뺀 것. 다 그린 획의 색은 화면 안 배열에 고정(`lockInks`), 지금 그리는 획은 현재 색. 고른 색은 모듈 변수라 ▶️ 다음 항목에도 유지.

**Tech Stack:** Vite + TS, Vitest/jsdom.

**Spec:** `docs/superpowers/specs/2026-11-24-trace-palette-design.md`

## Global Constraints
- 흰색 제외 9색, 처음 색 분홍 `#ff8fab`.
- 판정 로직(`advanceTrace`/`endStroke`), 점선 안내, 색칠 화면은 그대로.

## Review Focus
- 그리는 도중 색 바꾸기 → 지금 획만 새 색, 다 그린 획은 그대로 (lockInks 테스트).
- 다 그린 뒤(state.done) 색 바꾸기 → 이미 그린 그림 색이 바뀌지 않음 (lockInks가 done이면 전체 고정).
- 가로 화면에서 팔레트가 캔버스를 밀어내지 않음 (스크린샷 확인).

---

### Task 1: 팔레트 + 획별 색

**Files:**
- Modify: `src/ui/trace.ts`, `src/styles.css`
- Test: `tests/ui/trace.test.ts`

**Interfaces:**
- Produces: `export const TRACE_INKS: readonly PaletteColor[]` (PALETTE − white), `export function lockInks(inks: string[], doneCount: number, ink: string): string[]` (doneCount 미만 칸 중 빈 칸만 ink로 채운 새 배열).

- [ ] **Step 1: 실패하는 테스트**
  - `TRACE_INKS` 9개, white 없음.
  - `lockInks([], 1, R)` → `[R]`; `lockInks([R], 2, B)` → `[R, B]`; `lockInks([R], 1, B)` → `[R]`.
  - 화면: `trace-swatch-*` 버튼 9개, 처음엔 `trace-swatch-pink`에 `selected`. `trace-swatch-blue` 누르면 blue만 selected. 다음 항목 열어도 blue selected (afterEach에서 pink로 되돌림).
- [ ] **Step 2:** `npx vitest run tests/ui/trace.test.ts` → FAIL (export 없음)
- [ ] **Step 3:** 구현. 화면 구조 `topBar, area, palette(.trace-palette > .swatch…), actions`. draw에서 다 그린 획 i는 `inks[i]`, 지금 획은 `ink`. `feed`/`onUp` 뒤 `inks = lockInks(inks, doneCount, ink)` (doneCount = done ? strokes.length : strokeIndex).
- [ ] **Step 4:** `npm test` → 전부 PASS, `npx tsc --noEmit` 오류 없음
- [ ] **Step 5:** 세로·가로 스크린샷으로 배치 확인 후 commit
