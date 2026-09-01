import { FighterStats } from '../fighters/FighterStats';

/**
 * Enemy roster inspired by 《尋秦記》 (A Step into the Past).
 * Named minibosses map to novel/drama antagonists; grunts fill wave ranks.
 */
export type EnemyTypeId =
  // Grunts
  | 'soldier'       // 兵
  | 'archer'        // 弓兵
  | 'spearman'      // 矛兵
  | 'shieldman'     // 盾兵
  | 'cavalry'       // 騎兵
  | 'elite'         // 精兵
  | 'assassin'      // 刺客 (荆轲-style mook)
  | 'zhao_guard'    // 趙衛
  | 'qin_guard'     // 秦禁軍
  // Named characters / small bosses
  | 'boss'          // 將軍 (generic)
  | 'miniboss_lj'   // 管中邪
  | 'miniboss_tx'   // 圖先
  | 'miniboss_zm'   // 趙穆
  | 'miniboss_gk'   // 郭開
  | 'miniboss_lm'   // 李牧
  | 'miniboss_lbw'  // 呂不韋
  | 'miniboss_cj'   // 成蟜
  | 'miniboss_jk'   // 荊軻
  | 'miniboss_fyq'  // 樊於期
  | 'miniboss_yd'   // 燕丹
  | 'miniboss_wj'   // 王翦
  // Final boss
  | 'boss_lao';     // 嫪毐

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

// Complete pre-rendered PNG roster in public/assets/enemies/. BootScene keeps
// its procedural generator only as a resilient fallback if an asset fails.
export const RASTER_ENEMY_SPRITES: ReadonlySet<string> = new Set([
  'sprite_enemy_soldier',
  'sprite_enemy_archer',
  'sprite_enemy_spearman',
  'sprite_enemy_shieldman',
  'sprite_enemy_cavalry',
  'sprite_enemy_elite',
  'sprite_enemy_assassin',
  'sprite_enemy_zhaoguard',
  'sprite_enemy_qinguard',
  'sprite_enemy_general',
  'sprite_enemy_minilj',
  'sprite_enemy_minitx',
  'sprite_enemy_zhaomu',
  'sprite_enemy_guokai',
  'sprite_enemy_limu',
  'sprite_enemy_lubuwei',
  'sprite_enemy_chengjiao',
  'sprite_enemy_jingke',
  'sprite_enemy_fanyuqi',
  'sprite_enemy_yandan',
  'sprite_enemy_wangjian',
  'sprite_boss_lao',
]);

export const ENEMY_TYPES: Record<EnemyTypeId, EnemyTypeDef> = {
  // ---------- Grunts ----------
  soldier: {
    id: 'soldier',
    nameZH: '兵',
    stats: { maxHp: 200, attackPower: 12, speed: 140, width: 30, height: 46, defensePower: 2 },
    aiPersonality: 'normal',
    spriteKey: 'sprite_enemy_soldier',
    attackName: 'enemy_slash',
    attackRange: 60,
    color: { main: '#777777', accent: '#3a2a1a' },
  },
  archer: {
    id: 'archer',
    nameZH: '弓兵',
    stats: { maxHp: 150, attackPower: 10, speed: 130, width: 28, height: 44, defensePower: 0 },
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
    stats: { maxHp: 300, attackPower: 18, speed: 130, width: 32, height: 48, defensePower: 5 },
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
    stats: { maxHp: 350, attackPower: 25, speed: 260, width: 40, height: 54, defensePower: 8 },
    aiPersonality: 'cavalry',
    spriteKey: 'sprite_enemy_cavalry',
    attackName: 'enemy_charge',
    attackRange: 70,
    color: { main: '#553322', accent: '#331a0a' },
  },
  elite: {
    id: 'elite',
    nameZH: '精兵',
    stats: { maxHp: 500, attackPower: 28, speed: 160, width: 32, height: 48, defensePower: 12 },
    aiPersonality: 'elite',
    spriteKey: 'sprite_enemy_elite',
    attackName: 'enemy_heavy',
    attackRange: 65,
    color: { main: '#cc9944', accent: '#332211' },
  },
  assassin: {
    id: 'assassin',
    nameZH: '刺客',
    stats: { maxHp: 180, attackPower: 22, speed: 200, width: 28, height: 44, defensePower: 2 },
    aiPersonality: 'assassin',
    spriteKey: 'sprite_enemy_assassin',
    attackName: 'enemy_dagger',
    attackRange: 50,
    color: { main: '#2a2a3a', accent: '#8844aa' },
  },
  zhao_guard: {
    id: 'zhao_guard',
    nameZH: '趙衛',
    stats: { maxHp: 320, attackPower: 18, speed: 150, width: 32, height: 48, defensePower: 10 },
    aiPersonality: 'elite',
    spriteKey: 'sprite_enemy_zhaoguard',
    attackName: 'enemy_slash',
    attackRange: 62,
    color: { main: '#8b1a1a', accent: '#d4a017' },
  },
  qin_guard: {
    id: 'qin_guard',
    nameZH: '禁軍',
    stats: { maxHp: 380, attackPower: 22, speed: 155, width: 34, height: 50, defensePower: 14 },
    aiPersonality: 'elite',
    spriteKey: 'sprite_enemy_qinguard',
    attackName: 'enemy_heavy',
    attackRange: 65,
    color: { main: '#1a1a2e', accent: '#c9a227' },
  },

  // ---------- Named small bosses (尋秦記) ----------
  boss: {
    id: 'boss',
    nameZH: '將軍',
    stats: { maxHp: 1200, attackPower: 40, speed: 140, width: 40, height: 56, defensePower: 20 },
    aiPersonality: 'boss',
    spriteKey: 'sprite_enemy_general',
    attackName: 'enemy_heavy',
    attackRange: 75,
    color: { main: '#aa2222', accent: '#1a1a1a' },
  },
  miniboss_lj: {
    id: 'miniboss_lj',
    nameZH: '管中邪',
    stats: { maxHp: 1000, attackPower: 30, speed: 210, width: 34, height: 50, defensePower: 15 },
    aiPersonality: 'miniboss_lj',
    spriteKey: 'sprite_enemy_minilj',
    attackName: 'enemy_heavy',
    attackRange: 70,
    color: { main: '#2a1a2a', accent: '#cc2222' },
  },
  miniboss_tx: {
    id: 'miniboss_tx',
    nameZH: '圖先',
    stats: { maxHp: 1200, attackPower: 35, speed: 150, width: 36, height: 54, defensePower: 18 },
    aiPersonality: 'miniboss_tx',
    spriteKey: 'sprite_enemy_minitx',
    attackName: 'enemy_thrust',
    attackRange: 110,
    color: { main: '#bb4444', accent: '#222222' },
  },
  /** 趙穆 — Marquis of Zhao, arrogant schemer */
  miniboss_zm: {
    id: 'miniboss_zm',
    nameZH: '趙穆',
    stats: { maxHp: 1100, attackPower: 28, speed: 145, width: 36, height: 52, defensePower: 16 },
    aiPersonality: 'miniboss_zm',
    spriteKey: 'sprite_enemy_zhaomu',
    attackName: 'enemy_heavy',
    attackRange: 70,
    color: { main: '#6b1a1a', accent: '#e8c547' },
  },
  /** 郭開 — corrupt Zhao minister, dirty tricks */
  miniboss_gk: {
    id: 'miniboss_gk',
    nameZH: '郭開',
    stats: { maxHp: 900, attackPower: 24, speed: 160, width: 34, height: 50, defensePower: 10 },
    aiPersonality: 'miniboss_gk',
    spriteKey: 'sprite_enemy_guokai',
    attackName: 'enemy_poison',
    attackRange: 180,
    hasProjectile: true,
    color: { main: '#4a3a2a', accent: '#88aa44' },
  },
  /** 李牧 — legendary Zhao general, disciplined pressure */
  miniboss_lm: {
    id: 'miniboss_lm',
    nameZH: '李牧',
    stats: { maxHp: 1400, attackPower: 36, speed: 170, width: 38, height: 56, defensePower: 22 },
    aiPersonality: 'miniboss_lm',
    spriteKey: 'sprite_enemy_limu',
    attackName: 'enemy_thrust',
    attackRange: 95,
    color: { main: '#8b0000', accent: '#f0e68c' },
  },
  /** 呂不韋 — Chancellor, tanky with authority pressure */
  miniboss_lbw: {
    id: 'miniboss_lbw',
    nameZH: '呂不韋',
    stats: { maxHp: 1500, attackPower: 32, speed: 125, width: 40, height: 56, defensePower: 24 },
    aiPersonality: 'miniboss_lbw',
    spriteKey: 'sprite_enemy_lubuwei',
    attackName: 'enemy_heavy',
    attackRange: 75,
    color: { main: '#2c1810', accent: '#c9a227' },
  },
  /** 成蟜 — rebel prince, aggressive duelist */
  miniboss_cj: {
    id: 'miniboss_cj',
    nameZH: '成蟜',
    stats: { maxHp: 1150, attackPower: 34, speed: 180, width: 36, height: 52, defensePower: 14 },
    aiPersonality: 'miniboss_cj',
    spriteKey: 'sprite_enemy_chengjiao',
    attackName: 'enemy_heavy',
    attackRange: 70,
    color: { main: '#1a3a5c', accent: '#ffd700' },
  },
  /** 荊軻 — legendary assassin, glass cannon */
  miniboss_jk: {
    id: 'miniboss_jk',
    nameZH: '荊軻',
    stats: { maxHp: 850, attackPower: 42, speed: 230, width: 32, height: 50, defensePower: 6 },
    aiPersonality: 'miniboss_jk',
    spriteKey: 'sprite_enemy_jingke',
    attackName: 'enemy_dagger',
    attackRange: 55,
    color: { main: '#1a1a28', accent: '#aa66ff' },
  },
  /** 樊於期 — Yan general, heavy strikes */
  miniboss_fyq: {
    id: 'miniboss_fyq',
    nameZH: '樊於期',
    stats: { maxHp: 1300, attackPower: 38, speed: 155, width: 40, height: 56, defensePower: 18 },
    aiPersonality: 'miniboss_fyq',
    spriteKey: 'sprite_enemy_fanyuqi',
    attackName: 'enemy_heavy',
    attackRange: 80,
    color: { main: '#3d5a3d', accent: '#c0c0c0' },
  },
  /** 燕丹 — Prince Dan of Yan, tactical mid-range */
  miniboss_yd: {
    id: 'miniboss_yd',
    nameZH: '燕丹',
    stats: { maxHp: 1250, attackPower: 30, speed: 165, width: 36, height: 54, defensePower: 16 },
    aiPersonality: 'miniboss_yd',
    spriteKey: 'sprite_enemy_yandan',
    attackName: 'enemy_thrust',
    attackRange: 85,
    color: { main: '#1e3a5f', accent: '#88ccee' },
  },
  /** 王翦 — Qin great general, super-armor pressure */
  miniboss_wj: {
    id: 'miniboss_wj',
    nameZH: '王翦',
    stats: { maxHp: 1600, attackPower: 40, speed: 145, width: 42, height: 58, defensePower: 26 },
    aiPersonality: 'miniboss_wj',
    spriteKey: 'sprite_enemy_wangjian',
    attackName: 'enemy_heavy',
    attackRange: 80,
    color: { main: '#1a1a1a', accent: '#ff4444' },
  },
  boss_lao: {
    id: 'boss_lao',
    nameZH: '嫪毐',
    stats: { maxHp: 2200, attackPower: 42, speed: 130, width: 44, height: 60, defensePower: 25 },
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
  enemy_dagger: { offsetX: 20, offsetY: -26, width: 32, height: 26, damage: 20, knockbackX: 180, knockbackY: 25, hitstun: 220 },
  enemy_attack: { offsetX: 18, offsetY: -22, width: 35, height: 28, damage: 12, knockbackX: 150, knockbackY: 20, hitstun: 250 },
  // Guo Kai dirty-trick "poison dart" style
  enemy_poison: { offsetX: 24, offsetY: -28, width: 12, height: 10, damage: 16, knockbackX: 160, knockbackY: 10, hitstun: 260, projectile: { speed: 400, range: 240 } },
  boss_slam:    { offsetX: 24, offsetY: -26, width: 80, height: 38, damage: 30, knockbackX: 380, knockbackY: 60, hitstun: 500 },
  boss_sweep:   { offsetX: 0,  offsetY: -26, width: 140, height: 36, damage: 25, knockbackX: 420, knockbackY: 40, hitstun: 480 },
  boss_quake:   { offsetX: 0,  offsetY: -12, width: 800, height: 30, damage: 20, knockbackX: 280, knockbackY: 30, hitstun: 420 },
};
