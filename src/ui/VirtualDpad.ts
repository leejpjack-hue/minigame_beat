import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/constants';

interface TouchButton {
  circle: Phaser.GameObjects.Arc;
  label: Phaser.GameObjects.Text;
  x: number;
  y: number;
  radius: number;
  event: string;
  pressedBy: number; // pointer id, -1 when free
  baseColor: number;
}

/**
 * On-screen virtual D-pad + action buttons for touch devices.
 * - Left circular pad: virtual joystick (drag from center).
 * - Right cluster: 6 buttons (Attack / Heavy / Special / Jump / Block / Stone).
 * - Multi-touch safe: each button tracks its own pointer id; the dpad ignores
 *   pointers that started on a button.
 */
export class VirtualDpad {
  private scene: Phaser.Scene;
  private container!: Phaser.GameObjects.Container;

  private dpadBase!: Phaser.GameObjects.Arc;
  private dpadX = 90;
  private dpadY = GAME_HEIGHT - 90;
  private dpadRadius = 60;
  private dpadDirection = { x: 0, y: 0 };
  private dpadPointerId = -1;

  private buttons: TouchButton[] = [];
  private buttonOwner: Map<number, TouchButton> = new Map(); // pointerId -> button

  private isVisible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.create();
    this.detectTouchDevice();
  }

  private create(): void {
    this.container = this.scene.add.container(0, 0);
    this.container.setDepth(900);
    this.container.setScrollFactor(0);

    // --- D-Pad (left) ---
    this.dpadBase = this.scene.add.circle(this.dpadX, this.dpadY, this.dpadRadius, 0x000000, 0.35);
    this.dpadBase.setStrokeStyle(2, 0xffffff, 0.4);
    this.container.add(this.dpadBase);

    const arrowSize = 20;
    const arrowOffset = 38;
    this.makeArrow(this.dpadX, this.dpadY - arrowOffset, arrowSize, '▲');
    this.makeArrow(this.dpadX, this.dpadY + arrowOffset, arrowSize, '▼');
    this.makeArrow(this.dpadX - arrowOffset, this.dpadY, arrowSize, '◄');
    this.makeArrow(this.dpadX + arrowOffset, this.dpadY, arrowSize, '►');

    // --- Action Buttons (right cluster) ---
    // Layout (left col closer to dpad, right col edge of screen):
    //   重(K)  攻(J)
    //   防(L)  特
    //   石(H)  跳(SPACE)
    const colR = GAME_WIDTH - 50;
    const colL = GAME_WIDTH - 110;
    const rowT = GAME_HEIGHT - 160;
    const rowM = GAME_HEIGHT - 100;
    const rowB = GAME_HEIGHT - 40;
    const r = 26;

    this.addButton(colL, rowT, r, 0xff8833, '重',  'button-heavy');
    this.addButton(colR, rowT, r, 0xff4444, '攻',  'button-attack');
    this.addButton(colL, rowM, r, 0x44ff44, '防',  'button-block');
    this.addButton(colR, rowM, r, 0xffdd00, '特',  'button-special');
    this.addButton(colL, rowB, r, 0xaaaaaa, '石',  'button-stone');
    this.addButton(colR, rowB, r, 0x44aaff, '跳',  'button-jump');

    this.setupPointerHandlers();
  }

  private makeArrow(x: number, y: number, size: number, ch: string): void {
    const text = this.scene.add.text(x, y, ch, {
      fontSize: `${size}px`, color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5).setAlpha(0.55);
    this.container.add(text);
  }

  private addButton(x: number, y: number, radius: number, color: number, label: string, event: string): void {
    const circle = this.scene.add.circle(x, y, radius, color, 0.45);
    circle.setStrokeStyle(2, color, 0.85);
    this.container.add(circle);
    const text = this.scene.add.text(x, y, label, {
      fontSize: '15px', color: '#ffffff', fontFamily: 'monospace',
      stroke: '#000', strokeThickness: 2,
    }).setOrigin(0.5);
    this.container.add(text);
    this.buttons.push({ circle, label: text, x, y, radius: radius + 4, event, pressedBy: -1, baseColor: color });
  }

  private setupPointerHandlers(): void {
    const onDown = (pointer: Phaser.Input.Pointer) => {
      if (!this.isVisible) return;
      // Test buttons first (right cluster)
      for (const b of this.buttons) {
        if (b.pressedBy !== -1) continue;
        if (Phaser.Math.Distance.Between(pointer.x, pointer.y, b.x, b.y) <= b.radius) {
          b.pressedBy = pointer.id;
          this.buttonOwner.set(pointer.id, b);
          b.circle.setFillStyle(b.baseColor, 0.85);
          this.scene.events.emit(b.event);
          return;
        }
      }
      // Then dpad (left circle)
      if (this.dpadPointerId === -1 &&
          Phaser.Math.Distance.Between(pointer.x, pointer.y, this.dpadX, this.dpadY) <= this.dpadRadius + 10) {
        this.dpadPointerId = pointer.id;
        this.updateDpad(pointer.x, pointer.y);
      }
    };

    const onMove = (pointer: Phaser.Input.Pointer) => {
      if (!this.isVisible) return;
      if (pointer.id === this.dpadPointerId) {
        this.updateDpad(pointer.x, pointer.y);
      }
    };

    const onUp = (pointer: Phaser.Input.Pointer) => {
      const owned = this.buttonOwner.get(pointer.id);
      if (owned) {
        owned.pressedBy = -1;
        owned.circle.setFillStyle(owned.baseColor, 0.45);
        this.buttonOwner.delete(pointer.id);
      }
      if (pointer.id === this.dpadPointerId) {
        this.dpadPointerId = -1;
        this.dpadDirection = { x: 0, y: 0 };
        this.scene.events.emit('dpad-release');
      }
    };

    this.scene.input.on('pointerdown', onDown);
    this.scene.input.on('pointermove', onMove);
    this.scene.input.on('pointerup', onUp);
    this.scene.input.on('pointerupoutside', onUp);
    this.scene.input.on('pointercancel', onUp);
  }

  private updateDpad(px: number, py: number): void {
    const dx = px - this.dpadX;
    const dy = py - this.dpadY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 12) {
      if (this.dpadDirection.x !== 0 || this.dpadDirection.y !== 0) {
        this.dpadDirection = { x: 0, y: 0 };
        this.scene.events.emit('dpad-move', 0, 0);
      }
      return;
    }
    const nx = Math.abs(dx) > 18 ? (dx > 0 ? 1 : -1) : 0;
    const ny = Math.abs(dy) > 18 ? (dy > 0 ? 1 : -1) : 0;
    if (nx !== this.dpadDirection.x || ny !== this.dpadDirection.y) {
      this.dpadDirection = { x: nx, y: ny };
    }
    this.scene.events.emit('dpad-move', nx, ny);
  }

  private detectTouchDevice(): void {
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouch) this.show();
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
