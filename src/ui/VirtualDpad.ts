import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

export class VirtualDpad {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;

  // D-pad
  private dpadBase!: Phaser.GameObjects.Arc;
  private dpadDirection = { x: 0, y: 0 };
  private dpadPointerId = -1;

  // Buttons
  private btnAttack!: Phaser.GameObjects.Arc;
  private btnJump!: Phaser.GameObjects.Arc;
  private btnSpecial!: Phaser.GameObjects.Arc;
  private btnBlock!: Phaser.GameObjects.Arc;

  // State
  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
    // Show on touch devices
    this.detectTouchDevice();
  }

  private create(): void {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(900);
    this.container.setScrollFactor(0);

    // --- D-Pad (left side) ---
    const dpadX = 90;
    const dpadY = GAME_HEIGHT - 90;

    // Base circle
    this.dpadBase = this.scene.add.circle(dpadX, dpadY, 55, 0x000000, 0.3);
    this.dpadBase.setStrokeStyle(2, 0xffffff, 0.3);
    this.container.add(this.dpadBase);

    // Direction arrows
    const arrowSize = 18;
    const arrowOffset = 35;

    // Up
    const upArrow = this.createArrow(dpadX, dpadY - arrowOffset, arrowSize, 'up');
    // Down
    const downArrow = this.createArrow(dpadX, dpadY + arrowOffset, arrowSize, 'down');
    // Left
    const leftArrow = this.createArrow(dpadX - arrowOffset, dpadY, arrowSize, 'left');
    // Right
    const rightArrow = this.createArrow(dpadX + arrowOffset, dpadY, arrowSize, 'right');

    // --- Action Buttons (right side) ---
    const btnX = GAME_WIDTH - 90;
    const btnY = GAME_HEIGHT - 90;
    const btnRadius = 28;
    const btnSpacing = 60;

    this.btnAttack = this.createButton(btnX, btnY, btnRadius, 0xff4444, '攻');
    this.btnJump = this.createButton(btnX - btnSpacing, btnY - 20, btnRadius, 0x44aaff, '跳');
    this.btnSpecial = this.createButton(btnX + btnSpacing, btnY - 20, btnRadius, 0xffdd00, '特');
    this.btnBlock = this.createButton(btnX, btnY - btnSpacing - 10, btnRadius, 0x44ff44, '防');

    // Touch handlers
    this.setupTouchHandlers(dpadX, dpadY);
  }

  private createArrow(x: number, y: number, size: number, direction: string): Phaser.GameObjects.Text {
    const arrows: Record<string, string> = { up: '▲', down: '▼', left: '◄', right: '►' };
    const text = this.scene.add.text(x, y, arrows[direction], {
      fontSize: `${size}px`,
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0.5);
    this.container.add(text);
    return text;
  }

  private createButton(x: number, y: number, radius: number, color: number, label: string): Phaser.GameObjects.Arc {
    const circle = this.scene.add.circle(x, y, radius, color, 0.4);
    circle.setStrokeStyle(2, color, 0.7);
    this.container.add(circle);

    const text = this.scene.add.text(x, y, label, {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5);
    this.container.add(text);

    return circle;
  }

  private setupTouchHandlers(dpadX: number, dpadY: number): void {
    // D-pad touch
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isVisible) return;

      const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, dpadX, dpadY);
      if (dist < 60 && this.dpadPointerId === -1) {
        this.dpadPointerId = pointer.id;
        this.updateDpad(pointer.x, pointer.y, dpadX, dpadY);
      }
    });

    this.scene.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.dpadPointerId) {
        this.updateDpad(pointer.x, pointer.y, dpadX, dpadY);
      }
    });

    this.scene.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.id === this.dpadPointerId) {
        this.dpadPointerId = -1;
        this.dpadDirection = { x: 0, y: 0 };
        this.scene.events.emit('dpad-release');
      }
    });

    // Button touches
    this.setupButtonTouch(this.btnAttack, 'button-attack');
    this.setupButtonTouch(this.btnJump, 'button-jump');
    this.setupButtonTouch(this.btnSpecial, 'button-special');
    this.setupButtonTouch(this.btnBlock, 'button-block');
  }

  private setupButtonTouch(button: Phaser.GameObjects.Arc, event: string): void {
    this.scene.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isVisible) return;
      const dist = Phaser.Math.Distance.Between(pointer.x, pointer.y, button.x, button.y);
      if (dist < 30) {
        this.scene.events.emit(event);
      }
    });
  }

  private updateDpad(px: number, py: number, cx: number, cy: number): void {
    const dx = px - cx;
    const dy = py - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 10) {
      this.dpadDirection = { x: 0, y: 0 };
      return;
    }

    // Normalize to -1, 0, 1 for each axis
    this.dpadDirection = {
      x: Math.abs(dx) > 15 ? (dx > 0 ? 1 : -1) : 0,
      y: Math.abs(dy) > 15 ? (dy > 0 ? 1 : -1) : 0,
    };

    this.scene.events.emit('dpad-move', this.dpadDirection.x, this.dpadDirection.y);
  }

  private detectTouchDevice(): void {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) {
      this.show();
    }
  }

  show(): void {
    this.isVisible = true;
    this.container.setAlpha(1);
  }

  hide(): void {
    this.isVisible = false;
    this.container.setAlpha(0);
  }

  getDirection(): { x: number; y: number } {
    return this.dpadDirection;
  }

  destroy(): void {
    this.container.destroy();
  }
}
