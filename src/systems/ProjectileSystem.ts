import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { CharacterState } from '../enums/CharacterState';
import { GAME_WIDTH } from '../config/constants';

export interface ProjectileSpec {
  owner: BaseCharacter;
  x: number;
  y: number;
  dir: 1 | -1;
  speed: number;
  range: number;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  width: number;
  height: number;
  color: number;
  targetIsPlayer: boolean;
  sprite?: string;
}

interface Projectile extends ProjectileSpec {
  travelled: number;
  obj: Phaser.GameObjects.Rectangle;
  alive: boolean;
}

export class ProjectileSystem {
  private scene: Phaser.Scene;
  private projectiles: Projectile[] = [];
  private targets: BaseCharacter[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  registerTargets(targets: BaseCharacter[]): void {
    this.targets = targets;
  }

  spawn(spec: ProjectileSpec): void {
    const obj = this.scene.add.rectangle(spec.x, spec.y, spec.width, spec.height, spec.color);
    obj.setDepth(spec.y + 1);
    this.projectiles.push({ ...spec, travelled: 0, obj, alive: true });
  }

  update(delta: number, getAllCharacters: () => BaseCharacter[]): void {
    const dt = delta / 1000;
    for (const p of this.projectiles) {
      if (!p.alive) continue;
      const dx = p.speed * p.dir * dt;
      p.obj.x += dx;
      p.travelled += Math.abs(dx);
      p.obj.setDepth(p.obj.y + 1);

      // Expire
      if (p.travelled >= p.range || p.obj.x < -20 || p.obj.x > GAME_WIDTH + 20) {
        p.alive = false;
        p.obj.destroy();
        continue;
      }

      // Hit detection
      const rect = new Phaser.Geom.Rectangle(
        p.obj.x - p.width / 2, p.obj.y - p.height / 2, p.width, p.height
      );
      for (const c of getAllCharacters()) {
        if (!c.isAlive || c === p.owner) continue;
        if (c.stateMachine.currentState === CharacterState.Dead) continue;
        // Only hit opposing faction
        const isPlayer = (c as any).isPlayer === true;
        if (p.targetIsPlayer !== isPlayer) continue;
        const hurt = new Phaser.Geom.Rectangle(
          c.x - c.stats.width / 2, c.groundY - c.stats.height, c.stats.width, c.stats.height
        );
        if (Phaser.Geom.Rectangle.Overlaps(rect, hurt)) {
          c.takeDamage(p.damage, p.knockbackX * p.dir, p.knockbackY);
          p.alive = false;
          p.obj.destroy();
          // Small spark
          const spark = this.scene.add.rectangle(p.obj.x, p.obj.y, 14, 14, 0xffffaa);
          spark.setDepth(100);
          this.scene.tweens.add({ targets: spark, scaleX: 2, scaleY: 2, alpha: 0, duration: 160, onComplete: () => spark.destroy() });
          break;
        }
      }
    }
    this.projectiles = this.projectiles.filter((p) => p.alive);
  }

  clear(): void {
    for (const p of this.projectiles) { p.alive = false; p.obj.destroy(); }
    this.projectiles = [];
  }
}
