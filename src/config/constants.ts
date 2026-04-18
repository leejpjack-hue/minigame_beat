// Game dimensions
export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 450;

// Z-axis (2.5D depth) walkable band
export const STAGE_WALKABLE_Y_MIN = 280;
export const STAGE_WALKABLE_Y_MAX = 400;

// Player defaults
export const PLAYER_SPEED = 160;
export const PLAYER_JUMP_HEIGHT = 80;
export const PLAYER_JUMP_DURATION = 500;

// Combat
export const COMBO_INPUT_WINDOW = 300; // ms
export const HIT_STUN_BASE = 400; // ms
export const KNOCKBACK_FRICTION = 0.9;
export const BLOCK_DAMAGE_REDUCTION = 0.8;
export const MAX_ACTIVE_ENEMIES = 6;

// AI
export const ENEMY_DECISION_INTERVAL = 500; // ms
export const ENEMY_ATTACK_RANGE = 60;
export const ENEMY_CHASE_RANGE = 200;

// Colors
export const COLORS = {
  XIANG_SHAO_LONG: 0x4488ff,
  LIAN_JIN: 0xff4444,
  WU_TING_FANG: 0xff88ff,
  SHAN_ROU: 0x44ff44,
  YING_ZHENG: 0xffdd00,
  ENEMY: 0x888888,
  SHADOW: 0x000000,
  HP_GREEN: 0x00ff00,
  HP_RED: 0xff0000,
  MP_BLUE: 0x0088ff,
  UI_BG: 0x333333,
  WHITE: 0xffffff,
  BLACK: 0x000000,
};
