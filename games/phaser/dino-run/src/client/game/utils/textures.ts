import { Scene } from 'phaser';

const DINO_COLOR = 0x535353;
const GROUND_COLOR = 0x535353;
const CLOUD_COLOR = 0xd4d4d4;

export class TextureFactory {
  static generateAll(scene: Scene): void {
    this.generateDinoStand(scene);
    this.generateDinoRun1(scene);
    this.generateDinoRun2(scene);
    this.generateDinoDuck1(scene);
    this.generateDinoDuck2(scene);
    this.generateDinoDead(scene);
    this.generateCactusSmall(scene);
    this.generateCactusLarge(scene);
    this.generateCactusGroup(scene);
    this.generatePtero1(scene);
    this.generatePtero2(scene);
    this.generateGround(scene);
    this.generateCloud(scene);
    this.generateStar(scene);
    this.generateRestartIcon(scene);
  }

  private static drawDinoBase(g: Phaser.GameObjects.Graphics, legMode: 'stand' | 'left' | 'right'): void {
    g.fillStyle(DINO_COLOR);

    // Body
    g.fillRect(10, 10, 22, 26);
    // Head
    g.fillRect(20, 0, 24, 18);
    // Eye socket (cutout)
    g.fillStyle(0xffffff);
    g.fillRect(36, 4, 4, 4);
    g.fillStyle(DINO_COLOR);
    // Mouth line
    g.fillRect(32, 14, 12, 2);
    // Arm
    g.fillRect(26, 26, 4, 10);
    g.fillRect(28, 34, 4, 2);
    // Tail
    g.fillRect(4, 12, 8, 4);
    g.fillRect(0, 10, 6, 4);

    if (legMode === 'stand') {
      g.fillRect(12, 36, 6, 12);
      g.fillRect(16, 46, 4, 2);
      g.fillRect(22, 36, 6, 12);
      g.fillRect(26, 46, 4, 2);
    } else if (legMode === 'left') {
      g.fillRect(12, 36, 6, 12);
      g.fillRect(16, 46, 4, 2);
      g.fillRect(22, 36, 6, 6);
    } else {
      g.fillRect(12, 36, 6, 6);
      g.fillRect(22, 36, 6, 12);
      g.fillRect(26, 46, 4, 2);
    }
  }

  private static generateDinoStand(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    this.drawDinoBase(g, 'stand');
    g.generateTexture('dino-stand', 48, 48);
    g.destroy();
  }

  private static generateDinoRun1(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    this.drawDinoBase(g, 'left');
    g.generateTexture('dino-run-1', 48, 48);
    g.destroy();
  }

  private static generateDinoRun2(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    this.drawDinoBase(g, 'right');
    g.generateTexture('dino-run-2', 48, 48);
    g.destroy();
  }

  private static drawDinoDuck(g: Phaser.GameObjects.Graphics, legMode: 'left' | 'right'): void {
    g.fillStyle(DINO_COLOR);

    // Elongated body (ducking)
    g.fillRect(0, 4, 36, 14);
    // Head (forward)
    g.fillRect(36, 0, 24, 16);
    // Eye
    g.fillStyle(0xffffff);
    g.fillRect(52, 4, 4, 4);
    g.fillStyle(DINO_COLOR);
    // Mouth
    g.fillRect(48, 12, 12, 2);
    // Tail nub
    g.fillRect(0, 2, 4, 4);

    if (legMode === 'left') {
      g.fillRect(8, 18, 6, 10);
      g.fillRect(12, 26, 4, 2);
      g.fillRect(20, 18, 6, 4);
    } else {
      g.fillRect(8, 18, 6, 4);
      g.fillRect(20, 18, 6, 10);
      g.fillRect(24, 26, 4, 2);
    }
  }

  private static generateDinoDuck1(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    this.drawDinoDuck(g, 'left');
    g.generateTexture('dino-duck-1', 62, 28);
    g.destroy();
  }

  private static generateDinoDuck2(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    this.drawDinoDuck(g, 'right');
    g.generateTexture('dino-duck-2', 62, 28);
    g.destroy();
  }

  private static generateDinoDead(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    this.drawDinoBase(g, 'stand');
    // X-eye overlay
    g.fillStyle(0xffffff);
    g.fillRect(34, 2, 8, 8);
    g.lineStyle(2, DINO_COLOR);
    g.lineBetween(35, 3, 41, 9);
    g.lineBetween(41, 3, 35, 9);
    g.generateTexture('dino-dead', 48, 48);
    g.destroy();
  }

  private static generateCactusSmall(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(DINO_COLOR);
    // Main stem
    g.fillRect(5, 8, 8, 28);
    // Left arm
    g.fillRect(0, 14, 6, 4);
    g.fillRect(0, 10, 4, 6);
    // Right arm
    g.fillRect(12, 18, 6, 4);
    g.fillRect(14, 14, 4, 6);
    g.generateTexture('cactus-small', 18, 36);
    g.destroy();
  }

  private static generateCactusLarge(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(DINO_COLOR);
    // Main stem
    g.fillRect(8, 0, 10, 50);
    // Left arm
    g.fillRect(0, 16, 10, 4);
    g.fillRect(0, 10, 4, 10);
    // Right arm
    g.fillRect(16, 24, 10, 4);
    g.fillRect(22, 18, 4, 10);
    g.generateTexture('cactus-large', 26, 50);
    g.destroy();
  }

  private static generateCactusGroup(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(DINO_COLOR);
    // Left cactus
    g.fillRect(2, 10, 8, 26);
    g.fillRect(0, 16, 4, 4);
    g.fillRect(8, 20, 4, 4);
    // Middle cactus (taller)
    g.fillRect(14, 2, 8, 34);
    g.fillRect(10, 12, 6, 4);
    g.fillRect(20, 8, 6, 4);
    // Right cactus
    g.fillRect(28, 8, 8, 28);
    g.fillRect(24, 18, 6, 4);
    g.fillRect(34, 14, 4, 4);
    g.generateTexture('cactus-group', 38, 36);
    g.destroy();
  }

  private static drawPteroBody(g: Phaser.GameObjects.Graphics): void {
    g.fillStyle(DINO_COLOR);
    // Body
    g.fillRect(8, 16, 28, 8);
    // Head/beak
    g.fillRect(36, 16, 10, 6);
    g.fillRect(44, 18, 6, 4);
    // Eye
    g.fillStyle(0xffffff);
    g.fillRect(38, 17, 3, 3);
    g.fillStyle(DINO_COLOR);
    // Tail
    g.fillRect(2, 18, 8, 4);
  }

  private static generatePtero1(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    this.drawPteroBody(g);
    // Wings up
    g.fillRect(14, 4, 18, 4);
    g.fillRect(16, 0, 14, 6);
    g.generateTexture('ptero-1', 50, 40);
    g.destroy();
  }

  private static generatePtero2(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    this.drawPteroBody(g);
    // Wings down
    g.fillRect(14, 24, 18, 4);
    g.fillRect(16, 26, 14, 6);
    g.generateTexture('ptero-2', 50, 40);
    g.destroy();
  }

  private static generateGround(scene: Scene): void {
    const w = 2400;
    const h = 14;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(GROUND_COLOR);
    // Main ground line
    g.fillRect(0, 0, w, 2);

    // Bumpy texture below the line
    const rng = (seed: number) => {
      let s = seed;
      return () => {
        s = (s * 16807 + 0) % 2147483647;
        return (s & 0x7fffffff) / 0x7fffffff;
      };
    };
    const rand = rng(42);

    for (let x = 0; x < w; x += 3) {
      const bh = Math.floor(rand() * 4) + 1;
      const by = 3 + Math.floor(rand() * 3);
      if (rand() > 0.3) {
        g.fillRect(x, by, 2, bh);
      }
    }

    g.generateTexture('ground', w, h);
    g.destroy();
  }

  private static generateCloud(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(CLOUD_COLOR);
    g.fillRect(0, 6, 46, 8);
    g.fillRect(4, 2, 16, 10);
    g.fillRect(22, 4, 12, 10);
    g.fillRect(36, 6, 8, 6);
    g.generateTexture('cloud', 46, 16);
    g.destroy();
  }

  private static generateStar(scene: Scene): void {
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xe0e0e0);
    g.fillRect(2, 0, 2, 6);
    g.fillRect(0, 2, 6, 2);
    g.generateTexture('star', 6, 6);
    g.destroy();
  }

  private static generateRestartIcon(scene: Scene): void {
    const size = 36;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const cx = size / 2;
    const cy = size / 2;

    g.lineStyle(3, DINO_COLOR);
    g.beginPath();
    g.arc(cx, cy, 12, -Math.PI * 0.8, Math.PI * 0.6, false);
    g.strokePath();

    // Arrow head
    g.fillStyle(DINO_COLOR);
    g.fillTriangle(cx + 10, cy - 8, cx + 16, cy - 2, cx + 6, cy - 2);

    g.generateTexture('restart-icon', size, size);
    g.destroy();
  }
}
