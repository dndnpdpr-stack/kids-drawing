# 그림 더 늘리기 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 색칠 그림 24장, 따라 그리기 25개(여러 획 그림 6개 포함).
**Architecture:** 내용 파일 추가 + 따라 그리기 화면의 획별 색 구분. 엔진·저장 변경 없음.
**Tech Stack:** 기존 그대로 (Vite, TS, Vitest).
**Spec:** docs/superpowers/specs/2026-11-24-more-content-design.md

## Global Constraints
- 그림 좌표 0~100, 칸 path는 Z로 닫힘, 칸 개수는 단계 범위 안 (1: 4~6, 2: 7~10, 3: 10~15).
- PICTURES는 level 오름차순. 따라 그리기 점은 0~1, 이웃 간격 ≤ 0.25 (densify가 보장).
- 아이 화면에는 글자 대신 이모지.

## Review Focus
- 새 그림이 겹친 칸 때문에 안 보이는 칸이 없는지 (스크린샷으로 확인).
- 여러 획 항목의 짧은 획(눈 등)도 손가락으로 끝까지 따라가지는지 (점 ≥ 2, 길이 ≥ 0.06).
- 연결된 picture id가 모두 실제 색칠 그림인지.

---

### Task 1: 색칠 그림 12장 추가
**Files:** `src/content/pictures/{sun,icecream,umbrella,mushroom,boat,tree,snowman,turtle,train,castle,rabbit,owl}.ts`, `index.ts`, `tests/content/pictures.test.ts`
- [ ] 테스트: `PICTURES`가 24장, 새 id들의 level(쉬움 sun icecream umbrella mushroom / 중간 boat tree snowman turtle / 어려움 train castle rabbit owl). 실행 → FAIL.
- [ ] 그림 파일 작성. icecream·mushroom은 `OUTLINE` (한 획 따라 그리기용) 내보내기.
- [ ] 테스트 PASS, 스크린샷으로 모양 확인, 커밋.

### Task 2: 따라 그리기 12개 추가 + multi 묶음
**Files:** `src/content/tracing.ts`, `src/ui/tracePick.ts`, `tests/content/tracing.test.ts`, `tests/ui/trace.test.ts`
- [ ] 테스트: 25개 순서 `line:{hline,vline,zigzag,wave,stairs,loops}`, `shape:{circle,triangle,square,heart,star,diamond,moon}`, `picture:{fish,apple,house,balloon,icecream,mushroom}`, `multi:{face,sunM,flowerM,houseM,snowmanM,treeM}`; multi 항목은 획 ≥ 3; 연결 picture는 모두 존재; 고르기 화면 줄 4개. FAIL 확인.
- [ ] 구현. `TraceGroup`에 `'multi'`, GROUPS에 `✨`.
- [ ] PASS, 커밋.

### Task 3: 획별 색 구분
**Files:** `src/ui/trace.ts`, `tests/ui/trace.test.ts`
- [ ] 테스트: `strokeRole(i, state)` → `'done' | 'current' | 'future'` (done이면 모두 done). FAIL.
- [ ] 구현: 점선 색을 current는 진하게(#8f96b8), future는 연하게, done은 분홍 잉크.
- [ ] PASS, 전체 테스트, 스크린샷 확인, 커밋, README 개수 갱신.
