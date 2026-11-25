export type Pt = { x: number; y: number }; // 0~1 정규화 좌표 (왼쪽 위 원점, y 아래로)
export interface Stroke {
  points: Pt[]; // 체크포인트
}
export interface TraceState {
  strokeIndex: number;
  pointIndex: number;
  done: boolean;
}

/** 손가락이 선에서 이만큼(화면 폭 비율)까지 벗어나도 그린 걸로 친다. 아이 손가락 굵기 기준. */
export const TRACE_TOLERANCE = 0.17;
/** 손가락이 빨리 지나가 놓친 체크포인트를 몇 개까지 건너뛰어 줄지 */
const LOOKAHEAD = 1;

export function newTrace(): TraceState {
  return { strokeIndex: 0, pointIndex: 0, done: false };
}

/**
 * 손가락 위치 p로 지금 획을 앞으로 보낸다. 다음 체크포인트(또는 그다음 하나)가 허용 거리 안이면
 * 거기까지 지나가고, 손가락 근처 체크포인트는 한 번에 여러 개 지나간다. 획 끝에서 멈춘다.
 */
export function advanceTrace(s: TraceState, strokes: Stroke[], p: Pt): TraceState {
  if (s.done) return s;
  const pts = strokes[s.strokeIndex]?.points;
  if (!pts) return s;
  let pointIndex = s.pointIndex;
  while (pointIndex < pts.length) {
    let hit = -1;
    for (let j = pointIndex; j <= Math.min(pointIndex + LOOKAHEAD, pts.length - 1); j++) {
      if (Math.hypot(p.x - pts[j].x, p.y - pts[j].y) <= TRACE_TOLERANCE) hit = j;
    }
    if (hit < 0) break;
    pointIndex = hit + 1;
  }
  if (pointIndex === s.pointIndex) return s;
  if (pointIndex < pts.length) return { ...s, pointIndex };
  const strokeIndex = s.strokeIndex + 1;
  return { strokeIndex, pointIndex: 0, done: strokeIndex >= strokes.length };
}

/** 손을 떼도 그린 데까지는 남긴다 (아이 손가락이 잠깐 떨어져도 처음부터 다시 하지 않게). */
export function endStroke(s: TraceState, _strokes: Stroke[]): TraceState {
  return s;
}
