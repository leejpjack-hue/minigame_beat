import Phaser from 'phaser';
import { EnemyCharacter } from '../characters/EnemyCharacter';
import { BaseCharacter } from '../characters/BaseCharacter';
import { AIController } from './AIController';
import { ZDepthSorter } from './ZDepthSorter';
import { CombatSystem } from './CombatSystem';
import { ProjectileSystem } from './ProjectileSystem';
import { ENEMY_TYPES, ENEMY_HITBOXES, EnemyTypeId } from '../characters/enemies/EnemyTypes';
import { BossCharacter } from '../characters/enemies/BossCharacter';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { Direction } from '../enums/Direction';

export interface WaveEnemy {
  x: number;
  groundY: number;
  type: EnemyTypeId;
  stats?: { maxHp?: number; attackPower?: number; speed?: number };
}

export interface WaveConfig { enemies: WaveEnemy[]; }

export interface StageConfig {
  name: string;
  nameZH: string;
  skyColor: number;
  groundColor: number;
  accentColor: number;
  waves: WaveConfig[];
}

const STAGE_1: StageConfig = {
  name: 'Xianyang Streets',
  nameZH: '咸陽城街道',
  skyColor: 0x1a1a3a,
  groundColor: 0x3a2a1a,
  accentColor: 0x554433,
  waves: [
    { enemies: [
      { x: 600, groundY: 330, type: 'soldier' },
      { x: 650, groundY: 350, type: 'soldier' },
    ]},
    { enemies: [
      { x: 550, groundY: 320, type: 'soldier' },
      { x: 600, groundY: 340, type: 'soldier' },
      { x: 700, groundY: 360, type: 'archer' },
    ]},
    { enemies: [
      { x: 500, groundY: 310, type: 'soldier' },
      { x: 550, groundY: 330, type: 'soldier' },
      { x: 620, groundY: 350, type: 'shieldman' },
      { x: 680, groundY: 340, type: 'elite' },
    ]},
  ],
};

const STAGE_2: StageConfig = {
  name: 'Zhao Palace',
  nameZH: '趙國質子府',
  skyColor: 0x1a0a1a,
  groundColor: 0x2a1a2a,
  accentColor: 0x443344,
  waves: [
    { enemies: [
      { x: 500, groundY: 330, type: 'soldier' },
      { x: 560, groundY: 350, type: 'spearman' },
      { x: 620, groundY: 320, type: 'archer' },
    ]},
    { enemies: [
      { x: 480, groundY: 310, type: 'spearman' },
      { x: 550, groundY: 340, type: 'soldier' },
      { x: 600, groundY: 360, type: 'shieldman' },
      { x: 680, groundY: 330, type: 'archer' },
    ]},
    { enemies: [
      { x: 500, groundY: 340, type: 'miniboss_lj' },
      { x: 620, groundY: 320, type: 'soldier' },
      { x: 620, groundY: 360, type: 'soldier' },
    ]},
  ],
};

const STAGE_3: StageConfig = {
  name: 'Qin Border Wall',
  nameZH: '秦長城邊境',
  skyColor: 0x0a1a1a,
  groundColor: 0x2a2a2a,
  accentColor: 0x444444,
  waves: [
    { enemies: [
      { x: 600, groundY: 330, type: 'soldier' },
      { x: 650, groundY: 340, type: 'spearman' },
      { x: 720, groundY: 350, type: 'archer' },
    ]},
    { enemies: [
      { x: 480, groundY: 310, type: 'cavalry' },
      { x: 720, groundY: 360, type: 'cavalry' },
      { x: 600, groundY: 340, type: 'shieldman' },
    ]},
    { enemies: [
      { x: 500, groundY: 340, type: 'miniboss_tx' },
      { x: 620, groundY: 320, type: 'spearman' },
      { x: 680, groundY: 360, type: 'archer' },
    ]},
  ],
};

const STAGE_4: StageConfig = {
  name: 'Qin Throne Room',
  nameZH: '秦王大殿',
  skyColor: 0x2a0a0a,
  groundColor: 0x3a1a0a,
  accentColor: 0x664422,
  waves: [
    { enemies: [
      { x: 480, groundY: 330, type: 'elite' },
      { x: 560, groundY: 350, type: 'elite' },
      { x: 640, groundY: 320, type: 'shieldman' },
    ]},
    { enemies: [
      { x: 500, groundY: 340, type: 'boss_lao' },
    ]},
  ],
};

export const ALL_STAGES: StageConfig[] = [STAGE_1, STAGE_2, STAGE_3, STAGE_4];

export class StageManager {
  private scene: Phaser.Scene;
  private config: StageConfig;
  private currentWave = 0;
  private enemies: EnemyCharacter[] = [];
  private aiControllers: AIController[] = [];
  private players: BaseCharacter[] = [];
  private zDepthSorter: ZDepthSorter;
  private combatSystem: CombatSystem;
  private projectiles: ProjectileSystem;
  private waveText!: Phaser.GameObjects.Text;
  private advancePrompt!: Phaser.GameObjects.Text;
  private stageComplete = false;
  private waveCleared = false;
  private readonly sectionWidth = GAME_WIDTH;

  constructor(
    scene: Phaser.Scene,
    config: StageConfig,
    players: BaseCharacter[],
    zDepthSorter: ZDepthSorter,
    combatSystem: CombatSystem,
    projectiles: ProjectileSystem,
  ) {
    this.scene = scene;
    this.config = config;
    this.players = players;
    this.zDepthSorter = zDepthSorter;
    this.combatSystem = combatSystem;
    this.projectiles = projectiles;

    this.waveText = scene.add.text(GAME_WIDTH / 2, 120, '', {
      fontSize: '24px', fontFamily: 'monospace', color: '#ffdd00', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1000).setScrollFactor(0);

    this.advancePrompt = scene.add.text(GAME_WIDTH - 60, GAME_HEIGHT / 2 - 40, 'GO →', {
      fontSize: '32px', fontFamily: 'monospace', color: '#ffff00', stroke: '#000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1001).setScrollFactor(0).setVisible(false);

    scene.tweens.add({
      targets: this.advancePrompt, x: GAME_WIDTH - 30,
      duration: 450, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  startFirstWave(): void { this.spawnWave(0); }

  get isStageComplete(): boolean { return this.stageComplete; }

  get aliveEnemies(): EnemyCharacter[] {
    return this.enemies.filter((e) => e.isAlive);
  }

  /** World width spanning all sections of this stage. */
  get stageWidth(): number {
    return this.config.waves.length * this.sectionWidth;
  }

  /** Right-edge gate for current wave; player cannot cross while wave is active. */
  get sectionGateX(): number {
    const section = Math.max(0, this.currentWave - 1);
    return (section + 1) * this.sectionWidth - 20;
  }

  /** True while current wave is still active (enemies alive) — players are locked to current section. */
  get isLocked(): boolean {
    return !this.waveCleared && !this.stageComplete && this.currentWave > 0;
  }

  update(time: number, delta: number): void {
    for (const enemy of this.enemies) if (enemy.isAlive) enemy.update(time, delta);
    for (const ai of this.aiControllers) ai.update(time, delta);

    // Clamp alive enemies to current section so knockback can't fling them off-stage
    if (this.currentWave > 0) {
      const sectionLeft = (this.currentWave - 1) * this.sectionWidth;
      const sectionRight = this.currentWave * this.sectionWidth - 10;
      for (const enemy of this.enemies) {
        if (!enemy.isAlive) continue;
        if (enemy.x < sectionLeft) { enemy.x = sectionLeft; enemy.knockbackX = 0; }
        else if (enemy.x > sectionRight) { enemy.x = sectionRight; enemy.knockbackX = 0; }
      }
    }

    if (this.stageComplete || this.currentWave <= 0) return;

    // Wave just cleared
    if (!this.waveCleared && this.aliveEnemies.length === 0) {
      this.waveCleared = true;
      if (this.currentWave >= this.config.waves.length) {
        this.stageComplete = true;
        this.showStageComplete();
      } else {
        this.advancePrompt.setVisible(true);
      }
    }

    // Any alive player walked far enough into the next section → spawn next wave
    if (this.waveCleared && this.currentWave < this.config.waves.length) {
      const triggerX = this.currentWave * this.sectionWidth + 80;
      const crossed = this.players.some((p) => p.isAlive && p.x >= triggerX);
      if (crossed) {
        this.advancePrompt.setVisible(false);
        this.waveCleared = false;
        this.spawnWave(this.currentWave);
      }
    }
  }

  private spawnWave(waveIndex: number): void {
    if (waveIndex >= this.config.waves.length) return;
    this.currentWave = waveIndex + 1;
    const wave = this.config.waves[waveIndex];
    const baseX = waveIndex * this.sectionWidth;

    this.scene.sound.play('ui_wave_start');
    this.waveText.setText(`Wave ${this.currentWave}/${this.config.waves.length}`);
    this.waveText.setAlpha(1);
    this.scene.tweens.add({ targets: this.waveText, alpha: 0, duration: 2000, delay: 1000 });

    for (const enemyDef of wave.enemies) {
      const typeDef = ENEMY_TYPES[enemyDef.type];
      const stats = { ...typeDef.stats, ...enemyDef.stats };
      const worldX = baseX + enemyDef.x;
      let enemy: EnemyCharacter;
      if (enemyDef.type === 'boss_lao') {
        enemy = new BossCharacter(this.scene, worldX, enemyDef.groundY, stats, typeDef, {
          onSpawnAdd: (x, y) => this.spawnAdd(x, y),
        });
      } else {
        enemy = new EnemyCharacter(this.scene, worldX, enemyDef.groundY, stats, typeDef);
      }

      enemy.onProjectile = (att) => {
        const atk = ENEMY_HITBOXES[att.typeDef?.attackName ?? 'enemy_arrow'];
        if (!atk?.projectile) return;
        const dir = att.facing === Direction.Right ? 1 : -1;
        this.projectiles.spawn({
          owner: att,
          x: att.x + 20 * dir,
          y: att.groundY - 22,
          dir,
          speed: atk.projectile.speed,
          range: atk.projectile.range,
          damage: atk.damage,
          knockbackX: atk.knockbackX,
          knockbackY: atk.knockbackY,
          width: atk.width,
          height: atk.height,
          color: 0xffcc55,
          targetIsPlayer: true,
        });
      };

      const ai = new AIController(enemy, typeDef.aiPersonality);
      ai.setTarget(this.nearestAlivePlayer(enemy.x, enemy.groundY));
      ai.setAllPlayers(this.players);

      this.enemies.push(enemy);
      this.aiControllers.push(ai);
      this.zDepthSorter.addCharacter(enemy);
      this.combatSystem.addCharacter(enemy);
    }
  }

  private showStageComplete(): void {
    const cam = this.scene.cameras.main;
    const text = this.scene.add.text(cam.scrollX + GAME_WIDTH / 2, GAME_HEIGHT / 2, 'STAGE CLEAR!', {
      fontSize: '40px', fontFamily: 'monospace', color: '#ffdd00', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(2000).setScrollFactor(0);

    this.scene.tweens.add({
      targets: text, scale: 1.2, duration: 500, yoyo: true, repeat: 3,
      onComplete: () => { this.scene.scene.start('Victory'); },
    });
  }

  private spawnAdd(x: number, y: number): void {
    const typeDef = ENEMY_TYPES['soldier'];
    const enemy = new EnemyCharacter(this.scene, x, y, typeDef.stats, typeDef);
    const ai = new AIController(enemy, typeDef.aiPersonality);
    ai.setTarget(this.nearestAlivePlayer(x, y));
    ai.setAllPlayers(this.players);
    this.enemies.push(enemy);
    this.aiControllers.push(ai);
    this.zDepthSorter.addCharacter(enemy);
    this.combatSystem.addCharacter(enemy);
  }

  nearestAlivePlayer(fromX: number, fromY: number): BaseCharacter {
    const alive = this.players.filter((p) => p.isAlive);
    if (alive.length === 0) return this.players[0]; // fallback
    if (alive.length === 1) return alive[0];
    let best = alive[0];
    let bestDist = Infinity;
    for (const p of alive) {
      const d = Math.sqrt((p.x - fromX) ** 2 + (p.groundY - fromY) ** 2);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    return best;
  }

  destroy(): void { this.waveText?.destroy(); this.advancePrompt?.destroy(); }
}
