import Phaser from 'phaser';
import spriteMetrics from '../characters/fighters/CharacterSpriteMetrics.json';

interface SpriteMetric {
  artHeight: number;
  originX: number;
  originY: number;
  canvasWidth: number;
  canvasHeight: number;
}

const metrics: Record<string, SpriteMetric> = spriteMetrics;

/** Keep the feet and visible height stable despite pose/weapon overhang. */
export function fitCharacterArt(sprite: Phaser.GameObjects.Image, visibleHeight: number): boolean {
  const metric = metrics[sprite.texture.key];
  // Procedural fallbacks reuse these keys but have their original dimensions.
  if (!metric || sprite.width !== metric.canvasWidth || sprite.height !== metric.canvasHeight) return false;
  sprite.setOrigin(metric.originX, metric.originY);
  sprite.setScale(visibleHeight / metric.artHeight);
  return true;
}
