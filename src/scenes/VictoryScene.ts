import Phaser from 'phaser';
import { SceneKeys } from '../enums/SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export class VictoryScene extends Phaser.Scene {
  constructor() {
    super({ key: SceneKeys.Victory });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#1a0a2e');

    // Victory text
    const title = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '恭喜通關!', {
      fontSize: '48px',
      fontFamily: 'monospace',
      color: '#ffdd00',
      stroke: '#000',
      strokeThickness: 5,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'VICTORY - All Stages Cleared!', {
      fontSize: '20px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, '尋秦記齊打交 - A Step into the Past', {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);

    const restartText = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 90, 'Press Enter / Tap to Play Again', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: restartText,
      alpha: 0.3,
      duration: 800,
      yoyo: true,
      repeat: -1,
    });

    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 1000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.input.keyboard?.on('keydown-ENTER', () => {
      this.registry.remove('currentStage');
      this.scene.start(SceneKeys.CharacterSelect);
    });

    this.input.on('pointerdown', () => {
      this.registry.remove('currentStage');
      this.scene.start(SceneKeys.CharacterSelect);
    });
  }
}
