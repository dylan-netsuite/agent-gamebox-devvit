import * as Phaser from 'phaser';

export class TextureFactory {
  static generateAll(scene: Phaser.Scene): void {
    this.generateCandyCane(scene);
    this.generateCandyCaneCorner(scene);
    this.generateGrassBackground(scene);
    this.generateSparkle(scene);
    this.generateVignette(scene);
    this.generateChocolateBlock(scene);
    this.generateLicorice(scene);
    this.generateGumdrop(scene);
    this.generateGrahamCracker(scene);
    this.generateJawbreaker(scene);
    this.generateRampPlateau(scene);
    this.generateTaffy(scene);
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

  private static generateChocolateBlock(scene: Phaser.Scene): void {
    const w = 80;
    const h = 40;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Base chocolate brown
    ctx.fillStyle = '#5c3317';
    ctx.fillRect(0, 0, w, h);

    // Top face highlight gradient
    const topGrad = ctx.createLinearGradient(0, 0, 0, h);
    topGrad.addColorStop(0, 'rgba(180,120,60,0.4)');
    topGrad.addColorStop(0.3, 'rgba(120,70,30,0.1)');
    topGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
    topGrad.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle horizontal score lines (chocolate bar segments)
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h * 0.5);
    ctx.lineTo(w, h * 0.5);
    ctx.stroke();

    // Vertical score line
    ctx.beginPath();
    ctx.moveTo(w * 0.5, 0);
    ctx.lineTo(w * 0.5, h);
    ctx.stroke();

    // Top-left specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(2, 2, w * 0.4, h * 0.3);

    // Border
    ctx.strokeStyle = 'rgba(60,20,5,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    scene.textures.addCanvas('chocolate-block', canvas);
  }

  private static generateLicorice(scene: Phaser.Scene): void {
    const w = 64;
    const h = 24;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Black licorice base
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, w, h);

    // Twisted rope effect — diagonal highlight stripes
    ctx.strokeStyle = 'rgba(60,60,60,0.5)';
    ctx.lineWidth = 3;
    for (let i = -4; i < 12; i++) {
      const x0 = i * 10;
      ctx.beginPath();
      ctx.moveTo(x0, h);
      ctx.lineTo(x0 + h, 0);
      ctx.stroke();
    }

    // Cylindrical shading
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(80,80,80,0.3)');
    grad.addColorStop(0.3, 'rgba(0,0,0,0)');
    grad.addColorStop(0.5, 'rgba(60,60,60,0.15)');
    grad.addColorStop(0.7, 'rgba(0,0,0,0)');
    grad.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Top edge highlight
    ctx.strokeStyle = 'rgba(100,100,100,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0.5);
    ctx.lineTo(w, 0.5);
    ctx.stroke();

    scene.textures.addCanvas('licorice', canvas);
  }

  private static generateGumdrop(scene: Phaser.Scene): void {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    const cx = size / 2;
    const cy = size / 2;
    const r = size / 2 - 2;

    // White base (will be tinted by Phaser at render time)
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Sugar crystal speckles
    for (let i = 0; i < 30; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * r * 0.8;
      const sx = cx + Math.cos(angle) * dist;
      const sy = cy + Math.sin(angle) * dist;
      ctx.globalAlpha = 0.15 + Math.random() * 0.2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(sx, sy, 1 + Math.random(), 1 + Math.random());
    }
    ctx.globalAlpha = 1;

    // 3D dome gradient (highlight top-left, shadow bottom-right)
    const domeGrad = ctx.createRadialGradient(
      cx - r * 0.3,
      cy - r * 0.3,
      0,
      cx,
      cy,
      r
    );
    domeGrad.addColorStop(0, 'rgba(255,255,255,0.5)');
    domeGrad.addColorStop(0.4, 'rgba(255,255,255,0.1)');
    domeGrad.addColorStop(0.7, 'rgba(0,0,0,0)');
    domeGrad.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = domeGrad;
    ctx.fill();

    // Specular highlight dot
    ctx.beginPath();
    ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    scene.textures.addCanvas('gumdrop', canvas);
  }

  private static generateGrahamCracker(scene: Phaser.Scene): void {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Sandy tan base
    ctx.fillStyle = '#c4a265';
    ctx.fillRect(0, 0, size, size);

    // Crumb fragments — irregular darker/lighter patches
    const crumbColors = ['#b08840', '#d4b87a', '#a07830', '#c8a050', '#8a6828'];
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const w = 2 + Math.random() * 8;
      const h = 2 + Math.random() * 6;
      const color = crumbColors[Math.floor(Math.random() * crumbColors.length)]!;
      ctx.globalAlpha = 0.3 + Math.random() * 0.4;
      ctx.fillStyle = color;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(Math.random() * Math.PI);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.restore();
    }

    // Crack lines
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = '#6a4820';
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      let px = Math.random() * size;
      let py = Math.random() * size;
      ctx.moveTo(px, py);
      for (let j = 0; j < 3; j++) {
        px += (Math.random() - 0.5) * 40;
        py += (Math.random() - 0.5) * 40;
        ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Subtle noise grain
    for (let i = 0; i < 400; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.globalAlpha = 0.1 + Math.random() * 0.15;
      ctx.fillStyle = Math.random() > 0.5 ? '#e0c888' : '#906828';
      ctx.fillRect(x, y, 1, 1);
    }

    ctx.globalAlpha = 1;
    scene.textures.addCanvas('graham-cracker', canvas);
  }

  private static generateJawbreaker(scene: Phaser.Scene): void {
    const w = 128;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    // Jawbreaker candy stripes — horizontal bands of candy colors
    const stripes = [
      '#e03030', '#ff8c00', '#ffd700', '#32cd32',
      '#00ced1', '#6a5acd', '#ff69b4', '#e03030',
      '#ff8c00', '#ffd700', '#32cd32', '#00ced1',
      '#6a5acd', '#ff69b4', '#e03030', '#ff8c00',
    ];
    const stripeH = h / stripes.length;
    for (let i = 0; i < stripes.length; i++) {
      ctx.fillStyle = stripes[i]!;
      ctx.fillRect(0, i * stripeH, w, stripeH + 1);
    }

    // Glossy highlight across each stripe
    for (let i = 0; i < stripes.length; i++) {
      const sy = i * stripeH;
      const grad = ctx.createLinearGradient(0, sy, 0, sy + stripeH);
      grad.addColorStop(0, 'rgba(255,255,255,0.25)');
      grad.addColorStop(0.4, 'rgba(255,255,255,0.05)');
      grad.addColorStop(1, 'rgba(0,0,0,0.15)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, sy, w, stripeH);
    }

    // Side shadow edges for 3D ramp depth
    ctx.globalAlpha = 1;
    const leftShadow = ctx.createLinearGradient(0, 0, w * 0.2, 0);
    leftShadow.addColorStop(0, 'rgba(0,0,0,0.4)');
    leftShadow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = leftShadow;
    ctx.fillRect(0, 0, w * 0.2, h);

    const rightShadow = ctx.createLinearGradient(w * 0.8, 0, w, 0);
    rightShadow.addColorStop(0, 'rgba(0,0,0,0)');
    rightShadow.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = rightShadow;
    ctx.fillRect(w * 0.8, 0, w * 0.2, h);

    // Sugar crystal sparkle
    for (let i = 0; i < 150; i++) {
      const nx = Math.random() * w;
      const ny = Math.random() * h;
      ctx.globalAlpha = 0.15 + Math.random() * 0.2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(nx, ny, 1 + Math.random(), 1 + Math.random());
    }

    ctx.globalAlpha = 1;
    scene.textures.addCanvas('jawbreaker', canvas);
  }

  static generateRampPlateau(scene: Phaser.Scene): void {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Pastel pink candy base (like the inside of a jawbreaker)
    ctx.fillStyle = '#ffb6c1';
    ctx.fillRect(0, 0, size, size);

    // Swirled candy pattern — soft pastel patches
    const pastels = ['#ffc0cb', '#ffe4b5', '#e6e6fa', '#b0e0e6', '#f0e68c'];
    for (let i = 0; i < 80; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const r = 4 + Math.random() * 12;
      const color = pastels[Math.floor(Math.random() * pastels.length)]!;
      ctx.globalAlpha = 0.2 + Math.random() * 0.25;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Sugar sparkle
    for (let i = 0; i < 100; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.globalAlpha = 0.2 + Math.random() * 0.3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
    }

    // Glossy dome highlight
    const gloss = ctx.createRadialGradient(size * 0.35, size * 0.35, 0, size / 2, size / 2, size * 0.7);
    gloss.addColorStop(0, 'rgba(255,255,255,0.25)');
    gloss.addColorStop(0.5, 'rgba(255,255,255,0.05)');
    gloss.addColorStop(1, 'rgba(0,0,0,0.1)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = gloss;
    ctx.fillRect(0, 0, size, size);

    scene.textures.addCanvas('ramp-plateau', canvas);
  }

  private static generateTaffy(scene: Phaser.Scene): void {
    const w = 256;
    const h = 256;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#ff69b4';
    ctx.fillRect(0, 0, w, h);

    const taffyColors = ['#ff85c8', '#ff4da6', '#ff9ed2', '#e0559e', '#ffb3dd'];
    for (let i = 0; i < 40; i++) {
      const y0 = Math.random() * h;
      const amplitude = 8 + Math.random() * 20;
      const freq = 0.02 + Math.random() * 0.04;
      const color = taffyColors[Math.floor(Math.random() * taffyColors.length)]!;
      ctx.globalAlpha = 0.2 + Math.random() * 0.2;
      ctx.strokeStyle = color;
      ctx.lineWidth = 3 + Math.random() * 6;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const y = y0 + Math.sin(x * freq + i) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Glossy surface sheen
    const sheen = ctx.createLinearGradient(0, 0, 0, h);
    sheen.addColorStop(0, 'rgba(255,255,255,0.15)');
    sheen.addColorStop(0.3, 'rgba(255,255,255,0.02)');
    sheen.addColorStop(0.7, 'rgba(0,0,0,0.05)');
    sheen.addColorStop(1, 'rgba(255,255,255,0.1)');
    ctx.globalAlpha = 1;
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, w, h);

    // Sugar sparkle
    for (let i = 0; i < 120; i++) {
      const x = Math.random() * w;
      const y = Math.random() * h;
      ctx.globalAlpha = 0.15 + Math.random() * 0.2;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, 1 + Math.random(), 1 + Math.random());
    }

    ctx.globalAlpha = 1;
    scene.textures.addCanvas('taffy', canvas);
  }
}
