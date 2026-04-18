import { FighterName, FighterNameType } from '../../enums/FighterName';

export interface FighterStats {
  // Unique key linking to FIGHTER_MOVES
  fighterKey: FighterNameType | string;
  name: string;
  nameZH: string;
  spriteKey: string;
  maxHp: number;
  maxMp: number;
  speed: number;
  jumpPower: number;
  attackPower: number;
  defensePower: number;
  comboSpeedMultiplier: number;
  color: number;
  width: number;
  height: number;
  // Optional gameplay perks
  doubleJump?: boolean;
}

export const DEFAULT_STATS: FighterStats = {
  fighterKey: 'default',
  name: 'Fighter',
  nameZH: '格鬥家',
  spriteKey: 'sprite_enemy',
  maxHp: 400,
  maxMp: 100,
  speed: 160,
  jumpPower: 80,
  attackPower: 25,
  defensePower: 15,
  comboSpeedMultiplier: 1.0,
  color: 0x888888,
  width: 30,
  height: 46,
};
