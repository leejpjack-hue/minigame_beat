import Phaser from 'phaser';
import { GAME_WIDTH } from '../config/constants';

export class ComboIndicator {
  private scene: Phaser.Scene;
  private comboText!: Phaser.GameObjects.Text;
  private comboCount = 0;
  private resetTimer = 0;
  private readonly RESET_DELAY = 2000;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.comboText = scene.add.text(GAME_WIDTH / 2, 80, '', {
      fontSize: '32px',
      fontFamily: 'monospace',
      color: '#ffdd00',
      stroke: '#000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1000).setScrollFactor(0).setAlpha(0);
  }

  registerHit(): number {
    this.comboCount++;
    this.resetTimer = this.RESET_DELAY;
    this.updateDisplay();
    return this.comboCount;
  }

  update(delta: number): void {
    if (this.comboCount > 0) {
      this.resetTimer -= delta;
      if (this.resetTimer <= 0) {
        this.comboCount = 0;
        this.hide();
      }
    }
  }

  getCombo(): number {
    return this.comboCount;
  }

  private updateDisplay(): void {
    if (this.comboCount < 2) {
      this.hide();
      return;
    }

    const messages = [
      '', '', '2 HIT!', '3 HIT!', '4 HIT!', '5 COMBO!',
      '6 COMBO!', 'GREAT!', 'AMAZING!', 'INCREDIBLE!', 'UNSTOPPABLE!',
    ];
    const msg = this.comboCount < messages.length
      ? messages[this.comboCount]
      : `${this.comboCount} HITS! GODLIKE!`;

    this.comboText.setText(msg);
    this.comboText.setAlpha(1);
    this.comboText.setScale(1.5);
    this.comboText.setColor(this.comboCount >= 8 ? '#ff4444' : this.comboCount >= 5 ? '#ff8844' : '#ffdd00');

    this.scene.tweens.add({
      targets: this.comboText,
      scale: 1,
      duration: 200,
      ease: 'Back.easeOut',
    });

    if (this.comboCount >= 10) {
      // Add a cool shake effect for godlike combos
      this.scene.tweens.add({
        targets: this.comboText,
        x: GAME_WIDTH / 2 + (Math.random() > 0.5 ? 5 : -5),
        yoyo: true,
        repeat: 3,
        duration: 40,
        onComplete: () => this.comboText.setX(GAME_WIDTH / 2)
      });
      // And a quick subtle flash of the screen
      this.scene.cameras.main.flash(100, 255, 200, 0, false);
    }

    // Float up slightly
    this.scene.tweens.add({
      targets: this.comboText,
      y: 75,
      duration: 800,
      ease: 'Sine.easeOut',
    });
  }

  private hide(): void {
    this.comboText.setAlpha(0);
    this.comboText.setY(80);
  }

  destroy(): void {
    this.comboText.destroy();
  }
}
