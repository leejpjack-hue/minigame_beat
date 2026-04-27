import Phaser from 'phaser';
import { CharacterState, CharacterStateType } from '../enums/CharacterState';
import { Direction } from '../enums/Direction';
import { StateMachine } from '../systems/StateMachine';
import { FighterStats } from './fighters/FighterStats';
import { clamp } from '../utils/MathHelpers';
import { STAGE_WALKABLE_Y_MIN, STAGE_WALKABLE_Y_MAX, KNOCKBACK_FRICTION } from '../config/constants';

export abstract class BaseCharacter extends Phaser.GameObjects.Container {
  // Stats
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  speed: number;
  attackPower: number;
  defensePower: number;
  stats: FighterStats;

  // Position / depth
  groundY: number;
  jumpHeight = 0;
  isGrounded = true;
  facing: Direction = Direction.Right;
  jumpsUsed = 0;
  maxJumps = 1;

  // Velocity
  vx = 0;
  vy = 0;
  knockbackX = 0;
  knockbackY = 0;

  // Jump
  private jumpDuration = 0;
  private jumpElapsed = 0;

  // Dash
  dashDuration = 0;
  dashElapsed = 0;
  dashDir = 1;

  // State machine
  stateMachine: StateMachine<CharacterStateType>;

  // Visuals
  protected bodySprite!: Phaser.GameObjects.Image;
  protected shadowSprite!: Phaser.GameObjects.Image;
  protected stateLabel!: Phaser.GameObjects.Text;

  // Attack tracking
  attackFrame = 0;
  attackTotalFrames = 0;
  currentAttackName = '';
  isHitboxActive = false;

  // Attack window (fraction of total frames)
  attackActiveStart = 0.25;
  attackActiveEnd = 0.65;

  // Attack travel (gap-closer)
  private travelDistance = 0;
  private travelDuration = 0;
  private travelElapsed = 0;
  private travelStartX = 0;

  // Super-armor (ignore hurt state during attack)
  superArmorActive = false;

  // Self-buff
  atkMultiplier = 1;
  private atkBuffTimer = 0;

  // Invulnerability
  invulnerable = false;
  invulnerableTimer = 0;

  // Light-chain tracking (for L1 -> L2 -> L3 chain)
  lightChainIndex = 0;
  lightChainWindow = 0;

  get isAlive(): boolean {
    return this.hp > 0;
  }

  constructor(scene: Phaser.Scene, x: number, y: number, stats: FighterStats) {
    super(scene, x, y);
    this.stats = stats;
    this.hp = stats.maxHp;
    this.maxHp = stats.maxHp;
    this.mp = stats.maxMp;
    this.maxMp = stats.maxMp;
    this.speed = stats.speed;
    this.attackPower = stats.attackPower;
    this.defensePower = stats.defensePower;
    this.groundY = y;
    if (stats.doubleJump) this.maxJumps = 2;

    this.stateMachine = new StateMachine<CharacterStateType>(CharacterState.Idle);
    this.defineStates();
    this.createVisuals();
    scene.add.existing(this);
  }

  protected createVisuals(): void {
    this.shadowSprite = this.scene.add.image(0, 0, 'shadow');
    this.shadowSprite.setAlpha(0.4);
    this.shadowSprite.setDepth(-1);

    this.bodySprite = this.scene.add.image(0, 0, this.stats.spriteKey);
    this.bodySprite.setOrigin(0.5, 1);
    this.add(this.bodySprite);

    this.stateLabel = this.scene.add.text(0, -this.stats.height - 10, 'idle', {
      fontSize: '10px',
      color: '#ffff00',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.add(this.stateLabel);
  }

  protected abstract defineStates(): void;

  move(dx: number, dy: number): void {
    if (this.stateMachine.currentState !== CharacterState.Walk &&
        this.stateMachine.currentState !== CharacterState.Idle) {
      return;
    }
    const dt = this.scene.game.loop.delta / 1000;
    const newX = this.x + dx * this.speed * dt;
    const newGroundY = this.groundY + dy * this.speed * dt;
    this.x = newX;
    this.groundY = clamp(newGroundY, STAGE_WALKABLE_Y_MIN, STAGE_WALKABLE_Y_MAX);
    if (dx > 0) this.facing = Direction.Right;
    else if (dx < 0) this.facing = Direction.Left;
    if (dx !== 0 || dy !== 0) {
      this.stateMachine.transition(CharacterState.Walk);
    }
  }

  jump(): void {
    if (this.jumpsUsed >= this.maxJumps) return;
    const state = this.stateMachine.currentState;
    if (state !== CharacterState.Idle && state !== CharacterState.Walk && state !== CharacterState.Jump) return;
    // Second jump re-arms the arc
    this.isGrounded = false;
    this.jumpDuration = 500;
    this.jumpElapsed = 0;
    this.jumpsUsed += 1;
    if (state !== CharacterState.Jump) {
      this.stateMachine.transition(CharacterState.Jump);
    }
  }

  takeDamage(amount: number, knockbackX: number, knockbackY: number): void {
    if (this.invulnerable || !this.isAlive) return;
    if (this.superArmorActive && this.stateMachine.currentState === CharacterState.Attack) {
      // Absorb: take damage but do not interrupt
      const absorb = Math.max(1, Math.floor((amount - this.defensePower) * 0.5));
      this.hp = Math.max(0, this.hp - absorb);
      this.bodySprite.setTintFill(0xffffff);
      this.scene.time.delayedCall(80, () => { if (this.bodySprite) this.bodySprite.clearTint(); });
      this.spawnDamageNumber(absorb);
      if (this.hp <= 0) this.stateMachine.forceTransition(CharacterState.Dead);
      return;
    }

    const finalDamage = Math.max(1, amount - this.defensePower);
    this.hp = Math.max(0, this.hp - finalDamage);
    this.knockbackX = knockbackX;
    this.knockbackY = knockbackY;

    // Hit flash effect
    this.bodySprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(100, () => {
      if (this.bodySprite) this.bodySprite.clearTint();
    });

    // Damage number popup
    this.spawnDamageNumber(finalDamage);

    if (this.hp <= 0) {
      this.scene.sound.play('voice_ko');
      this.stateMachine.forceTransition(CharacterState.Dead);
    } else {
      // Random shout when hurt
      if (Math.random() > 0.7) {
        const shouts = ['voice_shout1', 'voice_shout2'];
        this.scene.sound.play(shouts[Math.floor(Math.random() * shouts.length)], { volume: 0.6 });
      }
      this.stateMachine.forceTransition(CharacterState.Hurt);
      this.bodySprite.setTint(0xffffff);
      this.scene.time.delayedCall(100, () => { if (this.bodySprite) this.bodySprite.clearTint(); });
    }
  }

  private spawnDamageNumber(damage: number): void {
    const isCrit = damage >= 25;
    const size = isCrit ? '24px' : '16px';
    const color = isCrit ? '#ff4444' : '#ffffff';
    
    const damageText = this.scene.add.text(this.x, this.y - this.stats.height - 10, damage.toString(), {
      fontSize: size,
      fontFamily: 'monospace',
      color: color,
      stroke: '#000000',
      strokeThickness: 3,
      fontStyle: isCrit ? 'bold' : 'normal'
    }).setOrigin(0.5).setDepth(2000);

    const xOffset = (Math.random() - 0.5) * 40;
    
    this.scene.tweens.add({
      targets: damageText,
      x: damageText.x + xOffset,
      y: damageText.y - 40,
      alpha: 0,
      scale: isCrit ? 1.5 : 1,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => damageText.destroy()
    });
  }

  // Sword-light trail emitter state (active while attacking with sword-wielding fighters)
  private swordTrailCooldown = 0;

  /** Per-fighter accent color for generic startup FX. */
  private fighterAccentColor(): number {
    const key = String(this.stats?.fighterKey ?? '');
    switch (key) {
      case 'xiang_shao_long':return 0x66ddff; // cyan sword light (墨子劍法 — taught by 元宗)
      case 'lian_jin':       return 0xff5566; // crimson (連晉 ruthless edge)
      case 'wu_ting_fang':   return 0xff88cc; // pink (agile whirl)
      case 'shan_rou':       return 0xaa66ff; // purple (shadow daggers)
      case 'ying_zheng':     return 0xffdd44; // imperial gold
      default:               return 0xffcc33;
    }
  }

  /** Expanding charge ring at character feet. */
  private fxChargeRing(color: number, startR = 14, endR = 48, dur = 320): void {
    const ring = this.scene.add.circle(this.x, this.groundY - 4, startR, color, 0);
    ring.setStrokeStyle(3, color, 0.9);
    ring.setDepth(50);
    // Tween scale (not radius) to avoid Arc.geom null-deref if the scene tears down mid-tween
    const scaleEnd = endR / Math.max(1, startR);
    this.scene.tweens.add({
      targets: ring, scaleX: scaleEnd, scaleY: scaleEnd, alpha: 0, duration: dur, ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy(),
    });
  }

  /** Radial sparks at character feet. */
  private fxRadialSparks(color: number, count = 6, dist = 26): void {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const spark = this.scene.add.rectangle(
        this.x + Math.cos(ang) * 14,
        this.groundY - 8 + Math.sin(ang) * 4,
        4, 4, color,
      );
      spark.setDepth(51);
      this.scene.tweens.add({
        targets: spark,
        x: spark.x + Math.cos(ang) * dist,
        y: spark.y - 18 - Math.random() * 10,
        alpha: 0, duration: 280, ease: 'Quad.easeOut',
        onComplete: () => spark.destroy(),
      });
    }
  }

  /** Spawn a single sword-light streak ahead of the character (used by LianJin sword trail). */
  private fxSwordStreak(): void {
    const dir = this.facing === Direction.Right ? 1 : -1;
    const cx = this.x + 26 * dir;
    const cy = this.groundY - (this.stats?.height ?? 46) * 0.55;
    const streak = this.scene.add.rectangle(cx, cy, 28, 4, 0x99eeff, 0.9);
    streak.setOrigin(0.5, 0.5);
    streak.rotation = -0.35 * dir;
    streak.setDepth(this.groundY + 3);
    this.scene.tweens.add({
      targets: streak, scaleX: 2.0, scaleY: 0.4, alpha: 0,
      duration: 180, ease: 'Quad.easeOut',
      onComplete: () => streak.destroy(),
    });
    // core glow
    const glow = this.scene.add.circle(cx, cy, 6, 0xffffff, 0.9);
    glow.setDepth(this.groundY + 4);
    this.scene.tweens.add({
      targets: glow, scaleX: 0.33, scaleY: 0.33, alpha: 0, duration: 160,
      onComplete: () => glow.destroy(),
    });
  }

  /** Vertical light pillar for anti-air / uppercut. */
  private fxUppercutPillar(color: number): void {
    const pillar = this.scene.add.rectangle(this.x, this.groundY - 40, 18, 120, color, 0.6);
    pillar.setDepth(this.groundY + 2);
    this.scene.tweens.add({
      targets: pillar, scaleY: 1.6, alpha: 0, y: pillar.y - 40,
      duration: 320, ease: 'Cubic.easeOut',
      onComplete: () => pillar.destroy(),
    });
  }

  /** Horizontal shockwave used for sweep/sword-wave. */
  private fxShockwaveHoriz(color: number): void {
    const dir = this.facing === Direction.Right ? 1 : -1;
    const bar = this.scene.add.rectangle(this.x + 30 * dir, this.groundY - 20, 18, 10, color, 0.8);
    bar.setDepth(this.groundY + 2);
    this.scene.tweens.add({
      targets: bar, scaleX: 8, alpha: 0, x: bar.x + 120 * dir,
      duration: 280, ease: 'Cubic.easeOut',
      onComplete: () => bar.destroy(),
    });
  }

  /** Dark teleport puff for backstab. */
  private fxShadowPuff(): void {
    for (let i = 0; i < 10; i++) {
      const startR = 6 + Math.random() * 4;
      const puff = this.scene.add.circle(
        this.x + (Math.random() - 0.5) * 30,
        this.groundY - 20 - Math.random() * 30,
        startR, 0x442266, 0.8,
      );
      puff.setDepth(this.groundY + 2);
      this.scene.tweens.add({
        targets: puff, scaleX: 14 / startR, scaleY: 14 / startR, alpha: 0,
        duration: 360, ease: 'Quad.easeOut',
        onComplete: () => puff.destroy(),
      });
    }
  }

  /** Imperial golden aura (YingZheng specials). */
  private fxImperialAura(): void {
    const aura = this.scene.add.circle(this.x, this.groundY - 24, 30, 0xffdd44, 0.35);
    aura.setDepth(this.groundY + 1);
    aura.setStrokeStyle(2, 0xffee88, 0.9);
    this.scene.tweens.add({
      targets: aura, scaleX: 70 / 30, scaleY: 70 / 30, alpha: 0,
      duration: 500, ease: 'Cubic.easeOut',
      onComplete: () => aura.destroy(),
    });
  }

  /**
   * Visual startup FX for heavy / special attacks.
   * moveName lets us pick a move-specific effect in addition to the base flourish.
   */
  playSpecialAttackFx(kind: 'heavy' | 'special', moveName?: string): void {
    const accent = this.fighterAccentColor();
    const color = kind === 'heavy' ? 0xffcc33 : accent;

    // Body tint pulse
    if (this.bodySprite) {
      this.bodySprite.setTint(color);
      this.scene.time.delayedCall(260, () => { if (this.bodySprite) this.bodySprite.clearTint(); });
    }
    this.fxChargeRing(color);
    this.fxRadialSparks(color);

    // Move-specific flourish
    switch (moveName) {
      case 'uppercut':
        this.fxUppercutPillar(0xffee88);
        break;
      case 'sweep_stomp':
        this.fxShockwaveHoriz(0xff9933);
        this.scene.cameras.main.shake(120, 0.006);
        break;
      case 'sword_wave':
        this.fxShockwaveHoriz(0x66ddff);
        this.fxSwordStreak();
        break;
      case 'phantom_step':
      case 'counter':
        // 墨子劍法 flash — triple sword streak
        for (let i = 0; i < 3; i++) {
          this.scene.time.delayedCall(40 * i, () => this.fxSwordStreak());
        }
        break;
      case 'backstab':
        this.fxShadowPuff();
        break;
      case 'dagger_throw':
        this.fxShockwaveHoriz(0xaa66ff);
        break;
      case 'bleed_combo':
      case 'whirl':
        // fast spinning ring
        this.fxChargeRing(color, 10, 40, 240);
        this.fxChargeRing(color, 14, 52, 320);
        break;
      case 'king_charge':
      case 'imperial_palm':
        this.fxImperialAura();
        this.scene.cameras.main.shake(120, 0.006);
        break;
      case 'flying_knee':
        this.fxShockwaveHoriz(0xffcc33);
        break;
      case 'super':
        this.scene.cameras.main.shake(200, 0.012);
        this.scene.cameras.main.flash(180, 255, 240, 180);
        this.fxChargeRing(color, 20, 80, 500);

        // Dynamic camera zoom on super moves
        this.scene.cameras.main.zoomTo(1.3, 200, 'Sine.easeOut', true);
        this.scene.time.delayedCall(800, () => {
          this.scene.cameras.main.zoomTo(1, 400, 'Sine.easeInOut', true);
        });
        break;
      default:
        break;
    }

    if (moveName === 'super') {
      this.scene.cameras.main.shake(150, 0.01);
      this.scene.cameras.main.flash(200, 255, 200, 100);
      this.fxChargeRing(color, 30, 100, 600);
      
      // Dynamic camera zoom on super moves
      this.scene.cameras.main.zoomTo(1.3, 200, 'Sine.easeOut', true);
      this.scene.time.delayedCall(800, () => {
        this.scene.cameras.main.zoomTo(1, 400, 'Sine.easeInOut', true);
      });
    } else if (kind === 'special' && moveName !== 'super') {
      this.scene.cameras.main.shake(80, 0.004);
      this.scene.cameras.main.flash(90, 255, 200, 255);
    }
  }

  /** Emit sword-trail streaks during active attack frames (called each tick for sword fighters). */
  protected updateSwordTrail(delta: number): void {
    const key = String(this.stats?.fighterKey ?? '');
    const sword = key === 'xiang_shao_long'; // 墨子劍法 glows while sword moves (項少龍)
    if (!sword) return;
    if (this.stateMachine.currentState !== CharacterState.Attack) {
      this.swordTrailCooldown = 0;
      return;
    }
    if (!this.isHitboxActive) return;
    this.swordTrailCooldown -= delta;
    if (this.swordTrailCooldown <= 0) {
      this.swordTrailCooldown = 55; // emit streak ~18 Hz
      this.fxSwordStreak();
    }
  }

  startAttack(attackName: string, totalFrames: number, options?: {
    activeStart?: number;
    activeEnd?: number;
    superArmor?: boolean;
    travel?: { distance: number; duration: number };
    teleportBehind?: boolean;
  }): boolean {
    const state = this.stateMachine.currentState;
    if (state === CharacterState.Attack || state === CharacterState.Hurt || state === CharacterState.Dead) return false;

    this.currentAttackName = attackName;
    this.attackFrame = 0;
    this.attackTotalFrames = totalFrames;
    this.attackActiveStart = options?.activeStart ?? 0.25;
    this.attackActiveEnd = options?.activeEnd ?? 0.65;
    this.superArmorActive = !!options?.superArmor;

    if (options?.travel) {
      this.travelDistance = options.travel.distance;
      this.travelDuration = options.travel.duration;
      this.travelElapsed = 0;
      this.travelStartX = this.x;
    } else {
      this.travelDistance = 0;
      this.travelDuration = 0;
    }

    if (options?.teleportBehind) {
      // This is triggered by PlayerCharacter with target reference;
      // effect is a blink tween here. Position change happens in subclass.
      this.setAlpha(0.4);
      this.scene.time.delayedCall(120, () => { if (this.active) this.setAlpha(1); });
    }

    this.stateMachine.transition(CharacterState.Attack);
    return true;
  }

  performDash(direction: 1 | -1): void {
    const state = this.stateMachine.currentState;
    if (state === CharacterState.Dead || state === CharacterState.Hurt || state === CharacterState.Dash) return;
    
    // Dash cancel attack!
    if (state === CharacterState.Attack) {
      this.currentAttackName = '';
      this.isHitboxActive = false;
      this.travelDuration = 0;
      this.superArmorActive = false;
      this.scene.cameras.main.flash(50, 200, 255, 255);
    }
    
    this.dashDuration = 300;
    this.dashElapsed = 0;
    this.dashDir = direction;
    this.facing = direction === 1 ? Direction.Right : Direction.Left;
    this.invulnerable = true;
    this.invulnerableTimer = 300;
    
    this.stateMachine.forceTransition(CharacterState.Dash);
    this.scene.sound.play('sfx_slash', { volume: 0.2 });
  }

  applySelfBuff(atkMul: number, duration: number): void {
    this.atkMultiplier = atkMul;
    this.atkBuffTimer = duration;
    this.bodySprite.setTint(0xffdd44);
  }

  update(time: number, delta: number): void {
    this.stateMachine.update(time, delta);

    // MP Regeneration
    if (this.isAlive) {
      const regenRate = this.stats.mpRegenRate ?? 0;
      if (regenRate > 0 && this.mp < this.maxMp) {
        this.mp = Math.min(this.maxMp, this.mp + regenRate * (delta / 1000));
      }
    }

    // Light-chain window decay
    if (this.lightChainWindow > 0) {
      this.lightChainWindow -= delta;
      if (this.lightChainWindow <= 0) this.lightChainIndex = 0;
    }

    // Jump arc
    if (!this.isGrounded) {
      this.jumpElapsed += delta;
      const progress = this.jumpElapsed / this.jumpDuration;
      if (progress >= 1) {
        this.jumpHeight = 0;
        this.isGrounded = true;
        this.jumpElapsed = 0;
        this.jumpsUsed = 0;
        if (this.stateMachine.currentState === CharacterState.Jump) {
          this.stateMachine.transition(CharacterState.Idle);
        }
      } else {
        this.jumpHeight = this.stats.jumpPower * Math.sin(progress * Math.PI);
      }
    }

    // Knockback
    if (this.knockbackX !== 0 || this.knockbackY !== 0) {
      this.x += this.knockbackX * (delta / 1000);
      this.groundY = clamp(this.groundY + this.knockbackY * (delta / 1000), STAGE_WALKABLE_Y_MIN, STAGE_WALKABLE_Y_MAX);
      this.knockbackX *= KNOCKBACK_FRICTION;
      this.knockbackY *= KNOCKBACK_FRICTION;
      if (Math.abs(this.knockbackX) < 1) this.knockbackX = 0;
      if (Math.abs(this.knockbackY) < 1) this.knockbackY = 0;
    }

    // Dash motion
    if (this.stateMachine.currentState === CharacterState.Dash) {
      this.dashElapsed += delta;
      const speedMultiplier = 2.5; // Dash is faster than walking
      this.x += this.dashDir * this.speed * speedMultiplier * (delta / 1000);
      
      // Afterimage effect
      if (Math.random() > 0.4) {
        const ghost = this.scene.add.image(this.x, this.y, this.bodySprite.texture.key);
        ghost.setFlipX(this.facing === Direction.Left);
        ghost.setOrigin(0.5, 1).setDepth(this.groundY - 1).setAlpha(0.5).setTint(0x88ccff);
        this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 250, onComplete: () => ghost.destroy() });
      }

      if (this.dashElapsed >= this.dashDuration) {
        this.stateMachine.transition(CharacterState.Idle);
      }
    }

    // Dust particles on walk/dash
    if ((this.stateMachine.currentState === CharacterState.Walk || this.stateMachine.currentState === CharacterState.Dash) && this.isGrounded) {
      if (Math.random() > 0.7) { // 30% chance per frame
        const dust = this.scene.add.circle(this.x + (Math.random() - 0.5) * 16, this.groundY, 2 + Math.random() * 3, 0xaaaaaa, 0.6);
        this.scene.physics.add.existing(dust);
        const body = dust.body as Phaser.Physics.Arcade.Body;
        if (body) {
           body.setVelocityY(-10 - Math.random() * 20);
           // Move dust opposite to facing direction
           body.setVelocityX((this.facing === Direction.Left ? 1 : -1) * (10 + Math.random() * 20));
        }
        dust.setDepth(this.groundY + 1);
        this.scene.tweens.add({ targets: dust, alpha: 0, scale: 2, duration: 400 + Math.random() * 200, onComplete: () => dust.destroy() });
      }
    }

    // Attack frame advance
    if (this.stateMachine.currentState === CharacterState.Attack) {
      this.attackFrame += delta;
      const frac = this.attackFrame / this.attackTotalFrames;
      this.isHitboxActive = frac >= this.attackActiveStart && frac <= this.attackActiveEnd;

      // Travel motion (gap-closer)
      if (this.travelDuration > 0) {
        this.travelElapsed += delta;
        const tFrac = Math.min(1, this.travelElapsed / this.travelDuration);
        const eased = 1 - Math.pow(1 - tFrac, 2); // ease-out
        const dir = this.facing === Direction.Right ? 1 : -1;
        this.x = this.travelStartX + this.travelDistance * eased * dir;
      }

      // Attack trail effect (semi-transparent afterimages)
      if (Math.random() > 0.6) {
        const ghost = this.scene.add.image(this.x, this.y, this.bodySprite.texture.key);
        ghost.setFlipX(this.facing === Direction.Left);
        ghost.setOrigin(0.5, 1).setDepth(this.groundY - 1).setAlpha(0.3).setTint(0xffaaaa);
        this.scene.tweens.add({ targets: ghost, alpha: 0, duration: 250, onComplete: () => ghost.destroy() });
      }

      if (this.attackFrame >= this.attackTotalFrames) {
        this.currentAttackName = '';
        this.attackFrame = 0;
        this.isHitboxActive = false;
        this.superArmorActive = false;
        this.travelDuration = 0;
        this.stateMachine.transition(CharacterState.Idle);
      }
    }

    // Buff timer
    if (this.atkBuffTimer > 0) {
      this.atkBuffTimer -= delta;
      if (this.atkBuffTimer <= 0) {
        this.atkMultiplier = 1;
        this.bodySprite.clearTint();
      }
    }

    // Invulnerability
    if (this.invulnerable) {
      this.invulnerableTimer -= delta;
      if (this.invulnerableTimer <= 0) {
        this.invulnerable = false;
        this.setAlpha(1);
      }
    }

    // Auto-idle from hurt
    if (this.stateMachine.currentState === CharacterState.Hurt &&
        this.stateMachine.getStateDuration() > 300) {
      this.stateMachine.transition(CharacterState.Idle);
      this.invulnerable = true;
      this.invulnerableTimer = 500;
      this.setAlpha(0.5);
    }

    this.updateSwordTrail(delta);
    this.updateVisuals();
  }

  /** Called by PlayerCharacter to extend the light-chain window after each L hit */
  bumpLightChainWindow(ms: number = 450): void {
    this.lightChainWindow = ms;
  }

  protected updateVisuals(): void {
    const visualY = this.groundY - this.jumpHeight;
    this.bodySprite.setFlipX(this.facing === Direction.Left);
    this.y = visualY;
    this.shadowSprite.setPosition(this.x, this.groundY);
    this.stateLabel.setText(this.stateMachine.currentState);
    this.updatePoseTexture();
  }

  private currentPoseKey = '';
  protected updatePoseTexture(): void {
    const s = this.stateMachine.currentState;
    let pose: 'idle' | 'walk' | 'attack' = 'idle';
    if (s === CharacterState.Walk) pose = 'walk';
    else if (s === CharacterState.Attack) pose = 'attack';
    else if (s === CharacterState.Jump) pose = 'walk';
    else if (s === CharacterState.Dash) pose = 'walk';
    else if (s === CharacterState.Hurt) pose = 'idle';
    const desired = this.stats.spriteKey + '_' + pose;
    if (this.currentPoseKey === desired) return;
    if (this.scene.textures.exists(desired)) {
      this.bodySprite.setTexture(desired);
      this.currentPoseKey = desired;
    }
  }

  destroy(fromScene?: boolean): void {
    this.shadowSprite?.destroy();
    super.destroy(fromScene);
  }
}
