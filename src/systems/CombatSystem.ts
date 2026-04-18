import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';
import { CharacterState } from '../enums/CharacterState';
import { Direction } from '../enums/Direction';
import { ParticlePool } from './ParticlePool';
import { getFighterMoves, MoveHitbox } from '../characters/fighters/FighterMoves';
import { ENEMY_HITBOXES } from '../characters/enemies/EnemyTypes';

export interface HitboxDef {
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  damage: number;
  knockbackX: number;
  knockbackY: number;
  hitstun: number;
  mpCost: number;
}

// Fallback hitboxes for enemies / generic attacks (keyed by attack name).
const DEFAULT_HITBOXES: Record<string, HitboxDef> = {
  light: { offsetX: 20, offsetY: -25, width: 40, height: 30, damage: 15, knockbackX: 200, knockbackY: 30, hitstun: 300, mpCost: 0 },
  heavy: { offsetX: 22, offsetY: -25, width: 50, height: 35, damage: 25, knockbackX: 350, knockbackY: 50, hitstun: 400, mpCost: 0 },
  enemy_attack: { offsetX: 18, offsetY: -22, width: 35, height: 28, damage: 12, knockbackX: 150, knockbackY: 20, hitstun: 250, mpCost: 0 },
};

export class CombatSystem {
  private allCharacters: BaseCharacter[] = [];
  private hitCooldowns = new Map<string, number>();
  private multiHitCounters = new Map<string, { next: number; remaining: number }>();
  private hitCounter = 0;
  private hitCounterTimer = 0;
  private scene: Phaser.Scene;
  private particles: ParticlePool;
  private debugGraphics: Phaser.GameObjects.Graphics | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.particles = new ParticlePool(scene, 30);
  }

  addCharacter(char: BaseCharacter): void {
    this.allCharacters.push(char);
  }

  removeCharacter(char: BaseCharacter): void {
    const idx = this.allCharacters.indexOf(char);
    if (idx >= 0) this.allCharacters.splice(idx, 1);
  }

  enableDebug(): void {
    this.debugGraphics = this.scene.add.graphics();
    this.debugGraphics.setDepth(500);
  }

  getHitCounter(): number {
    return this.hitCounter;
  }

  update(time: number, delta: number): void {
    if (this.hitCounterTimer > 0) {
      this.hitCounterTimer -= delta;
      if (this.hitCounterTimer <= 0) this.hitCounter = 0;
    }

    for (const [key, expiry] of this.hitCooldowns) {
      if (time > expiry) this.hitCooldowns.delete(key);
    }

    this.debugGraphics?.clear();
    this.particles.update(delta);

    for (const attacker of this.allCharacters) {
      if (!attacker.isAlive || !attacker.isHitboxActive) continue;

      const move = this.resolveMove(attacker);
      if (!move) continue;

      // Fullscreen AoE: damage all opponents once per attack
      if ((move as MoveHitbox).fullscreen) {
        this.resolveFullscreen(attacker, move as MoveHitbox, time);
        continue;
      }

      const hitbox = this.getHitbox(attacker, move);
      this.drawDebugRect(hitbox, 0xff0000, 0.3);

      for (const defender of this.allCharacters) {
        if (defender === attacker || !defender.isAlive) continue;
        if (defender.stateMachine.currentState === CharacterState.Dead) continue;

        const cooldownKey = `${attacker.x.toFixed(0)}_${defender.x.toFixed(0)}_${attacker.currentAttackName}_${this.multiHitTick(attacker, move)}`;
        if (this.hitCooldowns.has(cooldownKey)) continue;

        const hurtbox = this.getHurtbox(defender);
        this.drawDebugRect(hurtbox, 0x00ff00, 0.3);

        if (Phaser.Geom.Rectangle.Overlaps(hitbox, hurtbox)) {
          this.resolveHit(attacker, defender, move, cooldownKey, time);
        }
      }
    }
  }

  /** Look up the current attack's hitbox, per-fighter first, then fallback. */
  private resolveMove(attacker: BaseCharacter): MoveHitbox | HitboxDef | null {
    const name = attacker.currentAttackName;
    if (!name) return null;
    const moves = getFighterMoves(String(attacker.stats.fighterKey));
    if (moves) {
      if (name === 'L1') return moves.L1;
      if (name === 'L2') return moves.L2;
      if (name === 'L3') return moves.L3;
      if (name === 'heavy') return moves.heavy;
      if (moves.specials[name]) return moves.specials[name];
    }
    // Enemy-side hitbox lookup
    const enemyHb = ENEMY_HITBOXES[name];
    if (enemyHb) {
      return {
        offsetX: enemyHb.offsetX, offsetY: enemyHb.offsetY,
        width: enemyHb.width, height: enemyHb.height,
        damage: enemyHb.damage, knockbackX: enemyHb.knockbackX, knockbackY: enemyHb.knockbackY,
        hitstun: enemyHb.hitstun, mpCost: 0,
      } as HitboxDef;
    }
    return DEFAULT_HITBOXES[name] ?? null;
  }

  /** Compute multi-hit tick index; rotates hitbox cooldown key */
  private multiHitTick(attacker: BaseCharacter, move: MoveHitbox | HitboxDef): number {
    const multi = (move as MoveHitbox).multiHit;
    if (!multi) return 0;
    return Math.floor(attacker.attackFrame / multi.interval);
  }

  private resolveFullscreen(attacker: BaseCharacter, move: MoveHitbox, time: number): void {
    const tickKey = `${attacker.x.toFixed(0)}_fs_${attacker.currentAttackName}`;
    if (this.hitCooldowns.has(tickKey)) return;
    this.hitCooldowns.set(tickKey, time + 5000);
    const dir = attacker.facing === Direction.Right ? 1 : -1;
    for (const defender of this.allCharacters) {
      if (defender === attacker || !defender.isAlive) continue;
      // Screen flash
      defender.takeDamage(move.damage, move.knockbackX * dir * 0.5, move.knockbackY);
    }
    this.scene.cameras.main.flash(300, 255, 240, 180);
    this.scene.cameras.main.shake(300, 0.01);
  }

  private resolveHit(
    attacker: BaseCharacter,
    defender: BaseCharacter,
    move: MoveHitbox | HitboxDef,
    cooldownKey: string,
    time: number
  ): void {
    const multi = (move as MoveHitbox).multiHit;
    const cooldownMs = multi ? multi.interval : (move as HitboxDef).hitstun;
    this.hitCooldowns.set(cooldownKey, time + cooldownMs);

    const dir = attacker.facing === Direction.Right ? 1 : -1;
    const kbx = (move as HitboxDef).knockbackX * dir;
    const kby = (move as HitboxDef).knockbackY;
    const dmg = Math.round((move as HitboxDef).damage * (attacker.atkMultiplier || 1));

    defender.takeDamage(dmg, kbx, kby);

    // Play hit sound
    const hitSounds = ['sfx_punch', 'sfx_kick'];
    const randomHit = hitSounds[Math.floor(Math.random() * hitSounds.length)];
    this.scene.sound.play(randomHit);

    if ((move as HitboxDef).damage >= 20) {
        this.scene.sound.play('sfx_slash', { volume: 0.8 });
    }
    if ((move as HitboxDef).mpCost > 0 || (move as any).isSpecial) {
        this.scene.sound.play('sfx_special', { volume: 0.6 });
    }

    this.hitCounter++;
    this.hitCounterTimer = 2000;

    const hitX = defender.x;
    const hitY = defender.groundY + (move as HitboxDef).offsetY;
    this.spawnHitEffect(hitX, hitY);

    if ((move as HitboxDef).damage >= 25) {
      this.scene.cameras.main.shake(120, 0.005);
    }
  }

  private spawnHitEffect(x: number, y: number): void {
    const spark = this.scene.add.rectangle(x, y, 20, 20, 0xffffff);
    spark.setDepth(100);
    this.scene.tweens.add({
      targets: spark,
      scaleX: 2.5,
      scaleY: 2.5,
      alpha: 0,
      duration: 200,
      onComplete: () => spark.destroy(),
    });
    this.particles.emit(x, y, 8, 0xffff88);
  }

  private getHitbox(char: BaseCharacter, def: HitboxDef | MoveHitbox): Phaser.Geom.Rectangle {
    const dir = char.facing === Direction.Right ? 1 : -1;
    return new Phaser.Geom.Rectangle(
      char.x + def.offsetX * dir - def.width / 2,
      char.groundY + def.offsetY - def.height / 2,
      def.width,
      def.height
    );
  }

  private getHurtbox(char: BaseCharacter): Phaser.Geom.Rectangle {
    return new Phaser.Geom.Rectangle(
      char.x - char.stats.width / 2,
      char.groundY - char.stats.height,
      char.stats.width,
      char.stats.height
    );
  }

  private drawDebugRect(rect: Phaser.Geom.Rectangle, color: number, alpha: number): void {
    if (!this.debugGraphics) return;
    this.debugGraphics.fillStyle(color, alpha);
    this.debugGraphics.fillRect(rect.x, rect.y, rect.width, rect.height);
  }
}
