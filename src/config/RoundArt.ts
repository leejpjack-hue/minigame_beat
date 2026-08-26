/** One backdrop treatment per encounter; chapters retain their own locations. */
export const BACKGROUND_ASSETS = [
  'market', 'moon_gate', 'vermilion_court', 'zhao_garden',
  'border_wall', 'palace_approach', 'throne_hall',
] as const;

export type BackgroundAsset = typeof BACKGROUND_ASSETS[number];

export interface RoundArt {
  scene: BackgroundAsset;
  name: string;
  zoom: number;
  focus: number;
}

// The three approved concepts are locations along the journey, not competing
// global themes. Reframed views make later encounters feel like nearby areas.
export const ROUND_ART: readonly (readonly RoundArt[])[] = [
  [
    { scene: 'market', name: '燈火市集', zoom: 1, focus: 0.5 },
    { scene: 'moon_gate', name: '月下城門', zoom: 1, focus: 0.5 },
    { scene: 'vermilion_court', name: '朱門外街', zoom: 1, focus: 0.5 },
    { scene: 'market', name: '商坊後巷', zoom: 1.22, focus: 0.12 },
    { scene: 'moon_gate', name: '守將關口', zoom: 1.18, focus: 0.8 },
  ],
  [
    { scene: 'zhao_garden', name: '趙府前庭', zoom: 1, focus: 0.5 },
    { scene: 'zhao_garden', name: '府外迴廊', zoom: 1.12, focus: 0.3 },
    { scene: 'zhao_garden', name: '竹影密會', zoom: 1.24, focus: 0.08 },
    { scene: 'zhao_garden', name: '侯府內院', zoom: 1.18, focus: 0.9 },
    { scene: 'zhao_garden', name: '雙衛伏擊', zoom: 1.26, focus: 0.58 },
  ],
  [
    { scene: 'border_wall', name: '長城邊哨', zoom: 1, focus: 0.5 },
    { scene: 'border_wall', name: '騎軍營前', zoom: 1.2, focus: 0.08 },
    { scene: 'moon_gate', name: '叛軍關隘', zoom: 1.22, focus: 0.15 },
    { scene: 'border_wall', name: '烽火高臺', zoom: 1.2, focus: 0.92 },
    { scene: 'border_wall', name: '邊關決戰', zoom: 1.1, focus: 0.5 },
  ],
  [
    { scene: 'palace_approach', name: '禁軍前殿', zoom: 1, focus: 0.5 },
    { scene: 'vermilion_court', name: '相府宮門', zoom: 1.1, focus: 0.6 },
    { scene: 'palace_approach', name: '暗影長廊', zoom: 1.24, focus: 0.05 },
    { scene: 'palace_approach', name: '燕使前庭', zoom: 1.18, focus: 0.95 },
    { scene: 'palace_approach', name: '王翦鎮門', zoom: 1.08, focus: 0.5 },
  ],
  [
    { scene: 'throne_hall', name: '大殿禁衛', zoom: 1, focus: 0.5 },
    { scene: 'palace_approach', name: '御前兵陣', zoom: 1.14, focus: 0.35 },
    { scene: 'throne_hall', name: '群雄再會', zoom: 1.2, focus: 0.1 },
    { scene: 'throne_hall', name: '權臣末路', zoom: 1.2, focus: 0.9 },
    { scene: 'throne_hall', name: '王座決戰', zoom: 1.1, focus: 0.5 },
  ],
];

export const backgroundKey = (asset: BackgroundAsset): string => `round_bg_${asset}`;

export function getRoundArt(stageIndex: number, waveIndex: number): RoundArt {
  return ROUND_ART[stageIndex]?.[waveIndex] ?? ROUND_ART[0][0];
}
