import { BG, type Picture } from './types';

/** 하얀 도화지 (그림판). 칸은 배경 하나뿐이라 펜으로 자유롭게 그린다. 고르기 목록에는 없다. */
export const blank: Picture = { id: 'blank', name: '그림판', emoji: '📄', level: 1, regions: [BG], lines: [] };
