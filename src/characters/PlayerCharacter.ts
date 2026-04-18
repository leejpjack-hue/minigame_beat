import { BaseCharacter } from './BaseCharacter';
import { CharacterState, CharacterStateType } from '../enums/CharacterState';
import { ComboInput, ComboInputType } from '../enums/ComboInput';
import { FighterStats } from './fighters/FighterStats';
import { getFighterMoves, MoveHitbox } from './fighters/FighterMoves';

export class PlayerCharacter extends BaseCharacter {
  public isPlayer = true;
  // Counter window (open during Block state briefly after input)
  public counterWindow = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, stats: FighterStats) {
    super(scene, x, y, stats);
  }

  protected defineStates(): void {
    this.stateMachine.addState(CharacterState.Idle, {
      canTransitionFrom: [CharacterState.Walk, CharacterState.Jump, CharacterState.Attack, CharacterState.Hurt, CharacterState.Block],
      onEnter: () => this.stateLabel.setColor('#ffff00'),
    });
    this.stateMachine.addState(CharacterState.Walk, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Attack],
      onEnter: () => this.stateLabel.setColor('#88ff88'),
    });
    this.stateMachine.addState(CharacterState.Jump, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk, CharacterState.Jump],
      onEnter: () => this.stateLabel.setColor('#8888ff'),
    });
    this.stateMachine.addState(CharacterState.Attack, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk, CharacterState.Jump, CharacterState.Attack, CharacterState.Block],
      onEnter: () => this.stateLabel.setColor('#ff8888'),
    });
    this.stateMachine.addState(CharacterState.Hurt, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk, CharacterState.Attack, CharacterState.Jump, CharacterState.Block],
      onEnter: () => this.stateLabel.setColor('#ff4444'),
    });
    this.stateMachine.addState(CharacterState.Dead, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk, CharacterState.Attack, CharacterState.Hurt, CharacterState.Block],
      onEnter: () => {
        this.stateLabel.setColor('#666666');
        this.bodySprite.setTint(0x666666);
      },
    });
    this.stateMachine.addState(CharacterState.Block, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk],
      onEnter: () => {
        this.stateLabel.setColor('#44aaff');
        this.counterWindow = 200;
      },
    });
  }

  handleDirectionalInput(dx: number, dy: number): void {
    const state = this.stateMachine.currentState;
    if (state === CharacterState.Dead || state === CharacterState.Hurt) return;
    if (dx !== 0 || dy !== 0) {
      this.move(dx, dy);
    } else if (state === CharacterState.Walk) {
      this.stateMachine.transition(CharacterState.Idle);
    }
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    if (this.counterWindow > 0) this.counterWindow = Math.max(0, this.counterWindow - delta);
  }

  handleComboInput(input: ComboInputType): void {
    const state = this.stateMachine.currentState;
    if (state === CharacterState.Dead || state === CharacterState.Hurt) return;

    switch (input) {
      case ComboInput.Attack:
        this.performLightChain();
        break;
      case ComboInput.Jump:
        this.jump();
        break;
      case ComboInput.Defend:
        if (state === CharacterState.Idle || state === CharacterState.Walk) {
          this.stateMachine.transition(CharacterState.Block);
        }
        break;
    }
  }

  releaseBlock(): void {
    if (this.stateMachine.currentState === CharacterState.Block) {
      this.stateMachine.transition(CharacterState.Idle);
    }
  }

  private performLightChain(): void {
    const moves = getFighterMoves(String(this.stats.fighterKey));
    if (!moves) {
      this.startAttack('light', 400);
      return;
    }

    // If currently attacking but in late window, advance chain
    const state = this.stateMachine.currentState;
    const canChain = state === CharacterState.Attack &&
      this.attackFrame / this.attackTotalFrames > 0.55 &&
      (this.currentAttackName === 'L1' || this.currentAttackName === 'L2');

    let nextIdx: 1 | 2 | 3;
    if (state === CharacterState.Attack && !canChain) return;
    if (canChain) {
      nextIdx = (this.currentAttackName === 'L1' ? 2 : 3) as 1 | 2 | 3;
    } else if (this.lightChainWindow > 0 && this.lightChainIndex < 3) {
      nextIdx = (this.lightChainIndex + 1) as 1 | 2 | 3;
    } else {
      nextIdx = 1;
    }

    const name = `L${nextIdx}` as 'L1' | 'L2' | 'L3';
    const move = moves[name];
    const frames = moves.lightFrames;
    const started = this.startAttack(name, frames, {
      activeStart: move.activeStart,
      activeEnd: move.activeEnd,
    });
    if (started) {
      this.lightChainIndex = nextIdx;
      this.bumpLightChainWindow(450);
    }
  }

  performHeavy(): void {
    const moves = getFighterMoves(String(this.stats.fighterKey));
    if (!moves) return;
    this.startAttack('heavy', moves.heavyFrames, {
      activeStart: moves.heavy.activeStart,
      activeEnd: moves.heavy.activeEnd,
    });
  }

  /** Dispatch special-move name keyed per fighter */
  executeCombo(comboName: string): void {
    const moves = getFighterMoves(String(this.stats.fighterKey));
    if (!moves) return;

    // Map parser combo tokens to this fighter's moveset keys.
    // Universal -> fighter-specific mapping
    const action = this.resolveFighterAction(comboName);
    if (!action) return;

    const move: MoveHitbox | undefined = moves.specials[action];
    if (!move) return;
    if (this.mp < move.mpCost) return;

    // Counter window check
    if (action === 'counter') {
      if (this.counterWindow <= 0 && this.stateMachine.currentState !== CharacterState.Block) return;
    }

    // Air-only check (烏廷芳 air_dive only airborne)
    if (action === 'air_dive' && this.isGrounded) return;

    this.mp -= move.mpCost;

    // Self-buff (decree) does not enter attack state, just buffs
    if (move.selfBuff) {
      this.applySelfBuff(move.selfBuff.atkMul, move.selfBuff.duration);
      return;
    }

    const frames = moves.specialFrames[action] ?? 500;
    this.startAttack(action, frames, {
      activeStart: move.activeStart,
      activeEnd: move.activeEnd,
      superArmor: move.superArmor,
      travel: move.travel,
      teleportBehind: move.teleportBehind,
    });
  }

  /**
   * Each fighter interprets abstract combo tokens differently.
   * Tokens (from ComboParser): special_forward, special_up, dash_attack, super, heavy,
   * counter, air_dive, low_special, buff.
   */
  private resolveFighterAction(token: string): string | null {
    const key = String(this.stats.fighterKey);
    const map: Record<string, Record<string, string>> = {
      xiang_shao_long: {
        special_forward: 'flying_knee',
        special_up: 'uppercut',
        dash_attack: 'flying_knee',
        low_special: 'sweep_stomp',
        super: 'super',
        heavy: 'heavy',
      },
      lian_jin: {
        special_forward: 'phantom_step',
        special_up: 'phantom_step',
        dash_attack: 'phantom_step',
        low_special: 'sword_wave',
        counter: 'counter',
        super: 'super',
        heavy: 'heavy',
      },
      wu_ting_fang: {
        special_forward: 'pounce',
        special_up: 'pounce',
        dash_attack: 'pounce',
        low_special: 'whirl',
        air_dive: 'air_dive',
        super: 'super',
        heavy: 'heavy',
      },
      shan_rou: {
        special_forward: 'dagger_throw',
        special_up: 'backstab',
        dash_attack: 'dagger_throw',
        low_special: 'bleed_combo',
        counter: 'backstab',
        super: 'super',
        heavy: 'heavy',
      },
      ying_zheng: {
        special_forward: 'king_charge',
        special_up: 'imperial_palm',
        dash_attack: 'king_charge',
        low_special: 'imperial_palm',
        buff: 'decree',
        super: 'super',
        heavy: 'heavy',
      },
    };
    return map[key]?.[token] ?? null;
  }
}
