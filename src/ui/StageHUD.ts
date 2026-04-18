import { HealthBar } from './HealthBar';
import { MPBar } from './MPBar';
import { ComboIndicator } from './ComboIndicator';
import { BaseCharacter } from '../characters/BaseCharacter';
import { GAME_WIDTH } from '../config/constants';

export class StageHUD {
  private playerHpBar!: HealthBar;
  private playerMpBar!: MPBar;
  private enemyHpBars: HealthBar[] = [];
  private comboIndicator: ComboIndicator;
  private playerLabel!: Phaser.GameObjects.Text;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.comboIndicator = new ComboIndicator(scene);
  }

  initPlayerHUD(char: BaseCharacter): void {
    this.playerHpBar = new HealthBar(this.scene, 20, 20, 200, 14, char.maxHp);
    this.playerMpBar = new MPBar(this.scene, 20, 42, 160, 10, char.maxMp);

    // Player name
    this.playerLabel = this.scene.add.text(20, 5, char.stats.nameZH, {
      fontSize: '12px',
      color: '#ffffff',
      fontFamily: 'monospace',
      stroke: '#000',
      strokeThickness: 2,
    }).setDepth(900);
  }

  addEnemyHUD(char: BaseCharacter, index: number): void {
    const x = GAME_WIDTH - 180;
    const y = 20 + index * 30;
    const bar = new HealthBar(this.scene, x, y, 160, 10, char.maxHp);
    this.enemyHpBars.push(bar);
  }

  update(player: BaseCharacter, enemies: BaseCharacter[], hitCounter: number, delta: number = 16): void {
    this.playerHpBar?.update(player.hp);
    this.playerMpBar?.update(player.mp);

    for (let i = 0; i < enemies.length && i < this.enemyHpBars.length; i++) {
      this.enemyHpBars[i].update(enemies[i].hp);
    }

    // Combo indicator
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
    this.enemyHpBars.forEach((b) => b.destroy());
    this.comboIndicator.destroy();
    this.playerLabel?.destroy();
  }
}
