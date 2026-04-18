import { BaseCharacter } from './BaseCharacter';
import { CharacterState, CharacterStateType } from '../enums/CharacterState';
import { FighterStats, DEFAULT_STATS } from './fighters/FighterStats';
import { EnemyTypeDef, ENEMY_HITBOXES, EnemyTypeId } from './enemies/EnemyTypes';
import { Direction } from '../enums/Direction';

export class EnemyCharacter extends BaseCharacter {
  public aiType: string = 'normal';
  public enemyTypeId: EnemyTypeId = 'soldier';
  public typeDef: EnemyTypeDef | null = null;
  public onProjectile?: (attacker: EnemyCharacter) => void;

  constructor(scene: Phaser.Scene, x: number, y: number, stats?: Partial<FighterStats>, typeDef?: EnemyTypeDef) {
    const mergedStats: FighterStats = { ...DEFAULT_STATS, ...stats };
    if (typeDef) {
      mergedStats.spriteKey = typeDef.spriteKey;
      if (typeDef.stats.width) mergedStats.width = typeDef.stats.width;
      if (typeDef.stats.height) mergedStats.height = typeDef.stats.height;
    }
    super(scene, x, y, mergedStats);
    if (typeDef) {
      this.typeDef = typeDef;
      this.enemyTypeId = typeDef.id;
      this.aiType = typeDef.aiPersonality;
    }
  }

  protected defineStates(): void {
    this.stateMachine.addState(CharacterState.Idle, {
      canTransitionFrom: [CharacterState.Walk, CharacterState.Attack, CharacterState.Hurt, CharacterState.Block, CharacterState.Jump],
      onEnter: () => this.stateLabel.setColor('#ffff00'),
    });
    this.stateMachine.addState(CharacterState.Walk, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Attack],
      onEnter: () => this.stateLabel.setColor('#88ff88'),
    });
    this.stateMachine.addState(CharacterState.Jump, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk],
      onEnter: () => this.stateLabel.setColor('#8888ff'),
    });
    this.stateMachine.addState(CharacterState.Attack, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk, CharacterState.Block],
      onEnter: () => this.stateLabel.setColor('#ff8888'),
    });
    this.stateMachine.addState(CharacterState.Hurt, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk, CharacterState.Attack, CharacterState.Block],
      onEnter: () => this.stateLabel.setColor('#ff4444'),
    });
    this.stateMachine.addState(CharacterState.Dead, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk, CharacterState.Attack, CharacterState.Hurt, CharacterState.Block],
      onEnter: () => {
        this.stateLabel.setColor('#666666');
        this.bodySprite.setTint(0x666666);
        this.scene.tweens.add({
          targets: this, alpha: 0, duration: 1000, delay: 500,
          onComplete: () => this.destroy(),
        });
      },
    });
    this.stateMachine.addState(CharacterState.Block, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk],
      onEnter: () => this.stateLabel.setColor('#44aaff'),
    });
  }

  moveToward(targetX: number, targetY: number): void {
    const state = this.stateMachine.currentState;
    if (state === CharacterState.Attack || state === CharacterState.Hurt || state === CharacterState.Dead) return;
    const dx = targetX - this.x;
    const dy = targetY - this.groundY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 2) return;
    this.move(dx / dist, dy / dist);
  }

  moveAway(fromX: number, fromY: number): void {
    this.moveToward(this.x + (this.x - fromX), this.groundY + (this.groundY - fromY));
  }

  performAttack(): void {
    const state = this.stateMachine.currentState;
    if (state === CharacterState.Attack || state === CharacterState.Hurt || state === CharacterState.Dead) return;
    const attackName = this.typeDef?.attackName ?? 'enemy_attack';
    const hb = ENEMY_HITBOXES[attackName];
    if (!hb) { this.startAttack(attackName, 400); return; }
    const total = this.aiType === 'boss' || this.aiType === 'miniboss_lj' || this.aiType === 'miniboss_tx' ? 600 : 450;
    this.startAttack(attackName, total, { activeStart: 0.35, activeEnd: 0.65 });

    // Fire projectile mid-animation if archer-like
    if (this.typeDef?.hasProjectile && this.onProjectile) {
      this.scene.time.delayedCall(total * 0.45, () => {
        if (this.isAlive && this.stateMachine.currentState === CharacterState.Attack) {
          this.onProjectile?.(this);
        }
      });
    }
  }
}
