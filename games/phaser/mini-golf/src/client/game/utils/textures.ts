import * as Phaser from 'phaser';

export class TextureFactory {
  static generateAll(scene: Phaser.Scene): void {
    this.generateCandyCane(scene);
    this.generateCandyCaneCorner(scene);
    this.generateGrassBackground(scene);
    this.generateSparkle(scene);
    this.generateVignette(scene);
  }

  private static generateCandyCane(scene: Phaser.Scene): void {
    const w = 64;
    const h = 32;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // White base
    ctx.fillStyle = '#f8f0f0';
    ctx.fillRect(0, 0, w, h);

    // Cylindrical shading gradient (top-to-bottom = edge-to-center-to-edge)
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(0,0,0,0.12)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.08)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.15)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Diagonal red stripes — tileable
    const stripeWidth = h * 0.45;
    const stripeGap = h * 0.85;
    const skew = h * 0.9;

    ctx.fillStyle = '#cc1111';
    for (let i = -4; i < 8; i++) {
      const x0 = i * stripeGap;
      ctx.beginPath();
      ctx.moveTo(x0, h);
      ctx.lineTo(x0 + skew, 0);
      ctx.lineTo(x0 + skew + stripeWidth, 0);
      ctx.lineTo(x0 + stripeWidth, h);
      ctx.closePath();
      ctx.fill();
    }

    // Re-apply cylindrical shading on top of stripes
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Top edge highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0.5);
    ctx.lineTo(w, 0.5);
    ctx.stroke();

    // Bottom edge shadow
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.moveTo(0, h - 0.5);
    ctx.lineTo(w, h - 0.5);
    ctx.stroke();

    scene.textures.addCanvas('candy-cane', canvas);
  }

  private static generateCandyCaneCorner(scene: Phaser.Scene): void {
    const size = 36;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 1;

    // White base circle
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#f8f0f0';
    ctx.fill();

    // Red spiral segments (6 alternating wedges)
    const segments = 6;
    for (let i = 0; i < segments; i++) {
      const startAngle = (i * Math.PI * 2) / segments;
      const endAngle = startAngle + Math.PI / (segments / 2);
      if (i % 2 === 0) {
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = '#cc1111';
        ctx.fill();
      }
    }

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#cc1111';
    ctx.fill();

    // Radial highlight for 3D dome effect
    const radGrad = ctx.createRadialGradient(cx - r * 0.2, cy - r * 0.2, 0, cx, cy, r);
    radGrad.addColorStop(0, 'rgba(255,255,255,0.3)');
    radGrad.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    radGrad.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = radGrad;
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    scene.textures.addCanvas('candy-cane-corner', canvas);
  }

  private static generateGrassBackground(scene: Phaser.Scene): void {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Rich dark green base
    ctx.fillStyle = '#14381f';
    ctx.fillRect(0, 0, size, size);

    // Layered noise for organic grass texture
    const shades = ['#1a4a2a', '#164020', '#1e5530', '#123518', '#0f2d14'];
    for (let i = 0; i < 800; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const shade = shades[Math.floor(Math.random() * shades.length)]!;
      ctx.globalAlpha = 0.15 + Math.random() * 0.25;
      ctx.fillStyle = shade;
      ctx.fillRect(x, y, 1 + Math.random() * 2, 2 + Math.random() * 4);
    }

    // Lighter highlights
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.globalAlpha = 0.08 + Math.random() * 0.12;
      ctx.fillStyle = '#2a6b3a';
      ctx.beginPath();
      ctx.arc(x, y, 0.5 + Math.random() * 1.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    scene.textures.addCanvas('grass-bg', canvas);
  }

  private static generateSparkle(scene: Phaser.Scene): void {
    const size = 32;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;
    const armLen = size / 2 - 2;

    // 4-point star
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - armLen);
    ctx.lineTo(cx + armLen * 0.12, cy - armLen * 0.12);
    ctx.lineTo(cx + armLen, cy);
    ctx.lineTo(cx + armLen * 0.12, cy + armLen * 0.12);
    ctx.lineTo(cx, cy + armLen);
    ctx.lineTo(cx - armLen * 0.12, cy + armLen * 0.12);
    ctx.lineTo(cx - armLen, cy);
    ctx.lineTo(cx - armLen * 0.12, cy - armLen * 0.12);
    ctx.closePath();
    ctx.fill();

    // Center glow
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, armLen * 0.4);
    glow.addColorStop(0, 'rgba(255,255,255,0.9)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, armLen * 0.4, 0, Math.PI * 2);
    ctx.fill();

    scene.textures.addCanvas('sparkle', canvas);
  }

  private static generateVignette(scene: Phaser.Scene): void {
    const w = 512;
    const h = 512;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.55);
    grad.addColorStop(0, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(8,24,12,0.45)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    scene.textures.addCanvas('vignette', canvas);
  }
}
