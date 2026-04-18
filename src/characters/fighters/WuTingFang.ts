import { FighterStats } from './FighterStats';
import { FighterName } from '../../enums/FighterName';

export const WuTingFangStats: FighterStats = {
  fighterKey: FighterName.WuTingFang,
  name: 'WuTingFang',
  nameZH: '烏廷芳',
  spriteKey: 'sprite_wu_ting_fang',
  maxHp: 350,
  maxMp: 120,
  speed: 190,
  jumpPower: 100,
  attackPower: 22,
  defensePower: 15,
  comboSpeedMultiplier: 1.1,
  color: 0xff88ff,
  width: 28,
  height: 44,
  doubleJump: true,
};
