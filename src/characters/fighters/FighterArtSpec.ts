import { FighterName, FighterNameType } from '../../enums/FighterName';

export type HairStyle = 'short' | 'topknot' | 'braid' | 'ponytail' | 'crown' | 'helmet';
export type WeaponKind = 'none' | 'sword' | 'dagger' | 'fan' | 'royalblade' | 'spear' | 'bow' | 'shield_axe' | 'cavalry' | 'hammer';
export type FighterPose = 'idle' | 'walk' | 'attack';

export interface FighterArtSpec {
  // Canvas size
  width: number;
  height: number;
  // Colours
  skin: string;
  robeMain: string;
  robeAccent: string;
  hair: string;
  trim?: string;
  // Style
  hairStyle: HairStyle;
  weapon: WeaponKind;
  // Build
  shoulderWidth: number; // px half-width at shoulders
  waistWidth: number;    // px half-width at waist
  headRadius: number;
}

export const FIGHTER_ART: Record<FighterNameType, FighterArtSpec> = {
  [FighterName.XiangShaoLong]: {
    width: 36, height: 52,
    skin: '#f0c8a0',
    robeMain: '#3a6fd8',
    robeAccent: '#b98a50',
    hair: '#1a1a1a',
    trim: '#ffffff',
    hairStyle: 'short',
    weapon: 'none',
    shoulderWidth: 11, waistWidth: 8, headRadius: 7,
  },
  [FighterName.LianJin]: {
    width: 36, height: 54,
    skin: '#e8bc94',
    robeMain: '#1a1a1a',
    robeAccent: '#cc2222',
    hair: '#0a0a0a',
    trim: '#a02020',
    hairStyle: 'topknot',
    weapon: 'sword',
    shoulderWidth: 10, waistWidth: 7, headRadius: 6,
  },
  [FighterName.WuTingFang]: {
    width: 32, height: 48,
    skin: '#fcd5b4',
    robeMain: '#ff88cc',
    robeAccent: '#ffdd55',
    hair: '#2a1a1a',
    trim: '#fff1aa',
    hairStyle: 'braid',
    weapon: 'fan',
    shoulderWidth: 8, waistWidth: 7, headRadius: 6,
  },
  [FighterName.ShanRou]: {
    width: 32, height: 48,
    skin: '#eac4a0',
    robeMain: '#225533',
    robeAccent: '#111111',
    hair: '#1a1a0a',
    trim: '#88cc77',
    hairStyle: 'ponytail',
    weapon: 'dagger',
    shoulderWidth: 8, waistWidth: 7, headRadius: 6,
  },
  [FighterName.YingZheng]: {
    width: 40, height: 58,
    skin: '#eec8a0',
    robeMain: '#ffdd00',
    robeAccent: '#1a1a1a',
    hair: '#0a0a0a',
    trim: '#ff4444',
    hairStyle: 'crown',
    weapon: 'royalblade',
    shoulderWidth: 13, waistWidth: 10, headRadius: 8,
  },
};
