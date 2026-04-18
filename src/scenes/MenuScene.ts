import Phaser from 'phaser';
import { SceneKeys } from '../enums/SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

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
}
