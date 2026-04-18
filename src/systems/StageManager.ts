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
  private player!: BaseCharacter;
  private zDepthSorter: ZDepthSorter;
  private combatSystem: CombatSystem;
  private projectiles: ProjectileSystem;
  private waveText!: Phaser.GameObjects.Text;
  private stageComplete = false;

  constructor(
    scene: Phaser.Scene,
    config: StageConfig,
    player: BaseCharacter,
    zDepthSorter: ZDepthSorter,
    combatSystem: CombatSystem,
    projectiles: ProjectileSystem,
  ) {
    this.scene = scene;
    this.config = config;
    this.player = player;
    this.zDepthSorter = zDepthSorter;
    this.combatSystem = combatSystem;
    this.projectiles = projectiles;

    this.waveText = scene.add.text(GAME_WIDTH / 2, 120, '', {
      fontSize: '24px', fontFamily: 'monospace', color: '#ffdd00', stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1000);
  }

  startFirstWave(): void { this.spawnWave(0); }

  get isStageComplete(): boolean { return this.stageComplete; }

  get aliveEnemies(): EnemyCharacter[] {
    return this.enemies.filter((e) => e.isAlive);
  }

  update(time: number, delta: number): void {
    for (const enemy of this.enemies) if (enemy.isAlive) enemy.update(time, delta);
    for (const ai of this.aiControllers) ai.update(time, delta);

    if (!this.stageComplete && this.currentWave > 0) {
      if (this.aliveEnemies.length === 0) {
        if (this.currentWave >= this.config.waves.length) {
          this.stageComplete = true;
          this.showStageComplete();
        } else {
          this.scene.time.delayedCall(1500, () => this.spawnWave(this.currentWave));
        }
      }
    }
  }

  private spawnWave(waveIndex: number): void {
    if (waveIndex >= this.config.waves.length) return;
    this.currentWave = waveIndex + 1;
    const wave = this.config.waves[waveIndex];

    this.waveText.setText(`Wave ${this.currentWave}/${this.config.waves.length}`);
    this.waveText.setAlpha(1);
    this.scene.tweens.add({ targets: this.waveText, alpha: 0, duration: 2000, delay: 1000 });

    for (const enemyDef of wave.enemies) {
      const typeDef = ENEMY_TYPES[enemyDef.type];
      const stats = { ...typeDef.stats, ...enemyDef.stats };
      let enemy: EnemyCharacter;
      if (enemyDef.type === 'boss_lao') {
        enemy = new BossCharacter(this.scene, enemyDef.x, enemyDef.groundY, stats, typeDef, {
          onSpawnAdd: (x, y) => this.spawnAdd(x, y),
        });
      } else {
        enemy = new EnemyCharacter(this.scene, enemyDef.x, enemyDef.groundY, stats, typeDef);
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
      ai.setTarget(this.player);

      this.enemies.push(enemy);
      this.aiControllers.push(ai);
      this.zDepthSorter.addCharacter(enemy);
      this.combatSystem.addCharacter(enemy);
    }
  }

  private showStageComplete(): void {
    const text = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'STAGE CLEAR!', {
      fontSize: '40px', fontFamily: 'monospace', color: '#ffdd00', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(2000);

    this.scene.tweens.add({
      targets: text, scale: 1.2, duration: 500, yoyo: true, repeat: 3,
      onComplete: () => { this.scene.scene.start('Victory'); },
    });
  }

  private spawnAdd(x: number, y: number): void {
    const typeDef = ENEMY_TYPES['soldier'];
    const enemy = new EnemyCharacter(this.scene, x, y, typeDef.stats, typeDef);
    const ai = new AIController(enemy, typeDef.aiPersonality);
    ai.setTarget(this.player);
    this.enemies.push(enemy);
    this.aiControllers.push(ai);
    this.zDepthSorter.addCharacter(enemy);
    this.combatSystem.addCharacter(enemy);
  }

  destroy(): void { this.waveText?.destroy(); }
}
