export const CharacterState = {
  Idle: 'idle',
  Walk: 'walk',
  Jump: 'jump',
  Attack: 'attack',
  Hurt: 'hurt',
  Dead: 'dead',
  Block: 'block',
  Dash: 'dash',
} as const;

export type CharacterStateType = (typeof CharacterState)[keyof typeof CharacterState];
