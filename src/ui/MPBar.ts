import Phaser from 'phaser';

export class MPBar {
  private scene: Phaser.Scene;
  private x: number;
  private y: number;
  private width: number;
  private height: number;
  private maxMp: number;
  private currentMp: number;
  private bg!: Phaser.GameObjects.Graphics;
  private fill!: Phaser.GameObjects.Graphics;
  private label!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, x: number, y: number, width: number, height: number, maxMp: number) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.maxMp = maxMp;
    this.currentMp = maxMp;

    this.bg = scene.add.graphics().setDepth(900);
    this.fill = scene.add.graphics().setDepth(902);

    this.label = scene.add.text(x, y - 12, '', {
      fontSize: '9px',
      color: '#88ccff',
      fontFamily: 'monospace',
    }).setDepth(903);

    this.draw();
  }

  update(mp: number): void {
    this.currentMp = Phaser.Math.Clamp(mp, 0, this.maxMp);
    this.draw();
  }

  private draw(): void {
    const percent = this.currentMp / this.maxMp;

    this.bg.clear();
    this.bg.fillStyle(0x222233, 1);
    this.bg.fillRoundedRect(this.x, this.y, this.width, this.height, 2);

    this.fill.clear();
    this.fill.fillStyle(0x0088ff, 1);
    this.fill.fillRoundedRect(this.x + 1, this.y + 1, (this.width - 2) * percent, this.height - 2, 1);

    this.label.setText(`MP ${Math.ceil(this.currentMp)}/${this.maxMp}`);
  }

  destroy(): void {
    this.bg.destroy();
    this.fill.destroy();
    this.label.destroy();
  }
}
