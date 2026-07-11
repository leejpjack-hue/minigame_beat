import Phaser from 'phaser';
import { SceneKeys } from '../enums/SceneKeys';
import { SpriteGenerator } from '../utils/SpriteGenerator';
import { FIGHTER_ART } from '../characters/fighters/FighterArtSpec';
import { FighterName, FighterNameType } from '../enums/FighterName';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKeys.Boot });
  }

  preload(): void {
    // BGM
    this.load.audio('bgm_menu', 'assets/audio/bgm_menu.wav');
    this.load.audio('bgm_stage1', 'assets/audio/bgm_stage1.wav');
    this.load.audio('bgm_stage2', 'assets/audio/bgm_stage2.wav');
    this.load.audio('bgm_stage3', 'assets/audio/bgm_stage3.wav');
    this.load.audio('bgm_stage4', 'assets/audio/bgm_stage4.wav');

    // SFX
    this.load.audio('sfx_punch', 'assets/audio/sfx_punch.wav');
    this.load.audio('sfx_kick', 'assets/audio/sfx_kick.wav');
    this.load.audio('sfx_slash', 'assets/audio/sfx_slash.wav');
    this.load.audio('sfx_special', 'assets/audio/sfx_special.wav');

    // Voices
    this.load.audio('voice_shout1', 'assets/audio/voice_shout1.wav');
    this.load.audio('voice_shout2', 'assets/audio/voice_shout2.wav');
    this.load.audio('voice_ko', 'assets/audio/voice_ko.wav');

    // UI
    this.load.audio('ui_select', 'assets/audio/ui_select.wav');
    this.load.audio('ui_confirm', 'assets/audio/ui_confirm.wav');
    this.load.audio('ui_wave_start', 'assets/audio/ui_wave_start.wav');
  }

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

    // Enemy sprites — grunts + 《尋秦記》 named minibosses
    const enemyTypes: { key: string; w: number; h: number; main: string; accent: string; weapon: any; hair: any }[] = [
      { key: 'sprite_enemy_soldier',   w: 32, h: 46, main: '#777777', accent: '#3a2a1a', weapon: 'sword',  hair: 'helmet' },
      { key: 'sprite_enemy_archer',    w: 30, h: 44, main: '#8a6a3a', accent: '#3a2a1a', weapon: 'bow',    hair: 'helmet' },
      { key: 'sprite_enemy_spearman',  w: 34, h: 48, main: '#aa3333', accent: '#222222', weapon: 'spear',  hair: 'helmet' },
      { key: 'sprite_enemy_shieldman', w: 36, h: 48, main: '#aa7733', accent: '#553311', weapon: 'shield_axe', hair: 'helmet' },
      { key: 'sprite_enemy_cavalry',   w: 72, h: 64, main: '#553322', accent: '#331a0a', weapon: 'cavalry', hair: 'helmet' },
      { key: 'sprite_enemy_elite',     w: 34, h: 48, main: '#cc9944', accent: '#332211', weapon: 'sword',  hair: 'helmet' },
      { key: 'sprite_enemy_assassin',  w: 30, h: 44, main: '#2a2a3a', accent: '#8844aa', weapon: 'dagger', hair: 'short' },
      { key: 'sprite_enemy_zhaoguard', w: 34, h: 48, main: '#8b1a1a', accent: '#d4a017', weapon: 'sword',  hair: 'helmet' },
      { key: 'sprite_enemy_qinguard',  w: 36, h: 50, main: '#1a1a2e', accent: '#c9a227', weapon: 'sword',  hair: 'helmet' },
      { key: 'sprite_enemy_general',   w: 42, h: 56, main: '#aa2222', accent: '#1a1a1a', weapon: 'sword',  hair: 'topknot' },
      { key: 'sprite_enemy_minilj',    w: 36, h: 50, main: '#2a1a2a', accent: '#cc2222', weapon: 'sword',  hair: 'topknot' },
      { key: 'sprite_enemy_minitx',    w: 38, h: 54, main: '#bb4444', accent: '#222222', weapon: 'spear',  hair: 'topknot' },
      { key: 'sprite_enemy_zhaomu',    w: 38, h: 52, main: '#6b1a1a', accent: '#e8c547', weapon: 'sword',  hair: 'crown' },
      { key: 'sprite_enemy_guokai',    w: 36, h: 50, main: '#4a3a2a', accent: '#88aa44', weapon: 'dagger', hair: 'topknot' },
      { key: 'sprite_enemy_limu',      w: 40, h: 56, main: '#8b0000', accent: '#f0e68c', weapon: 'spear',  hair: 'topknot' },
      { key: 'sprite_enemy_lubuwei',   w: 42, h: 56, main: '#2c1810', accent: '#c9a227', weapon: 'royalblade', hair: 'crown' },
      { key: 'sprite_enemy_chengjiao', w: 38, h: 52, main: '#1a3a5c', accent: '#ffd700', weapon: 'sword',  hair: 'topknot' },
      { key: 'sprite_enemy_jingke',    w: 34, h: 50, main: '#1a1a28', accent: '#aa66ff', weapon: 'dagger', hair: 'short' },
      { key: 'sprite_enemy_fanyuqi',   w: 42, h: 56, main: '#3d5a3d', accent: '#c0c0c0', weapon: 'sword',  hair: 'topknot' },
      { key: 'sprite_enemy_yandan',    w: 38, h: 54, main: '#1e3a5f', accent: '#88ccee', weapon: 'sword',  hair: 'crown' },
      { key: 'sprite_enemy_wangjian',  w: 44, h: 58, main: '#1a1a1a', accent: '#ff4444', weapon: 'sword',  hair: 'helmet' },
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

    // Background elements
    SpriteGenerator.generateCloud(this, 'bg_cloud');
    SpriteGenerator.generateTree(this, 'bg_tree_1', '#2d4d22');
    SpriteGenerator.generateTree(this, 'bg_tree_2', '#1a3a1a');
    SpriteGenerator.generateRock(this, 'bg_rock');

    // Thematic elements
    SpriteGenerator.generateStall(this, 'bg_stall_blue', '#2196f3');
    SpriteGenerator.generateStall(this, 'bg_stall_red', '#f44336');
    SpriteGenerator.generateLantern(this, 'bg_lantern');
    SpriteGenerator.generateBanner(this, 'bg_banner_qin', '秦', '#000000');
    SpriteGenerator.generateBanner(this, 'bg_banner_zhao', '趙', '#d32f2f');
    SpriteGenerator.generateHouse(this, 'bg_house_1', '#795548');
    SpriteGenerator.generateHouse(this, 'bg_house_2', '#4e342e');

    this.scene.start(SceneKeys.Menu);
  }
}
