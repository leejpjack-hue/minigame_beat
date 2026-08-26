import Phaser from 'phaser';
import { EnemyCharacter } from '../characters/EnemyCharacter';
import { BaseCharacter } from '../characters/BaseCharacter';
import { AIController } from './AIController';
import { ZDepthSorter } from './ZDepthSorter';
import { CombatSystem } from './CombatSystem';
import { ProjectileSystem } from './ProjectileSystem';
import { ItemDropSystem } from './ItemDropSystem';
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

// ---------- Stage 1: 咸陽城街道 — street brawl, grow the pack ----------
const STAGE_1: StageConfig = {
  name: 'Xianyang Streets',
  nameZH: '咸陽城街道',
  skyColor: 0x1a1a3a,
  groundColor: 0x3a2a1a,
  accentColor: 0x554433,
  waves: [
    { enemies: [
      { x: 560, groundY: 320, type: 'soldier' },
      { x: 620, groundY: 340, type: 'soldier' },
      { x: 680, groundY: 360, type: 'soldier' },
      { x: 720, groundY: 330, type: 'soldier' },
    ]},
    { enemies: [
      { x: 500, groundY: 320, type: 'soldier' },
      { x: 560, groundY: 350, type: 'soldier' },
      { x: 620, groundY: 330, type: 'spearman' },
      { x: 680, groundY: 360, type: 'archer' },
      { x: 740, groundY: 320, type: 'archer' },
    ]},
    { enemies: [
      { x: 480, groundY: 310, type: 'soldier' },
      { x: 540, groundY: 340, type: 'soldier' },
      { x: 600, groundY: 360, type: 'spearman' },
      { x: 660, groundY: 320, type: 'shieldman' },
      { x: 700, groundY: 350, type: 'archer' },
      { x: 740, groundY: 330, type: 'assassin' },
    ]},
    { enemies: [
      { x: 460, groundY: 320, type: 'shieldman' },
      { x: 520, groundY: 350, type: 'soldier' },
      { x: 580, groundY: 320, type: 'spearman' },
      { x: 640, groundY: 360, type: 'soldier' },
      { x: 700, groundY: 330, type: 'archer' },
      { x: 740, groundY: 360, type: 'archer' },
      { x: 680, groundY: 310, type: 'assassin' },
    ]},
    // Mini-boss: street captain (將軍) + squad
    { enemies: [
      { x: 500, groundY: 340, type: 'boss' },
      { x: 580, groundY: 320, type: 'soldier' },
      { x: 620, groundY: 360, type: 'soldier' },
      { x: 660, groundY: 330, type: 'spearman' },
      { x: 700, groundY: 350, type: 'elite' },
      { x: 740, groundY: 320, type: 'archer' },
    ]},
  ],
};

// ---------- Stage 2: 趙國質子府 — Zhao court intrigue ----------
const STAGE_2: StageConfig = {
  name: 'Zhao Palace',
  nameZH: '趙國質子府',
  skyColor: 0x1a0a1a,
  groundColor: 0x2a1a2a,
  accentColor: 0x443344,
  waves: [
    { enemies: [
      { x: 500, groundY: 320, type: 'zhao_guard' },
      { x: 560, groundY: 350, type: 'zhao_guard' },
      { x: 620, groundY: 330, type: 'spearman' },
      { x: 680, groundY: 360, type: 'archer' },
      { x: 720, groundY: 320, type: 'archer' },
    ]},
    { enemies: [
      { x: 480, groundY: 310, type: 'zhao_guard' },
      { x: 540, groundY: 340, type: 'shieldman' },
      { x: 600, groundY: 360, type: 'spearman' },
      { x: 660, groundY: 320, type: 'soldier' },
      { x: 700, groundY: 350, type: 'assassin' },
      { x: 740, groundY: 330, type: 'archer' },
    ]},
    // 郭開 — corrupt minister + tricksters
    { enemies: [
      { x: 520, groundY: 340, type: 'miniboss_gk' },
      { x: 480, groundY: 310, type: 'assassin' },
      { x: 600, groundY: 360, type: 'assassin' },
      { x: 660, groundY: 320, type: 'zhao_guard' },
      { x: 700, groundY: 350, type: 'archer' },
      { x: 740, groundY: 330, type: 'archer' },
    ]},
    // 趙穆 — Marquis of Zhao
    { enemies: [
      { x: 520, groundY: 340, type: 'miniboss_zm' },
      { x: 460, groundY: 320, type: 'zhao_guard' },
      { x: 560, groundY: 360, type: 'zhao_guard' },
      { x: 620, groundY: 310, type: 'elite' },
      { x: 680, groundY: 350, type: 'shieldman' },
      { x: 720, groundY: 330, type: 'archer' },
    ]},
    // 管中邪 + 圖先 escort
    { enemies: [
      { x: 480, groundY: 330, type: 'miniboss_lj' },
      { x: 640, groundY: 350, type: 'miniboss_tx' },
      { x: 540, groundY: 310, type: 'zhao_guard' },
      { x: 580, groundY: 360, type: 'zhao_guard' },
      { x: 700, groundY: 320, type: 'archer' },
      { x: 740, groundY: 360, type: 'assassin' },
    ]},
  ],
};

// ---------- Stage 3: 秦長城邊境 — border war, Li Mu ----------
const STAGE_3: StageConfig = {
  name: 'Qin Border Wall',
  nameZH: '秦長城邊境',
  skyColor: 0x0a1a1a,
  groundColor: 0x2a2a2a,
  accentColor: 0x444444,
  waves: [
    { enemies: [
      { x: 500, groundY: 320, type: 'soldier' },
      { x: 560, groundY: 350, type: 'spearman' },
      { x: 620, groundY: 330, type: 'spearman' },
      { x: 680, groundY: 360, type: 'archer' },
      { x: 720, groundY: 320, type: 'archer' },
      { x: 740, groundY: 350, type: 'cavalry' },
    ]},
    { enemies: [
      { x: 460, groundY: 310, type: 'cavalry' },
      { x: 540, groundY: 360, type: 'cavalry' },
      { x: 620, groundY: 330, type: 'cavalry' },
      { x: 680, groundY: 320, type: 'shieldman' },
      { x: 720, groundY: 350, type: 'elite' },
      { x: 740, groundY: 310, type: 'archer' },
    ]},
    // 成蟜 — rebel prince leads mutiny
    { enemies: [
      { x: 520, groundY: 340, type: 'miniboss_cj' },
      { x: 460, groundY: 310, type: 'cavalry' },
      { x: 580, groundY: 360, type: 'elite' },
      { x: 640, groundY: 320, type: 'spearman' },
      { x: 700, groundY: 350, type: 'archer' },
      { x: 740, groundY: 330, type: 'assassin' },
    ]},
    { enemies: [
      { x: 480, groundY: 320, type: 'shieldman' },
      { x: 540, groundY: 350, type: 'elite' },
      { x: 600, groundY: 310, type: 'cavalry' },
      { x: 660, groundY: 360, type: 'cavalry' },
      { x: 700, groundY: 330, type: 'spearman' },
      { x: 740, groundY: 350, type: 'archer' },
      { x: 620, groundY: 340, type: 'assassin' },
    ]},
    // 李牧 — Zhao war god
    { enemies: [
      { x: 500, groundY: 340, type: 'miniboss_lm' },
      { x: 460, groundY: 310, type: 'cavalry' },
      { x: 560, groundY: 360, type: 'cavalry' },
      { x: 620, groundY: 320, type: 'elite' },
      { x: 680, groundY: 350, type: 'spearman' },
      { x: 720, groundY: 330, type: 'archer' },
      { x: 740, groundY: 360, type: 'archer' },
    ]},
  ],
};

// ---------- Stage 4: 秦王大殿前殿 — court power struggle ----------
const STAGE_4: StageConfig = {
  name: 'Qin Throne Room Approach',
  nameZH: '秦王大殿前殿',
  skyColor: 0x2a0a0a,
  groundColor: 0x3a1a0a,
  accentColor: 0x664422,
  waves: [
    { enemies: [
      { x: 480, groundY: 320, type: 'qin_guard' },
      { x: 540, groundY: 350, type: 'qin_guard' },
      { x: 600, groundY: 330, type: 'qin_guard' },
      { x: 660, groundY: 360, type: 'elite' },
      { x: 720, groundY: 320, type: 'archer' },
      { x: 740, groundY: 350, type: 'shieldman' },
    ]},
    // 呂不韋 — Chancellor
    { enemies: [
      { x: 520, groundY: 340, type: 'miniboss_lbw' },
      { x: 460, groundY: 310, type: 'qin_guard' },
      { x: 580, groundY: 360, type: 'qin_guard' },
      { x: 640, groundY: 320, type: 'elite' },
      { x: 700, groundY: 350, type: 'shieldman' },
      { x: 740, groundY: 330, type: 'archer' },
    ]},
    // 荊軻 — assassin attempt
    { enemies: [
      { x: 540, groundY: 340, type: 'miniboss_jk' },
      { x: 480, groundY: 310, type: 'assassin' },
      { x: 560, groundY: 360, type: 'assassin' },
      { x: 620, groundY: 320, type: 'assassin' },
      { x: 680, groundY: 350, type: 'qin_guard' },
      { x: 720, groundY: 330, type: 'elite' },
    ]},
    // 樊於期 + 燕丹
    { enemies: [
      { x: 460, groundY: 320, type: 'miniboss_fyq' },
      { x: 640, groundY: 350, type: 'miniboss_yd' },
      { x: 520, groundY: 310, type: 'elite' },
      { x: 580, groundY: 360, type: 'cavalry' },
      { x: 700, groundY: 330, type: 'archer' },
      { x: 740, groundY: 360, type: 'assassin' },
    ]},
    // 王翦 holds the gate
    { enemies: [
      { x: 500, groundY: 340, type: 'miniboss_wj' },
      { x: 460, groundY: 310, type: 'qin_guard' },
      { x: 560, groundY: 360, type: 'qin_guard' },
      { x: 620, groundY: 320, type: 'elite' },
      { x: 680, groundY: 350, type: 'cavalry' },
      { x: 720, groundY: 330, type: 'shieldman' },
      { x: 740, groundY: 360, type: 'archer' },
    ]},
  ],
};

// ---------- Stage 5: 秦王大殿 — final gauntlet + 嫪毐 ----------
const STAGE_5: StageConfig = {
  name: 'Qin Throne Room',
  nameZH: '秦王大殿',
  skyColor: 0x300505,
  groundColor: 0x4a1a0a,
  accentColor: 0xffaa44,
  waves: [
    { enemies: [
      { x: 460, groundY: 320, type: 'qin_guard' },
      { x: 520, groundY: 350, type: 'qin_guard' },
      { x: 580, groundY: 310, type: 'elite' },
      { x: 640, groundY: 360, type: 'elite' },
      { x: 700, groundY: 330, type: 'shieldman' },
      { x: 740, groundY: 350, type: 'spearman' },
    ]},
    { enemies: [
      { x: 460, groundY: 310, type: 'cavalry' },
      { x: 540, groundY: 360, type: 'cavalry' },
      { x: 620, groundY: 320, type: 'cavalry' },
      { x: 680, groundY: 350, type: 'qin_guard' },
      { x: 720, groundY: 330, type: 'elite' },
      { x: 740, groundY: 360, type: 'assassin' },
    ]},
    // Rematch gauntlet: 管中邪 + 荊軻 + 成蟜
    { enemies: [
      { x: 460, groundY: 320, type: 'miniboss_lj' },
      { x: 580, groundY: 340, type: 'miniboss_jk' },
      { x: 700, groundY: 360, type: 'miniboss_cj' },
      { x: 520, groundY: 310, type: 'assassin' },
      { x: 640, groundY: 350, type: 'qin_guard' },
      { x: 740, groundY: 320, type: 'archer' },
    ]},
    // 呂不韋 + 王翦 dual small-boss
    { enemies: [
      { x: 460, groundY: 320, type: 'miniboss_lbw' },
      { x: 680, groundY: 360, type: 'miniboss_wj' },
      { x: 540, groundY: 340, type: 'qin_guard' },
      { x: 600, groundY: 310, type: 'elite' },
      { x: 640, groundY: 360, type: 'cavalry' },
      { x: 720, groundY: 330, type: 'archer' },
    ]},
    // Final boss 嫪毐
    { enemies: [
      { x: 500, groundY: 340, type: 'boss_lao' },
      { x: 600, groundY: 320, type: 'qin_guard' },
      { x: 660, groundY: 360, type: 'qin_guard' },
      { x: 720, groundY: 340, type: 'elite' },
    ]},
  ],
};

export const ALL_STAGES: StageConfig[] = [STAGE_1, STAGE_2, STAGE_3, STAGE_4, STAGE_5];

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
  private itemDrops: ItemDropSystem;
  private deadEnemies = new Set<EnemyCharacter>();
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
    this.itemDrops = new ItemDropSystem(scene, players);

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

  get stageWidth(): number {
    return this.config.waves.length * this.sectionWidth;
  }

  get sectionGateX(): number {
    const section = Math.max(0, this.currentWave - 1);
    return (section + 1) * this.sectionWidth - 20;
  }

  get isLocked(): boolean {
    return !this.waveCleared && !this.stageComplete && this.currentWave > 0;
  }

  update(time: number, delta: number): void {
    this.itemDrops.update();

    for (const enemy of this.enemies) {
      if (enemy.isAlive) {
        enemy.update(time, delta);
      } else if (!this.deadEnemies.has(enemy)) {
        this.deadEnemies.add(enemy);

        const combo = this.combatSystem.getHitCounter();
        const isNamed = enemy.typeDef?.id?.startsWith('miniboss') || enemy.typeDef?.id === 'boss' || enemy.typeDef?.id === 'boss_lao';
        const basePoints = isNamed ? 500 : 100;
        const comboMultiplier = 1 + (combo * 0.1);
        const points = Math.floor(basePoints * comboMultiplier);
        let currentScore = this.scene.registry.get('score') || 0;
        this.scene.registry.set('score', currentScore + points);

        if (Math.random() < (isNamed ? 0.6 : 0.25)) {
          const type = Math.random() < 0.5 ? 'hp' : 'mp';
          this.itemDrops.spawnItem(enemy.x, enemy.groundY, type);
        }
      }
    }
    for (const ai of this.aiControllers) ai.update(time, delta);

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

    if (!this.waveCleared && this.aliveEnemies.length === 0) {
      this.waveCleared = true;
      if (this.currentWave >= this.config.waves.length) {
        this.stageComplete = true;
        this.showStageComplete();
      } else {
        this.advancePrompt.setVisible(true);
      }
    }

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

    this.scene.events.emit('round-started', {
      stageIndex: Math.max(0, ALL_STAGES.indexOf(this.config)), waveIndex,
    });

    this.scene.sound.play('ui_wave_start');

    // Banner: show named miniboss if present
    const named = wave.enemies.find((e) => e.type.startsWith('miniboss') || e.type === 'boss_lao' || e.type === 'boss');
    const namedLabel = named ? ` — ${ENEMY_TYPES[named.type].nameZH}` : '';
    this.waveText.setText(`Wave ${this.currentWave}/${this.config.waves.length}${namedLabel}`);
    this.waveText.setAlpha(1);
    this.scene.tweens.add({ targets: this.waveText, alpha: 0, duration: 2200, delay: 1200 });

    for (const enemyDef of wave.enemies) {
      const typeDef = ENEMY_TYPES[enemyDef.type];

      const stageIndex = ALL_STAGES.indexOf(this.config);
      const diffMul = 1 + Math.max(0, stageIndex) * 0.2;

      const baseStats = { ...typeDef.stats, ...enemyDef.stats };
      const stats = {
        ...baseStats,
        maxHp: Math.floor((baseStats.maxHp ?? 100) * diffMul),
        attackPower: Math.floor((baseStats.attackPower ?? 10) * diffMul),
      };

      const worldX = baseX + enemyDef.x;
      let enemy: EnemyCharacter;
      if (enemyDef.type === 'boss_lao') {
        enemy = new BossCharacter(this.scene, worldX, enemyDef.groundY, stats, typeDef, {
          onSpawnAdd: (x, y) => this.spawnAdd(x, y),
        });
      } else {
        enemy = new EnemyCharacter(this.scene, worldX, enemyDef.groundY, stats, typeDef);
      }

      // Name tag for minibosses / bosses
      if (typeDef.id.startsWith('miniboss') || typeDef.id === 'boss' || typeDef.id === 'boss_lao') {
        const h = Math.round((typeDef.stats.height ?? 52) * 1.65);
        const tag = this.scene.add.text(0, -h - 18, typeDef.nameZH, {
          fontSize: '11px', fontFamily: 'monospace', color: '#ffaa88',
          stroke: '#000', strokeThickness: 2,
        }).setOrigin(0.5);
        enemy.add(tag);
      }

      enemy.onProjectile = (att) => {
        const atkName = att.typeDef?.attackName ?? 'enemy_arrow';
        // Guo Kai uses poison projectile override
        const key = att.enemyTypeId === 'miniboss_gk' ? 'enemy_poison' : atkName;
        const atk = ENEMY_HITBOXES[key] ?? ENEMY_HITBOXES[atkName];
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
          color: att.enemyTypeId === 'miniboss_gk' ? 0x88ff44 : 0xffcc55,
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

  /** Visual only — StageScene advances to next stage / Victory. */
  private showStageComplete(): void {
    const text = this.scene.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'STAGE CLEAR!', {
      fontSize: '40px', fontFamily: 'monospace', color: '#ffdd00', stroke: '#000', strokeThickness: 5,
    }).setOrigin(0.5).setDepth(2000).setScrollFactor(0);

    this.scene.tweens.add({
      targets: text, scale: 1.2, duration: 500, yoyo: true, repeat: 3,
      onComplete: () => text.destroy(),
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
    if (alive.length === 0) return this.players[0];
    if (alive.length === 1) return alive[0];
    let best = alive[0];
    let bestDist = Infinity;
    for (const p of alive) {
      const d = Math.sqrt((p.x - fromX) ** 2 + (p.groundY - fromY) ** 2);
      if (d < bestDist) { bestDist = d; best = p; }
    }
    return best;
  }

  destroy(): void {
    this.waveText?.destroy();
    this.advancePrompt?.destroy();
    this.itemDrops.clear();
  }
}
