export const ComboInput = {
  Up: 'U',
  Down: 'D',
  Left: 'L',
  Right: 'R',
  Attack: 'A',
  Heavy: 'K',
  Jump: 'J',
  Defend: 'S',
} as const;

export type ComboInputType = (typeof ComboInput)[keyof typeof ComboInput];
