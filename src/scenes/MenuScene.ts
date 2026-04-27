import Phaser from 'phaser';
import { SceneKeys } from '../enums/SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { ALL_FIGHTERS } from '../characters/fighters';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKeys.Menu });
  }

  create(): void {
    // Play menu bgm
    if (!this.sound.get('bgm_menu')) {
      this.sound.add('bgm_menu', { loop: true, volume: 0.5 }).play();
    } else if (!this.sound.get('bgm_menu')?.isPlaying) {
      this.sound.play('bgm_menu', { loop: true, volume: 0.5 });
    }

    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // Background
    this.cameras.main.setBackgroundColor('#1a0a2e');

    // Menu background animation (moving character silhouettes)
    // Initial spawns to populate screen
    for (let i = 0; i < 3; i++) {
      this.spawnSilhouette();
    }
    // Continuous spawns
    this.time.addEvent({
      delay: 2000,
      callback: () => this.spawnSilhouette(),
      loop: true
    });

    // Title
    const title = this.add.text(cx, cy - 60, '尋秦記齊打交', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ffdd00',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(cx, cy - 10, 'A Step into the Past - Beat \'em Up', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#aaaaaa',
    }).setOrigin(0.5);

    // Start button
    const startText = this.add.text(cx, cy + 60, '[ Press Enter or Tap to Start ]', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    // Blinking effect
    this.tweens.add({
      targets: startText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    // Title pulse
    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // Input
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.sound.play('ui_confirm');
      this.scene.start(SceneKeys.CharacterSelect);
    });

    this.input.on('pointerdown', () => {
      this.sound.play('ui_confirm');
      this.scene.start(SceneKeys.CharacterSelect);
    });
  }

  private spawnSilhouette(): void {
    if (!this.scene.isActive(SceneKeys.Menu)) return;
    
    const isRightToLeft = Math.random() > 0.5;
    const startX = isRightToLeft ? GAME_WIDTH + 50 : -50;
    const endX = isRightToLeft ? -50 : GAME_WIDTH + 50;
    const startY = GAME_HEIGHT - 60 + (Math.random() * 40 - 20);

    const fighter = ALL_FIGHTERS[Math.floor(Math.random() * ALL_FIGHTERS.length)];
    const tex = fighter.spriteKey + '_walk';
    if (!this.textures.exists(tex)) return; // Failsafe

    const silhouette = this.add.image(startX, startY, tex);
    silhouette.setOrigin(0.5, 1);
    silhouette.setFlipX(!isRightToLeft);
    silhouette.setTint(0x0a001a); // Very dark, matching background
    silhouette.setAlpha(0.6);
    // Lower depth than UI text
    silhouette.setDepth(10);

    // Random speed variation
    const duration = 6000 + Math.random() * 4000;

    this.tweens.add({
      targets: silhouette,
      x: endX,
      duration: duration,
      onComplete: () => silhouette.destroy()
    });
  }
}
