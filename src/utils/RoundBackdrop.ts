import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, STAGE_WALKABLE_Y_MIN } from '../config/constants';
import { backgroundKey, getRoundArt } from '../config/RoundArt';

/** Screen-sized illustrated arenas crossfade when the real wave changes. */
export class RoundBackdrop {
  private layers: Phaser.GameObjects.Image[] = [];
  private caption: Phaser.GameObjects.Text;
  private stageIndex: number;
  private currentRound = -1;

  constructor(private scene: Phaser.Scene, stageIndex: number) {
    this.stageIndex = stageIndex;
    this.caption = scene.add.text(GAME_WIDTH / 2, 76, '', {
      fontSize: '11px', fontFamily: 'monospace', color: '#d9c6a0',
      stroke: '#10101e', strokeThickness: 3,
    }).setOrigin(0.5).setScrollFactor(0).setDepth(900);
    scene.events.on('round-started', this.onRoundStarted, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
    this.show(0, false);
  }

  private onRoundStarted(data: { stageIndex: number; waveIndex: number }): void {
    this.stageIndex = data.stageIndex;
    this.show(data.waveIndex, true);
  }

  private show(waveIndex: number, animate: boolean): void {
    const round = this.stageIndex * 5 + waveIndex;
    if (round === this.currentRound) return;
    const art = getRoundArt(this.stageIndex, waveIndex);
    const key = backgroundKey(art.scene);
    if (!this.scene.textures.exists(key)) return;
    this.currentRound = round;
    const previous = [...this.layers];
    const next = this.scene.add.image(
      (GAME_WIDTH - GAME_WIDTH * art.zoom) * art.focus,
      STAGE_WALKABLE_Y_MIN * (1 - art.zoom), key,
    ).setOrigin(0).setScrollFactor(0).setDepth(-20)
      .setDisplaySize(GAME_WIDTH * art.zoom, GAME_HEIGHT * art.zoom);
    this.layers.push(next);
    this.caption.setText(`ROUND ${String(this.stageIndex * 5 + waveIndex + 1).padStart(2, '0')} / 25  ·  ${art.name}`);

    const clearPrevious = () => {
      for (const layer of previous) {
        this.scene.tweens.killTweensOf(layer);
        layer.destroy();
      }
      this.layers = this.layers.filter((layer) => !previous.includes(layer));
    };
    if (animate && previous.length) {
      next.setAlpha(0);
      this.scene.tweens.add({ targets: next, alpha: 1, duration: 450, onComplete: clearPrevious });
    } else {
      clearPrevious();
    }
  }

  destroy(): void {
    this.scene.events.off('round-started', this.onRoundStarted, this);
    for (const layer of this.layers) {
      this.scene.tweens.killTweensOf(layer);
      layer.destroy();
    }
    this.layers = [];
    this.caption.destroy();
  }
}
