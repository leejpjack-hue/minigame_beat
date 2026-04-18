import { ComboInput, ComboInputType } from '../enums/ComboInput';
import { COMBO_INPUT_WINDOW } from '../config/constants';

export interface ComboDefinition {
  name: string;
  sequence: ComboInputType[];
  action: string; // maps to PlayerCharacter.executeCombo()
}

const COMBO_DEFINITIONS: ComboDefinition[] = [
  // Longest sequences first
  { name: 'Super', sequence: [ComboInput.Defend, ComboInput.Down, ComboInput.Right, ComboInput.Attack], action: 'super' },
  { name: 'Super Alt', sequence: [ComboInput.Defend, ComboInput.Right, ComboInput.Down, ComboInput.Attack], action: 'super' },
  { name: 'Buff Stance', sequence: [ComboInput.Down, ComboInput.Down, ComboInput.Defend], action: 'buff' },
  { name: 'Low Special', sequence: [ComboInput.Down, ComboInput.Right, ComboInput.Heavy], action: 'low_special' },
  { name: 'Low Special Alt', sequence: [ComboInput.Down, ComboInput.Heavy], action: 'low_special' },
  { name: 'Up Special', sequence: [ComboInput.Up, ComboInput.Heavy], action: 'special_up' },
  { name: 'Dash Attack', sequence: [ComboInput.Right, ComboInput.Right, ComboInput.Attack], action: 'dash_attack' },
  { name: 'Dash Attack Left', sequence: [ComboInput.Left, ComboInput.Left, ComboInput.Attack], action: 'dash_attack' },
];

export class ComboParser {
  private inputBuffer: { input: ComboInputType; timestamp: number }[] = [];
  private readonly windowMs = COMBO_INPUT_WINDOW;

  recordInput(input: ComboInputType): string | null {
    const now = Date.now();
    this.inputBuffer.push({ input, timestamp: now });
    this.inputBuffer = this.inputBuffer.filter((e) => now - e.timestamp <= this.windowMs);
    return this.checkCombos();
  }

  private checkCombos(): string | null {
    for (const combo of COMBO_DEFINITIONS) {
      if (this.matchSequence(combo.sequence)) {
        this.clear();
        return combo.action;
      }
    }
    return null;
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
  }
}
