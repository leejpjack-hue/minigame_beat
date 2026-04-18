import Phaser from 'phaser';
import { SceneKeys } from '../enums/SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT, STAGE_WALKABLE_Y_MIN, STAGE_WALKABLE_Y_MAX } from '../config/constants';
import { ComboInput } from '../enums/ComboInput';
import { PlayerCharacter } from '../characters/PlayerCharacter';
import { BaseCharacter } from '../characters/BaseCharacter';
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
  private player2: PlayerCharacter | null = null;
  private is2P = false;
  private zDepthSorter!: ZDepthSorter;
  private combatSystem!: CombatSystem;
  private comboParser!: ComboParser;
  private comboParser2!: ComboParser;
  private projectiles!: ProjectileSystem;
  private hud!: StageHUD;
  private stageManager!: StageManager;
  private virtualDpad!: VirtualDpad;
  private touchDx = 0;
  private touchDy = 0;
  private currentStageIndex = 0;
  private cameraTracker!: Phaser.GameObjects.Zone;

  // P1 keys
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyAttack!: Phaser.Input.Keyboard.Key;
  private keyHeavy!: Phaser.Input.Keyboard.Key;
  private keyJump!: Phaser.Input.Keyboard.Key;
  private keyBlock!: Phaser.Input.Keyboard.Key;

  // P2 keys
  private keyP2Attack!: Phaser.Input.Keyboard.Key;
  private keyP2Heavy!: Phaser.Input.Keyboard.Key;
  private keyP2Jump!: Phaser.Input.Keyboard.Key;
  private keyP2Block!: Phaser.Input.Keyboard.Key;

  private debugText!: Phaser.GameObjects.Text;
  private showDebug = false;
  private keyDebug!: Phaser.Input.Keyboard.Key;
  private gameOver = false;

  constructor() {
    super({ key: SceneKeys.Stage });
  }

  create(data?: { fighter?: FighterStats; fighterP1?: FighterStats; fighterP2?: FighterStats; stageIndex?: number }): void {
    // Stop menu bgm
    this.sound.stopByKey('bgm_menu');

    this.gameOver = false;
    this.currentStageIndex = data?.stageIndex ?? this.registry.get('currentStage') ?? 0;

    // Persist fighters across scene restarts (stage-to-stage transitions)
    const storedP1 = this.registry.get('fighterP1') as FighterStats | undefined;
    const storedP2 = this.registry.get('fighterP2') as FighterStats | undefined;
    const incomingP1 = data?.fighterP1 ?? data?.fighter;
    const incomingP2 = data?.fighterP2;
    if (incomingP1) this.registry.set('fighterP1', incomingP1);
    if (incomingP2) this.registry.set('fighterP2', incomingP2);
    const effectiveP1 = incomingP1 ?? storedP1;
    const effectiveP2 = incomingP2 ?? storedP2;
    this.is2P = !!effectiveP2;
    this.player2 = null;

    // Play stage bgm
    const bgmKey = `bgm_stage${Math.min(3, this.currentStageIndex + 1)}`;
    if (!this.sound.get(bgmKey)?.isPlaying) {
      this.sound.play(bgmKey, { loop: true, volume: 0.4 });
    }

    const stageConfig = ALL_STAGES[this.currentStageIndex] ?? ALL_STAGES[0];

    const skyColor = '#' + stageConfig.skyColor.toString(16).padStart(6, '0');
    this.cameras.main.setBackgroundColor(skyColor);

    // Full stage width spans all sections (one per wave)
    const stageWidth = stageConfig.waves.length * GAME_WIDTH;

    // Floor across full stage
    const floor = this.add.graphics();
    floor.fillStyle(stageConfig.groundColor, 1);
    floor.fillRect(0, STAGE_WALKABLE_Y_MIN, stageWidth, STAGE_WALKABLE_Y_MAX - STAGE_WALKABLE_Y_MIN + 30);
    floor.lineStyle(1, stageConfig.accentColor, 0.5);
    for (let y = STAGE_WALKABLE_Y_MIN; y <= STAGE_WALKABLE_Y_MAX; y += 20) {
      floor.beginPath(); floor.moveTo(0, y); floor.lineTo(stageWidth, y); floor.strokePath();
    }
    // Section divider posts (subtle pillars between waves)
    for (let i = 1; i < stageConfig.waves.length; i++) {
      const px = i * GAME_WIDTH;
      floor.fillStyle(stageConfig.accentColor, 0.6);
      floor.fillRect(px - 3, STAGE_WALKABLE_Y_MIN - 60, 6, 60);
    }

    // Sky across full stage
    const sky = this.add.graphics();
    sky.fillStyle(stageConfig.skyColor, 1);
    sky.fillRect(0, 0, stageWidth, STAGE_WALKABLE_Y_MIN);
    sky.setDepth(-10);

    // -- ADDED DETAIL: Background Elements --
    const stageName = stageConfig.name;

    // Clouds (all stages except maybe Throne Room, but let's keep for now)
    for (let i = 0; i < stageConfig.waves.length * 3; i++) {
      const cx = Math.random() * stageWidth;
      const cy = 20 + Math.random() * 60;
      this.add.image(cx, cy, 'bg_cloud').setScrollFactor(0.2).setDepth(-9).setAlpha(0.6);
    }

    // Distant Parallax (Houses for streets/palace, Trees/Rocks for border)
    for (let i = 0; i < stageConfig.waves.length * 10; i++) {
      const tx = Math.random() * stageWidth;
      const ty = STAGE_WALKABLE_Y_MIN - 10 - Math.random() * 20;
      let key = '';

      if (stageName === 'Xianyang Streets' || stageName === 'Zhao Palace') {
        key = Math.random() > 0.5 ? 'bg_house_1' : 'bg_house_2';
      } else {
        key = Math.random() > 0.4 ? (Math.random() > 0.5 ? 'bg_tree_1' : 'bg_tree_2') : 'bg_rock';
      }

      const scale = 0.6 + Math.random() * 0.4;
      this.add.image(tx, ty, key).setOrigin(0.5, 1).setScale(scale).setDepth(-5).setScrollFactor(0.7).setAlpha(0.8);
    }

    // Interactive/Mid-ground Details (Stalls, Lanterns, Banners)
    for (let i = 0; i < stageConfig.waves.length * 5; i++) {
      const tx = Math.random() * stageWidth;
      const ty = STAGE_WALKABLE_Y_MIN - 5;
      const rand = Math.random();

      if (stageName === 'Xianyang Streets') {
        if (rand > 0.7) {
          this.add.image(tx, ty, Math.random() > 0.5 ? 'bg_stall_blue' : 'bg_stall_red').setOrigin(0.5, 1).setDepth(-4).setScrollFactor(0.9);
        } else if (rand > 0.4) {
          this.add.image(tx, ty - 80, 'bg_lantern').setOrigin(0.5, 0).setDepth(-4).setScrollFactor(0.9);
        } else {
          this.add.image(tx, ty, 'bg_banner_qin').setOrigin(0.5, 1).setDepth(-4).setScrollFactor(0.9);
        }
      } else if (stageName === 'Zhao Palace') {
        if (rand > 0.6) {
          this.add.image(tx, ty, 'bg_banner_zhao').setOrigin(0.5, 1).setDepth(-4).setScrollFactor(0.9);
        } else {
          this.add.image(tx, ty - 80, 'bg_lantern').setOrigin(0.5, 0).setDepth(-4).setScrollFactor(0.9);
        }
      } else if (stageName === 'Qin Border Wall' || stageName === 'Qin Throne Room') {
        if (rand > 0.5) {
          this.add.image(tx, ty, 'bg_banner_qin').setOrigin(0.5, 1).setDepth(-4).setScrollFactor(0.9);
        } else if (stageName === 'Qin Throne Room' && rand > 0.2) {
          this.add.image(tx, ty - 100, 'bg_lantern').setOrigin(0.5, 0).setScale(1.5).setDepth(-4).setScrollFactor(0.9);
        }
      }
    }

    // Floor Detail (Stones on the ground)
    for (let i = 0; i < stageConfig.waves.length * 15; i++) {
      const rx = Math.random() * stageWidth;
      const ry = STAGE_WALKABLE_Y_MIN + Math.random() * (STAGE_WALKABLE_Y_MAX - STAGE_WALKABLE_Y_MIN);
      const rock = this.add.image(rx, ry, 'bg_rock').setScale(0.3 + Math.random() * 0.4).setAlpha(0.7).setOrigin(0.5, 1);
      rock.setDepth(ry);
    }

    // Stage title pinned to viewport
    this.add.text(GAME_WIDTH / 2, STAGE_WALKABLE_Y_MIN - 15, `${stageConfig.nameZH} - ${stageConfig.name}`, {
      fontSize: '14px', color: '#888888', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(-5).setScrollFactor(0);

    // Systems
    this.zDepthSorter = new ZDepthSorter();
    this.combatSystem = new CombatSystem(this);
    this.comboParser = new ComboParser();
    this.comboParser2 = new ComboParser();
    this.projectiles = new ProjectileSystem(this);
    this.hud = new StageHUD(this);

    // P1
    const p1Stats: FighterStats = effectiveP1 ?? XiangShaoLongStats;
    this.player = new PlayerCharacter(this, 150, 340, p1Stats);
    this.zDepthSorter.addCharacter(this.player);
    this.combatSystem.addCharacter(this.player);
    this.hud.initPlayerHUD(this.player, 'P1');

    // P2
    if (this.is2P && effectiveP2) {
      this.player2 = new PlayerCharacter(this, 200, 340, effectiveP2);
      this.zDepthSorter.addCharacter(this.player2);
      this.combatSystem.addCharacter(this.player2);
      this.hud.initPlayerHUD(this.player2, 'P2');
    }

    const players: BaseCharacter[] = [this.player];
    if (this.player2) players.push(this.player2);

    this.stageManager = new StageManager(this, stageConfig, players, this.zDepthSorter, this.combatSystem, this.projectiles);
    this.stageManager.startFirstWave();

    // Camera: bounds span full stage, follow invisible tracker = midpoint of alive players
    this.cameras.main.setBounds(0, 0, stageWidth, GAME_HEIGHT);
    this.cameraTracker = this.add.zone(this.player.x, GAME_HEIGHT / 2, 1, 1);
    this.cameras.main.startFollow(this.cameraTracker, true, 0.12, 0);

    // Virtual D-pad (P1 only)
    this.virtualDpad = new VirtualDpad(this);
    this.events.on('dpad-move', (dx: number, dy: number) => { this.touchDx = dx; this.touchDy = dy; });
    this.events.on('dpad-release', () => { this.touchDx = 0; this.touchDy = 0; });
    this.events.on('button-attack', () => this.player.handleComboInput(ComboInput.Attack));
    this.events.on('button-jump', () => this.player.handleComboInput(ComboInput.Jump));
    this.events.on('button-special', () => this.player.executeCombo('special_forward'));
    this.events.on('button-block', () => this.player.handleComboInput(ComboInput.Defend));

    // Keyboard
    if (this.input.keyboard) {
      // P1 keys: WASD + J/K/Space/L
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keyW = this.input.keyboard.addKey('W');
      this.keyS = this.input.keyboard.addKey('S');
      this.keyA = this.input.keyboard.addKey('A');
      this.keyD = this.input.keyboard.addKey('D');
      this.keyAttack = this.input.keyboard.addKey('J');
      this.keyHeavy = this.input.keyboard.addKey('K');
      this.keyJump = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
      this.keyBlock = this.input.keyboard.addKey('L');

      // P2 keys: Arrows + ,/M/.//
      this.keyP2Attack = this.input.keyboard.addKey(',');
      this.keyP2Heavy = this.input.keyboard.addKey('M');
      this.keyP2Jump = this.input.keyboard.addKey('.');
      this.keyP2Block = this.input.keyboard.addKey('/');

      this.keyDebug = this.input.keyboard.addKey('`');
    }

    this.debugText = this.add.text(10, GAME_HEIGHT - 70, '', {
      fontSize: '11px', color: '#ffffff', fontFamily: 'monospace',
    }).setDepth(1000).setScrollFactor(0).setVisible(false);

    // Instructions
    const p1Help = 'P1: WASD+Space+J/K/L';
    const p2Help = this.is2P ? ' | P2: Arrows+./,+M+/' : '';
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 10, p1Help + p2Help, {
      fontSize: '9px', color: '#555555', fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(1000).setScrollFactor(0);
  }

  update(time: number, delta: number): void {
    if (this.gameOver) return;

    // Co-op game over: both players must be dead
    const p1Dead = !this.player.isAlive;
    const p2Dead = !this.player2 || !this.player2.isAlive;
    if (p1Dead && p2Dead) {
      this.gameOver = true;
      const cam = this.cameras.main;
      this.add.rectangle(cam.scrollX + GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.6).setDepth(2000).setScrollFactor(0);
      this.add.text(cam.scrollX + GAME_WIDTH / 2, GAME_HEIGHT / 2 - 20, 'GAME OVER', {
        fontSize: '36px', color: '#ff0000', fontFamily: 'monospace', stroke: '#000', strokeThickness: 4,
      }).setOrigin(0.5).setDepth(2001).setScrollFactor(0);
      this.add.text(cam.scrollX + GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'Press R to restart', {
        fontSize: '16px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5).setDepth(2001).setScrollFactor(0);
      this.input.keyboard?.on('keydown-R', () => {
        this.registry.set('currentStage', this.currentStageIndex);
        this.scene.restart();
      });
      return;
    }

    // P1 input & update
    this.handleP1Input();
    this.player.update(time, delta);

    // P2 input & update
    if (this.player2 && this.player2.isAlive) {
      this.handleP2Input();
      this.player2.update(time, delta);
    }

    this.stageManager.update(time, delta);
    this.combatSystem.update(time, delta);
    this.projectiles.update(delta, () => this.getAllCharacters());
    this.zDepthSorter.update();
    this.hud.update(this.player, this.stageManager.aliveEnemies, this.combatSystem.getHitCounter(), delta, this.player2);

    // Clamp players: cannot walk past the section gate while a wave is active, and cannot leave stage bounds
    const stageWidth = this.stageManager.stageWidth;
    const gate = this.stageManager.sectionGateX;
    const locked = this.stageManager.isLocked;
    const cam = this.cameras.main;
    const leftBound = Math.max(0, cam.scrollX - 20); // can't walk backward off-camera
    this.clampPlayer(this.player, leftBound, locked ? gate : stageWidth - 20);
    if (this.player2 && this.player2.isAlive) {
      this.clampPlayer(this.player2, leftBound, locked ? gate : stageWidth - 20);
    }

    // Update camera tracker: midpoint between alive players, clamped to camera bounds
    const alive = this.player2 && this.player2.isAlive ? [this.player, this.player2] : [this.player];
    const aliveP = alive.filter((p) => p.isAlive);
    const list = aliveP.length ? aliveP : [this.player];
    const avgX = list.reduce((s, p) => s + p.x, 0) / list.length;
    this.cameraTracker.x = avgX;

    if (this.stageManager.isStageComplete) {
      this.gameOver = true;
      this.time.delayedCall(3000, () => {
        const nextStage = this.currentStageIndex + 1;
        if (nextStage < ALL_STAGES.length) {
          this.registry.set('currentStage', nextStage);
          this.scene.restart({ stageIndex: nextStage });
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

  private clampPlayer(p: BaseCharacter, minX: number, maxX: number): void {
    if (p.x < minX) p.x = minX;
    if (p.x > maxX) p.x = maxX;
  }

  private getAllCharacters(): BaseCharacter[] {
    const chars: BaseCharacter[] = [this.player];
    if (this.player2) chars.push(this.player2);
    return chars.concat(this.stageManager.aliveEnemies);
  }

  // --- P1 Input (WASD + J/K/Space/L) ---
  private handleP1Input(): void {
    if (!this.player.isAlive) return;

    let dx = 0, dy = 0;
    if (this.keyW?.isDown) dy = -1;
    if (this.keyS?.isDown) dy = 1;
    if (this.keyA?.isDown) dx = -1;
    if (this.keyD?.isDown) dx = 1;
    if (this.touchDx !== 0) dx = this.touchDx;
    if (this.touchDy !== 0) dy = this.touchDy;

    // Feed directions to combo parser
    if (Phaser.Input.Keyboard.JustDown(this.keyA)) this.comboParser.recordInput(ComboInput.Left);
    if (Phaser.Input.Keyboard.JustDown(this.keyD)) this.comboParser.recordInput(ComboInput.Right);
    if (Phaser.Input.Keyboard.JustDown(this.keyW)) this.comboParser.recordInput(ComboInput.Up);
    if (Phaser.Input.Keyboard.JustDown(this.keyS)) this.comboParser.recordInput(ComboInput.Down);

    this.player.handleDirectionalInput(dx, dy);

    if (Phaser.Input.Keyboard.JustDown(this.keyJump)) {
      this.player.handleComboInput(ComboInput.Jump);
      this.comboParser.recordInput(ComboInput.Jump);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
      const combo = this.comboParser.recordInput(ComboInput.Attack);
      if (combo) { this.player.executeCombo(combo); }
      else if (!this.player.isGrounded) { this.player.executeCombo('air_dive'); }
      else { this.player.handleComboInput(ComboInput.Attack); }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyHeavy)) {
      const combo = this.comboParser.recordInput(ComboInput.Heavy);
      if (combo) { this.player.executeCombo(combo); }
      else { this.player.performHeavy(); }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyBlock)) {
      const combo = this.comboParser.recordInput(ComboInput.Defend);
      if (combo) { this.player.executeCombo(combo); }
      else { this.player.handleComboInput(ComboInput.Defend); }
    }
    if (Phaser.Input.Keyboard.JustUp(this.keyBlock)) {
      this.player.releaseBlock();
    }
  }

  // --- P2 Input (Arrows + ,/M/./ / ) ---
  private handleP2Input(): void {
    if (!this.player2 || !this.player2.isAlive) return;

    let dx = 0, dy = 0;
    if (this.cursors.up.isDown) dy = -1;
    if (this.cursors.down.isDown) dy = 1;
    if (this.cursors.left.isDown) dx = -1;
    if (this.cursors.right.isDown) dx = 1;

    // Feed P2 directions to P2 combo parser
    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.comboParser2.recordInput(ComboInput.Left);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.comboParser2.recordInput(ComboInput.Right);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.up)) this.comboParser2.recordInput(ComboInput.Up);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.down)) this.comboParser2.recordInput(ComboInput.Down);

    this.player2.handleDirectionalInput(dx, dy);

    if (Phaser.Input.Keyboard.JustDown(this.keyP2Jump)) {
      this.player2.handleComboInput(ComboInput.Jump);
      this.comboParser2.recordInput(ComboInput.Jump);
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyP2Attack)) {
      const combo = this.comboParser2.recordInput(ComboInput.Attack);
      if (combo) { this.player2.executeCombo(combo); }
      else if (!this.player2.isGrounded) { this.player2.executeCombo('air_dive'); }
      else { this.player2.handleComboInput(ComboInput.Attack); }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyP2Heavy)) {
      const combo = this.comboParser2.recordInput(ComboInput.Heavy);
      if (combo) { this.player2.executeCombo(combo); }
      else { this.player2.performHeavy(); }
    }
    if (Phaser.Input.Keyboard.JustDown(this.keyP2Block)) {
      const combo = this.comboParser2.recordInput(ComboInput.Defend);
      if (combo) { this.player2.executeCombo(combo); }
      else { this.player2.handleComboInput(ComboInput.Defend); }
    }
    if (Phaser.Input.Keyboard.JustUp(this.keyP2Block)) {
      this.player2.releaseBlock();
    }
  }

  private updateDebugText(): void {
    if (!this.showDebug) return;
    const lines = [
      `P1: x=${this.player.x.toFixed(0)} y=${this.player.groundY.toFixed(0)} HP: ${this.player.hp}/${this.player.maxHp} State: ${this.player.stateMachine.currentState}`,
      `Attack: ${this.player.currentAttackName || '-'} active=${this.player.isHitboxActive}`,
    ];
    if (this.player2) {
      lines.push(`P2: x=${this.player2.x.toFixed(0)} y=${this.player2.groundY.toFixed(0)} HP: ${this.player2.hp}/${this.player2.maxHp} State: ${this.player2.stateMachine.currentState}`);
    }
    lines.push(`Enemies: ${this.stageManager.aliveEnemies.length} | Combo: ${this.combatSystem.getHitCounter()}`);
    this.debugText.setText(lines);
  }
}
