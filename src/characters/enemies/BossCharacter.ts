import { EnemyCharacter } from '../EnemyCharacter';
import { FighterStats } from '../fighters/FighterStats';
import { EnemyTypeDef, ENEMY_HITBOXES } from './EnemyTypes';
import { CharacterState } from '../../enums/CharacterState';
import { GAME_WIDTH } from '../../config/constants';

export interface BossHooks {
  onSpawnAdd?: (x: number, y: number) => void;
}

export class BossCharacter extends EnemyCharacter {
  private phase = 1;
  private baseSpeed: number;
  private baseAtk: number;
  private addSpawnTimer = 0;
  private hooks: BossHooks;
  private phaseBanner!: Phaser.GameObjects.Text;
  private attackRoll = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    stats: Partial<FighterStats> | undefined,
    typeDef: EnemyTypeDef,
    hooks: BossHooks = {}
  ) {
    super(scene, x, y, stats, typeDef);
    this.baseSpeed = this.speed;
    this.baseAtk = this.attackPower;
    this.hooks = hooks;
    this.phaseBanner = scene.add.text(x, y - 90, `${typeDef.nameZH}`, {
      fontSize: '14px', fontFamily: 'monospace', color: '#ff8888', stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(1000);
  }

  update(time: number, delta: number): void {
    super.update(time, delta);
    // Keep banner above boss
    if (this.phaseBanner) this.phaseBanner.setPosition(this.x, this.groundY - this.stats.height - 14);

    // Phase transitions by HP %
    const pct = this.hp / this.maxHp;
    if (this.phase === 1 && pct <= 0.66) this.enterPhase(2);
    else if (this.phase === 2 && pct <= 0.33) this.enterPhase(3);

    // Phase 2: spawn adds every 15s
    if (this.phase === 2) {
      this.addSpawnTimer -= delta;
      if (this.addSpawnTimer <= 0) {
        this.addSpawnTimer = 15000;
        this.hooks.onSpawnAdd?.(this.x - 120, this.groundY);
        this.hooks.onSpawnAdd?.(this.x + 120, this.groundY);
      }
    }
  }

  private enterPhase(n: number): void {
    this.phase = n;
    if (n === 2) {
      this.phaseBanner.setText(`${this.typeDef?.nameZH ?? ''} — 盛怒`);
      this.phaseBanner.setColor('#ffaa44');
      this.addSpawnTimer = 4000; // first summon quickly
      this.scene.cameras.main.flash(200, 255, 180, 80);
    } else if (n === 3) {
      this.phaseBanner.setText(`${this.typeDef?.nameZH ?? ''} — 狂化`);
      this.phaseBanner.setColor('#ff3333');
      this.speed = Math.floor(this.baseSpeed * 1.5);
      this.attackPower = Math.floor(this.baseAtk * 1.3);
      this.bodySprite.setTint(0xff8888);
      this.scene.cameras.main.flash(300, 255, 80, 80);
      this.scene.cameras.main.shake(200, 0.01);
    }
  }

  performAttack(): void {
    const state = this.stateMachine.currentState;
    if (state === CharacterState.Attack || state === CharacterState.Hurt || state === CharacterState.Dead) return;

    // Pick attack based on phase
    this.attackRoll++;
    let attackName = 'boss_slam';
    let totalFrames = 700;

    if (this.phase >= 2 && this.attackRoll % 3 === 0) {
      attackName = 'boss_sweep';
      totalFrames = 800;
    }
    if (this.phase === 3 && this.attackRoll % 4 === 0) {
      attackName = 'boss_quake';
      totalFrames = 900;
    }

    const hb = ENEMY_HITBOXES[attackName];
    if (!hb) { this.startAttack('enemy_attack', 400); return; }

    // Super-armor during all boss attacks
    this.startAttack(attackName, totalFrames, {
      activeStart: 0.4,
      activeEnd: 0.7,
      superArmor: true,
    });

    // Visual warning for quake (fullscreen)
    if (attackName === 'boss_quake') {
      this.scene.cameras.main.shake(400, 0.012);
      const flash = this.scene.add.rectangle(GAME_WIDTH / 2, this.groundY, GAME_WIDTH, 20, 0xff6644, 0.6);
      flash.setDepth(200);
      this.scene.tweens.add({ targets: flash, alpha: 0, duration: 500, onComplete: () => flash.destroy() });
    }
  }

  destroy(fromScene?: boolean): void {
    this.phaseBanner?.destroy();
    super.destroy(fromScene);
  }
}
