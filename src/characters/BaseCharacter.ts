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
      this.bodySprite.setTint(0xff8888);
      this.scene.time.delayedCall(80, () => { if (this.bodySprite) this.bodySprite.clearTint(); });
      if (this.hp <= 0) this.stateMachine.forceTransition(CharacterState.Dead);
      return;
    }

    const finalDamage = Math.max(1, amount - this.defensePower);
    this.hp = Math.max(0, this.hp - finalDamage);
    this.knockbackX = knockbackX;
    this.knockbackY = knockbackY;

    if (this.hp <= 0) {
      this.stateMachine.forceTransition(CharacterState.Dead);
    } else {
      this.stateMachine.forceTransition(CharacterState.Hurt);
      this.bodySprite.setTint(0xffffff);
      this.scene.time.delayedCall(100, () => { if (this.bodySprite) this.bodySprite.clearTint(); });
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

  applySelfBuff(atkMul: number, duration: number): void {
    this.atkMultiplier = atkMul;
    this.atkBuffTimer = duration;
    this.bodySprite.setTint(0xffdd44);
  }

  update(time: number, delta: number): void {
    this.stateMachine.update(time, delta);

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
