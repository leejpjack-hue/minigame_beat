import Phaser from 'phaser';
import { SceneKeys } from '../enums/SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { ALL_FIGHTERS } from '../characters/fighters';
import { FighterStats } from '../characters/fighters/FighterStats';

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIndex = 0;
  private cards: Phaser.GameObjects.Container[] = [];
  private previewTexts: { label: string; bar: Phaser.GameObjects.Graphics; value: Phaser.GameObjects.Text }[] = [];
  private confirmButton!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKeys.CharacterSelect });
  }

  create(): void {
    this.cameras.main.setBackgroundColor('#0a0a2e');

    // Title
    this.add.text(GAME_WIDTH / 2, 30, '選擇角色 SELECT FIGHTER', {
      fontSize: '24px',
      fontFamily: 'monospace',
      color: '#ffdd00',
      stroke: '#000',
      strokeThickness: 3,
    }).setOrigin(0.5);

    // Create fighter cards
    const cardWidth = 120;
    const cardHeight = 150;
    const gap = 15;
    const totalWidth = ALL_FIGHTERS.length * cardWidth + (ALL_FIGHTERS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;

    for (let i = 0; i < ALL_FIGHTERS.length; i++) {
      const fighter = ALL_FIGHTERS[i];
      const cx = startX + i * (cardWidth + gap);
      const cy = 170;

      const card = this.createCard(cx, cy, cardWidth, cardHeight, fighter, i);
      this.cards.push(card);
    }

    // Stat preview area
    this.createStatPreview();

    // Confirm button
    this.confirmButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 40, '[ Press Enter / Tap to Fight ]', {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.confirmButton,
      alpha: 0.4,
      duration: 600,
      yoyo: true,
      repeat: -1,
    });

    // Highlight initial selection
    this.updateSelection();

    // Keyboard input
    this.input.keyboard?.on('keydown-LEFT', () => {
      this.sound.play('ui_select');
      this.selectedIndex = (this.selectedIndex - 1 + ALL_FIGHTERS.length) % ALL_FIGHTERS.length;
      this.updateSelection();
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.sound.play('ui_select');
      this.selectedIndex = (this.selectedIndex + 1) % ALL_FIGHTERS.length;
      this.updateSelection();
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.confirmSelection();
    });

    // Touch/click input
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      for (let i = 0; i < this.cards.length; i++) {
        const card = this.cards[i];
        if (card.getBounds().contains(pointer.x, pointer.y)) {
          if (this.selectedIndex !== i) this.sound.play('ui_select');
          this.selectedIndex = i;
          this.updateSelection();
          return;
        }
      }
      // Click confirm button
      if (this.confirmButton.getBounds().contains(pointer.x, pointer.y)) {
        this.confirmSelection();
      }
    });
  }

  private createCard(cx: number, cy: number, w: number, h: number, fighter: FighterStats, index: number): Phaser.GameObjects.Container {
    const container = this.add.container(cx, cy);

    // Card background
    const bg = this.add.rectangle(0, 0, w, h, 0x222244, 0.8);
    bg.setStrokeStyle(2, 0x444466);
    container.add(bg);

    // Character sprite preview (colored rect)
    const sprite = this.add.image(0, -20, fighter.spriteKey);
    sprite.setScale(2);
    container.add(sprite);

    // Name
    const name = this.add.text(0, 35, fighter.nameZH, {
      fontSize: '16px',
      fontFamily: 'monospace',
      color: '#ffffff',
    }).setOrigin(0.5);
    container.add(name);

    // English name
    const engName = this.add.text(0, 52, fighter.name, {
      fontSize: '9px',
      fontFamily: 'monospace',
      color: '#888888',
    }).setOrigin(0.5);
    container.add(engName);

    return container;
  }

  private createStatPreview(): void {
    const startX = 200;
    const startY = 310;
    const barWidth = 150;
    const barHeight = 10;
    const labels = ['HP', 'ATK', 'DEF', 'SPD', 'MP'];
    const colors = [0x00ff00, 0xff4444, 0x4488ff, 0xffdd00, 0x8844ff];

    for (let i = 0; i < labels.length; i++) {
      const y = startY + i * 25;

      this.add.text(startX - 40, y, labels[i], {
        fontSize: '12px',
        fontFamily: 'monospace',
        color: '#aaaaaa',
      }).setOrigin(0.5);

      // Bar background
      const bgBar = this.add.graphics();
      bgBar.fillStyle(0x333333, 1);
      bgBar.fillRect(startX, y - barHeight / 2, barWidth, barHeight);

      // Value bar
      const bar = this.add.graphics();
      bar.fillStyle(colors[i], 1);

      // Value text
      const value = this.add.text(startX + barWidth + 10, y, '', {
        fontSize: '11px',
        fontFamily: 'monospace',
        color: '#ffffff',
      }).setOrigin(0, 0.5);

      this.previewTexts.push({ label: labels[i], bar, value });
    }
  }

  private updateSelection(): void {
    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;

      if (i === this.selectedIndex) {
        bg.setStrokeStyle(3, 0xffdd00);
        card.setScale(1.1);

        // Pulse animation
        this.tweens.add({
          targets: card,
          scaleX: 1.12,
          scaleY: 1.12,
          duration: 500,
          yoyo: true,
          repeat: -1,
          ease: 'Sine.easeInOut',
        });
      } else {
        bg.setStrokeStyle(2, 0x444466);
        card.setScale(1);
        this.tweens.killTweensOf(card);
      }
    }

    this.updateStatPreview(ALL_FIGHTERS[this.selectedIndex]);
  }

  private updateStatPreview(fighter: FighterStats): void {
    const barWidth = 150;
    const startX = 200;
    const startY = 310;
    const barHeight = 10;
    const maxValues = [800, 50, 35, 210, 200]; // max possible values for normalization

    const values = [fighter.maxHp, fighter.attackPower, fighter.defensePower, fighter.speed, fighter.maxMp];

    for (let i = 0; i < this.previewTexts.length; i++) {
      const { bar, value } = this.previewTexts[i];
      bar.clear();
      const colors = [0x00ff00, 0xff4444, 0x4488ff, 0xffdd00, 0x8844ff];
      bar.fillStyle(colors[i], 1);
      const percent = values[i] / maxValues[i];
      bar.fillRect(startX, startY + i * 25 - barHeight / 2, barWidth * percent, barHeight);
      value.setText(String(values[i]));
    }
  }

  private confirmSelection(): void {
    this.sound.play('ui_confirm');
    const selected = ALL_FIGHTERS[this.selectedIndex];
    this.registry.set('selectedFighter', selected);
    this.scene.start(SceneKeys.Stage, { fighter: selected });
  }
}
