import Phaser from 'phaser';
import { FighterArtSpec, FighterPose } from '../characters/fighters/FighterArtSpec';

export class SpriteGenerator {
  /** Legacy rectangle placeholder (kept for fallback/enemy quick use) */
  static generateRect(scene: Phaser.Scene, key: string, width: number, height: number, color: number, label?: string): void {
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, width, height)!;
    const ctx = canvas.getContext();
    ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, width - 2, height - 2);
    if (label) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, width / 2, height / 2);
    }
    canvas.refresh();
  }

  static generateShadow(scene: Phaser.Scene, key: string): void {
    if (scene.textures.exists(key)) return;
    const w = 40, h = 12;
    const canvas = scene.textures.createCanvas(key, w, h)!;
    const ctx = canvas.getContext();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    canvas.refresh();
  }

  /** Layered fighter sprite. Produces texture keyed `${baseKey}_${pose}`. */
  static generateFighter(
    scene: Phaser.Scene,
    baseKey: string,
    spec: FighterArtSpec,
    pose: FighterPose
  ): string {
    const key = `${baseKey}_${pose}`;
    if (scene.textures.exists(key)) return key;

    const pad = 8; // canvas padding for weapon overhang
    const W = spec.width + pad * 2;
    const H = spec.height + pad;
    const canvas = scene.textures.createCanvas(key, W, H)!;
    const ctx = canvas.getContext();

    // Coordinate system: feet at bottom-center
    const feetX = W / 2;
    const feetY = H - 2;
    const bodyTop = feetY - spec.height;
    const headCY = bodyTop + spec.headRadius;
    const shoulderY = bodyTop + spec.headRadius * 2 + 2;
    const waistY = feetY - spec.height * 0.42;

    // Pose offsets
    const leanX = pose === 'attack' ? 3 : 0;
    const armOffsetX = pose === 'walk' ? 2 : pose === 'attack' ? 6 : 0;
    const armOffsetY = pose === 'walk' ? -1 : pose === 'attack' ? -3 : 0;
    const legStanceOffset = pose === 'walk' ? 3 : 0;

    // ---- Shadow under feet (lighter than main shadow) ----
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(feetX, feetY + 1, spec.waistWidth + 4, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // ---- Legs ----
    ctx.fillStyle = spec.robeAccent;
    // left leg
    ctx.fillRect(feetX - spec.waistWidth + 1, waistY, spec.waistWidth - 1, feetY - waistY - legStanceOffset);
    // right leg
    ctx.fillRect(feetX + 1, waistY + legStanceOffset, spec.waistWidth - 1, feetY - waistY - legStanceOffset);
    // feet
    ctx.fillStyle = '#2a1a0a';
    ctx.fillRect(feetX - spec.waistWidth + 1, feetY - 3, spec.waistWidth - 1, 3);
    ctx.fillRect(feetX + 1, feetY - 3, spec.waistWidth - 1, 3);

    // ---- Body / robe (trapezoid) ----
    ctx.fillStyle = spec.robeMain;
    ctx.beginPath();
    ctx.moveTo(feetX - spec.shoulderWidth + leanX, shoulderY);
    ctx.lineTo(feetX + spec.shoulderWidth + leanX, shoulderY);
    ctx.lineTo(feetX + spec.waistWidth + 1, waistY + 3);
    ctx.lineTo(feetX - spec.waistWidth - 1, waistY + 3);
    ctx.closePath();
    ctx.fill();

    // Trim stripe
    if (spec.trim) {
      ctx.fillStyle = spec.trim;
      ctx.fillRect(feetX - 1 + leanX, shoulderY, 2, waistY - shoulderY);
    }

    // Belt / sash
    ctx.fillStyle = spec.robeAccent;
    ctx.fillRect(feetX - spec.waistWidth - 1, waistY, spec.waistWidth * 2 + 2, 3);

    // ---- Arms ----
    ctx.fillStyle = spec.robeMain;
    // back arm
    ctx.fillRect(feetX - spec.shoulderWidth - 1 + leanX, shoulderY, 4, 14);
    // front arm (shifted for pose)
    ctx.fillRect(feetX + spec.shoulderWidth - 3 + leanX + armOffsetX, shoulderY + armOffsetY, 4, 14);
    // hands
    ctx.fillStyle = spec.skin;
    ctx.fillRect(feetX - spec.shoulderWidth - 1 + leanX, shoulderY + 13, 4, 4);
    ctx.fillRect(feetX + spec.shoulderWidth - 3 + leanX + armOffsetX, shoulderY + 13 + armOffsetY, 4, 4);

    // ---- Head ----
    ctx.fillStyle = spec.skin;
    ctx.beginPath();
    ctx.arc(feetX + leanX, headCY, spec.headRadius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes (tiny stroke so they read)
    ctx.fillStyle = '#000';
    ctx.fillRect(feetX - 3 + leanX, headCY - 1, 2, 2);
    ctx.fillRect(feetX + 1 + leanX, headCY - 1, 2, 2);

    // ---- Hair ----
    this.drawHair(ctx, feetX + leanX, headCY, spec);

    // ---- Weapon ----
    this.drawWeapon(ctx, feetX + leanX + spec.shoulderWidth, shoulderY, pose, spec);

    canvas.refresh();
    return key;
  }

  private static drawHair(ctx: CanvasRenderingContext2D, cx: number, cy: number, spec: FighterArtSpec): void {
    ctx.fillStyle = spec.hair;
    const r = spec.headRadius;
    switch (spec.hairStyle) {
      case 'short':
        ctx.beginPath();
        ctx.arc(cx, cy - 1, r + 1, Math.PI, Math.PI * 2);
        ctx.fill();
        break;
      case 'topknot':
        ctx.beginPath();
        ctx.arc(cx, cy - 1, r + 1, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx, cy - r - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx + r - 2, cy - 2, 2, 8);
        break;
      case 'braid':
        ctx.beginPath();
        ctx.arc(cx, cy - 1, r + 2, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - 2, cy + r - 1, 4, 12); // braid down back
        break;
      case 'ponytail':
        ctx.beginPath();
        ctx.arc(cx, cy - 1, r + 1, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - r - 1, cy - 1, 3, 9); // hood-like ponytail band
        ctx.fillRect(cx - r + 1, cy + 4, 3, 10);
        break;
      case 'crown': {
        // 冕旒 rectangular crown
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(cx - r - 2, cy - r - 2, (r + 2) * 2, 5);
        // bead strings
        ctx.fillStyle = '#fff1aa';
        for (let i = -2; i <= 2; i++) {
          ctx.fillRect(cx + i * 3, cy - r + 2, 1, 4);
        }
        break;
      }
      case 'helmet':
        ctx.fillStyle = '#888888';
        ctx.beginPath();
        ctx.arc(cx, cy - 1, r + 2, Math.PI, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(cx - r - 2, cy - 1, (r + 2) * 2, 3);
        break;
    }
  }

  private static drawWeapon(
    ctx: CanvasRenderingContext2D,
    handX: number,
    handY: number,
    pose: FighterPose,
    spec: FighterArtSpec
  ): void {
    const angle = pose === 'attack' ? -Math.PI / 6 : Math.PI / 2.4;
    switch (spec.weapon) {
      case 'none':
        return;
      case 'sword': {
        // long blade
        ctx.save();
        ctx.translate(handX + 2, handY + 12);
        ctx.rotate(angle);
        ctx.fillStyle = '#bbbbbb';
        ctx.fillRect(-1, -26, 2, 26);
        ctx.fillStyle = '#884422';
        ctx.fillRect(-2, -2, 4, 4);
        ctx.restore();
        break;
      }
      case 'dagger': {
        ctx.save();
        ctx.translate(handX + 2, handY + 12);
        ctx.rotate(angle);
        ctx.fillStyle = '#cccccc';
        ctx.fillRect(-1, -10, 2, 10);
        ctx.fillStyle = '#333';
        ctx.fillRect(-2, -1, 4, 3);
        ctx.restore();
        break;
      }
      case 'fan': {
        ctx.save();
        ctx.translate(handX + 2, handY + 12);
        ctx.rotate(angle);
        ctx.fillStyle = spec.robeAccent;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-6, -10);
        ctx.lineTo(6, -10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'royalblade': {
        ctx.save();
        ctx.translate(handX + 2, handY + 12);
        ctx.rotate(angle);
        ctx.fillStyle = '#ddcc44';
        ctx.fillRect(-2, -30, 4, 30);
        ctx.fillStyle = '#cc2222';
        ctx.fillRect(-3, -2, 6, 5);
        ctx.fillStyle = '#ffdd88';
        ctx.fillRect(-1, -32, 2, 2);
        ctx.restore();
        break;
      }
      case 'spear': {
        ctx.save();
        ctx.translate(handX + 2, handY + 12);
        ctx.rotate(angle);
        ctx.fillStyle = '#996633';
        ctx.fillRect(-1, -34, 2, 34);
        ctx.fillStyle = '#ccccdd';
        ctx.beginPath();
        ctx.moveTo(0, -40);
        ctx.lineTo(-3, -30);
        ctx.lineTo(3, -30);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'bow': {
        ctx.save();
        ctx.translate(handX + 2, handY + 12);
        ctx.rotate(angle);
        ctx.strokeStyle = '#884422';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -12, 12, -Math.PI / 3, Math.PI / 3);
        ctx.stroke();
        ctx.strokeStyle = '#dddddd';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(6, -18);
        ctx.lineTo(6, -6);
        ctx.stroke();
        ctx.restore();
        break;
      }
      case 'shield_axe': {
        // Shield
        ctx.fillStyle = '#aa7733';
        ctx.fillRect(handX - 16, handY + 2, 10, 18);
        ctx.strokeStyle = '#553311';
        ctx.lineWidth = 1;
        ctx.strokeRect(handX - 16, handY + 2, 10, 18);
        // Axe
        ctx.save();
        ctx.translate(handX + 2, handY + 12);
        ctx.rotate(angle);
        ctx.fillStyle = '#886622';
        ctx.fillRect(-1, -18, 2, 18);
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.moveTo(1, -18);
        ctx.lineTo(7, -14);
        ctx.lineTo(1, -10);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'cavalry': {
        // horse silhouette under the rider
        ctx.fillStyle = '#553322';
        ctx.fillRect(handX - 20, handY + 16, 32, 8);
        ctx.fillRect(handX - 18, handY + 24, 3, 6);
        ctx.fillRect(handX + 8, handY + 24, 3, 6);
        // lance
        ctx.save();
        ctx.translate(handX + 2, handY + 12);
        ctx.rotate(-Math.PI / 8);
        ctx.fillStyle = '#996633';
        ctx.fillRect(-1, -26, 2, 26);
        ctx.fillStyle = '#cccccc';
        ctx.beginPath();
        ctx.moveTo(0, -30);
        ctx.lineTo(-2, -24);
        ctx.lineTo(2, -24);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;
      }
      case 'hammer': {
        ctx.save();
        ctx.translate(handX + 2, handY + 12);
        ctx.rotate(angle);
        ctx.fillStyle = '#664422';
        ctx.fillRect(-1, -22, 2, 22);
        ctx.fillStyle = '#777777';
        ctx.fillRect(-6, -28, 12, 8);
        ctx.restore();
        break;
      }
    }
  }

  /** Simple enemy silhouette with palette + label */
  static generateEnemy(
    scene: Phaser.Scene,
    key: string,
    opts: { width: number; height: number; main: string; accent: string; label: string; weapon?: FighterArtSpec['weapon']; hair?: FighterArtSpec['hairStyle'] }
  ): void {
    if (scene.textures.exists(key)) return;
    const spec: FighterArtSpec = {
      width: opts.width, height: opts.height,
      skin: '#c89878',
      robeMain: opts.main,
      robeAccent: opts.accent,
      hair: '#1a1a1a',
      trim: '#000000',
      hairStyle: opts.hair ?? 'helmet',
      weapon: opts.weapon ?? 'sword',
      shoulderWidth: Math.floor(opts.width / 3),
      waistWidth: Math.floor(opts.width / 4),
      headRadius: Math.floor(opts.height / 8),
    };
    // Generate a single "idle" pose under the requested key
    const tempKey = `${key}__base`;
    this.generateFighter(scene, tempKey, spec, 'idle');
    // Rename: copy the generated canvas to requested key
    const src = scene.textures.get(`${tempKey}_idle`);
    if (src) {
      // Phaser cannot rename easily; alias by adding under requested key
      const srcImg = src.getSourceImage(0) as HTMLCanvasElement;
      scene.textures.addCanvas(key, srcImg);
    }
  }

  static generateCloud(scene: Phaser.Scene, key: string): void {
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 120, 60)!;
    const ctx = canvas.getContext();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    const circles = [
      { x: 30, y: 35, r: 20 }, { x: 60, y: 30, r: 25 }, { x: 90, y: 35, r: 20 },
      { x: 50, y: 20, r: 18 }, { x: 75, y: 22, r: 16 }
    ];
    for (const c of circles) {
      ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
    }
    canvas.refresh();
  }

  static generateTree(scene: Phaser.Scene, key: string, color: string = '#2d4d22'): void {
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 80, 120)!;
    const ctx = canvas.getContext();
    // trunk
    ctx.fillStyle = '#4b3621';
    ctx.fillRect(35, 80, 10, 40);
    // foliage
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(40, 0); ctx.lineTo(5, 40); ctx.lineTo(75, 40); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(40, 20); ctx.lineTo(10, 70); ctx.lineTo(70, 70); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(40, 40); ctx.lineTo(15, 90); ctx.lineTo(65, 90); ctx.closePath(); ctx.fill();
    canvas.refresh();
  }

  static generateRock(scene: Phaser.Scene, key: string): void {
    if (scene.textures.exists(key)) return;
    const canvas = scene.textures.createCanvas(key, 40, 30)!;
    const ctx = canvas.getContext();
    ctx.fillStyle = '#777777';
    ctx.beginPath();
    ctx.moveTo(0, 30); ctx.lineTo(10, 5); ctx.lineTo(25, 0); ctx.lineTo(40, 30);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#555555'; // shading
    ctx.beginPath(); ctx.moveTo(25, 0); ctx.lineTo(40, 30); ctx.lineTo(20, 30); ctx.closePath(); ctx.fill();
    canvas.refresh();
  }
}
