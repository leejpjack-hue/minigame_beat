import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { ProjectileSystem } from './ProjectileSystem';
import { Direction } from '../enums/Direction';

interface Stone {
  x: number;
  y: number;          // groundY where it rests
  gfx: Phaser.GameObjects.Container;
  alive: boolean;
}

interface HeldIndicator {
  stone: Stone;
  gfx: Phaser.GameObjects.Container;
}

/**
 * Lets players pick up ground stones and throw them as damaging projectiles.
 * - Pickup range: 36 px (horizontal)
 * - While holding, a small stone icon bobs above the player.
 * - Throwing spawns a fast projectile via ProjectileSystem.
 */
export class StonePickupSystem {
  private scene: Phaser.Scene;
  private projectiles: ProjectileSystem;
  private stones: Stone[] = [];
  private holders: Map<BaseCharacter, HeldIndicator> = new Map();
  private readonly pickupRange = 36;

  constructor(scene: Phaser.Scene, projectiles: ProjectileSystem) {
    this.scene = scene;
    this.projectiles = projectiles;
  }

  /** Create a stone at world position, resting on ground. */
  spawnStone(x: number, groundY: number): void {
    const c = this.scene.add.container(x, groundY - 6);
    const body = this.scene.add.ellipse(0, 0, 18, 12, 0x888888);
    body.setStrokeStyle(1, 0x444444, 1);
    const hi = this.scene.add.ellipse(-4, -2, 7, 3, 0xcccccc, 0.8);
    c.add([body, hi]);
    c.setDepth(groundY);
    this.stones.push({ x, y: groundY, gfx: c, alive: true });
  }

  /** Main per-player action: pickup if near stone, throw if already holding. */
  tryAction(player: BaseCharacter): void {
    if (!player.isAlive) return;
    const held = this.holders.get(player);
    if (held) {
      this.throwStone(player, held);
      return;
    }
    // find nearest alive stone within pickup range, on same-ish ground
    let best: Stone | null = null;
    let bestD = Infinity;
    for (const s of this.stones) {
      if (!s.alive) continue;
      const dx = Math.abs(s.x - player.x);
      const dy = Math.abs(s.y - player.groundY);
      if (dy > 50) continue;
      if (dx < bestD && dx <= this.pickupRange) { bestD = dx; best = s; }
    }
    if (best) this.pickupStone(player, best);
  }

  private pickupStone(player: BaseCharacter, stone: Stone): void {
    stone.alive = false;
    stone.gfx.destroy();
    // Held indicator: small stone icon above player's head
    const c = this.scene.add.container(player.x, player.groundY - (player.stats.height ?? 46) - 8);
    const body = this.scene.add.ellipse(0, 0, 14, 10, 0x888888);
    body.setStrokeStyle(1, 0x444444, 1);
    c.add(body);
    c.setDepth(player.groundY + 2);
    this.holders.set(player, { stone, gfx: c });
    this.scene.sound.play('sfx_punch', { volume: 0.25 });
  }

  private throwStone(player: BaseCharacter, held: HeldIndicator): void {
    held.gfx.destroy();
    this.holders.delete(player);
    const dir: 1 | -1 = player.facing === Direction.Right ? 1 : -1;
    this.projectiles.spawn({
      owner: player,
      x: player.x + 22 * dir,
      y: player.groundY - ((player.stats.height ?? 46) * 0.55),
      dir,
      speed: 520,
      range: 420,
      damage: 22,
      knockbackX: 260,
      knockbackY: 20,
      width: 14,
      height: 10,
      color: 0x9a9a9a,
      targetIsPlayer: false,
    });
    this.scene.sound.play('sfx_slash', { volume: 0.5 });
  }

  /** Update held-indicator positions and stone depths. */
  update(): void {
    for (const [player, held] of this.holders) {
      if (!player.isAlive) {
        held.gfx.destroy();
        this.holders.delete(player);
        continue;
      }
      const headY = player.groundY - (player.stats.height ?? 46) - 8;
      held.gfx.x = player.x;
      held.gfx.y = headY;
      held.gfx.setDepth(player.groundY + 2);
    }
    for (const s of this.stones) {
      if (s.alive) s.gfx.setDepth(s.y);
    }
  }

  /** True if player currently holds a stone (for HUD/debug). */
  isHolding(player: BaseCharacter): boolean {
    return this.holders.has(player);
  }

  clear(): void {
    for (const s of this.stones) { if (s.alive) s.gfx.destroy(); }
    this.stones = [];
    for (const [, h] of this.holders) h.gfx.destroy();
    this.holders.clear();
  }
}
