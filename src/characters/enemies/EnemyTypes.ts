import { FighterStats } from '../fighters/FighterStats';

export type EnemyTypeId =
  | 'soldier'    // 兵
  | 'archer'     // 弓兵
  | 'spearman'   // 矛兵
  | 'shieldman'  // 盾兵
  | 'cavalry'    // 騎兵
  | 'elite'
  | 'boss'
  | 'miniboss_lj'
  | 'miniboss_tx'
  | 'boss_lao';

export interface EnemyTypeDef {
  id: EnemyTypeId;
  nameZH: string;
  stats: Partial<FighterStats>;
  aiPersonality: string;
  spriteKey: string;
  attackName: string; // hitbox key in ENEMY_HITBOXES
  attackRange: number;
  hasProjectile?: boolean;
  color: { main: string; accent: string };
}

export const ENEMY_TYPES: Record<EnemyTypeId, EnemyTypeDef> = {
  soldier: {
    id: 'soldier',
    nameZH: '兵',
    stats: { maxHp: 200, attackPower: 12, speed: 140, width: 30, height: 46 },
    aiPersonality: 'normal',
    spriteKey: 'sprite_enemy_soldier',
    attackName: 'enemy_slash',
    attackRange: 60,
    color: { main: '#777777', accent: '#3a2a1a' },
  },
  archer: {
    id: 'archer',
    nameZH: '弓兵',
    stats: { maxHp: 150, attackPower: 10, speed: 130, width: 28, height: 44 },
    aiPersonality: 'archer',
    spriteKey: 'sprite_enemy_archer',
    attackName: 'enemy_arrow',
    attackRange: 220,
    hasProjectile: true,
    color: { main: '#8a6a3a', accent: '#3a2a1a' },
  },
  spearman: {
    id: 'spearman',
    nameZH: '矛兵',
    stats: { maxHp: 300, attackPower: 18, speed: 130, width: 32, height: 48 },
    aiPersonality: 'spearman',
    spriteKey: 'sprite_enemy_spearman',
    attackName: 'enemy_thrust',
    attackRange: 90,
    color: { main: '#aa3333', accent: '#222222' },
  },
  shieldman: {
    id: 'shieldman',
    nameZH: '盾兵',
    stats: { maxHp: 400, attackPower: 14, speed: 110, width: 34, height: 48, defensePower: 22 },
    aiPersonality: 'shield',
    spriteKey: 'sprite_enemy_shieldman',
    attackName: 'enemy_chop',
    attackRange: 55,
    color: { main: '#aa7733', accent: '#553311' },
  },
  cavalry: {
    id: 'cavalry',
    nameZH: '騎兵',
    stats: { maxHp: 350, attackPower: 25, speed: 260, width: 40, height: 54 },
    aiPersonality: 'cavalry',
    spriteKey: 'sprite_enemy_cavalry',
    attackName: 'enemy_charge',
    attackRange: 70,
    color: { main: '#553322', accent: '#331a0a' },
  },
  elite: {
    id: 'elite',
    nameZH: '精兵',
    stats: { maxHp: 500, attackPower: 28, speed: 160, width: 32, height: 48 },
    aiPersonality: 'elite',
    spriteKey: 'sprite_enemy_elite',
    attackName: 'enemy_heavy',
    attackRange: 65,
    color: { main: '#cc9944', accent: '#332211' },
  },
  boss: {
    id: 'boss',
    nameZH: '將軍',
    stats: { maxHp: 1200, attackPower: 40, speed: 140, width: 40, height: 56 },
    aiPersonality: 'boss',
    spriteKey: 'sprite_enemy_general',
    attackName: 'enemy_heavy',
    attackRange: 75,
    color: { main: '#aa2222', accent: '#1a1a1a' },
  },
  miniboss_lj: {
    id: 'miniboss_lj',
    nameZH: '管中邪',
    stats: { maxHp: 1000, attackPower: 30, speed: 210, width: 34, height: 50 },
    aiPersonality: 'miniboss_lj',
    spriteKey: 'sprite_enemy_minilj',
    attackName: 'enemy_heavy',
    attackRange: 70,
    color: { main: '#2a1a2a', accent: '#cc2222' },
  },
  miniboss_tx: {
    id: 'miniboss_tx',
    nameZH: '圖先',
    stats: { maxHp: 1200, attackPower: 35, speed: 150, width: 36, height: 54 },
    aiPersonality: 'miniboss_tx',
    spriteKey: 'sprite_enemy_minitx',
    attackName: 'enemy_thrust',
    attackRange: 110,
    color: { main: '#bb4444', accent: '#222222' },
  },
  boss_lao: {
    id: 'boss_lao',
    nameZH: '嫪毐',
    stats: { maxHp: 2000, attackPower: 40, speed: 130, width: 44, height: 60 },
    aiPersonality: 'boss',
    spriteKey: 'sprite_boss_lao',
    attackName: 'boss_slam',
    attackRange: 85,
    color: { main: '#882288', accent: '#ffcc44' },
  },
};

export const ENEMY_HITBOXES: Record<string, {
  offsetX: number; offsetY: number; width: number; height: number;
  damage: number; knockbackX: number; knockbackY: number; hitstun: number;
  projectile?: { speed: number; range: number };
}> = {
  enemy_slash:  { offsetX: 18, offsetY: -25, width: 38, height: 28, damage: 12, knockbackX: 150, knockbackY: 20, hitstun: 250 },
  enemy_arrow:  { offsetX: 22, offsetY: -25, width: 14, height: 8,  damage: 14, knockbackX: 220, knockbackY: 10, hitstun: 300, projectile: { speed: 480, range: 300 } },
  enemy_thrust: { offsetX: 30, offsetY: -25, width: 68, height: 20, damage: 18, knockbackX: 260, knockbackY: 10, hitstun: 320 },
  enemy_chop:   { offsetX: 16, offsetY: -26, width: 34, height: 30, damage: 14, knockbackX: 200, knockbackY: 20, hitstun: 280 },
  enemy_charge: { offsetX: 22, offsetY: -30, width: 50, height: 40, damage: 25, knockbackX: 420, knockbackY: 40, hitstun: 400 },
  enemy_heavy:  { offsetX: 22, offsetY: -28, width: 46, height: 34, damage: 24, knockbackX: 320, knockbackY: 40, hitstun: 380 },
  enemy_attack: { offsetX: 18, offsetY: -22, width: 35, height: 28, damage: 12, knockbackX: 150, knockbackY: 20, hitstun: 250 },
  boss_slam:    { offsetX: 24, offsetY: -26, width: 80, height: 38, damage: 30, knockbackX: 380, knockbackY: 60, hitstun: 500 },
  boss_sweep:   { offsetX: 0,  offsetY: -26, width: 140, height: 36, damage: 25, knockbackX: 420, knockbackY: 40, hitstun: 480 },
  boss_quake:   { offsetX: 0,  offsetY: -12, width: 800, height: 30, damage: 20, knockbackX: 280, knockbackY: 30, hitstun: 420 },
};
