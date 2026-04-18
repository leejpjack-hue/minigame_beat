import { FighterName, FighterNameType } from '../../enums/FighterName';

export interface MoveHitbox {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  hitstun: number;
  mpCost: number;
  // Hitbox active window as fraction of total animation frames (0..1)
  activeStart?: number;
  activeEnd?: number;
  // Optional flags
  projectile?: {
    speed: number;
    range: number;
    sprite?: string;
  };
  multiHit?: { hits: number; interval: number }; // interval in ms
  superArmor?: boolean;
  travel?: { distance: number; duration: number }; // for gap-closers
  teleportBehind?: boolean;
  selfBuff?: { atkMul: number; duration: number };
  fullscreen?: boolean;
}

export interface FighterMoveSet {
  // Light chain (3 hits)
  L1: MoveHitbox;
  L2: MoveHitbox;
  L3: MoveHitbox;
  // Heavy
  heavy: MoveHitbox;
  // Specials keyed by action string (matches PlayerCharacter.executeCombo)
  specials: Record<string, MoveHitbox>;
  // Animation frame totals (ms)
  lightFrames: number;
  heavyFrames: number;
  specialFrames: Record<string, number>;
}

// ---------- Project Shaolong ----------
const XiangShaoLongMoves: FighterMoveSet = {
  L1: { offsetX: 22, offsetY: -28, width: 34, height: 28, damage: 12, knockbackX: 180, knockbackY: 20, hitstun: 250, mpCost: 0, activeStart: 0.25, activeEnd: 0.6 },
  L2: { offsetX: 24, offsetY: -28, width: 38, height: 28, damage: 15, knockbackX: 220, knockbackY: 20, hitstun: 280, mpCost: 0, activeStart: 0.25, activeEnd: 0.6 },
  L3: { offsetX: 28, offsetY: -30, width: 46, height: 34, damage: 22, knockbackX: 320, knockbackY: 40, hitstun: 380, mpCost: 0, activeStart: 0.3, activeEnd: 0.65 },
  heavy: { offsetX: 20, offsetY: -28, width: 36, height: 30, damage: 28, knockbackX: 260, knockbackY: 30, hitstun: 420, mpCost: 0, activeStart: 0.35, activeEnd: 0.7 },
  specials: {
    flying_knee: { offsetX: 28, offsetY: -30, width: 50, height: 36, damage: 25, knockbackX: 380, knockbackY: 50, hitstun: 400, mpCost: 15, activeStart: 0.2, activeEnd: 0.8, travel: { distance: 120, duration: 260 } },
    uppercut: { offsetX: 18, offsetY: -48, width: 38, height: 54, damage: 30, knockbackX: 100, knockbackY: -220, hitstun: 450, mpCost: 25, activeStart: 0.2, activeEnd: 0.6 },
    sweep_stomp: { offsetX: 24, offsetY: -18, width: 56, height: 24, damage: 35, knockbackX: 450, knockbackY: 30, hitstun: 500, mpCost: 30, activeStart: 0.3, activeEnd: 0.8 },
    super: { offsetX: 26, offsetY: -30, width: 60, height: 40, damage: 10, knockbackX: 550, knockbackY: 60, hitstun: 700, mpCost: 60, activeStart: 0.1, activeEnd: 0.95, multiHit: { hits: 7, interval: 90 } },
  },
  lightFrames: 360,
  heavyFrames: 520,
  specialFrames: { flying_knee: 500, uppercut: 560, sweep_stomp: 620, super: 900 },
};

// ---------- Lian Jin ----------
const LianJinMoves: FighterMoveSet = {
  L1: { offsetX: 26, offsetY: -28, width: 42, height: 26, damage: 15, knockbackX: 200, knockbackY: 20, hitstun: 280, mpCost: 0, activeStart: 0.25, activeEnd: 0.55 },
  L2: { offsetX: 28, offsetY: -30, width: 46, height: 26, damage: 18, knockbackX: 240, knockbackY: 20, hitstun: 300, mpCost: 0, activeStart: 0.25, activeEnd: 0.55 },
  L3: { offsetX: 32, offsetY: -28, width: 54, height: 26, damage: 22, knockbackX: 420, knockbackY: 30, hitstun: 380, mpCost: 0, activeStart: 0.3, activeEnd: 0.6 },
  heavy: { offsetX: 24, offsetY: -34, width: 48, height: 44, damage: 30, knockbackX: 200, knockbackY: -80, hitstun: 450, mpCost: 0, activeStart: 0.35, activeEnd: 0.7 },
  specials: {
    phantom_step: { offsetX: 28, offsetY: -30, width: 52, height: 36, damage: 32, knockbackX: 500, knockbackY: 30, hitstun: 430, mpCost: 20, activeStart: 0.2, activeEnd: 0.7, travel: { distance: 150, duration: 180 } },
    sword_wave: { offsetX: 30, offsetY: -28, width: 32, height: 32, damage: 25, knockbackX: 350, knockbackY: 20, hitstun: 380, mpCost: 30, activeStart: 0.1, activeEnd: 0.9, projectile: { speed: 420, range: 300 } },
    counter: { offsetX: 24, offsetY: -30, width: 50, height: 34, damage: 40, knockbackX: 480, knockbackY: 60, hitstun: 500, mpCost: 15, activeStart: 0.15, activeEnd: 0.5 },
    super: { offsetX: 28, offsetY: -30, width: 58, height: 40, damage: 10, knockbackX: 600, knockbackY: 40, hitstun: 700, mpCost: 60, activeStart: 0.1, activeEnd: 0.95, multiHit: { hits: 10, interval: 70 } },
  },
  lightFrames: 320,
  heavyFrames: 540,
  specialFrames: { phantom_step: 420, sword_wave: 560, counter: 420, super: 900 },
};

// ---------- Wu Ting Fang ----------
const WuTingFangMoves: FighterMoveSet = {
  L1: { offsetX: 18, offsetY: -28, width: 30, height: 24, damage: 10, knockbackX: 160, knockbackY: 20, hitstun: 220, mpCost: 0, activeStart: 0.2, activeEnd: 0.55 },
  L2: { offsetX: 20, offsetY: -28, width: 32, height: 26, damage: 12, knockbackX: 180, knockbackY: 20, hitstun: 250, mpCost: 0, activeStart: 0.2, activeEnd: 0.55 },
  L3: { offsetX: 24, offsetY: -30, width: 42, height: 34, damage: 18, knockbackX: 280, knockbackY: 30, hitstun: 320, mpCost: 0, activeStart: 0.25, activeEnd: 0.65 },
  heavy: { offsetX: 22, offsetY: -30, width: 44, height: 36, damage: 22, knockbackX: 300, knockbackY: 30, hitstun: 360, mpCost: 0, activeStart: 0.3, activeEnd: 0.65 },
  specials: {
    air_dive: { offsetX: 20, offsetY: -20, width: 32, height: 40, damage: 20, knockbackX: 200, knockbackY: 100, hitstun: 350, mpCost: 0, activeStart: 0.1, activeEnd: 0.9 },
    pounce: { offsetX: 24, offsetY: -30, width: 44, height: 36, damage: 25, knockbackX: 360, knockbackY: 30, hitstun: 380, mpCost: 15, activeStart: 0.25, activeEnd: 0.75, travel: { distance: 140, duration: 260 } },
    whirl: { offsetX: 0, offsetY: -28, width: 72, height: 40, damage: 5, knockbackX: 260, knockbackY: 20, hitstun: 300, mpCost: 25, activeStart: 0.1, activeEnd: 0.95, multiHit: { hits: 6, interval: 80 } },
    super: { offsetX: 0, offsetY: -46, width: 72, height: 72, damage: 8, knockbackX: 100, knockbackY: -280, hitstun: 600, mpCost: 60, activeStart: 0.1, activeEnd: 0.95, multiHit: { hits: 7, interval: 80 } },
  },
  lightFrames: 280,
  heavyFrames: 400,
  specialFrames: { air_dive: 360, pounce: 480, whirl: 560, super: 820 },
};

// ---------- Shan Rou ----------
const ShanRouMoves: FighterMoveSet = {
  L1: { offsetX: 18, offsetY: -28, width: 28, height: 24, damage: 12, knockbackX: 160, knockbackY: 15, hitstun: 180, mpCost: 0, activeStart: 0.2, activeEnd: 0.5 },
  L2: { offsetX: 20, offsetY: -28, width: 30, height: 24, damage: 12, knockbackX: 160, knockbackY: 15, hitstun: 180, mpCost: 0, activeStart: 0.2, activeEnd: 0.5 },
  L3: { offsetX: 22, offsetY: -30, width: 36, height: 28, damage: 16, knockbackX: 220, knockbackY: 20, hitstun: 260, mpCost: 0, activeStart: 0.25, activeEnd: 0.55 },
  heavy: { offsetX: 22, offsetY: -30, width: 40, height: 32, damage: 20, knockbackX: 260, knockbackY: 20, hitstun: 340, mpCost: 0, activeStart: 0.25, activeEnd: 0.6 },
  specials: {
    backstab: { offsetX: -22, offsetY: -28, width: 38, height: 30, damage: 35, knockbackX: 200, knockbackY: 40, hitstun: 420, mpCost: 20, activeStart: 0.4, activeEnd: 0.75, teleportBehind: true },
    dagger_throw: { offsetX: 20, offsetY: -28, width: 18, height: 14, damage: 10, knockbackX: 140, knockbackY: 10, hitstun: 200, mpCost: 15, activeStart: 0.15, activeEnd: 0.95, multiHit: { hits: 3, interval: 110 }, projectile: { speed: 480, range: 280 } },
    bleed_combo: { offsetX: 24, offsetY: -28, width: 40, height: 30, damage: 4, knockbackX: 200, knockbackY: 20, hitstun: 280, mpCost: 25, activeStart: 0.1, activeEnd: 0.95, multiHit: { hits: 8, interval: 70 } },
    super: { offsetX: 0, offsetY: -28, width: 80, height: 48, damage: 9, knockbackX: 450, knockbackY: 30, hitstun: 700, mpCost: 60, activeStart: 0.05, activeEnd: 0.95, multiHit: { hits: 8, interval: 75 } },
  },
  lightFrames: 240,
  heavyFrames: 380,
  specialFrames: { backstab: 500, dagger_throw: 460, bleed_combo: 640, super: 820 },
};

// ---------- Ying Zheng ----------
const YingZhengMoves: FighterMoveSet = {
  L1: { offsetX: 22, offsetY: -30, width: 40, height: 32, damage: 18, knockbackX: 220, knockbackY: 20, hitstun: 320, mpCost: 0, activeStart: 0.35, activeEnd: 0.65 },
  L2: { offsetX: 24, offsetY: -30, width: 42, height: 32, damage: 22, knockbackX: 260, knockbackY: 20, hitstun: 350, mpCost: 0, activeStart: 0.35, activeEnd: 0.65 },
  L3: { offsetX: 28, offsetY: -34, width: 52, height: 38, damage: 30, knockbackX: 400, knockbackY: 60, hitstun: 480, mpCost: 0, activeStart: 0.4, activeEnd: 0.75 },
  heavy: { offsetX: 0, offsetY: -14, width: 100, height: 22, damage: 40, knockbackX: 280, knockbackY: 40, hitstun: 550, mpCost: 0, activeStart: 0.45, activeEnd: 0.8 },
  specials: {
    king_charge: { offsetX: 28, offsetY: -32, width: 50, height: 42, damage: 35, knockbackX: 500, knockbackY: 40, hitstun: 500, mpCost: 20, activeStart: 0.15, activeEnd: 0.9, travel: { distance: 160, duration: 320 }, superArmor: true },
    imperial_palm: { offsetX: 36, offsetY: -30, width: 80, height: 42, damage: 40, knockbackX: 550, knockbackY: 60, hitstun: 550, mpCost: 30, activeStart: 0.3, activeEnd: 0.85 },
    decree: { offsetX: 0, offsetY: -30, width: 1, height: 1, damage: 0, knockbackX: 0, knockbackY: 0, hitstun: 0, mpCost: 30, selfBuff: { atkMul: 1.5, duration: 5000 } },
    super: { offsetX: 0, offsetY: -30, width: 800, height: 200, damage: 90, knockbackX: 600, knockbackY: 60, hitstun: 900, mpCost: 70, activeStart: 0.35, activeEnd: 0.75, fullscreen: true },
  },
  lightFrames: 440,
  heavyFrames: 620,
  specialFrames: { king_charge: 540, imperial_palm: 620, decree: 500, super: 1000 },
};

export const FIGHTER_MOVES: Record<FighterNameType, FighterMoveSet> = {
  [FighterName.XiangShaoLong]: XiangShaoLongMoves,
  [FighterName.LianJin]: LianJinMoves,
  [FighterName.WuTingFang]: WuTingFangMoves,
  [FighterName.ShanRou]: ShanRouMoves,
  [FighterName.YingZheng]: YingZhengMoves,
};

export function getFighterMoves(fighterKey: string): FighterMoveSet | null {
  return (FIGHTER_MOVES as Record<string, FighterMoveSet>)[fighterKey] ?? null;
}
