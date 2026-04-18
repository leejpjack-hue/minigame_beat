import Phaser from 'phaser';

export class ParticlePool {
  private scene: Phaser.Scene;
  private pool: Phaser.GameObjects.Arc[] = [];
  private active: { particle: Phaser.GameObjects.Arc; vx: number; vy: number; life: number }[] = [];

  constructor(scene: Phaser.Scene, poolSize: number = 20) {
    this.scene = scene;

    for (let i = 0; i < poolSize; i++) {
      const p = scene.add.circle(0, 0, 4, 0xffffff);
      p.setActive(false);
      p.setVisible(false);
      p.setDepth(500);
      this.pool.push(p);
    }
  }

  emit(x: number, y: number, count: number = 6, color: number = 0xffffff): void {
    for (let i = 0; i < count; i++) {
      const p = this.pool.find((p) => !p.active);
      if (!p) break;

      p.setPosition(x, y);
      p.setActive(true);
      p.setVisible(true);
      p.setFillStyle(color);
      p.setAlpha(1);
      p.setScale(1);

      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 120;
      this.active.push({
        particle: p,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 300 + Math.random() * 200,
      });
    }
  }

  update(delta: number): void {
    for (let i = this.active.length - 1; i >= 0; i--) {
      const entry = this.active[i];
      entry.life -= delta;

      if (entry.life <= 0) {
        entry.particle.setActive(false);
        entry.particle.setVisible(false);
        this.active.splice(i, 1);
        continue;
      }

      const dt = delta / 1000;
      entry.particle.x += entry.vx * dt;
      entry.particle.y += entry.vy * dt;
      entry.vx *= 0.95;
      entry.vy *= 0.95;

      // Fade out
      const alpha = entry.life / 500;
      entry.particle.setAlpha(Math.max(0, alpha));
      entry.particle.setScale(alpha);
    }
  }

  destroy(): void {
    this.pool.forEach((p) => p.destroy());
    this.active = [];
  }
}
