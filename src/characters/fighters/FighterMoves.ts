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

// Shared lightweight stance buff for non-Ying fighters (↓↓L)
const STANCE_FOCUS: MoveHitbox = {
  offsetX: 0, offsetY: 0, width: 1, height: 1,
  damage: 0, knockbackX: 0, knockbackY: 0, hitstun: 0, mpCost: 15,
  selfBuff: { atkMul: 1.25, duration: 4000 },
};

// ---------- Project Shaolong — balanced, clean cancel windows ----------
const XiangShaoLongMoves: FighterMoveSet = {
  L1: { offsetX: 22, offsetY: -28, width: 36, height: 28, damage: 12, knockbackX: 160, knockbackY: 15, hitstun: 220, mpCost: 0, activeStart: 0.22, activeEnd: 0.55 },
  L2: { offsetX: 26, offsetY: -28, width: 40, height: 28, damage: 16, knockbackX: 200, knockbackY: 18, hitstun: 260, mpCost: 0, activeStart: 0.20, activeEnd: 0.58 },
  L3: { offsetX: 30, offsetY: -30, width: 48, height: 34, damage: 24, knockbackX: 340, knockbackY: 45, hitstun: 400, mpCost: 0, activeStart: 0.28, activeEnd: 0.68 },
  heavy: { offsetX: 22, offsetY: -28, width: 40, height: 32, damage: 30, knockbackX: 280, knockbackY: 35, hitstun: 440, mpCost: 0, activeStart: 0.32, activeEnd: 0.72 },
  specials: {
    flying_knee: { offsetX: 30, offsetY: -30, width: 52, height: 36, damage: 28, knockbackX: 400, knockbackY: 55, hitstun: 420, mpCost: 15, activeStart: 0.18, activeEnd: 0.78, travel: { distance: 130, duration: 240 } },
    uppercut: { offsetX: 18, offsetY: -50, width: 40, height: 56, damage: 32, knockbackX: 80, knockbackY: -240, hitstun: 480, mpCost: 22, activeStart: 0.18, activeEnd: 0.62 },
    sweep_stomp: { offsetX: 26, offsetY: -16, width: 60, height: 24, damage: 36, knockbackX: 480, knockbackY: 25, hitstun: 520, mpCost: 28, activeStart: 0.28, activeEnd: 0.78 },
    super: { offsetX: 28, offsetY: -30, width: 64, height: 42, damage: 12, knockbackX: 120, knockbackY: 30, hitstun: 120, mpCost: 60, activeStart: 0.08, activeEnd: 0.96, multiHit: { hits: 7, interval: 85 } },
    stance_focus: STANCE_FOCUS,
  },
  lightFrames: 340,
  heavyFrames: 500,
  specialFrames: { flying_knee: 480, uppercut: 540, sweep_stomp: 600, super: 880, stance_focus: 200 },
};

// ---------- Lian Jin — fast rushdown, sharp cancels ----------
const LianJinMoves: FighterMoveSet = {
  L1: { offsetX: 28, offsetY: -28, width: 44, height: 26, damage: 14, knockbackX: 170, knockbackY: 15, hitstun: 200, mpCost: 0, activeStart: 0.18, activeEnd: 0.50 },
  L2: { offsetX: 30, offsetY: -30, width: 48, height: 26, damage: 18, knockbackX: 210, knockbackY: 18, hitstun: 240, mpCost: 0, activeStart: 0.16, activeEnd: 0.52 },
  L3: { offsetX: 34, offsetY: -28, width: 56, height: 28, damage: 24, knockbackX: 440, knockbackY: 35, hitstun: 380, mpCost: 0, activeStart: 0.22, activeEnd: 0.58 },
  heavy: { offsetX: 26, offsetY: -36, width: 50, height: 46, damage: 32, knockbackX: 180, knockbackY: -100, hitstun: 460, mpCost: 0, activeStart: 0.30, activeEnd: 0.68 },
  specials: {
    phantom_step: { offsetX: 30, offsetY: -30, width: 54, height: 36, damage: 34, knockbackX: 520, knockbackY: 30, hitstun: 440, mpCost: 18, activeStart: 0.15, activeEnd: 0.72, travel: { distance: 160, duration: 160 } },
    sword_wave: { offsetX: 32, offsetY: -28, width: 34, height: 32, damage: 26, knockbackX: 360, knockbackY: 20, hitstun: 360, mpCost: 28, activeStart: 0.08, activeEnd: 0.92, projectile: { speed: 460, range: 320 } },
    counter: { offsetX: 26, offsetY: -30, width: 52, height: 36, damage: 42, knockbackX: 500, knockbackY: 70, hitstun: 520, mpCost: 12, activeStart: 0.10, activeEnd: 0.48 },
    super: { offsetX: 30, offsetY: -30, width: 60, height: 40, damage: 11, knockbackX: 100, knockbackY: 25, hitstun: 100, mpCost: 60, activeStart: 0.06, activeEnd: 0.96, multiHit: { hits: 10, interval: 65 } },
    stance_focus: STANCE_FOCUS,
  },
  lightFrames: 280,
  heavyFrames: 480,
  specialFrames: { phantom_step: 400, sword_wave: 520, counter: 380, super: 860, stance_focus: 200 },
};

// ---------- Wu Ting Fang — agile aerial ----------
const WuTingFangMoves: FighterMoveSet = {
  L1: { offsetX: 18, offsetY: -28, width: 32, height: 24, damage: 10, knockbackX: 140, knockbackY: 15, hitstun: 180, mpCost: 0, activeStart: 0.16, activeEnd: 0.48 },
  L2: { offsetX: 20, offsetY: -28, width: 34, height: 26, damage: 12, knockbackX: 160, knockbackY: 18, hitstun: 200, mpCost: 0, activeStart: 0.16, activeEnd: 0.50 },
  L3: { offsetX: 24, offsetY: -32, width: 44, height: 36, damage: 20, knockbackX: 300, knockbackY: 40, hitstun: 340, mpCost: 0, activeStart: 0.20, activeEnd: 0.62 },
  heavy: { offsetX: 22, offsetY: -30, width: 46, height: 36, damage: 24, knockbackX: 320, knockbackY: 35, hitstun: 380, mpCost: 0, activeStart: 0.26, activeEnd: 0.64 },
  specials: {
    air_dive: { offsetX: 16, offsetY: -12, width: 36, height: 44, damage: 22, knockbackX: 220, knockbackY: 120, hitstun: 360, mpCost: 0, activeStart: 0.08, activeEnd: 0.92 },
    pounce: { offsetX: 26, offsetY: -30, width: 46, height: 36, damage: 26, knockbackX: 380, knockbackY: 35, hitstun: 400, mpCost: 14, activeStart: 0.20, activeEnd: 0.78, travel: { distance: 150, duration: 240 } },
    whirl: { offsetX: 0, offsetY: -28, width: 76, height: 42, damage: 6, knockbackX: 200, knockbackY: 15, hitstun: 80, mpCost: 24, activeStart: 0.08, activeEnd: 0.96, multiHit: { hits: 6, interval: 75 } },
    super: { offsetX: 0, offsetY: -48, width: 76, height: 76, damage: 9, knockbackX: 80, knockbackY: -300, hitstun: 100, mpCost: 60, activeStart: 0.08, activeEnd: 0.96, multiHit: { hits: 7, interval: 75 } },
    stance_focus: STANCE_FOCUS,
  },
  lightFrames: 260,
  heavyFrames: 380,
  specialFrames: { air_dive: 340, pounce: 460, whirl: 540, super: 800, stance_focus: 200 },
};

// ---------- Shan Rou — assassin, fast chain, teleport ----------
const ShanRouMoves: FighterMoveSet = {
  L1: { offsetX: 18, offsetY: -28, width: 30, height: 24, damage: 11, knockbackX: 130, knockbackY: 10, hitstun: 150, mpCost: 0, activeStart: 0.14, activeEnd: 0.45 },
  L2: { offsetX: 20, offsetY: -28, width: 32, height: 24, damage: 12, knockbackX: 140, knockbackY: 12, hitstun: 160, mpCost: 0, activeStart: 0.14, activeEnd: 0.46 },
  L3: { offsetX: 24, offsetY: -30, width: 38, height: 28, damage: 18, knockbackX: 240, knockbackY: 22, hitstun: 280, mpCost: 0, activeStart: 0.18, activeEnd: 0.55 },
  heavy: { offsetX: 22, offsetY: -30, width: 42, height: 32, damage: 22, knockbackX: 280, knockbackY: 22, hitstun: 340, mpCost: 0, activeStart: 0.22, activeEnd: 0.58 },
  specials: {
    backstab: { offsetX: 20, offsetY: -28, width: 40, height: 32, damage: 38, knockbackX: 220, knockbackY: 45, hitstun: 440, mpCost: 20, activeStart: 0.35, activeEnd: 0.72, teleportBehind: true },
    dagger_throw: { offsetX: 22, offsetY: -28, width: 18, height: 14, damage: 11, knockbackX: 140, knockbackY: 10, hitstun: 80, mpCost: 14, activeStart: 0.12, activeEnd: 0.95, multiHit: { hits: 3, interval: 100 }, projectile: { speed: 500, range: 300 } },
    bleed_combo: { offsetX: 24, offsetY: -28, width: 42, height: 30, damage: 5, knockbackX: 120, knockbackY: 12, hitstun: 70, mpCost: 24, activeStart: 0.08, activeEnd: 0.96, multiHit: { hits: 8, interval: 65 } },
    super: { offsetX: 0, offsetY: -28, width: 84, height: 50, damage: 10, knockbackX: 160, knockbackY: 20, hitstun: 90, mpCost: 60, activeStart: 0.04, activeEnd: 0.96, multiHit: { hits: 8, interval: 70 } },
    stance_focus: STANCE_FOCUS,
  },
  lightFrames: 220,
  heavyFrames: 360,
  specialFrames: { backstab: 480, dagger_throw: 440, bleed_combo: 600, super: 800, stance_focus: 200 },
};

// ---------- Ying Zheng — tank, slow but crushing ----------
const YingZhengMoves: FighterMoveSet = {
  L1: { offsetX: 24, offsetY: -30, width: 42, height: 34, damage: 18, knockbackX: 200, knockbackY: 20, hitstun: 300, mpCost: 0, activeStart: 0.30, activeEnd: 0.62 },
  L2: { offsetX: 26, offsetY: -30, width: 44, height: 34, damage: 22, knockbackX: 240, knockbackY: 22, hitstun: 340, mpCost: 0, activeStart: 0.28, activeEnd: 0.64 },
  L3: { offsetX: 30, offsetY: -34, width: 54, height: 40, damage: 32, knockbackX: 420, knockbackY: 70, hitstun: 500, mpCost: 0, activeStart: 0.34, activeEnd: 0.76 },
  heavy: { offsetX: 0, offsetY: -14, width: 108, height: 24, damage: 42, knockbackX: 300, knockbackY: 45, hitstun: 560, mpCost: 0, activeStart: 0.40, activeEnd: 0.82 },
  specials: {
    king_charge: { offsetX: 30, offsetY: -32, width: 54, height: 44, damage: 38, knockbackX: 520, knockbackY: 45, hitstun: 520, mpCost: 20, activeStart: 0.12, activeEnd: 0.90, travel: { distance: 170, duration: 300 }, superArmor: true },
    imperial_palm: { offsetX: 38, offsetY: -30, width: 84, height: 44, damage: 42, knockbackX: 580, knockbackY: 65, hitstun: 560, mpCost: 28, activeStart: 0.28, activeEnd: 0.82 },
    decree: { offsetX: 0, offsetY: -30, width: 1, height: 1, damage: 0, knockbackX: 0, knockbackY: 0, hitstun: 0, mpCost: 30, selfBuff: { atkMul: 1.5, duration: 5000 } },
    super: { offsetX: 0, offsetY: -30, width: 800, height: 200, damage: 95, knockbackX: 620, knockbackY: 70, hitstun: 900, mpCost: 70, activeStart: 0.32, activeEnd: 0.78, fullscreen: true },
  },
  lightFrames: 420,
  heavyFrames: 600,
  specialFrames: { king_charge: 520, imperial_palm: 600, decree: 400, super: 1000 },
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
