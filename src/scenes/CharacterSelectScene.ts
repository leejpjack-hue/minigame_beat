import Phaser from 'phaser';
import { SceneKeys } from '../enums/SceneKeys';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';
import { ALL_FIGHTERS } from '../characters/fighters';
import { FighterStats } from '../characters/fighters/FighterStats';

export class CharacterSelectScene extends Phaser.Scene {
  private p1Index = 0;
  private p2Index = 1;
  private mode: '1p' | '2p' = '1p';
  private p1Confirmed = false;
  private p2Confirmed = false;
  private cards: Phaser.GameObjects.Container[] = [];
  private previewTexts: { label: string; bar: Phaser.GameObjects.Graphics; value: Phaser.GameObjects.Text }[] = [];
  private confirmButton!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private p1Tag!: Phaser.GameObjects.Text;
  private p2Tag!: Phaser.GameObjects.Text;
  private p1Cursor!: Phaser.GameObjects.Text;
  private p2Cursor!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: SceneKeys.CharacterSelect });
  }

  create(): void {
    this.p1Confirmed = false;
    this.p2Confirmed = false;
    this.cameras.main.setBackgroundColor('#0a0a2e');

    // Title
    this.add.text(GAME_WIDTH / 2, 25, '選擇角色 SELECT FIGHTER', {
      fontSize: '24px', fontFamily: 'monospace', color: '#ffdd00',
      stroke: '#000', strokeThickness: 3,
    }).setOrigin(0.5);

    // Mode toggle
    this.modeText = this.add.text(GAME_WIDTH / 2, 55, '', {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 72, 'Press [1] or [2] to switch mode  (or tap below)', {
      fontSize: '10px', fontFamily: 'monospace', color: '#666666',
    }).setOrigin(0.5);

    // Touch-friendly mode-toggle buttons
    const mkModeBtn = (label: string, x: number, mode: '1p' | '2p') => {
      const bg = this.add.rectangle(x, 95, 100, 26, 0x223355, 0.85)
        .setStrokeStyle(2, 0x66ddff, 0.9)
        .setInteractive({ useHandCursor: true })
        .setOrigin(0.5);
      const txt = this.add.text(x, 95, label, {
        fontSize: '14px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(0.5);
      bg.on('pointerdown', () => { this.sound.play('ui_select'); this.setMode(mode); });
      return { bg, txt };
    };
    mkModeBtn('1P MODE',  GAME_WIDTH / 2 - 60, '1p');
    mkModeBtn('2P MODE',  GAME_WIDTH / 2 + 60, '2p');

    // Create fighter cards
    const cardWidth = 120;
    const cardHeight = 140;
    const gap = 15;
    const totalWidth = ALL_FIGHTERS.length * cardWidth + (ALL_FIGHTERS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;
    const cy = 175;

    for (let i = 0; i < ALL_FIGHTERS.length; i++) {
      const fighter = ALL_FIGHTERS[i];
      const cx = startX + i * (cardWidth + gap);
      const card = this.createCard(cx, cy, cardWidth, cardHeight, fighter);
      this.cards.push(card);
    }

    // Player tags above cards
    this.p1Tag = this.add.text(0, 0, 'P1', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffdd00',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(100);

    this.p2Tag = this.add.text(0, 0, 'P2', {
      fontSize: '14px', fontFamily: 'monospace', color: '#44ddff',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5).setDepth(100).setAlpha(0);

    // Stat preview area
    this.createStatPreview();

    // Confirm button
    this.confirmButton = this.add.text(GAME_WIDTH / 2, GAME_HEIGHT - 35, '', {
      fontSize: '14px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.confirmButton, alpha: 0.4, duration: 600, yoyo: true, repeat: -1,
    });

    // Default to 1P
    this.setMode('1p');

    // Keyboard: mode toggle
    this.input.keyboard?.on('keydown-ONE', () => this.setMode('1p'));
    this.input.keyboard?.on('keydown-TWO', () => this.setMode('2p'));

    // P1: WASD + Space
    this.input.keyboard?.on('keydown-A', () => { if (!this.p1Confirmed) { this.p1Index = (this.p1Index - 1 + ALL_FIGHTERS.length) % ALL_FIGHTERS.length; this.refreshHighlights(); } });
    this.input.keyboard?.on('keydown-D', () => { if (!this.p1Confirmed) { this.p1Index = (this.p1Index + 1) % ALL_FIGHTERS.length; this.refreshHighlights(); } });
    this.input.keyboard?.on('keydown-SPACE', () => this.confirmP1());

    // P2: Arrows + Enter (and in 1P mode, arrows also control the single cursor)
    this.input.keyboard?.on('keydown-LEFT', () => {
      this.sound.play('ui_select');
      if (this.mode === '1p' && !this.p1Confirmed) {
        this.p1Index = (this.p1Index - 1 + ALL_FIGHTERS.length) % ALL_FIGHTERS.length;
        this.refreshHighlights();
      } else if (this.mode === '2p' && !this.p2Confirmed) {
        this.p2Index = (this.p2Index - 1 + ALL_FIGHTERS.length) % ALL_FIGHTERS.length;
        this.refreshHighlights();
      }
    });
    this.input.keyboard?.on('keydown-RIGHT', () => {
      this.sound.play('ui_select');
      if (this.mode === '1p' && !this.p1Confirmed) {
        this.p1Index = (this.p1Index + 1) % ALL_FIGHTERS.length;
        this.refreshHighlights();
      } else if (this.mode === '2p' && !this.p2Confirmed) {
        this.p2Index = (this.p2Index + 1) % ALL_FIGHTERS.length;
        this.refreshHighlights();
      }
    });
    this.input.keyboard?.on('keydown-ENTER', () => {
      if (this.mode === '1p') this.confirmP1();
      else this.confirmP2();
    });

    // Touch-friendly Back button
    const backBtn = this.add.rectangle(60, GAME_HEIGHT - 22, 90, 26, 0x442222, 0.85)
      .setStrokeStyle(2, 0xff8888, 0.9)
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5);
    this.add.text(60, GAME_HEIGHT - 22, '< BACK', {
      fontSize: '12px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);
    backBtn.on('pointerdown', () => { this.sound.play('ui_select'); this.scene.start(SceneKeys.Menu); });

    // Touch: tap card to select, tap confirm button
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      for (let i = 0; i < this.cards.length; i++) {
        const card = this.cards[i];
        if (card.getBounds().contains(pointer.x, pointer.y)) {
          this.sound.play('ui_select');
          if (!this.p1Confirmed) { this.p1Index = i; }
          else if (this.mode === '2p' && !this.p2Confirmed) { this.p2Index = i; }
          this.refreshHighlights();
          return;
        }
      }
      if (this.confirmButton.getBounds().contains(pointer.x, pointer.y)) {
        if (!this.p1Confirmed) this.confirmP1();
        else if (this.mode === '2p' && !this.p2Confirmed) this.confirmP2();
      }
    });
  }

  private setMode(mode: '1p' | '2p'): void {
    this.mode = mode;
    this.p1Confirmed = false;
    this.p2Confirmed = false;
    this.modeText.setText(mode === '1p' ? '[ 1P MODE ]' : '[ 2P CO-OP MODE ]');
    this.p2Tag.setAlpha(mode === '2p' ? 1 : 0);
    this.refreshHighlights();
  }

  private confirmP1(): void {
    if (this.p1Confirmed) return;
    this.p1Confirmed = true;

    if (this.mode === '1p') {
      this.startGame();
    } else {
      this.confirmButton.setText('P2: Pick your fighter, then press Enter');
      this.refreshHighlights();
    }
  }

  private confirmP2(): void {
    if (this.p2Confirmed || !this.p1Confirmed) return;
    this.p2Confirmed = true;
    this.startGame();
  }

  private startGame(): void {
    const p1 = ALL_FIGHTERS[this.p1Index];
    this.registry.set('selectedFighterP1', p1);

    if (this.mode === '2p') {
      const p2 = ALL_FIGHTERS[this.p2Index];
      this.registry.set('selectedFighterP2', p2);
      this.registry.set('gameMode', '2p');
      this.scene.start(SceneKeys.Stage, { fighterP1: p1, fighterP2: p2 });
    } else {
      this.registry.remove('selectedFighterP2');
      this.registry.remove('gameMode');
      this.registry.remove('fighterP2');  // clear stale 2P cache from previous run
      this.scene.start(SceneKeys.Stage, { fighter: p1 });
    }
  }

  private refreshHighlights(): void {
    const cardWidth = 120;
    const gap = 15;
    const totalWidth = ALL_FIGHTERS.length * cardWidth + (ALL_FIGHTERS.length - 1) * gap;
    const startX = (GAME_WIDTH - totalWidth) / 2 + cardWidth / 2;
    const cy = 175;

    for (let i = 0; i < this.cards.length; i++) {
      const card = this.cards[i];
      const bg = card.getAt(0) as Phaser.GameObjects.Rectangle;

      const isP1 = i === this.p1Index && !this.p1Confirmed;
      const isP1Lock = i === this.p1Index && this.p1Confirmed;
      const isP2 = i === this.p2Index && this.mode === '2p' && !this.p2Confirmed;
      const isP2Lock = i === this.p2Index && this.mode === '2p' && this.p2Confirmed;

      if (isP1 || isP1Lock) {
        bg.setStrokeStyle(3, 0xffdd00);
        card.setScale(1.1);
        this.tweens.killTweensOf(card);
        if (isP1) {
          this.tweens.add({ targets: card, scaleX: 1.12, scaleY: 1.12, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        }
      } else if (isP2) {
        bg.setStrokeStyle(3, 0x44ddff);
        card.setScale(1.05);
        this.tweens.killTweensOf(card);
        this.tweens.add({ targets: card, scaleX: 1.07, scaleY: 1.07, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      } else {
        bg.setStrokeStyle(2, 0x444466);
        card.setScale(1);
        this.tweens.killTweensOf(card);
      }
    }

    // Position tags above selected cards
    const p1cx = startX + this.p1Index * (cardWidth + gap);
    this.p1Tag.setPosition(p1cx, cy - 82);
    this.p1Tag.setText(this.p1Confirmed ? 'P1 ✓' : 'P1');
    this.p1Tag.setColor(this.p1Confirmed ? '#88ff88' : '#ffdd00');

    if (this.mode === '2p') {
      const p2cx = startX + this.p2Index * (cardWidth + gap);
      const tagY = this.p2Index === this.p1Index ? cy - 96 : cy - 82;
      this.p2Tag.setPosition(p2cx, tagY);
      this.p2Tag.setText(this.p2Confirmed ? 'P2 ✓' : 'P2');
    }

    // Update stat preview for P1 selection (or P2 if P1 is confirmed)
    const previewIdx = this.p1Confirmed && this.mode === '2p' ? this.p2Index : this.p1Index;
    this.updateStatPreview(ALL_FIGHTERS[previewIdx]);

    // Update confirm text
    if (!this.p1Confirmed) {
      this.confirmButton.setText(this.mode === '1p' ? 'P1: Press Space to confirm' : 'P1: Press Space to confirm');
    } else if (this.mode === '2p' && !this.p2Confirmed) {
      this.confirmButton.setText('P2: Use Arrows + Enter to confirm');
    } else {
      this.confirmButton.setText('Starting...');
    }
  }

  private createCard(cx: number, cy: number, w: number, h: number, fighter: FighterStats): Phaser.GameObjects.Container {
    const container = this.add.container(cx, cy);
    const bg = this.add.rectangle(0, 0, w, h, 0x222244, 0.8);
    bg.setStrokeStyle(2, 0x444466);
    container.add(bg);

    const sprite = this.add.image(0, -20, fighter.spriteKey);
    sprite.setScale(2);
    container.add(sprite);

    const name = this.add.text(0, 35, fighter.nameZH, {
      fontSize: '16px', fontFamily: 'monospace', color: '#ffffff',
    }).setOrigin(0.5);
    container.add(name);

    const engName = this.add.text(0, 52, fighter.name, {
      fontSize: '9px', fontFamily: 'monospace', color: '#888888',
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
        fontSize: '12px', fontFamily: 'monospace', color: '#aaaaaa',
      }).setOrigin(0.5);

      const bgBar = this.add.graphics();
      bgBar.fillStyle(0x333333, 1);
      bgBar.fillRect(startX, y - barHeight / 2, barWidth, barHeight);

      const bar = this.add.graphics();
      bar.fillStyle(colors[i], 1);

      const value = this.add.text(startX + barWidth + 10, y, '', {
        fontSize: '11px', fontFamily: 'monospace', color: '#ffffff',
      }).setOrigin(0, 0.5);

      this.previewTexts.push({ label: labels[i], bar, value });
    }
  }

  private updateStatPreview(fighter: FighterStats): void {
    const barWidth = 150;
    const startX = 200;
    const startY = 310;
    const barHeight = 10;
    const maxValues = [800, 50, 35, 210, 200];
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


}
