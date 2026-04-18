export const SceneKeys = {
  Boot: 'Boot',
  Menu: 'Menu',
  CharacterSelect: 'CharacterSelect',
  Stage: 'Stage',
  Victory: 'Victory',
} as const;

export type SceneKey = (typeof SceneKeys)[keyof typeof SceneKeys];
