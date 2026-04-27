import Phaser from 'phaser';
import { BaseCharacter } from '../characters/BaseCharacter';

type ItemType = 'hp' | 'mp';

interface DroppedItem {
  x: number;
  y: number; // groundY
  type: ItemType;
  gfx: Phaser.GameObjects.Container;
  alive: boolean;
}

export class ItemDropSystem {
  private scene: Phaser.Scene;
  private players: BaseCharacter[];
  private items: DroppedItem[] = [];
  private readonly pickupRange = 36;

  constructor(scene: Phaser.Scene, players: BaseCharacter[]) {
    this.scene = scene;
    this.players = players;
  }

  spawnItem(x: number, groundY: number, type: ItemType): void {
    const c = this.scene.add.container(x, groundY - 10);
    
    // Simple visual representation of potion
    const bodyColor = type === 'hp' ? 0xff4444 : 0x4488ff;
    const body = this.scene.add.rectangle(0, 0, 14, 18, bodyColor);
    body.setStrokeStyle(1, 0xffffff, 0.8);
    
    // Potion neck
    const neck = this.scene.add.rectangle(0, -10, 8, 6, bodyColor);
    // Cork
    const cork = this.scene.add.rectangle(0, -14, 6, 4, 0x8b4513);
    
    // Glow effect
    const glow = this.scene.add.circle(0, 0, 16, bodyColor, 0.4);
    this.scene.tweens.add({
      targets: glow,
      radius: 20,
      alpha: 0.1,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    c.add([glow, body, neck, cork]);
    c.setDepth(groundY);
    
    // Small spawn pop animation
    c.setScale(0);
    this.scene.tweens.add({
      targets: c,
      scaleX: 1,
      scaleY: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    this.items.push({ x, y: groundY, type, gfx: c, alive: true });
  }

  update(): void {
    for (const item of this.items) {
      if (!item.alive) continue;

      for (const player of this.players) {
        if (!player.isAlive) continue;

        const dx = Math.abs(item.x - player.x);
        const dy = Math.abs(item.y - player.groundY);

        // Collision logic
        if (dx <= this.pickupRange && dy <= 20) {
          this.pickupItem(player, item);
          break; // Item consumed, don't check other players
        }
      }
    }
  }

  private pickupItem(player: BaseCharacter, item: DroppedItem): void {
    item.alive = false;
    
    // Pickup animation
    this.scene.tweens.add({
      targets: item.gfx,
      y: item.gfx.y - 40,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 300,
      onComplete: () => item.gfx.destroy()
    });

    if (item.type === 'hp') {
      player.hp = Math.min(player.maxHp, player.hp + 100);
      this.showFloatText(player, '+100 HP', 0x00ff00);
      this.scene.sound.play('sfx_punch', { volume: 0.3, rate: 1.5 }); // Placeholder sound
    } else {
      player.mp = Math.min(player.maxMp, player.mp + 50);
      this.showFloatText(player, '+50 MP', 0x44aaff);
      this.scene.sound.play('sfx_punch', { volume: 0.3, rate: 1.8 }); // Placeholder sound
    }
  }

  private showFloatText(player: BaseCharacter, text: string, color: number): void {
    const floatText = this.scene.add.text(player.x, player.groundY - (player.stats.height ?? 46) - 20, text, {
      fontSize: '14px',
      fontFamily: 'monospace',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5).setDepth(player.groundY + 10);

    // Float up and fade
    this.scene.tweens.add({
      targets: floatText,
      y: floatText.y - 30,
      alpha: 0,
      duration: 800,
      ease: 'Quad.easeOut',
      onComplete: () => floatText.destroy()
    });
  }

  clear(): void {
    for (const item of this.items) {
      if (item.alive) item.gfx.destroy();
    }
    this.items = [];
  }
}
