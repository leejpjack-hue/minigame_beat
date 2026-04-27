import Phaser from 'phaser';
import { BaseCharacter } from './BaseCharacter';
import { CharacterState } from '../enums/CharacterState';
import { FighterStats } from './fighters/FighterStats';

export class BreakableObject extends BaseCharacter {
  constructor(scene: Phaser.Scene, x: number, y: number, key: string, maxHp: number = 1) {
    const stats: FighterStats = {
      name: 'Object',
      nameZH: '物品',
      spriteKey: key,
      fighterKey: 'breakable',
      maxHp: maxHp,
      maxMp: 0,
      speed: 0,
      jumpPower: 0,
      attackPower: 0,
      defensePower: 0,
      comboSpeedMultiplier: 1,
      color: 0x888888,
      width: 40,
      height: 60,
    };
    super(scene, x, y, stats);
    
    // Customize rendering: breakables don't use pose-based texture switching like fighters
    this.bodySprite.setTexture(key);
    this.stateLabel.setVisible(false);
  }

  protected defineStates(): void {
    // Only needs Idle, Hurt, and Dead
    this.stateMachine.addState(CharacterState.Idle, {
      canTransitionFrom: [CharacterState.Hurt],
    });
    this.stateMachine.addState(CharacterState.Hurt, {
      canTransitionFrom: [CharacterState.Idle],
      onEnter: () => {
        this.scene.tweens.add({
          targets: this.bodySprite,
          x: this.bodySprite.x + (Math.random() > 0.5 ? 5 : -5),
          yoyo: true,
          duration: 50,
          repeat: 2
        });
      }
    });
    this.stateMachine.addState(CharacterState.Dead, {
      canTransitionFrom: [CharacterState.Idle, CharacterState.Hurt],
      onEnter: () => {
        this.destroyWithParticles();
      },
    });
  }

  protected updatePoseTexture(): void {
    // Override to prevent BaseCharacter from switching textures to 'idle'/'walk'/'attack'
  }

  private destroyWithParticles(): void {
    // Create debris particles
    for (let i = 0; i < 6; i++) {
      const debris = this.scene.add.rectangle(this.x, this.y - 20, 8 + Math.random() * 8, 8 + Math.random() * 8, 0x885533);
      this.scene.physics.add.existing(debris);
      const body = debris.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.setVelocity((Math.random() - 0.5) * 200, -150 - Math.random() * 150);
        body.setGravityY(400);
      }
      
      this.scene.tweens.add({
        targets: debris,
        alpha: 0,
        angle: 360,
        duration: 800 + Math.random() * 400,
        onComplete: () => debris.destroy()
      });
    }

    this.scene.sound.play('sfx_punch', { volume: 0.5, rate: 0.5 }); // Crashing sound
    
    // A trick: set droppedItem = false so StageManager picks it up for item dropping!
    (this as any).droppedItem = false;
    
    this.destroy();
  }
}
