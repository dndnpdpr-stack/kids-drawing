/** 칸 하나. 닫힌 path, 좌표 0~100 (viewBox 0 0 100 100). */
export interface Region {
  id: string;
  d: string;
}

/**
 * 색칠 그림. regions는 그리는 순서(뒤 → 앞)다. 나중 칸이 앞 칸 위에 겹쳐 그려지고,
 * 칠하지 않은 칸은 흰색으로 그려서 아래 칸을 가린다. 누른 곳은 가장 앞 칸이 받는다.
 */
export interface Picture {
  id: string;
  name: string;
  emoji: string;
  level: 1 | 2 | 3;
  regions: Region[];
  /**
   * 덧그림 선 (수염, 바퀴 축 등). 칸에 속하지 않고 맨 위에 그린다.
   * 칸의 테두리는 따로 적지 않는다: 칸마다 자기 차례에 테두리를 그려서 위 칸이 가린다.
   */
  lines: string[];
}

export const BG: Region = { id: 'bg', d: 'M0 0H100V100H0Z' };

/** 동그라미 path (두 반원 호) */
export function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy}A${r} ${r} 0 1 1 ${cx + r} ${cy}A${r} ${r} 0 1 1 ${cx - r} ${cy}Z`;
}

/** 타원 path */
export function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  return `M${cx - rx} ${cy}A${rx} ${ry} 0 1 1 ${cx + rx} ${cy}A${rx} ${ry} 0 1 1 ${cx - rx} ${cy}Z`;
}

/** 꼭짓점 목록 → 닫힌 다각형 path */
export function poly(pts: [number, number][]): string {
  return `M${pts.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
}
