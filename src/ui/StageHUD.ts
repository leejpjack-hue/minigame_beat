import { HealthBar } from './HealthBar';
import { MPBar } from './MPBar';
import { ComboIndicator } from './ComboIndicator';
import { BaseCharacter } from '../characters/BaseCharacter';
import { GAME_WIDTH } from '../config/constants';

export class StageHUD {
  private playerHpBar!: HealthBar;
  private playerMpBar!: MPBar;
  private playerLabel!: Phaser.GameObjects.Text;

  // P2
  private player2HpBar: HealthBar | null = null;
  private player2MpBar: MPBar | null = null;
  private player2Label: Phaser.GameObjects.Text | null = null;

  private enemyHpBars: HealthBar[] = [];
  private comboIndicator: ComboIndicator;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.comboIndicator = new ComboIndicator(scene);
  }

  initPlayerHUD(char: BaseCharacter, tag: string = 'P1'): void {
    const yOff = tag === 'P2' ? 62 : 20;
    const labelY = tag === 'P2' ? 47 : 5;
    const tagColor = tag === 'P2' ? '#44ddff' : '#ffffff';

    if (tag === 'P1') {
      this.playerHpBar = new HealthBar(this.scene, 20, yOff, 200, 14, char.maxHp);
      this.playerMpBar = new MPBar(this.scene, 20, yOff + 22, 160, 10, char.maxMp);
      this.playerLabel = this.scene.add.text(20, labelY, `[P1] ${char.stats.nameZH}`, {
        fontSize: '12px', color: tagColor, fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setDepth(900).setScrollFactor(0);
    } else {
      this.player2HpBar = new HealthBar(this.scene, 20, yOff, 200, 14, char.maxHp);
      this.player2MpBar = new MPBar(this.scene, 20, yOff + 22, 160, 10, char.maxMp);
      this.player2Label = this.scene.add.text(20, labelY, `[P2] ${char.stats.nameZH}`, {
        fontSize: '12px', color: tagColor, fontFamily: 'monospace',
        stroke: '#000', strokeThickness: 2,
      }).setDepth(900).setScrollFactor(0);
    }
  }

  addEnemyHUD(char: BaseCharacter, index: number): void {
    const x = GAME_WIDTH - 180;
    const y = 20 + index * 30;
    const bar = new HealthBar(this.scene, x, y, 160, 10, char.maxHp);
    this.enemyHpBars.push(bar);
  }

  update(player: BaseCharacter, enemies: BaseCharacter[], hitCounter: number, delta: number = 16, player2?: BaseCharacter | null): void {
    this.playerHpBar?.update(player.hp);
    this.playerMpBar?.update(player.mp);

    if (player2 && this.player2HpBar) {
      this.player2HpBar.update(player2.hp);
      this.player2MpBar?.update(player2.mp);
    }

    for (let i = 0; i < enemies.length && i < this.enemyHpBars.length; i++) {
      this.enemyHpBars[i].update(enemies[i].hp);
    }

    this.comboIndicator.update(delta);
  }

  registerHit(): number {
    return this.comboIndicator.registerHit();
  }

  getComboCount(): number {
    return this.comboIndicator.getCombo();
  }

  destroy(): void {
    this.playerHpBar?.destroy();
    this.playerMpBar?.destroy();
    this.player2HpBar?.destroy();
    this.player2MpBar?.destroy();
    this.enemyHpBars.forEach((b) => b.destroy());
    this.comboIndicator.destroy();
    this.playerLabel?.destroy();
    this.player2Label?.destroy();
  }
}
