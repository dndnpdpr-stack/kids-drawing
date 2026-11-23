# 그림 놀이 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 4~6세용 색칠하기 · 따라 그리기 · 내 그림첩 웹앱을 만들고 Android APK로 포장한다.

**Architecture:** kids-learning과 같은 구조 (해시 라우터 + 화면별 `render(root, route, deps) → cleanup`, 프레임워크 없음). 그림은 0~100 좌표의 SVG path 데이터(칸 = 닫힌 path, 선 = 윤곽 path). 색칠 상태는 **동작 목록**(채우기 / 붓 한 획)으로 저장하고, 그 목록을 캔버스에 다시 그려 화면·썸네일·그림첩 이미지를 만든다. 선은 캔버스 위에 겹친 SVG라 항상 색 위에 보인다. 진행 상태와 그림첩은 IndexedDB.

**Tech Stack:** Vite 8, TypeScript 7, Vitest 4 (jsdom) + fake-indexeddb, vite-plugin-pwa, Capacitor 8 (`@capacitor/android`, `@capacitor/app`, `@capacitor-community/text-to-speech`), `@fontsource/jua`, `@fontsource/noto-sans-kr`.

**Spec:** `docs/superpowers/specs/2026-11-23-kids-drawing-design.md`

**Reference project (read-only):** `D:\myproject\kids-learning` — "복사" 라고 적힌 파일은 거기서 가져와 이 앱에 맞게 고친다.

## Global Constraints

- 앱 이름 `그림 놀이`, appId `com.family.kidsDrawing`, 첫 화면 제목 `○○의 그림 놀이`.
- localStorage 키 접두어 `kidsdraw.` (예: `kidsdraw.profile.v1`, `kidsdraw.settings.v1`), IndexedDB 이름 `kidsdraw`.
- 별·점수·잠금 없음. 모든 그림은 처음부터 열려 있다.
- 터치 영역 최소 64px (`--touch: 64px`). 휴대폰 세로·가로, 태블릿.
- 틀림 표시·경고음 없음. 아이 화면에 "전부 지우기" 없음.
- 외부 전송 없음. 첫 실행 후 오프라인 동작.
- 팔레트 10색 순서 고정: 빨강 `#ff595e`, 주황 `#ff924c`, 노랑 `#ffca3a`, 초록 `#8ac926`, 파랑 `#1982c4`, 보라 `#6a4c93`, 분홍 `#ff8fab`, 갈색 `#a0522d`, 검정 `#333333`, 흰색 `#ffffff`.
- 붓 굵기 = 그림 한 변의 4% (0~100 좌표에서 `4`). 되돌리기 최소 20단계 (동작 목록이라 제한 없음).
- 부모 메뉴: 🔒 3초 길게 누르기. 테스트 모드(`npm run dev:test`)에선 한 번 누르기.
- Android 뒤로 가기: 이전 화면, 첫 화면에서는 아무것도 안 함.
- 화면 글자는 아이용 화면에서 Jua, 부모 메뉴는 Noto Sans KR (kids-learning과 같음).

## Review Focus

1. **붓을 칸 밖으로 끌고 나감** → 색은 처음 댄 칸 경계에서 잘리고, 손을 뗄 때까지 다른 칸에 칠해지지 않는다. (Task 3 테스트 `brush stroke stays in its starting region`, Task 6 테스트 `pointer leaving region keeps painting the start region`)
2. **두 손가락 / 손바닥 동시 터치** → 첫 포인터만 쓴다. 두 번째 포인터는 무시하고, 첫 포인터가 끝나면 다시 받는다. (Task 6 테스트 `second pointer is ignored while drawing`)
3. **칸이 아닌 곳(선 위, 그림 바깥)을 누름** → 아무 일 없음, 오류 없음. (Task 6 테스트 `tap outside any region does nothing`)
4. **IndexedDB를 못 쓰는 환경(사생활 보호 모드 등)이나 깨진 저장 데이터** → 앱은 정상으로 뜨고 그냥 저장이 안 될 뿐. (Task 4 테스트 `load returns empty on corrupt record`, `db unavailable resolves to empty`)
5. **화면 회전 / 창 크기 바뀜 중 색칠** → 칠한 내용이 그대로 다시 그려진다 (동작 목록 좌표가 0~100이라 크기와 무관). (Task 6 테스트 `resize re-renders from ops`)

---

## File Structure

```
index.html, package.json, tsconfig.json, vite.config.ts, capacitor.config.ts, .env.playtest
public/icon-192.png, icon-512.png
scripts/build-apk.mjs, gen-icons.mjs, check-precache.mjs        (복사, 이름만 수정)
src/
  main.ts            부팅, 화면 표, deps
  router.ts          Route 타입, parseRoute/toHash/go/startRouter
  styles.css         토큰 + 공통 (복사 후 이 앱 화면 스타일 추가)
  core/
    audio.ts nativeTts.ts offline.ts profile.ts devFlags.ts   (복사)
    settings.ts      볼륨 { volume } — kidsdraw.settings.v1
    trace.ts         (복사) 체크포인트 진행 로직
    palette.ts       PALETTE 10색
    coloring.ts      동작 목록 상태: 채우기, 붓, 되돌리기, 화면용 계산, 완성 여부
    db.ts            IndexedDB: 그림별 진행, 그림첩
    paint.ts         동작 목록 → 캔버스 그리기, 칸 찾기(hit test), PNG 만들기
    backButton.ts    Android 뒤로 가기
  content/
    pictures/        색칠 그림 한 장당 한 파일 (apple.ts …) + index.ts
    tracing.ts       따라 그리기 13개 (체크포인트 + 연결 그림 id)
  ui/
    dom.ts celebrate.ts longPress.ts setup.ts   (복사, ScreenDeps 수정)
    home.ts          첫 화면
    colorPick.ts     색칠 그림 고르기
    color.ts         색칠 화면
    tracePick.ts     따라 그리기 고르기
    trace.ts         따라 그리기 화면
    gallery.ts       내 그림첩 (격자 + 크게 보기)
    parent.ts        부모 메뉴
tests/ (src와 같은 구조)
```

---

### Task 1: 프로젝트 뼈대, 첫 화면, 이름 묻기

**Files:**
- Create: 위 File Structure의 루트 설정 파일 전부, `src/main.ts`, `src/router.ts`, `src/styles.css`, `src/core/{audio,nativeTts,offline,profile,devFlags,settings}.ts`, `src/ui/{dom,celebrate,longPress,setup,home}.ts`, `public/icon-*.png`, `scripts/*.mjs`
- Test: `tests/router.test.ts`, `tests/core/settings.test.ts`, `tests/ui/home.test.ts`, 그리고 복사한 core 모듈의 kids-learning 테스트(`audio`, `offline`, `profile`, `devFlags`) 복사본

**Interfaces:**
- Produces:
  - `type Route = {name:'home'} | {name:'setup'} | {name:'parent'} | {name:'colorPick'} | {name:'color'; picture: string} | {name:'tracePick'} | {name:'trace'; item: string} | {name:'gallery'} | {name:'galleryView'; id: string}`
  - 해시: `#/`, `#/setup`, `#/parent`, `#/color`, `#/color/<pictureId>`, `#/trace`, `#/trace/<itemId>`, `#/gallery`, `#/gallery/<id>`. 모르는 해시는 `home`.
  - `parseRoute(hash: string): Route`, `toHash(r: Route): string`, `go(r: Route, opts?: {replace?: boolean}): void`, `startRouter(onRoute): () => void` (kids-learning과 같은 동작)
  - `interface Settings { volume: number }`, `loadSettings(storage?): Settings`, `saveSettings(s, storage?)` — 키 `kidsdraw.settings.v1`, 기본 `{volume: 1}`, 0~1 밖이면 기본값
  - `interface ScreenDeps { settings: Settings; saveSettings(s: Settings): void; speak: typeof speak; childName: string | null; saveName(name: string): void; announce: string | null; testMode: boolean; db: DrawDb }` (`DrawDb`는 Task 4. 이 Task에선 `db` 필드 없이 시작하고 Task 4에서 추가)
  - `say(deps, text)` → `deps.speak(text, {lang:'ko-KR', volume: deps.settings.volume})`
  - `topBar(back: Route | null, ...extra)` — 🏠(홈) + back이 있으면 ⬅
  - `APP_NAME = '그림 놀이'`

- [ ] **Step 1:** kids-learning에서 `package.json`(name `kids-drawing`, 같은 scripts·버전, dependencies에 `@capacitor/app`, devDependencies에 `fake-indexeddb` 추가, `@capacitor/ios` 제거), `tsconfig.json`, `index.html`(title `그림 놀이`), `vite.config.ts`(manifest name/short_name `그림 놀이`), `capacitor.config.ts`(appId `com.family.kidsDrawing`, appName `그림 놀이`), `.env.playtest`, `scripts/*.mjs`, `public/icon-*.png` 복사. `npm install`.
- [ ] **Step 2:** core 모듈 복사: `audio`, `nativeTts`, `offline`, `devFlags`, `profile`(키 `kidsdraw.profile.v1`). 해당 kids-learning 테스트도 복사(키 이름만 수정). `npm test` → PASS.
- [ ] **Step 3: failing tests 작성**
  - `tests/router.test.ts`: 위 해시 9개 각각 `parseRoute(toHash(r))`가 `r`와 같다; `parseRoute('#/nope')` → `{name:'home'}`; `parseRoute('#/color/')` → `{name:'colorPick'}`.
  - `tests/core/settings.test.ts`: 빈 저장소 → `{volume:1}`; `{volume:0.4}` 저장 후 불러오기 → 0.4; `{volume:3}` 또는 깨진 JSON → `{volume:1}`.
  - `tests/ui/home.test.ts`: 이름 `민지`로 home 그리면 제목 `민지의 그림 놀이`; `[data-testid=go-color]`, `go-trace`, `go-gallery` 버튼이 있고 누르면 `location.hash`가 각각 `#/color`, `#/trace`, `#/gallery`; 🔒 `[data-testid=parent-lock]`를 3초 누르면 `#/parent` (fake timers).
- [ ] **Step 4:** 실행 → FAIL.
- [ ] **Step 5:** `router.ts`, `settings.ts`, `ui/dom.ts`(위 ScreenDeps, kids-learning의 학습 전용 함수 `hasBatchim/objectJosa/callName/shake`는 `callName`만 남김), `celebrate.ts`, `longPress.ts`, `setup.ts`(제목 `그림 놀이`, 마스코트 `🎨 🖍️ ✏️`), `home.ts`, `main.ts` 구현. 아직 없는 화면은 `main.ts`의 SCREENS에서 홈으로 보내는 임시 render를 둔다. `styles.css`는 kids-learning의 `:root` 토큰, 공통 버튼·topbar·setup·celebrate 스타일만 가져온다.
  - 홈 화면: 🎨 색칠하기 카드가 가장 크고(세로면 위, 가로면 왼쪽), ✏️ 따라 그리기, 📒 그림첩. 들어오면 `"○○아, 뭐 하고 놀까?"` 음성 (`callName`).
- [ ] **Step 6:** `npm test` → PASS, `npm run build` → 성공, `npm run dev`로 홈이 뜨는지 확인.
- [ ] **Step 7: Commit** — `feat: app shell, router, home and name setup (copied base from kids-learning)`

---

### Task 2: 색칠 그림 데이터 형식 + 쉬운 그림 6장

**Files:**
- Create: `src/content/pictures/index.ts`, `src/content/pictures/{apple,balloon,heart,star,fish,house}.ts`, `src/core/palette.ts`
- Test: `tests/content/pictures.test.ts`

**Interfaces:**
- Produces:
  - `interface Region { id: string; d: string }` — 닫힌 path, 좌표 0~100 (viewBox `0 0 100 100`)
  - `interface Picture { id: string; name: string; emoji: string; level: 1 | 2 | 3; regions: Region[]; lines: string[] }` — `lines`는 윤곽 path들 (선 굵기는 그릴 때 `2.2`, 둥근 끝/이음)
  - `PICTURES: Picture[]` (level 순), `getPicture(id: string): Picture | undefined`
  - `PALETTE: readonly {id: string; hex: string; name: string}[]` — Global Constraints의 10색, id `red, orange, yellow, green, blue, purple, pink, brown, black, white`

- [ ] **Step 1: failing test** `tests/content/pictures.test.ts` — 모든 그림에 대해 (Task 3 그림이 추가되면 자동으로 함께 검사됨):
  - id가 서로 다르고, 각 그림 안의 region id도 서로 다르다
  - 모든 region `d`가 `Z`/`z`로 끝난다 (닫힌 path)
  - `d`와 `lines`의 숫자 좌표가 전부 0~100 안
  - 칸 개수가 level 범위 안: level 1 → 4~6, level 2 → 7~10, level 3 → 10~15
  - 이 Task 끝에서: `PICTURES.map(p=>p.id)`에 `apple, balloon, heart, star, fish, house`가 있고 전부 level 1
  - `PALETTE.length === 10`, 순서대로 hex가 Global Constraints 값과 같다
- [ ] **Step 2:** 실행 → FAIL.
- [ ] **Step 3:** 그림 6장 작성. 기준:
  - 큰 둥근 모양, 칸끼리 맞닿게(빈틈 없이) 나누고 선이 칸 경계를 덮는다.
  - 가장 작은 칸도 대략 12×12 이상 (화면 300px 기준 손가락 하나).
  - 하트·별은 안쪽을 나눠 칸 4개 이상 (예: 하트 = 좌/우 반쪽 + 가운데 띠 + 반짝이, 별 = 가운데 오각형 + 꼭짓점 5개 중 일부 묶기). **바깥 윤곽은 Task 8의 따라 그리기 모양과 같아야 하므로** 하트·별·물고기·사과·집·풍선의 바깥 윤곽 좌표를 각 파일 상단에 `OUTLINE` 상수로 export 한다 (`export const OUTLINE: [number, number][]` — 윤곽을 따라가는 점 8~16개).
- [ ] **Step 4:** 브라우저 확인용 임시 화면 없이, `npm test` → PASS. 눈으로 보는 확인은 Task 6에서.
- [ ] **Step 5: Commit** — `feat(content): picture format, palette, six easy coloring pictures`

---

### Task 3: 색칠 상태 (동작 목록)

**Files:**
- Create: `src/core/coloring.ts`
- Test: `tests/core/coloring.test.ts`

**Interfaces:**
- Consumes: `Picture` (Task 2)
- Produces:
  - `type Pt = { x: number; y: number }` (0~100)
  - `type Op = { kind: 'fill'; region: string; color: string } | { kind: 'brush'; region: string; color: string; points: Pt[] }` (`color`는 hex)
  - `interface ColoringState { pictureId: string; ops: Op[] }`
  - `newColoring(pictureId): ColoringState`
  - `fill(s, region, color): ColoringState` — 같은 칸이 이미 같은 색 단색이고 그 뒤 붓 자국이 없으면 `s` 그대로 반환 (되돌리기 기록이 쌓이지 않게)
  - `addBrush(s, region, color, points): ColoringState` — 점 1개여도 기록(콕 찍기). 빈 배열이면 `s` 그대로
  - `undo(s): ColoringState` — 마지막 op 제거
  - `canUndo(s): boolean`
  - `interface RegionView { fill: string | null; brushes: { color: string; points: Pt[] }[] }`
  - `viewOf(s): Record<string, RegionView>` — 칸마다 마지막 fill 색, 그 fill **이후**의 붓 획들 (fill이 그 칸의 이전 붓 자국을 덮음)
  - `isComplete(s, picture): boolean` — 모든 칸이 fill 또는 붓 자국 1개 이상
  - `simplify(points: Pt[], minDist = 0.8): Pt[]` — 직전에 남긴 점과 거리 < minDist인 점 버림, 마지막 점은 항상 유지
  - `isColoringState(v: unknown): v is ColoringState` — 저장 데이터 검증

- [ ] **Step 1: failing tests**
  - `fill then undo returns to empty`; `undo on empty is no-op`, `canUndo` false
  - `refill same color adds no op`; 다른 색이면 op 추가
  - `fill hides earlier brushes in that region only`: 칸 a에 붓, 칸 b에 붓, a에 fill → `viewOf().a.brushes` 빈 배열, `b.brushes` 길이 1
  - `brush after fill shows on top`: a fill 빨강 → a 붓 파랑 → `a.fill==='#ff595e'`, `a.brushes[0].color==='#1982c4'`
  - `brush stroke stays in its starting region`: `addBrush(s,'a',c,pts)`의 op.region은 'a' (점이 다른 칸 좌표여도 그대로 a에 귀속 — 잘라내기는 그릴 때)
  - `25 ops can all be undone one by one`
  - `isComplete` — 6칸 그림에서 5칸 fill → false, 남은 칸에 붓 1획 → true
  - `simplify` — `[(0,0),(0.1,0),(0.5,0),(2,0)]` → `[(0,0),(2,0)]`; 점 1개는 그대로.
  - `isColoringState` — 정상 객체 true; `ops`에 모르는 kind, 숫자 아닌 좌표, `null` → false
- [ ] **Step 2:** FAIL 확인. **Step 3:** 구현 (순수 함수, 불변). **Step 4:** PASS.
- [ ] **Step 5: Commit** — `feat(core): coloring state as an op list with fill, brush and undo`

---

### Task 4: 저장소 (IndexedDB)

**Files:**
- Create: `src/core/db.ts`
- Modify: `src/ui/dom.ts` (ScreenDeps에 `db: DrawDb`), `src/main.ts` (`openDrawDb()` 연결)
- Test: `tests/core/db.test.ts` (`import 'fake-indexeddb/auto'`)

**Interfaces:**
- Consumes: `ColoringState`, `isColoringState` (Task 3)
- Produces:
  - `interface GalleryItem { id: string; pictureId: string; createdAt: number; image: Blob }`
  - `interface DrawDb { loadProgress(pictureId): Promise<ColoringState | null>; saveProgress(s: ColoringState): Promise<void>; clearProgress(pictureId): Promise<void>; allProgress(): Promise<ColoringState[]>; addGallery(pictureId: string, image: Blob): Promise<GalleryItem>; listGallery(): Promise<GalleryItem[]>  /* 최신 먼저 */; getGallery(id): Promise<GalleryItem | null>; deleteGallery(id): Promise<void>; clearAll(): Promise<void> }`
  - `openDrawDb(factory?: IDBFactory | null): Promise<DrawDb>` — DB 이름 `kidsdraw`, 버전 1, store `progress`(key `pictureId`), `gallery`(key `id`, index `createdAt`). factory가 없거나 열기 실패면 **메모리 없는 빈 구현**(읽기 빈 값, 쓰기 무시)을 돌려준다 — 절대 reject 하지 않는다.
  - 그림첩 id는 `crypto.randomUUID()`.

- [ ] **Step 1: failing tests**
  - `progress round-trips`; `clearProgress removes`; `allProgress lists saved`
  - `load returns empty on corrupt record`: store에 `{pictureId:'apple', ops:'x'}` 직접 넣으면 `loadProgress('apple')` → `null`
  - `gallery newest first`: 세 개 추가(createdAt 다르게, `Date.now` 모킹) → `listGallery` 역순
  - `deleteGallery`, `getGallery` unknown → `null`
  - `clearAll` 후 progress·gallery 둘 다 빈 값
  - `db unavailable resolves to empty`: `openDrawDb(null)` → `listGallery()`가 `[]`, `saveProgress` 오류 없음
- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS. `npm run build` 성공.
- [ ] **Step 5: Commit** — `feat(core): IndexedDB storage for coloring progress and gallery`

---

### Task 5: 나머지 색칠 그림 6장

**Files:**
- Create: `src/content/pictures/{flower,car,cat,butterfly,dino,rocket}.ts`
- Modify: `src/content/pictures/index.ts`
- Test: `tests/content/pictures.test.ts` (추가 단언)

- [ ] **Step 1: test 추가** — `PICTURES.length === 12`; flower·car·cat level 2, butterfly·dino·rocket level 3; `PICTURES`가 level 오름차순.
- [ ] **Step 2:** FAIL. **Step 3:** Task 2와 같은 기준으로 그림 작성 (level 2: 7~10칸, level 3: 10~15칸, 가장 작은 칸 약 10×10 이상). **Step 4:** PASS.
- [ ] **Step 5: Commit** — `feat(content): six more coloring pictures (flower, car, cat, butterfly, dinosaur, rocket)`

(Task 3·4와 독립이라 순서를 바꿔도 된다.)

---

### Task 6: 그리기 엔진 + 색칠 화면 + 고르기 화면

**Files:**
- Create: `src/core/paint.ts`, `src/ui/colorPick.ts`, `src/ui/color.ts`
- Modify: `src/main.ts` (SCREENS), `src/styles.css`
- Test: `tests/core/paint.test.ts`, `tests/ui/color.test.ts`

**Interfaces:**
- Consumes: Task 2·3·4 전부, `celebrate`, `say`
- Produces:
  - `paint.ts`:
    - `drawColoring(ctx: CanvasRenderingContext2D, picture: Picture, view: Record<string, RegionView>, size: number, opts?: { lines?: boolean }): void` — 흰 바탕 → 칸마다 fill(`Path2D(d)`, 100→size 스케일) → 칸마다 `save; clip(Path2D); 붓 획(lineWidth 4, round cap/join); restore` → `opts.lines`면 윤곽선(lineWidth 2.2, `#333`)
    - `drawBrushSegment(ctx, picture, region, color, from: Pt, to: Pt, size): void` — 진행 중 획을 한 마디씩 (clip 포함)
    - `type HitTest = (p: Pt) => string | null`
    - `makeHitTest(ctx: CanvasRenderingContext2D, picture: Picture): HitTest` — `isPointInPath`, **뒤에 있는 칸부터** 검사 (나중에 그린 칸이 위)
    - `exportPng(picture, state, size = 1024): Promise<Blob>` — `OffscreenCanvas` 또는 임시 canvas에 `drawColoring(..., {lines:true})`
    - `renderThumb(picture, state | null, size = 240): HTMLCanvasElement`
  - `color.ts`의 render는 테스트용으로 `deps`에 더해 선택 인자 `hitTest?: HitTest`를 받을 수 있다 (jsdom엔 캔버스가 없음; 없으면 `makeHitTest`). 캔버스 `getContext`가 `null`이어도 화면은 오류 없이 뜬다.
- 화면 동작 (color):
  - 레이아웃: topBar(⬅ = colorPick) + 오른쪽 ↩️ `[data-testid=undo]`, ✅ `[data-testid=done]`; 정사각형 그림 영역(캔버스 + 그 위에 `pointer-events:none` 선 SVG); 팔레트 `[data-testid=swatch-<id>]` 10개 + 모드 토글 `[data-testid=mode]` (👆 ↔ 🖌️). 세로면 팔레트 아래, 가로면 오른쪽 (`@media (orientation: landscape)`).
  - 처음 색: 빨강, 모드: 채우기. 들어오면 `db.loadProgress`로 이어 칠하기, `"<그림 이름> 색칠하자!"` 음성.
  - 채우기 모드: pointerup 지점 hitTest → `fill` → 다시 그리기 + 그 칸 "뽁" 효과(CSS 애니메이션 클래스, 선 SVG의 해당 칸 path에).
  - 붓 모드: pointerdown 지점 hitTest로 칸 고정 → pointermove마다 `drawBrushSegment` → pointerup에 `addBrush(simplify(points))`. 칸 밖에서 시작하면 무시.
  - 첫 포인터만 받는다 (`pointerId` 기억, 다른 포인터 무시, `pointercancel`은 그 획을 버린다).
  - 상태가 바뀔 때마다 `db.saveProgress` (붓은 pointerup 때), 연속 호출은 300ms 디바운스, 화면을 떠날 때(cleanup) 남은 저장을 즉시 실행.
  - `isComplete`가 되면 ✅에 `ready` 클래스(반짝임). ✅는 언제든 누를 수 있다.
  - ✅ 누르면: `exportPng` → `db.addGallery` → `db.clearProgress` → `celebrate(big, mascot = picture.emoji)` + `"우와, 멋진 <이름>!"` → `CELEBRATE_BIG_MS` 후 `#/gallery/<새 id>`. ops가 비어 있으면 ✅는 아무것도 안 한다.
  - 창 크기 바뀌면 캔버스 크기 다시 잡고 `drawColoring`으로 전체 다시 그림.
- 화면 동작 (colorPick): topBar(홈) + 12장 썸네일 버튼 `[data-testid=pick-<id>]` (level 순, `db.allProgress`로 칠하던 상태 반영), 누르면 `#/color/<id>`. 들어오면 `"어떤 그림을 칠할까?"`.

- [ ] **Step 1: failing tests** (`tests/ui/color.test.ts`, `fake-indexeddb`, 가짜 hitTest: x<50 → 첫 칸, 아니면 둘째 칸; y>95 → null)
  - `tap fills region with selected color`: 파랑 스와치 누르고 (20,20) 탭 → 잠시 후 `db.loadProgress`의 ops = `[{kind:'fill', region: <첫칸>, color:'#1982c4'}]`
  - `tap outside any region does nothing`: (20,99) 탭 → ops 비어 있음, 오류 없음
  - `undo removes last op`
  - `pointer leaving region keeps painting the start region`: 붓 모드, (20,20) down → (80,20) move → up → op.region = 첫 칸
  - `second pointer is ignored while drawing`: pointerId 1 down, pointerId 2 down/move/up, 1 up → op 1개
  - `progress resumes`: 저장된 상태로 들어오면 undo 가능 상태(`[data-testid=undo]`가 disabled 아님)
  - `done saves to gallery and clears progress`: fill 한 번 → ✅ → `listGallery().length===1`, `loadProgress`는 null, hash `#/gallery/<id>` (fake timers; `exportPng`는 `vi.mock`으로 빈 Blob)
  - `done with no ops does nothing`
  - `resize re-renders from ops`: `drawColoring`을 spy, `window.dispatchEvent(new Event('resize'))` → 최신 view로 다시 호출됨
  - `tests/core/paint.test.ts`: `makeHitTest`가 가짜 ctx(`isPointInPath`를 칸별로 true 지정)에서 겹치는 두 칸 중 **나중 칸** id를 돌려준다; 아무 칸도 아니면 null.
- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS.
- [ ] **Step 5: 브라우저 확인** — `npm run dev`, 12장 모두 열어 채우기·붓·되돌리기, 붓이 칸 밖으로 안 나가는지, 휴대폰 크기(DevTools 360×740 세로·가로)에서 가장 작은 칸이 손가락으로 눌리는지 눈으로 본다. 너무 작은 칸은 그림 데이터를 고친다.
- [ ] **Step 6: Commit** — `feat(color): coloring screen with tap-fill, clipped brush, undo, autosave; picture picker`

---

### Task 7: 내 그림첩

**Files:**
- Create: `src/ui/gallery.ts`
- Modify: `src/main.ts`, `src/styles.css`
- Test: `tests/ui/gallery.test.ts`

**Interfaces:**
- Consumes: `DrawDb.listGallery/getGallery` (Task 4), `getPicture`
- Produces: `render` for `gallery`, `galleryView` routes

- 동작: `gallery` — topBar(홈), 그림첩 격자 `[data-testid=gallery-item]`(최신 먼저, `URL.createObjectURL(image)`의 `<img>`), 누르면 `#/gallery/<id>`. 비어 있으면 큰 🎨 버튼(`#/color`)과 `"아직 그림이 없어. 색칠하러 가자!"`. `galleryView` — topBar(⬅ = gallery) + 큰 그림 + 🎨 `[data-testid=color-again]`(같은 그림 새로 칠하기 → `#/color/<pictureId>`). 없는 id면 `gallery`로 replace. cleanup에서 object URL 해제. 아이 화면엔 삭제 버튼 없음.

- [ ] **Step 1: failing tests** — 3개 저장 → 격자 3개, 첫 번째가 최신; 빈 그림첩 → 빈 안내 버튼; `#/gallery/unknown` → hash가 `#/gallery`; view에서 `color-again` → `#/color/<pictureId>`; 그림첩 화면에 `[data-testid*=delete]` 없음.
- [ ] **Step 2:** FAIL. **Step 3:** 구현 (jsdom에 `URL.createObjectURL` 없으면 테스트에서 stub). **Step 4:** PASS.
- [ ] **Step 5: Commit** — `feat(gallery): my gallery grid and full view`

---

### Task 8: 따라 그리기

**Files:**
- Create: `src/core/trace.ts` (kids-learning 복사, `getStrokes`·`STROKES` 의존 제거), `src/content/tracing.ts`, `src/ui/tracePick.ts`, `src/ui/trace.ts`
- Modify: `src/main.ts`, `src/styles.css`
- Test: `tests/core/trace.test.ts` (kids-learning 복사본에서 `getStrokes` 부분 제거), `tests/content/tracing.test.ts`, `tests/ui/trace.test.ts`

**Interfaces:**
- Consumes: `OUTLINE` exports (Task 2), `getPicture`, `celebrate`
- Produces:
  - trace.ts: `Pt`(0~1), `Stroke`, `TraceState`, `TRACE_TOLERANCE = 0.12`, `newTrace`, `advanceTrace`, `endStroke` — kids-learning과 같은 시그니처·동작
  - `type TraceGroup = 'line' | 'shape' | 'picture'`
  - `interface TraceItem { id: string; name: string; emoji: string; group: TraceGroup; strokes: Stroke[]; picture?: string }`
  - `TRACE_ITEMS: TraceItem[]`, `getTraceItem(id)`, `nextTraceItem(id): TraceItem` (마지막 다음은 첫 번째)
- 항목 13개 (id / group / picture):
  - line: `hline`, `vline`, `zigzag`, `wave`
  - shape: `circle`, `triangle`, `square`, `heart`→`heart`, `star`→`star`
  - picture: `fish`→`fish`, `apple`→`apple`, `house`→`house`, `balloon`→`balloon`
- 연결 있는 항목의 strokes는 그 그림의 `OUTLINE`(0~100)을 0.1~0.9 범위로 옮긴 것에서 만든다 (`OUTLINE` 좌표 `v` → `0.1 + v * 0.008`). 집처럼 한 번에 그리기 어려운 모양은 OUTLINE을 2~3획으로 나눠도 된다 (그때 `OUTLINE`을 `[number,number][][]`로 바꾸지 말고 tracing.ts에서 인덱스로 나눈다).
- 화면 (trace): kids-learning `src/ui/trace.ts`의 캔버스 그리기를 가져온다 (점선 가이드, 시작점 반짝임, 지나간 부분 진한 분홍 `#ff8fab`). 완료되면 `celebrate(big)` + `"잘 그렸어!"` → 버튼 ▶️ `[data-testid=next]`(→ 다음 항목) 와, `picture`가 있으면 🎨 `[data-testid=to-color]`(→ `#/color/<picture>`). 들어오면 `"<이름> 따라 그려 보자"`.
- 화면 (tracePick): 묶음 세 줄(선 / 도형 / 그림), 항목 버튼 `[data-testid=trace-<id>]`.

- [ ] **Step 1: failing tests**
  - tracing: 13개, id 중복 없음; 모든 점이 0~1 안; 획마다 점 2개 이상, 이웃 점 거리 ≤ 0.25 (허용 거리 0.12로 끊김 없이 따라가지게); `picture` 있는 항목 = `heart, star, fish, apple, house, balloon` 정확히, 그 id가 `getPicture`로 존재
  - trace 화면: `advanceTrace`를 전 체크포인트 순서대로 지나가도록 pointer 이벤트를 쏘면 `[data-testid=next]`가 보인다; `heart`면 `to-color`가 있고 `hline`이면 없다; `to-color` → `#/color/heart`; `nextTraceItem('balloon').id === 'hline'`
- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS.
- [ ] **Step 5: 브라우저 확인** — 13개 모두 손가락(마우스)으로 끝까지 따라 그려지는지, 연결 그림의 윤곽과 모양이 같은지.
- [ ] **Step 6: Commit** — `feat(trace): tracing lines, shapes and pictures with a jump to coloring`

---

### Task 9: 부모 메뉴

**Files:**
- Create: `src/ui/parent.ts`
- Modify: `src/main.ts`, `src/styles.css`
- Test: `tests/ui/parent.test.ts`

- 동작 (어른용, Noto Sans KR, 글자 사용): 볼륨 슬라이더 `[data-testid=volume]`(0~1, 바꾸면 `saveSettings`); 아이 이름 바꾸기(kids-learning과 같은 폼, `NAME_MAX` 검증); 그림첩 목록 — 작은 썸네일마다 `삭제` `[data-testid=delete-<id>]`, 한 번 누르면 `한 번 더 누르면 지워져요`로 바뀌고 3초 안에 다시 누르면 `deleteGallery`, 3초 지나면 원래대로; `모든 기록 초기화` `[data-testid=reset]` — 같은 두 번 누르기 방식, `db.clearAll()` (이름과 볼륨은 유지).
- [ ] **Step 1: failing tests** — 볼륨 0.3으로 바꾸면 `loadSettings().volume===0.3`; delete 한 번 → 그대로, 두 번 → 목록에서 빠짐; 한 번 누르고 3초 경과 후 다시 한 번 → 아직 안 지워짐; reset 두 번 → `listGallery()`, `allProgress()` 빈 값, `loadChildName()`은 그대로.
- [ ] **Step 2:** FAIL. **Step 3:** 구현. **Step 4:** PASS.
- [ ] **Step 5: Commit** — `feat(parent): volume, name, gallery delete and reset behind the lock`

---

### Task 10: Android — 뒤로 가기, APK, README

**Files:**
- Create: `src/core/backButton.ts`, `README.md`
- Modify: `src/main.ts`
- Test: `tests/core/backButton.test.ts`

**Interfaces:**
- Produces: `handleBack(current: Route, history: { back(): void }): 'back' | 'ignore'` — `home`이면 `'ignore'`(아무것도 안 함), `setup`도 `'ignore'`, 그 외는 `history.back()` 호출 후 `'back'`. `installBackButton(getRoute: () => Route): void` — 네이티브일 때만 `App.addListener('backButton', …)`; 브라우저에서는 아무것도 안 함. `exitApp`은 어디서도 부르지 않는다.
- [ ] **Step 1: failing tests** — home → `'ignore'`, back 호출 안 됨; color → `'back'`, back 1회 호출.
- [ ] **Step 2:** FAIL. **Step 3:** 구현, `main.ts`에서 현재 route를 기억해 연결. **Step 4:** PASS.
- [ ] **Step 5:** README 작성 (kids-learning README 형식: 무엇을 하나, 실행하기, APK 만들기(JDK 21, `npx cap add android` 한 번, `npm run apk`), 홈 버튼까지 막고 싶으면 Android **화면 고정**(설정 → 보안 → 앱 고정) 안내, 기술, 폴더).
- [ ] **Step 6:** `npm test` 전체 PASS → `npm run build` → `npm run check:precache` → `npx cap add android` → `npm run apk` → APK 생성 확인 (`android/app/build/outputs/apk/debug/app-debug.apk`).
- [ ] **Step 7: Commit** — `feat(android): back button never exits the app; README with build steps`
