import { BaseCharacter } from '../characters/BaseCharacter';
import { EnemyCharacter } from '../characters/EnemyCharacter';
import { CharacterState } from '../enums/CharacterState';
import { ENEMY_ATTACK_RANGE, ENEMY_CHASE_RANGE } from '../config/constants';

export interface AIPersonality {
  aggressiveness: number;
  reactionTime: number;
  preferredDistance: number;
  /** Chance to block when in range AND player is attacking (0–1) */
  blockChance: number;
  /** Max ms spent in a single block action */
  maxBlockMs?: number;
  kite?: boolean;          // retreat when too close (archer)
  chargeLine?: boolean;    // cavalry-like straight charge
  shieldCounter?: boolean; // shieldman counter on block
  comboCount?: number;     // elite: multi-hit combos
}

const PERSONALITIES: Record<string, AIPersonality> = {
  // Grunts — aggressive, mobile
  normal:       { aggressiveness: 0.65, reactionTime: 450, preferredDistance: 70, blockChance: 0.08, maxBlockMs: 220 },
  elite:        { aggressiveness: 0.80, reactionTime: 320, preferredDistance: 55, blockChance: 0.15, maxBlockMs: 250, comboCount: 2 },
  boss:         { aggressiveness: 0.90, reactionTime: 280, preferredDistance: 50, blockChance: 0.18, maxBlockMs: 280 },
  archer:       { aggressiveness: 0.70, reactionTime: 480, preferredDistance: 170, blockChance: 0.04, maxBlockMs: 180, kite: true },
  spearman:     { aggressiveness: 0.72, reactionTime: 400, preferredDistance: 85, blockChance: 0.10, maxBlockMs: 220 },
  shield:       { aggressiveness: 0.55, reactionTime: 420, preferredDistance: 60, blockChance: 0.28, maxBlockMs: 280, shieldCounter: true },
  cavalry:      { aggressiveness: 0.90, reactionTime: 280, preferredDistance: 45, blockChance: 0.04, maxBlockMs: 160, chargeLine: true },
  assassin:     { aggressiveness: 0.88, reactionTime: 260, preferredDistance: 45, blockChance: 0.05, maxBlockMs: 160 },
  // Named minibosses (尋秦記)
  miniboss_lj:  { aggressiveness: 0.88, reactionTime: 280, preferredDistance: 50, blockChance: 0.16, maxBlockMs: 260 }, // 管中邪
  miniboss_tx:  { aggressiveness: 0.78, reactionTime: 340, preferredDistance: 95, blockChance: 0.14, maxBlockMs: 260 }, // 圖先
  miniboss_zm:  { aggressiveness: 0.70, reactionTime: 360, preferredDistance: 60, blockChance: 0.20, maxBlockMs: 260 }, // 趙穆
  miniboss_gk:  { aggressiveness: 0.65, reactionTime: 380, preferredDistance: 100, blockChance: 0.12, maxBlockMs: 220, kite: true }, // 郭開
  miniboss_lm:  { aggressiveness: 0.85, reactionTime: 300, preferredDistance: 70, blockChance: 0.18, maxBlockMs: 280 }, // 李牧
  miniboss_lbw: { aggressiveness: 0.72, reactionTime: 340, preferredDistance: 55, blockChance: 0.22, maxBlockMs: 300 }, // 呂不韋
  miniboss_cj:  { aggressiveness: 0.90, reactionTime: 260, preferredDistance: 50, blockChance: 0.10, maxBlockMs: 200 }, // 成蟜
  miniboss_jk:  { aggressiveness: 0.95, reactionTime: 220, preferredDistance: 40, blockChance: 0.05, maxBlockMs: 140 }, // 荊軻
  miniboss_fyq: { aggressiveness: 0.82, reactionTime: 300, preferredDistance: 55, blockChance: 0.14, maxBlockMs: 250 }, // 樊於期
  miniboss_yd:  { aggressiveness: 0.75, reactionTime: 320, preferredDistance: 75, blockChance: 0.16, maxBlockMs: 260 }, // 燕丹
  miniboss_wj:  { aggressiveness: 0.88, reactionTime: 280, preferredDistance: 55, blockChance: 0.20, maxBlockMs: 280 }, // 王翦
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
  Circle = 'circle', // sidestep on Z-axis for variety
}

export class AIController {
  private owner: EnemyCharacter;
  private target!: BaseCharacter;
  private personality: AIPersonality;
  private decisionTimer = 0;
  private currentAction: AIAction = AIAction.Idle;
  private actionDuration = 0;
  private patrolTarget = { x: 0, y: 0 };
  private circleDir: 1 | -1 = 1;
  private chargeDir: 1 | -1 = 1;
  private allPlayers: BaseCharacter[] = [];
  /** Prevents back-to-back block spam */
  private blockCooldown = 0;
  private consecutiveBlocks = 0;

  constructor(owner: EnemyCharacter, type: string = 'normal') {
    this.owner = owner;
    this.owner.aiType = type;
    this.personality = PERSONALITIES[type] ?? PERSONALITIES.normal;
  }

  setTarget(target: BaseCharacter): void {
    this.target = target;
  }

  setAllPlayers(players: BaseCharacter[]): void {
    this.allPlayers = players;
  }

  private retarget(): void {
    const alive = this.allPlayers.filter((p) => p.isAlive);
    if (alive.length === 0) return;
    if (alive.length === 1) { this.target = alive[0]; return; }
    let best = alive[0];
    let bestDist = Infinity;
    for (const p of alive) {
      const d = Math.sqrt((p.x - this.owner.x) ** 2 + (p.groundY - this.owner.groundY) ** 2);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    this.target = best;
  }

  update(time: number, delta: number): void {
    if (!this.target || !this.owner.isAlive) return;
    const state = this.owner.stateMachine.currentState;
    if (state === CharacterState.Hurt || state === CharacterState.Dead) return;

    if (this.blockCooldown > 0) this.blockCooldown = Math.max(0, this.blockCooldown - delta);

    this.decisionTimer -= delta;
    if (this.decisionTimer > 0) {
      this.executeCurrentAction(delta);
      return;
    }
    this.decisionTimer = this.personality.reactionTime + Math.random() * 120;
    if (this.allPlayers.length > 1) this.retarget();
    this.makeDecision();
    this.executeCurrentAction(delta);
  }

  private makeDecision(): void {
    // Always leave block before picking a new action (unless we re-choose block)
    this.exitBlockIfNeeded();

    const dx = this.target.x - this.owner.x;
    const dy = this.target.groundY - this.owner.groundY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const hpPercent = this.owner.hp / this.owner.maxHp;
    const roll = Math.random();
    const pref = this.personality.preferredDistance;
    const playerAttacking = this.target.stateMachine.currentState === CharacterState.Attack;

    // Face target
    if (dx > 5) this.owner.facing = 1;
    else if (dx < -5) this.owner.facing = -1;

    if (this.personality.chargeLine && dist > pref) {
      this.currentAction = AIAction.ChargeLine;
      this.chargeDir = dx > 0 ? 1 : -1;
      this.actionDuration = 550 + Math.random() * 250;
      this.consecutiveBlocks = 0;
      return;
    }

    if (this.personality.kite && dist < pref - 20) {
      this.currentAction = AIAction.Kite;
      this.actionDuration = 280 + Math.random() * 220;
      this.consecutiveBlocks = 0;
      return;
    }

    // Low HP: prefer retreat + re-engage, not prolonged turtle
    if (hpPercent < 0.2 && roll < 0.35) {
      this.currentAction = AIAction.Retreat;
      this.actionDuration = 280 + Math.random() * 280;
      this.consecutiveBlocks = 0;
      return;
    }

    const attackThreshold = this.personality.kite ? pref + 30 : ENEMY_ATTACK_RANGE + 12;

    if (dist < attackThreshold) {
      this.decideInRange(roll, playerAttacking);
    } else if (dist < ENEMY_CHASE_RANGE || this.personality.kite) {
      // Mid range: almost always chase / circle — rarely idle
      if (roll < 0.75 || roll < this.personality.aggressiveness) {
        this.currentAction = AIAction.Chase;
        this.actionDuration = 350 + Math.random() * 350;
      } else if (roll < 0.9) {
        this.currentAction = AIAction.Circle;
        this.circleDir = Math.random() > 0.5 ? 1 : -1;
        this.actionDuration = 280 + Math.random() * 220;
      } else {
        this.currentAction = AIAction.Patrol;
        this.setPatrolNearTarget();
        this.actionDuration = 400 + Math.random() * 300;
      }
      this.consecutiveBlocks = 0;
    } else {
      // Far: chase or patrol toward fight
      if (roll < 0.85) {
        this.currentAction = AIAction.Chase;
        this.actionDuration = 450 + Math.random() * 400;
      } else {
        this.currentAction = AIAction.Patrol;
        this.setPatrolNearTarget();
        this.actionDuration = 500 + Math.random() * 400;
      }
      this.consecutiveBlocks = 0;
    }
  }

  /** Close-range decision: attack-first, block only briefly when threatened */
  private decideInRange(roll: number, playerAttacking: boolean): void {
    const maxBlockMs = this.personality.maxBlockMs ?? 220;
    const canBlock =
      this.blockCooldown <= 0 &&
      this.consecutiveBlocks < 1 && // at most one block in a row
      playerAttacking && // only guard when player is swinging
      roll < this.personality.blockChance;

    if (canBlock) {
      this.currentAction = AIAction.Block;
      this.actionDuration = 120 + Math.random() * Math.max(40, maxBlockMs - 120);
      this.consecutiveBlocks += 1;
      this.blockCooldown = 900 + Math.random() * 500; // long gap before next block
      return;
    }

    // Attack often
    if (roll < this.personality.aggressiveness + 0.15) {
      this.currentAction = AIAction.Attack;
      this.actionDuration = 320 + Math.random() * 180;
      this.consecutiveBlocks = 0;
      return;
    }

    // Otherwise stay mobile: circle, short retreat, or re-chase
    if (roll < 0.75) {
      this.currentAction = AIAction.Circle;
      this.circleDir = Math.random() > 0.5 ? 1 : -1;
      this.actionDuration = 220 + Math.random() * 200;
    } else if (roll < 0.9) {
      this.currentAction = AIAction.Chase;
      this.actionDuration = 200 + Math.random() * 200;
    } else {
      this.currentAction = AIAction.Retreat;
      this.actionDuration = 180 + Math.random() * 160;
    }
    this.consecutiveBlocks = 0;
  }

  private setPatrolNearTarget(): void {
    this.patrolTarget = {
      x: this.target.x + (Math.random() - 0.5) * 100,
      y: this.target.groundY + (Math.random() - 0.5) * 50,
    };
  }

  /** Leave Block state so move/chase can work again */
  private exitBlockIfNeeded(): void {
    if (this.owner.stateMachine.currentState === CharacterState.Block) {
      this.owner.stateMachine.forceTransition(CharacterState.Idle);
    }
  }

  private executeCurrentAction(delta: number): void {
    this.actionDuration -= delta;
    if (this.actionDuration <= 0) {
      // Critical: leave Block so the enemy is not stuck guarding forever
      this.exitBlockIfNeeded();
      this.currentAction = AIAction.Idle;
      // Re-decide soon instead of idling for a full reactionTime
      this.decisionTimer = Math.min(this.decisionTimer, 80 + Math.random() * 80);
      return;
    }

    switch (this.currentAction) {
      case AIAction.Chase:
        this.exitBlockIfNeeded();
        this.owner.moveToward(this.target.x, this.target.groundY);
        break;
      case AIAction.Attack:
        this.exitBlockIfNeeded();
        this.owner.performAttack();
        break;
      case AIAction.Retreat:
      case AIAction.Kite: {
        this.exitBlockIfNeeded();
        this.owner.moveAway(this.target.x, this.target.groundY);
        break;
      }
      case AIAction.Patrol:
        this.exitBlockIfNeeded();
        this.owner.moveToward(this.patrolTarget.x, this.patrolTarget.y);
        break;
      case AIAction.Circle: {
        // Sidestep on depth axis while slowly closing gap
        this.exitBlockIfNeeded();
        const dx = this.target.x - this.owner.x;
        const close = Math.abs(dx) > 40 ? Math.sign(dx) * 0.35 : 0;
        this.owner.move(close, this.circleDir * 0.9);
        break;
      }
      case AIAction.Block:
        if (this.owner.stateMachine.currentState !== CharacterState.Block) {
          this.owner.stateMachine.forceTransition(CharacterState.Block);
        }
        break;
      case AIAction.ChargeLine: {
        this.exitBlockIfNeeded();
        this.owner.move(this.chargeDir, 0);
        const adx = Math.abs(this.target.x - this.owner.x);
        if (adx < 60) {
          this.owner.performAttack();
          this.currentAction = AIAction.Idle;
          this.actionDuration = 0;
        }
        break;
      }
      case AIAction.Idle:
      default:
        this.exitBlockIfNeeded();
        break;
    }
  }
}
