import { Scene } from 'phaser';

export class TextureFactory {
  static generateAll(scene: Scene): void {
    this.generateMeercaHead(scene);
    this.generateTailSegment(scene);
    this.generateNegg(scene);
    this.generateBadNegg(scene);
    this.generateGridBg(scene);
    this.generateParticle(scene);
  }

  private static generateMeercaHead(scene: Scene): void {
    const size = 64;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0xffcc00);
    g.fillCircle(size / 2, size / 2 + 4, size / 2 - 4);

    g.fillStyle(0xffe066);
    g.fillCircle(size / 2 - 4, size / 2 - 2, size / 2 - 10);

    g.fillStyle(0xffcc00);
    g.fillEllipse(size / 2 - 12, size / 2 - 18, 14, 20);
    g.fillEllipse(size / 2 + 12, size / 2 - 18, 14, 20);

    g.fillStyle(0xffe066);
    g.fillEllipse(size / 2 - 12, size / 2 - 20, 8, 12);
    g.fillEllipse(size / 2 + 12, size / 2 - 20, 8, 12);

    g.fillStyle(0x1a0a2e);
    g.fillCircle(size / 2 - 8, size / 2, 4);
    g.fillCircle(size / 2 + 8, size / 2, 4);

    g.fillStyle(0xffffff);
    g.fillCircle(size / 2 - 9, size / 2 - 1, 1.5);
    g.fillCircle(size / 2 + 7, size / 2 - 1, 1.5);

    g.fillStyle(0xff6b6b);
    g.fillEllipse(size / 2, size / 2 + 8, 6, 3);

    g.generateTexture('meerca-head', size, size);
    g.destroy();
  }

  private static generateTailSegment(scene: Scene): void {
    const size = 48;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0xffcc00);
    g.fillCircle(size / 2, size / 2, size / 2 - 4);

    g.fillStyle(0xffe066);
    g.fillCircle(size / 2 - 2, size / 2 - 2, size / 2 - 10);

    g.generateTexture('tail-segment', size, size);
    g.destroy();
  }

  private static generateNegg(scene: Scene): void {
    const size = 48;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0xffffff);
    g.fillEllipse(size / 2, size / 2, size - 8, size - 4);

    g.fillStyle(0xffffff, 0.4);
    g.fillEllipse(size / 2 - 4, size / 2 - 6, 12, 8);

    g.generateTexture('negg-base', size, size);
    g.destroy();
  }

  private static generateBadNegg(scene: Scene): void {
    const size = 48;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);
    const cx = size / 2;
    const cy = size / 2;

    // Spiky body — draw 8 triangular spikes around an ellipse
    g.fillStyle(0xffffff);
    const spikes = 8;
    const innerRx = 15;
    const innerRy = 18;
    const spikeLen = 7;
    for (let i = 0; i < spikes; i++) {
      const angle = (i / spikes) * Math.PI * 2;
      const nextAngle = ((i + 1) / spikes) * Math.PI * 2;
      const midAngle = (angle + nextAngle) / 2;

      const x1 = cx + Math.cos(angle) * innerRx;
      const y1 = cy + Math.sin(angle) * innerRy;
      const x2 = cx + Math.cos(nextAngle) * innerRx;
      const y2 = cy + Math.sin(nextAngle) * innerRy;
      const sx = cx + Math.cos(midAngle) * (innerRx + spikeLen);
      const sy = cy + Math.sin(midAngle) * (innerRy + spikeLen);

      g.fillTriangle(x1, y1, sx, sy, x2, y2);
    }

    // Core ellipse
    g.fillEllipse(cx, cy, innerRx * 2, innerRy * 2);

    // X eyes
    g.lineStyle(3, 0x000000, 0.8);
    const eyeOff = 6;
    const eyeSize = 3;
    // left X
    g.lineBetween(cx - eyeOff - eyeSize, cy - 4 - eyeSize, cx - eyeOff + eyeSize, cy - 4 + eyeSize);
    g.lineBetween(cx - eyeOff + eyeSize, cy - 4 - eyeSize, cx - eyeOff - eyeSize, cy - 4 + eyeSize);
    // right X
    g.lineBetween(cx + eyeOff - eyeSize, cy - 4 - eyeSize, cx + eyeOff + eyeSize, cy - 4 + eyeSize);
    g.lineBetween(cx + eyeOff + eyeSize, cy - 4 - eyeSize, cx + eyeOff - eyeSize, cy - 4 + eyeSize);

    // Frown
    g.lineStyle(2.5, 0x000000, 0.7);
    g.beginPath();
    g.arc(cx, cy + 14, 5, Math.PI * 1.2, Math.PI * 1.8, false);
    g.strokePath();

    g.generateTexture('negg-bad', size, size);
    g.destroy();
  }

  private static generateGridBg(scene: Scene): void {
    const size = 128;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0x1a0a2e);
    g.fillRect(0, 0, size, size);

    g.fillStyle(0x221244, 0.5);
    for (let x = 0; x < size; x += 32) {
      for (let y = 0; y < size; y += 32) {
        if ((x / 32 + y / 32) % 2 === 0) {
          g.fillRect(x, y, 32, 32);
        }
      }
    }

    g.generateTexture('grid-bg', size, size);
    g.destroy();
  }

  private static generateParticle(scene: Scene): void {
    const size = 16;
    const g = scene.make.graphics({ x: 0, y: 0 }, false);

    g.fillStyle(0xffffff);
    g.fillCircle(size / 2, size / 2, size / 2 - 1);

    g.generateTexture('particle', size, size);
    g.destroy();
  }
}
