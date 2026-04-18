import Phaser from 'phaser';

export class HealthBar {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private maxHp: number;
  private currentHp: number;
  private bg!: Phaser.GameObjects.Graphics;
  private fill!: Phaser.GameObjects.Graphics;
  private delayFill!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, maxHp: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxHp = maxHp;
    this.currentHp = maxHp;

    this.bg = scene.add.graphics().setDepth(900);
    this.delayFill = scene.add.graphics().setDepth(901);
    this.fill = scene.add.graphics().setDepth(902);

    this.label = scene.add.text(x, y - 14, '', {
      fontSize: '10px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setDepth(903);

    this.draw();
  }

  update(hp: number): void {
    if (hp === this.currentHp) return;
    const oldHp = this.currentHp;
    this.currentHp = Phaser.Math.Clamp(hp, 0, this.maxHp);

    // Animate delay fill (red bar that shrinks slowly)
    if (this.currentHp < oldHp) {
      const delayPercent = oldHp / this.maxHp;
      this.scene.tweens.addCounter({
        from: delayPercent,
        to: this.currentHp / this.maxHp,
        duration: 400,
        delay: 200,
        onUpdate: (tw: Phaser.Tweens.Tween) => {
          this.drawDelayFill(tw.getValue() ?? 0);
        },
      });
    }

    this.draw();
  }

  private draw(): void {
    const percent = this.currentHp / this.maxHp;

    // Background
    this.bg.clear();
    this.bg.fillStyle(0x333333, 1);
    this.bg.fillRoundedRect(this.x, this.y, this.width, this.height, 2);

    // Fill
    this.fill.clear();
    const fillColor = percent > 0.5 ? 0x00ff00 : percent > 0.25 ? 0xffff00 : 0xff0000;
    this.fill.fillStyle(fillColor, 1);
    this.fill.fillRoundedRect(this.x + 1, this.y + 1, (this.width - 2) * percent, this.height - 2, 1);

    // Label
    this.label.setText(`HP ${Math.ceil(this.currentHp)}/${this.maxHp}`);
    this.label.setPosition(this.x, this.y - 14);
  }

  private drawDelayFill(percent: number): void {
    this.delayFill.clear();
    this.delayFill.fillStyle(0xff0000, 0.5);
    this.delayFill.fillRoundedRect(this.x + 1, this.y + 1, (this.width - 2) * percent, this.height - 2, 1);
  }

  destroy(): void {
    this.bg.destroy();
    this.fill.destroy();
    this.delayFill.destroy();
    this.label.destroy();
  }
}
