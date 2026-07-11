import { BaseCharacter } from './BaseCharacter';
import { CharacterState, CharacterStateType } from '../enums/CharacterState';
import { ComboInput, ComboInputType } from '../enums/ComboInput';
import { Direction } from '../enums/Direction';
import { FighterStats } from './fighters/FighterStats';
import { getFighterMoves, MoveHitbox } from './fighters/FighterMoves';
import {
  LIGHT_CHAIN_CANCEL,
  SPECIAL_CANCEL_WINDOW,
  COUNTER_WINDOW_MS,
  LIGHT_CHAIN_WINDOW_MS,
} from '../config/constants';

export class PlayerCharacter extends BaseCharacter {
  public isPlayer = true;
  /** Open after releasing block — enables counter special */
  public counterWindow = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, stats: FighterStats) {
    super(scene, x, y, stats);
  }

  protected defineStates(): void {
    this.stateMachine.addState(CharacterState.Idle, {
      canTransitionFrom: [
        CharacterState.Walk, CharacterState.Jump, CharacterState.Attack,
        CharacterState.Hurt, CharacterState.Block, CharacterState.Dash,
      ],
      onEnter: () => this.stateLabel.setColor('#ffff00'),
    });
    this.stateMachine.addState(CharacterState.Walk, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Attack, CharacterState.Dash],
      onEnter: () => this.stateLabel.setColor('#88ff88'),
    });
    this.stateMachine.addState(CharacterState.Jump, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk, CharacterState.Jump],
      onEnter: () => this.stateLabel.setColor('#8888ff'),
    });
    this.stateMachine.addState(CharacterState.Attack, {
      canTransitionFrom: [
        CharacterState.Idle, CharacterState.Walk, CharacterState.Jump,
        CharacterState.Attack, CharacterState.Block, CharacterState.Dash,
      ],
      onEnter: () => this.stateLabel.setColor('#ff8888'),
    });
    this.stateMachine.addState(CharacterState.Hurt, {
      canTransitionFrom: [
        CharacterState.Idle, CharacterState.Walk, CharacterState.Attack,
        CharacterState.Jump, CharacterState.Block, CharacterState.Dash,
      ],
      onEnter: () => this.stateLabel.setColor('#ff4444'),
    });
    this.stateMachine.addState(CharacterState.Dead, {
      canTransitionFrom: [
        CharacterState.Idle, CharacterState.Walk, CharacterState.Attack,
        CharacterState.Hurt, CharacterState.Block, CharacterState.Jump, CharacterState.Dash,
      ],
      onEnter: () => {
        this.stateLabel.setColor('#666666');
        this.bodySprite.setTint(0x666666);
      },
    });
    this.stateMachine.addState(CharacterState.Block, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Walk],
      onEnter: () => {
        this.stateLabel.setColor('#44aaff');
        this.superArmorActive = true;
      },
      onExit: () => {
        this.superArmorActive = false;
        // Open counter window on block release
        this.counterWindow = COUNTER_WINDOW_MS;
      },
    });
    this.stateMachine.addState(CharacterState.Dash, {
      canTransitionFrom: [
        CharacterState.Idle, CharacterState.Walk, CharacterState.Attack, CharacterState.Block,
      ],
      onEnter: () => {
        this.stateLabel.setColor('#00ffff');
      },
    });
  }

  handleDirectionalInput(dx: number, dy: number): void {
    const state = this.stateMachine.currentState;
    if (state === CharacterState.Dead || state === CharacterState.Hurt || state === CharacterState.Dash) return;
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

    // Scale light timing by fighter combo speed
    const speedMul = this.stats.comboSpeedMultiplier || 1;
    const frames = Math.round(moves.lightFrames / speedMul);

    const state = this.stateMachine.currentState;
    const progress = this.attackTotalFrames > 0 ? this.attackFrame / this.attackTotalFrames : 0;
    const canChain =
      state === CharacterState.Attack &&
      progress >= LIGHT_CHAIN_CANCEL &&
      (this.currentAttackName === 'L1' || this.currentAttackName === 'L2');

    let nextIdx: 1 | 2 | 3;
    if (state === CharacterState.Attack && !canChain) {
      // Too early or already on L3 / special — ignore mash
      return;
    }
    if (canChain) {
      nextIdx = (this.currentAttackName === 'L1' ? 2 : 3) as 1 | 2 | 3;
    } else if (this.lightChainWindow > 0 && this.lightChainIndex < 3) {
      nextIdx = (this.lightChainIndex + 1) as 1 | 2 | 3;
    } else {
      nextIdx = 1;
    }

    const name = `L${nextIdx}` as 'L1' | 'L2' | 'L3';
    const move = moves[name];
    const started = this.startAttack(name, frames, {
      activeStart: move.activeStart,
      activeEnd: move.activeEnd,
      cancel: canChain,
    });
    if (started) {
      this.lightChainIndex = nextIdx;
      this.bumpLightChainWindow(LIGHT_CHAIN_WINDOW_MS);
      // Small forward nudge on L2/L3 so chains track better
      if (nextIdx > 1) {
        const dir = this.facing === Direction.Right ? 1 : -1;
        this.x += dir * (6 + nextIdx * 4);
      }
    }
  }

  performHeavy(): void {
    const state = this.stateMachine.currentState;
    if (state === CharacterState.Dead || state === CharacterState.Hurt || state === CharacterState.Dash) return;

    // Counter on block / counter window (Lian Jin / mapped fighters)
    if (
      (state === CharacterState.Block || this.counterWindow > 0) &&
      this.resolveFighterAction('counter')
    ) {
      this.executeCombo('counter');
      return;
    }

    const moves = getFighterMoves(String(this.stats.fighterKey));
    if (!moves) return;

    // Special-cancel heavy from late light chain
    const cancelling = state === CharacterState.Attack && this.canSpecialCancel(SPECIAL_CANCEL_WINDOW);
    if (state === CharacterState.Attack && !cancelling) return;

    const started = this.startAttack('heavy', moves.heavyFrames, {
      activeStart: moves.heavy.activeStart,
      activeEnd: moves.heavy.activeEnd,
      cancel: cancelling,
    });
    if (started) this.playSpecialAttackFx('heavy');
  }

  /** Dispatch special-move name keyed per fighter */
  executeCombo(comboName: string): void {
    if (comboName === 'dash_right') {
      this.performDash(1);
      return;
    }
    if (comboName === 'dash_left') {
      this.performDash(-1);
      return;
    }

    const moves = getFighterMoves(String(this.stats.fighterKey));
    if (!moves) return;

    const action = this.resolveFighterAction(comboName);
    if (!action) return;

    const state = this.stateMachine.currentState;
    if (state === CharacterState.Dead || state === CharacterState.Hurt || state === CharacterState.Dash) return;

    // Special cancel from lights/heavy in the cancel window
    const cancelling = state === CharacterState.Attack && this.canSpecialCancel(SPECIAL_CANCEL_WINDOW);
    if (state === CharacterState.Attack && !cancelling) return;

    // Finisher / heavy_burst may resolve to 'heavy' or a special
    if (action === 'heavy') {
      const started = this.startAttack('heavy', moves.heavyFrames, {
        activeStart: moves.heavy.activeStart,
        activeEnd: moves.heavy.activeEnd,
        cancel: cancelling,
      });
      if (started) this.playSpecialAttackFx('heavy');
      return;
    }

    const move: MoveHitbox | undefined = moves.specials[action];
    if (!move) return;
    if (this.mp < move.mpCost) return;

    // Counter: require block state or open counter window
    if (action === 'counter') {
      if (this.counterWindow <= 0 && state !== CharacterState.Block) return;
    }

    // Air-only check (烏廷芳 air_dive)
    if (action === 'air_dive' && this.isGrounded) return;
    // Ground-only for most specials (air dive is the exception)
    if (action !== 'air_dive' && !this.isGrounded && action !== 'pounce' && action !== 'whirl') {
      // Allow a few aerial specials; block supers/teleports mid-air for readability
      if (action === 'super' || action === 'backstab' || action === 'king_charge') return;
    }

    this.mp -= move.mpCost;
    this.counterWindow = 0;

    // Self-buff (decree / shared stance) does not enter attack state
    if (move.selfBuff) {
      this.applySelfBuff(move.selfBuff.atkMul, move.selfBuff.duration);
      this.playSpecialAttackFx('special', action);
      return;
    }

    // Teleport behind nearest enemy when move requests it
    if (move.teleportBehind) {
      this.tryTeleportBehind();
    }

    const frames = moves.specialFrames[action] ?? 500;
    const started = this.startAttack(action, frames, {
      activeStart: move.activeStart,
      activeEnd: move.activeEnd,
      superArmor: move.superArmor,
      travel: move.travel,
      teleportBehind: move.teleportBehind,
      cancel: cancelling,
    });
    if (started) this.playSpecialAttackFx('special', action);
  }

  /** Blink ~behind the nearest living opponent within range. */
  private tryTeleportBehind(): void {
    const scene = this.scene as Phaser.Scene & {
      // StageScene keeps enemies on stageManager; fall back to nothing if missing
      stageManager?: { aliveEnemies: BaseCharacter[] };
      player?: BaseCharacter;
      player2?: BaseCharacter | null;
    };
    const enemies = scene.stageManager?.aliveEnemies ?? [];
    let best: BaseCharacter | null = null;
    let bestDist = 220;
    for (const e of enemies) {
      if (!e.isAlive) continue;
      const d = Math.abs(e.x - this.x) + Math.abs(e.groundY - this.groundY) * 0.5;
      if (d < bestDist) {
        bestDist = d;
        best = e;
      }
    }
    if (!best) {
      // No target — short hop in facing direction
      const dir = this.facing === Direction.Right ? 1 : -1;
      this.x += dir * 80;
      return;
    }
    const behind = best.facing === Direction.Right ? -1 : 1;
    this.x = best.x + behind * 36;
    this.groundY = best.groundY;
    this.facing = behind > 0 ? Direction.Right : Direction.Left;
    // Face the target
    this.facing = this.x < best.x ? Direction.Right : Direction.Left;
  }

  /**
   * Each fighter interprets abstract combo tokens differently.
   * Tokens: special_forward, special_up, special_back, dash_attack, super,
   *         low_special, buff, counter, air_dive, finisher, heavy_burst
   */
  private resolveFighterAction(token: string): string | null {
    const key = String(this.stats.fighterKey);
    const map: Record<string, Record<string, string>> = {
      xiang_shao_long: {
        special_forward: 'flying_knee',
        special_up: 'uppercut',
        special_back: 'sweep_stomp',
        dash_attack: 'flying_knee',
        low_special: 'sweep_stomp',
        super: 'super',
        finisher: 'uppercut',
        heavy_burst: 'flying_knee',
        buff: 'stance_focus',
        counter: 'uppercut',
      },
      lian_jin: {
        special_forward: 'phantom_step',
        special_up: 'phantom_step',
        special_back: 'counter',
        dash_attack: 'phantom_step',
        low_special: 'sword_wave',
        counter: 'counter',
        super: 'super',
        finisher: 'phantom_step',
        heavy_burst: 'sword_wave',
        buff: 'stance_focus',
      },
      wu_ting_fang: {
        special_forward: 'pounce',
        special_up: 'pounce',
        special_back: 'whirl',
        dash_attack: 'pounce',
        low_special: 'whirl',
        air_dive: 'air_dive',
        super: 'super',
        finisher: 'whirl',
        heavy_burst: 'pounce',
        buff: 'stance_focus',
      },
      shan_rou: {
        special_forward: 'dagger_throw',
        special_up: 'backstab',
        special_back: 'backstab',
        dash_attack: 'backstab',
        low_special: 'bleed_combo',
        counter: 'backstab',
        super: 'super',
        finisher: 'bleed_combo',
        heavy_burst: 'dagger_throw',
        buff: 'stance_focus',
      },
      ying_zheng: {
        special_forward: 'king_charge',
        special_up: 'imperial_palm',
        special_back: 'imperial_palm',
        dash_attack: 'king_charge',
        low_special: 'imperial_palm',
        buff: 'decree',
        super: 'super',
        finisher: 'imperial_palm',
        heavy_burst: 'king_charge',
        counter: 'king_charge',
      },
    };
    return map[key]?.[token] ?? null;
  }
}
