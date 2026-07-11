import { ComboInput, ComboInputType } from '../enums/ComboInput';
import { COMBO_INPUT_WINDOW, COMBO_PREFIX_HOLD_MS } from '../config/constants';

export interface ComboDefinition {
  name: string;
  sequence: ComboInputType[];
  action: string; // maps to PlayerCharacter.executeCombo()
  /** Higher priority wins when two combos match the same buffer tail */
  priority?: number;
}

/**
 * Combo sequences (longest / highest priority first).
 *
 * Notation (keys): ↑↓←→ = W/S/A/D or arrows, J = light, K = heavy, L = block
 *
 * Universal special routes:
 *   ↓→J / ↓→→J     Super
 *   →↓→J           Super alt (hadouken-style)
 *   ↑K             Up special
 *   ↓K / ↓→K       Low special
 *   →K             Forward special
 *   →→J / ←←J      Dash attack
 *   →→ / ←←        Dash (deferred — does not steal →→J)
 *   ↓↓L            Buff stance
 *   L→K            Counter (block then heavy)
 *   J→J→K          Light chain finisher (heavy ender)
 *   ↓↑J            Super flash alt
 */
const COMBO_DEFINITIONS: ComboDefinition[] = [
  // --- Supers (highest priority / longest) ---
  { name: 'Super QCF', sequence: [ComboInput.Down, ComboInput.Right, ComboInput.Attack], action: 'super', priority: 100 },
  { name: 'Super QCF Ext', sequence: [ComboInput.Down, ComboInput.Right, ComboInput.Right, ComboInput.Attack], action: 'super', priority: 100 },
  { name: 'Super Hadouken', sequence: [ComboInput.Right, ComboInput.Down, ComboInput.Right, ComboInput.Attack], action: 'super', priority: 100 },
  { name: 'Super Flash', sequence: [ComboInput.Down, ComboInput.Up, ComboInput.Attack], action: 'super', priority: 95 },
  { name: 'Super Defend Route', sequence: [ComboInput.Defend, ComboInput.Down, ComboInput.Right, ComboInput.Attack], action: 'super', priority: 90 },

  // --- Specials ---
  { name: 'Low Special Full', sequence: [ComboInput.Down, ComboInput.Right, ComboInput.Heavy], action: 'low_special', priority: 80 },
  { name: 'Low Special', sequence: [ComboInput.Down, ComboInput.Heavy], action: 'low_special', priority: 70 },
  { name: 'Up Special', sequence: [ComboInput.Up, ComboInput.Heavy], action: 'special_up', priority: 70 },
  { name: 'Forward Special', sequence: [ComboInput.Right, ComboInput.Heavy], action: 'special_forward', priority: 70 },
  { name: 'Forward Special Left', sequence: [ComboInput.Left, ComboInput.Heavy], action: 'special_forward', priority: 70 },
  { name: 'Back Special', sequence: [ComboInput.Left, ComboInput.Down, ComboInput.Heavy], action: 'special_back', priority: 75 },

  // --- Movement attacks ---
  { name: 'Dash Attack', sequence: [ComboInput.Right, ComboInput.Right, ComboInput.Attack], action: 'dash_attack', priority: 80 },
  { name: 'Dash Attack Left', sequence: [ComboInput.Left, ComboInput.Left, ComboInput.Attack], action: 'dash_attack', priority: 80 },
  // Pure dash — deferred while a longer prefix-continuation is still possible
  { name: 'Dash Right', sequence: [ComboInput.Right, ComboInput.Right], action: 'dash_right', priority: 40 },
  { name: 'Dash Left', sequence: [ComboInput.Left, ComboInput.Left], action: 'dash_left', priority: 40 },

  // --- Utility ---
  { name: 'Buff Stance', sequence: [ComboInput.Down, ComboInput.Down, ComboInput.Defend], action: 'buff', priority: 75 },
  { name: 'Counter', sequence: [ComboInput.Defend, ComboInput.Heavy], action: 'counter', priority: 75 },
  { name: 'Light Finisher', sequence: [ComboInput.Attack, ComboInput.Attack, ComboInput.Heavy], action: 'finisher', priority: 85 },
  { name: 'Heavy Burst', sequence: [ComboInput.Heavy, ComboInput.Heavy], action: 'heavy_burst', priority: 60 },
];

// Sort once: longer sequences first, then higher priority
const SORTED_COMBOS = [...COMBO_DEFINITIONS].sort((a, b) => {
  if (b.sequence.length !== a.sequence.length) return b.sequence.length - a.sequence.length;
  return (b.priority ?? 0) - (a.priority ?? 0);
});

export class ComboParser {
  private inputBuffer: { input: ComboInputType; timestamp: number }[] = [];
  private readonly windowMs = COMBO_INPUT_WINDOW;
  private readonly prefixHoldMs = COMBO_PREFIX_HOLD_MS;
  /** Pending short combo waiting to see if a longer one continues */
  private pending: { action: string; fireAt: number } | null = null;

  recordInput(input: ComboInputType): string | null {
    const now = Date.now();
    this.inputBuffer.push({ input, timestamp: now });
    this.inputBuffer = this.inputBuffer.filter((e) => now - e.timestamp <= this.windowMs);

    // New input invalidates a deferred short match — re-evaluate
    this.pending = null;

    return this.evaluate(now, false);
  }

  /**
   * Call once per frame so deferred prefix combos (e.g. →→ dash)
   * can fire after the hold window if no longer combo continues them.
   */
  tick(): string | null {
    if (!this.pending) return null;
    const now = Date.now();
    if (now < this.pending.fireAt) return null;
    const action = this.pending.action;
    this.pending = null;
    this.clear();
    return action;
  }

  private evaluate(now: number, forcePending: boolean): string | null {
    for (const combo of SORTED_COMBOS) {
      if (!this.matchSequence(combo.sequence)) continue;

      // If this sequence is a strict prefix of another defined combo,
      // defer firing so the player can finish the longer route (→→ vs →→J).
      if (!forcePending && this.isPrefixOfLongerCombo(combo.sequence)) {
        const hold = this.prefixHoldMs;
        this.pending = { action: combo.action, fireAt: now + hold };
        // Keep looking for a longer exact match on this same buffer
        continue;
      }

      this.pending = null;
      this.clear();
      return combo.action;
    }

    // No longer match — if we deferred a prefix, leave pending for tick()
    return null;
  }

  private isPrefixOfLongerCombo(sequence: ComboInputType[]): boolean {
    return SORTED_COMBOS.some((other) => {
      if (other.sequence.length <= sequence.length) return false;
      for (let i = 0; i < sequence.length; i++) {
        if (other.sequence[i] !== sequence[i]) return false;
      }
      return true;
    });
  }

  private matchSequence(sequence: ComboInputType[]): boolean {
    if (this.inputBuffer.length < sequence.length) return false;
    const startIdx = this.inputBuffer.length - sequence.length;
    for (let i = 0; i < sequence.length; i++) {
      if (this.inputBuffer[startIdx + i].input !== sequence[i]) return false;
    }
    return true;
  }

  clear(): void {
    this.inputBuffer = [];
    this.pending = null;
  }
}
