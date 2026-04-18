import Phaser from 'phaser';
import { SceneKeys } from '../enums/SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, STAGE_WALKABLE_Y_MIN, STAGE_WALKABLE_Y_MAX } from '../config/constants';
import { ComboInput } from '../enums/ComboInput';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import { ZDepthSorter } from '../systems/ZDepthSorter';
import { CombatSystem } from '../systems/CombatSystem';
import { ComboParser } from '../systems/ComboParser';
import { ProjectileSystem } from '../systems/ProjectileSystem';
import { StageHUD } from '../ui/StageHUD';
import { VirtualDpad } from '../ui/VirtualDpad';
import { StageManager, ALL_STAGES } from '../systems/StageManager';
import { FighterStats } from '../characters/fighters/FighterStats';
import { XiangShaoLongStats } from '../characters/fighters/XiangShaoLong';

export class StageScene extends Phaser.Scene {
  private player!: PlayerCharacter;
  private zDepthSorter!: ZDepthSorter;
  private combatSystem!: CombatSystem;
  private comboParser!: ComboParser;
  private projectiles!: ProjectileSystem;
  private hud!: StageHUD;
  private stageManager!: StageManager;
  private virtualDpad!: VirtualDpad;
  private touchDx = 0;
  private touchDy = 0;
  private currentStageIndex = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyAttack!: Phaser.Input.Keyboard.Key;
  private keyHeavy!: Phaser.Input.Keyboard.Key;
  private keyJump!: Phaser.Input.Keyboard.Key;
  private keyBlock!: Phaser.Input.Keyboard.Key;

  private debugText!: Phaser.GameObjects.Text;
  private showDebug = false;
  private keyDebug!: Phaser.Input.Keyboard.Key;
  private gameOver = false;

  constructor() {
    super({ key: SceneKeys.Stage });
  }

  create(data?: { fighter?: FighterStats; stageIndex?: number }): void {
    this.gameOver = false;
    this.currentStageIndex = data?.stageIndex ?? this.registry.get('currentStage') ?? 0;

    const stageConfig = ALL_STAGES[this.currentStageIndex] ?? ALL_STAGES[0];

    const skyColor = '#' + stageConfig.skyColor.toString(16).padStart(6, '0');
    this.cameras.main.setBackgroundColor(skyColor);

    const floor = this.add.graphics();
    floor.fillStyle(stageConfig.groundColor, 1);
    floor.fillRect(0, STAGE_WALKABLE_Y_MIN, GAME_WIDTH, STAGE_WALKABLE_Y_MAX - STAGE_WALKABLE_Y_MIN + 30);
    floor.lineStyle(1, stageConfig.accentColor, 0.5);
    for (let y = STAGE_WALKABLE_Y_MIN; y <= STAGE_WALKABLE_Y_MAX; y += 20) {
      floor.beginPath();
      floor.moveTo(0, y);
      floor.lineTo(GAME_WIDTH, y);
      floor.strokePath();
    }

    const sky = this.add.graphics();
    sky.fillStyle(stageConfig.skyColor, 1);
    sky.fillRect(0, 0, GAME_WIDTH, STAGE_WALKABLE_Y_MIN);
    sky.setDepth(-10);

    this.add.text(GAME_WIDTH / 2, STAGE_WALKABLE_Y_MIN - 15, `${stageConfig.nameZH} - ${stageConfig.name}`, {
      fontSize: '14px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(-5);

    this.zDepthSorter = new ZDepthSorter();
    this.combatSystem = new CombatSystem(this);
    this.comboParser = new ComboParser();
    this.projectiles = new ProjectileSystem(this);
    this.hud = new StageHUD(this);

    const playerStats: FighterStats = data?.fighter ?? XiangShaoLongStats;
    this.player = new PlayerCharacter(this, 150, 340, playerStats);
    this.zDepthSorter.addCharacter(this.player);
    this.combatSystem.addCharacter(this.player);
    this.hud.initPlayerHUD(this.player);

    this.stageManager = new StageManager(this, stageConfig, this.player, this.zDepthSorter, this.combatSystem, this.projectiles);
    this.stageManager.startFirstWave();

    // Virtual D-pad
    this.virtualDpad = new VirtualDpad(this);
    this.events.on('dpad-move', (dx: number, dy: number) => { this.touchDx = dx; this.touchDy = dy; });
    this.events.on('dpad-release', () => { this.touchDx = 0; this.touchDy = 0; });
    this.events.on('button-attack', () => this.player.handleComboInput(ComboInput.Attack));
    this.events.on('button-jump', () => this.player.handleComboInput(ComboInput.Jump));
    this.events.on('button-special', () => this.player.executeCombo('special_forward'));
    this.events.on('button-block', () => this.player.handleComboInput(ComboInput.Defend));

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey('W');
      this.keyS = this.input.keyboard.addKey('S');
      this.keyA = this.input.keyboard.addKey('A');
      this.keyD = this.input.keyboard.addKey('D');
      this.keyAttack = this.input.keyboard.addKey('J');
      this.keyHeavy = this.input.keyboard.addKey('K');
      this.keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyBlock = this.input.keyboard.addKey('L');
      this.keyDebug = this.input.keyboard.addKey('\`');
    }

    this.debugText = this.add.text(10, GAME_HEIGHT - 70, '', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'monospace',
    }).setDepth(1000).setScrollFactor(0).setVisible(false);

    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10,
      'WASD move | SPACE jump | J light | K heavy | L block | →→J dash | ↑K upper | ↓K low-sp | S↓→J super', {
      fontSize: '9px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(1000);
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    if (!this.player.isAlive) {
      this.gameOver = true;
      this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setDepth(2000);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'GAME OVER', {
        fontSize: '36px', color: '#ff0000', fontFamily: 'monospace', stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(2001);
      this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'Press R to restart', {
        fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(2001);
      this.input.keyboard?.on('keydown-R', () => {
        this.registry.set('currentStage', this.currentStageIndex);
        this.scene.restart({ stageIndex: this.currentStageIndex });
      });
      return;
    }

    this.handleInput();
    this.player.update(time, delta);
    this.stageManager.update(time, delta);
    this.combatSystem.update(time, delta);
    this.projectiles.update(delta, () => [this.player, ...this.stageManager.aliveEnemies]);
    this.zDepthSorter.update();
    this.hud.update(this.player, this.stageManager.aliveEnemies, this.combatSystem.getHitCounter(), delta);

    if (this.stageManager.isStageComplete) {
      this.gameOver = true;
      this.time.delayedCall(3000, () => {
        const nextStage = this.currentStageIndex + 1;
        if (nextStage < ALL_STAGES.length) {
          this.registry.set('currentStage', nextStage);
          this.scene.start(SceneKeys.Stage, { stageIndex: nextStage });
        } else {
          this.scene.start(SceneKeys.Victory);
        }
      });
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyDebug)) {
      this.showDebug = !this.showDebug;
      this.debugText.setVisible(this.showDebug);
      if (this.showDebug) this.combatSystem.enableDebug();
    }
    this.updateDebugText();
  }

  private handleInput(): void {
    let dx = 0, dy = 0;
    if (this.keyW?.isDown || this.cursors.up.isDown) dy = -1;
    if (this.keyS?.isDown || this.cursors.down.isDown) dy = 1;
    if (this.keyA?.isDown || this.cursors.left.isDown) dx = -1;
    if (this.keyD?.isDown || this.cursors.right.isDown) dx = 1;
    if (this.touchDx !== 0) dx = this.touchDx;
    if (this.touchDy !== 0) dy = this.touchDy;

    // Feed directions into combo parser so sequences like ↓→K land
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left) || Phaser.Input.Keyboard.JustDown(this.keyA)) {
      this.comboParser.recordInput(ComboInput.Left);
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right) || Phaser.Input.Keyboard.JustDown(this.keyD)) {
      this.comboParser.recordInput(ComboInput.Right);
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.keyW)) {
      this.comboParser.recordInput(ComboInput.Up);
    }
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down) || Phaser.Input.Keyboard.JustDown(this.keyS)) {
      this.comboParser.recordInput(ComboInput.Down);
    }

    this.player.handleDirectionalInput(dx, dy);

    if (Phaser.Input.Keyboard.JustDown(this.keyJump)) {
      this.player.handleComboInput(ComboInput.Jump);
      this.comboParser.recordInput(ComboInput.Jump);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
      const combo = this.comboParser.recordInput(ComboInput.Attack);
      if (combo) {
        this.player.executeCombo(combo);
      } else if (!this.player.isGrounded) {
        // Air attack => air_dive for fighters that have it
        this.player.executeCombo('air_dive');
      } else {
        this.player.handleComboInput(ComboInput.Attack);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyHeavy)) {
      const combo = this.comboParser.recordInput(ComboInput.Heavy);
      if (combo) {
        this.player.executeCombo(combo);
      } else {
        this.player.performHeavy();
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyBlock)) {
      const combo = this.comboParser.recordInput(ComboInput.Defend);
      if (combo) {
        this.player.executeCombo(combo);
      } else {
        this.player.handleComboInput(ComboInput.Defend);
      }
    }
    if (Phaser.Input.Keyboard.JustUp(this.keyBlock)) {
      this.player.releaseBlock();
    }
  }

  private updateDebugText(): void {
    if (!this.showDebug) return;
    this.debugText.setText([
      `Player: x=${this.player.x.toFixed(0)} y=${this.player.groundY.toFixed(0)} jump=${this.player.jumpHeight.toFixed(0)}`,
      `State: ${this.player.stateMachine.currentState} HP: ${this.player.hp} MP: ${this.player.mp}`,
      `Attack: ${this.player.currentAttackName || '-'} active=${this.player.isHitboxActive} chain=${this.player.lightChainIndex}`,
      `Enemies: ${this.stageManager.aliveEnemies.length} | Combo: ${this.combatSystem.getHitCounter()}`,
    ]);
  }
}
