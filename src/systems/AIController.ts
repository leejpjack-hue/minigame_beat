import { BaseCharacter } from '../characters/BaseCharacter';
import { EnemyCharacter } from '../characters/EnemyCharacter';
import { CharacterState } from '../enums/CharacterState';
import { ENEMY_ATTACK_RANGE, ENEMY_CHASE_RANGE } from '../config/constants';

export interface AIPersonality {
  aggressiveness: number;
  reactionTime: number;
  preferredDistance: number;
  blockChance: number;
  kite?: boolean;          // retreat when too close (archer)
  chargeLine?: boolean;    // cavalry-like straight charge
  shieldCounter?: boolean; // shieldman counter on block
  comboCount?: number;     // elite: multi-hit combos
}

const PERSONALITIES: Record<string, AIPersonality> = {
  normal:       { aggressiveness: 0.4, reactionTime: 800, preferredDistance: 80, blockChance: 0.1 },
  elite:        { aggressiveness: 0.7, reactionTime: 500, preferredDistance: 60, blockChance: 0.3, comboCount: 2 },
  boss:         { aggressiveness: 0.9, reactionTime: 300, preferredDistance: 50, blockChance: 0.5 },
  archer:       { aggressiveness: 0.55, reactionTime: 700, preferredDistance: 180, blockChance: 0.05, kite: true },
  spearman:     { aggressiveness: 0.6, reactionTime: 600, preferredDistance: 90, blockChance: 0.2 },
  shield:       { aggressiveness: 0.35, reactionTime: 700, preferredDistance: 55, blockChance: 0.7, shieldCounter: true },
  cavalry:      { aggressiveness: 0.85, reactionTime: 400, preferredDistance: 50, blockChance: 0.05, chargeLine: true },
  miniboss_lj:  { aggressiveness: 0.85, reactionTime: 350, preferredDistance: 55, blockChance: 0.4 },
  miniboss_tx:  { aggressiveness: 0.7, reactionTime: 450, preferredDistance: 100, blockChance: 0.4 },
};

enum AIAction {
  Idle = 'idle',
  Patrol = 'patrol',
  Chase = 'chase',
  Attack = 'attack',
  Retreat = 'retreat',
  Block = 'block',
  Kite = 'kite',
  ChargeLine = 'chargeLine',
}

export class AIController {
  private owner: EnemyCharacter;
  private target!: BaseCharacter;
  private personality: AIPersonality;
  private decisionTimer = 0;
  private currentAction: AIAction = AIAction.Idle;
  private actionDuration = 0;
  private patrolTarget = { x: 0, y: 0 };
  private chargeDir: 1 | -1 = 1;

  constructor(owner: EnemyCharacter, type: string = 'normal') {
    this.owner = owner;
    this.owner.aiType = type;
    this.personality = PERSONALITIES[type] ?? PERSONALITIES.normal;
  }

  setTarget(target: BaseCharacter): void {
    this.target = target;
  }

  update(time: number, delta: number): void {
    if (!this.target || !this.owner.isAlive) return;
    const state = this.owner.stateMachine.currentState;
    if (state === CharacterState.Hurt || state === CharacterState.Dead) return;

    this.decisionTimer -= delta;
    if (this.decisionTimer > 0) {
      this.executeCurrentAction(delta);
      return;
    }
    this.decisionTimer = this.personality.reactionTime + Math.random() * 200;
    this.makeDecision();
    this.executeCurrentAction(delta);
  }

  private makeDecision(): void {
    const dx = this.target.x - this.owner.x;
    const dy = this.target.groundY - this.owner.groundY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hpPercent = this.owner.hp / this.owner.maxHp;
    const roll = Math.random();
    const pref = this.personality.preferredDistance;

    // Face target
    if (dx > 5) this.owner.facing = 1;
    else if (dx < -5) this.owner.facing = -1;

    if (this.personality.chargeLine && dist > pref) {
      this.currentAction = AIAction.ChargeLine;
      this.chargeDir = dx > 0 ? 1 : -1;
      this.actionDuration = 700;
      return;
    }

    if (this.personality.kite && dist < pref - 20) {
      this.currentAction = AIAction.Kite;
      this.actionDuration = 400 + Math.random() * 300;
      return;
    }

    if (hpPercent < 0.2 && roll < 0.5) {
      this.currentAction = AIAction.Retreat;
      this.actionDuration = 500 + Math.random() * 500;
      return;
    }

    const attackThreshold = this.personality.kite ? pref + 30 : ENEMY_ATTACK_RANGE;
    if (dist < attackThreshold) {
      if (roll < this.personality.aggressiveness) {
        this.currentAction = AIAction.Attack;
        this.actionDuration = 400;
      } else if (roll < this.personality.aggressiveness + this.personality.blockChance) {
        this.currentAction = AIAction.Block;
        this.actionDuration = 300 + Math.random() * 300;
      } else {
        this.currentAction = AIAction.Retreat;
        this.actionDuration = 300 + Math.random() * 200;
      }
    } else if (dist < ENEMY_CHASE_RANGE || this.personality.kite) {
      if (roll < this.personality.aggressiveness) {
        this.currentAction = AIAction.Chase;
        this.actionDuration = 300 + Math.random() * 400;
      } else {
        this.currentAction = AIAction.Idle;
        this.actionDuration = 200 + Math.random() * 300;
      }
    } else {
      if (roll < this.personality.aggressiveness * 0.6) {
        this.currentAction = AIAction.Chase;
        this.actionDuration = 500 + Math.random() * 500;
      } else {
        this.currentAction = AIAction.Patrol;
        this.patrolTarget = {
          x: this.owner.x + (Math.random() - 0.5) * 150,
          y: this.owner.groundY + (Math.random() - 0.5) * 60,
        };
        this.actionDuration = 800 + Math.random() * 600;
      }
    }
  }

  private executeCurrentAction(delta: number): void {
    this.actionDuration -= delta;
    if (this.actionDuration <= 0) {
      this.currentAction = AIAction.Idle;
      return;
    }
    switch (this.currentAction) {
      case AIAction.Chase:
        this.owner.moveToward(this.target.x, this.target.groundY);
        break;
      case AIAction.Attack:
        this.owner.performAttack();
        break;
      case AIAction.Retreat:
      case AIAction.Kite: {
        this.owner.moveAway(this.target.x, this.target.groundY);
        break;
      }
      case AIAction.Patrol:
        this.owner.moveToward(this.patrolTarget.x, this.patrolTarget.y);
        break;
      case AIAction.Block:
        if (this.owner.stateMachine.currentState !== CharacterState.Block) {
          this.owner.stateMachine.forceTransition(CharacterState.Block);
        }
        break;
      case AIAction.ChargeLine: {
        // Fixed horizontal charge
        this.owner.move(this.chargeDir, 0);
        // Attack when close
        const dx = Math.abs(this.target.x - this.owner.x);
        if (dx < 60) {
          this.owner.performAttack();
          this.currentAction = AIAction.Idle;
        }
        break;
      }
      case AIAction.Idle:
      default:
        break;
    }
  }
}
