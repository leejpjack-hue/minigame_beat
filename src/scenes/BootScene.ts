import Phaser from 'phaser';
import { SceneKeys } from '../enums/SceneKeys';
import { SpriteGenerator } from '../utils/SpriteGenerator';
import { FIGHTER_ART } from '../characters/fighters/FighterArtSpec';
import { FighterName, FighterNameType } from '../enums/FighterName';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKeys.Boot });
  }

  preload(): void {}

  create(): void {
    // Generate 3 poses per fighter
    const fighterKeys: { key: FighterNameType; sprite: string }[] = [
      { key: FighterName.XiangShaoLong, sprite: 'sprite_xiang_shao_long' },
      { key: FighterName.LianJin, sprite: 'sprite_lian_jin' },
      { key: FighterName.WuTingFang, sprite: 'sprite_wu_ting_fang' },
      { key: FighterName.ShanRou, sprite: 'sprite_shan_rou' },
      { key: FighterName.YingZheng, sprite: 'sprite_ying_zheng' },
    ];

    for (const f of fighterKeys) {
      const spec = FIGHTER_ART[f.key];
      SpriteGenerator.generateFighter(this, f.sprite, spec, 'idle');
      SpriteGenerator.generateFighter(this, f.sprite, spec, 'walk');
      SpriteGenerator.generateFighter(this, f.sprite, spec, 'attack');
      // Alias the base key (for scenes that load without explicit pose) to the idle pose
      if (!this.textures.exists(f.sprite)) {
        const src = this.textures.get(`${f.sprite}_idle`);
        if (src) {
          const img = src.getSourceImage(0) as HTMLCanvasElement;
          this.textures.addCanvas(f.sprite, img);
        }
      }
    }

    // Enemy sprites (rollout 3: full roster)
    const enemyTypes: { key: string; w: number; h: number; main: string; accent: string; weapon: any; hair: any }[] = [
      { key: 'sprite_enemy_soldier',   w: 32, h: 46, main: '#777777', accent: '#3a2a1a', weapon: 'sword',  hair: 'helmet' },
      { key: 'sprite_enemy_archer',    w: 30, h: 44, main: '#8a6a3a', accent: '#3a2a1a', weapon: 'bow',    hair: 'helmet' },
      { key: 'sprite_enemy_spearman',  w: 34, h: 48, main: '#aa3333', accent: '#222222', weapon: 'spear',  hair: 'helmet' },
      { key: 'sprite_enemy_shieldman', w: 36, h: 48, main: '#aa7733', accent: '#553311', weapon: 'shield_axe', hair: 'helmet' },
      { key: 'sprite_enemy_cavalry',   w: 42, h: 54, main: '#553322', accent: '#331a0a', weapon: 'cavalry', hair: 'helmet' },
      { key: 'sprite_enemy_elite',     w: 34, h: 48, main: '#cc9944', accent: '#332211', weapon: 'sword',  hair: 'helmet' },
      { key: 'sprite_enemy_general',   w: 42, h: 56, main: '#aa2222', accent: '#1a1a1a', weapon: 'sword',  hair: 'topknot' },
      { key: 'sprite_enemy_minilj',    w: 36, h: 50, main: '#2a1a2a', accent: '#cc2222', weapon: 'sword',  hair: 'topknot' },
      { key: 'sprite_enemy_minitx',    w: 38, h: 54, main: '#bb4444', accent: '#222222', weapon: 'spear',  hair: 'topknot' },
      { key: 'sprite_boss_lao',        w: 46, h: 60, main: '#882288', accent: '#ffcc44', weapon: 'hammer', hair: 'crown' },
    ];
    for (const e of enemyTypes) {
      SpriteGenerator.generateEnemy(this, e.key, {
        width: e.w, height: e.h, main: e.main, accent: e.accent, label: '', weapon: e.weapon, hair: e.hair,
      });
    }
    // Legacy alias used by DEFAULT_STATS fallback
    if (!this.textures.exists('sprite_enemy')) {
      const src = this.textures.get('sprite_enemy_soldier');
      if (src) this.textures.addCanvas('sprite_enemy', src.getSourceImage(0) as HTMLCanvasElement);
    }

    // Shadow
    SpriteGenerator.generateShadow(this, 'shadow');

    this.scene.start(SceneKeys.Menu);
  }
}
