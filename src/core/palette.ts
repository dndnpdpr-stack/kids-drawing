export interface PaletteColor {
  id: string;
  hex: string;
  name: string;
}

export const PALETTE: readonly PaletteColor[] = [
  { id: 'red', hex: '#ff595e', name: '빨강' },
  { id: 'orange', hex: '#ff924c', name: '주황' },
  { id: 'yellow', hex: '#ffca3a', name: '노랑' },
  { id: 'green', hex: '#8ac926', name: '초록' },
  { id: 'blue', hex: '#1982c4', name: '파랑' },
  { id: 'purple', hex: '#6a4c93', name: '보라' },
  { id: 'pink', hex: '#ff8fab', name: '분홍' },
  { id: 'brown', hex: '#a0522d', name: '갈색' },
  { id: 'black', hex: '#333333', name: '검정' },
  { id: 'white', hex: '#ffffff', name: '흰색' },
];
