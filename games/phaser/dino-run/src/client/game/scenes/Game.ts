import { Scene } from 'phaser';

const GRAVITY = 1600;
const JUMP_VELOCITY = -620;
const INITIAL_SPEED = 320;
const MAX_SPEED = 900;
const SPEED_INCREMENT = 25;
const MIN_OBSTACLE_GAP = 300;
const NIGHT_TOGGLE_SCORE = 700;

type DinoState = 'running' | 'jumping' | 'ducking' | 'dead';
type ObstacleType = 'cactus-small' | 'cactus-large' | 'cactus-group' | 'ptero';

interface Obstacle {
  sprite: Phaser.GameObjects.Image;
  type: ObstacleType;
  hitbox: { x: number; y: number; w: number; h: number };
}

export class DinoGame extends Scene {
  private dino!: Phaser.GameObjects.Image;
  private dinoState: DinoState = 'running';
  private dinoVy = 0;
  private groundY = 0;
  private dinoX = 0;

  private ground1!: Phaser.GameObjects.TileSprite;

  private obstacles: Obstacle[] = [];
  private clouds: Phaser.GameObjects.Image[] = [];
  private stars: Phaser.GameObjects.Image[] = [];

  private speed = INITIAL_SPEED;
  private score = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private highScoreText!: Phaser.GameObjects.Text;
  private highScore = 0;

  private isNight = false;
  private nightToggles = 0;
  private bgColor = 0xf7f7f7;

  private runFrame = 0;
  private runTimer = 0;
  private pteroFrame = 0;
  private pteroTimer = 0;

  private lastObstacleX = 0;
  private gameStarted = false;
  private isGameOver = false;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;

  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private groundLine!: Phaser.GameObjects.Graphics;

  constructor() {
    super('DinoGame');
  }

  init() {
    this.dinoState = 'running';
    this.dinoVy = 0;
    this.speed = INITIAL_SPEED;
    this.score = 0;
    this.isNight = false;
    this.nightToggles = 0;
    this.bgColor = 0xf7f7f7;
    this.runFrame = 0;
    this.runTimer = 0;
    this.pteroFrame = 0;
    this.pteroTimer = 0;
    this.lastObstacleX = 0;
    this.gameStarted = false;
    this.isGameOver = false;
    this.obstacles = [];
    this.clouds = [];
    this.stars = [];
    this.allObjects = [];
  }

  create() {
    const { width, height } = this.scale;
    this.cameras.main.setBackgroundColor(this.bgColor);

    this.groundY = height * 0.75;
    this.dinoX = width * 0.12;

    // Ground line
    this.groundLine = this.add.graphics();
    this.groundLine.lineStyle(2, 0x535353);
    this.groundLine.lineBetween(0, this.groundY, width, this.groundY);
    this.groundLine.setDepth(5);
    this.allObjects.push(this.groundLine);

    // Ground tile sprites (two side-by-side for seamless scroll)
    this.ground1 = this.add.tileSprite(width / 2, this.groundY + 7, width, 14, 'ground');
    this.ground1.setDepth(4);
    this.allObjects.push(this.ground1);

    // Initial clouds
    this.spawnCloud(width * 0.3, height * 0.2);
    this.spawnCloud(width * 0.6, height * 0.12);
    this.spawnCloud(width * 0.85, height * 0.28);

    // Dino
    this.dino = this.add.image(this.dinoX, this.groundY, 'dino-stand');
    this.dino.setOrigin(0.5, 1);
    this.dino.setDepth(10);
    this.allObjects.push(this.dino);

    // Score display
    const scoreFontSize = Math.max(14, Math.round(height * 0.06));
    this.highScoreText = this.add
      .text(width - 20, 20, '', {
        fontFamily: '"Courier New", monospace',
        fontSize: `${scoreFontSize}px`,
        color: '#999',
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(20);
    this.allObjects.push(this.highScoreText);

    this.scoreText = this.add
      .text(width - 20, 20, '00000', {
        fontFamily: '"Courier New", monospace',
        fontSize: `${scoreFontSize}px`,
        color: '#535353',
        align: 'right',
      })
      .setOrigin(1, 0)
      .setDepth(20);
    this.allObjects.push(this.scoreText);

    this.fetchHighScore();

    // Input
    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    this.input.on('pointerdown', () => {
      if (this.isGameOver) return;
      if (!this.gameStarted) {
        this.gameStarted = true;
      }
      this.tryJump();
    });

    // Prompt to start
    this.showStartPrompt();

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.handleResize(gameSize.width, gameSize.height);
    });
  }

  private showStartPrompt(): void {
    const { width, height } = this.scale;
    const prompt = this.add
      .text(width / 2, height * 0.4, 'Press SPACE or Tap to Start', {
        fontFamily: '"Courier New", monospace',
        fontSize: `${Math.max(14, Math.round(height * 0.06))}px`,
        color: '#535353',
        align: 'center',
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setName('start-prompt');
    this.allObjects.push(prompt);

    this.tweens.add({
      targets: prompt,
      alpha: { from: 1, to: 0.3 },
      duration: 800,
      yoyo: true,
      repeat: -1,
    });
  }

  private handleResize(w: number, h: number): void {
    this.groundY = h * 0.75;
    this.dinoX = w * 0.12;

    this.groundLine.clear();
    this.groundLine.lineStyle(2, this.isNight ? 0xe0e0e0 : 0x535353);
    this.groundLine.lineBetween(0, this.groundY, w, this.groundY);

    this.ground1.setPosition(w / 2, this.groundY + 7);
    this.ground1.setSize(w, 14);

    if (!this.isGameOver) {
      this.dino.setPosition(this.dinoX, this.dinoState === 'jumping' ? this.dino.y : this.groundY);
    }

    this.scoreText.setPosition(w - 20, 20);
    this.highScoreText.setPosition(w - 20 - this.scoreText.width - 20, 20);
  }

  override update(_time: number, delta: number) {
    if (this.isGameOver) return;

    const dt = delta / 1000;

    this.handleInput();

    if (!this.gameStarted) {
      this.updateDinoAnimation(dt);
      return;
    }

    // Remove start prompt
    const prompt = this.children.getByName('start-prompt');
    if (prompt) prompt.destroy();

    // Update speed
    const scoreHundreds = Math.floor(this.score / 100);
    this.speed = Math.min(INITIAL_SPEED + scoreHundreds * SPEED_INCREMENT, MAX_SPEED);

    // Scroll ground
    this.ground1.tilePositionX += this.speed * dt;

    // Update score
    this.score += this.speed * dt * 0.02;
    this.scoreText.setText(String(Math.floor(this.score)).padStart(5, '0'));

    // Day/night cycle
    this.checkNightToggle();

    // Update dino physics
    this.updateDino(dt);
    this.updateDinoAnimation(dt);

    // Spawn / update obstacles
    this.updateObstacles(dt);

    // Update clouds
    this.updateClouds(dt);

    // Update ptero animation
    this.updatePteroAnimation(dt);

    // Check collisions
    this.checkCollisions();
  }

  private handleInput(): void {
    if (!this.input.keyboard) return;

    const jumpPressed = this.spaceKey?.isDown || this.cursors?.up?.isDown;
    const duckPressed = this.cursors?.down?.isDown;

    if (jumpPressed && !this.gameStarted) {
      this.gameStarted = true;
    }

    if (jumpPressed) {
      this.tryJump();
    }

    if (duckPressed && this.dinoState !== 'dead') {
      if (this.dinoState === 'jumping') {
        this.dinoVy = Math.max(this.dinoVy, 400);
      } else {
        this.dinoState = 'ducking';
      }
    } else if (this.dinoState === 'ducking') {
      this.dinoState = 'running';
    }
  }

  private tryJump(): void {
    if (this.dinoState === 'running' || this.dinoState === 'ducking') {
      this.dinoState = 'jumping';
      this.dinoVy = JUMP_VELOCITY;
    }
  }

  private updateDino(dt: number): void {
    if (this.dinoState === 'jumping') {
      this.dinoVy += GRAVITY * dt;
      const dinoY = this.dino.y + this.dinoVy * dt;

      if (dinoY >= this.groundY) {
        this.dino.setY(this.groundY);
        this.dinoVy = 0;
        this.dinoState = 'running';
      } else {
        this.dino.setY(dinoY);
      }
    }
  }

  private updateDinoAnimation(dt: number): void {
    this.runTimer += dt;

    const animSpeed = 0.1 - (this.speed - INITIAL_SPEED) * 0.00005;
    const clampedSpeed = Math.max(0.05, animSpeed);

    if (this.runTimer >= clampedSpeed) {
      this.runTimer = 0;
      this.runFrame = this.runFrame === 0 ? 1 : 0;
    }

    if (this.dinoState === 'dead') {
      this.dino.setTexture('dino-dead');
    } else if (this.dinoState === 'jumping') {
      this.dino.setTexture('dino-stand');
    } else if (this.dinoState === 'ducking') {
      this.dino.setTexture(this.runFrame === 0 ? 'dino-duck-1' : 'dino-duck-2');
    } else {
      this.dino.setTexture(this.runFrame === 0 ? 'dino-run-1' : 'dino-run-2');
    }
  }

  private updateObstacles(dt: number): void {
    const { width } = this.scale;
    const scrollDist = this.speed * dt;

    // Move obstacles left
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i]!;
      obs.sprite.x -= scrollDist;
      obs.hitbox.x -= scrollDist;

      if (obs.sprite.x < -100) {
        obs.sprite.destroy();
        this.obstacles.splice(i, 1);
      }
    }

    // Spawn new obstacles
    this.lastObstacleX -= scrollDist;
    const gap = Math.max(MIN_OBSTACLE_GAP, 600 - this.speed * 0.3);

    if (this.lastObstacleX < width - gap) {
      this.spawnObstacle(width + 50);
    }
  }

  private spawnObstacle(x: number): void {
    const types: ObstacleType[] = ['cactus-small', 'cactus-large', 'cactus-group'];
    if (this.score > 200) {
      types.push('ptero');
    }

    const type = types[Math.floor(Math.random() * types.length)]!;
    let sprite: Phaser.GameObjects.Image;
    let hitbox: { x: number; y: number; w: number; h: number };

    if (type === 'ptero') {
      const heights = [this.groundY - 40, this.groundY - 70, this.groundY - 100];
      const pteroY = heights[Math.floor(Math.random() * heights.length)]!;

      sprite = this.add.image(x, pteroY, 'ptero-1');
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(8);
      hitbox = {
        x: x - 20,
        y: pteroY - 30,
        w: 40,
        h: 24,
      };
    } else {
      const texKey = type;
      sprite = this.add.image(x, this.groundY, texKey);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(8);

      const dims = this.getObstacleDims(type);
      hitbox = {
        x: x - dims.w / 2,
        y: this.groundY - dims.h,
        w: dims.w,
        h: dims.h,
      };
    }

    this.obstacles.push({ sprite, type, hitbox });
    this.allObjects.push(sprite);
    this.lastObstacleX = x;
  }

  private getObstacleDims(type: ObstacleType): { w: number; h: number } {
    switch (type) {
      case 'cactus-small':
        return { w: 14, h: 34 };
      case 'cactus-large':
        return { w: 22, h: 48 };
      case 'cactus-group':
        return { w: 34, h: 34 };
      case 'ptero':
        return { w: 40, h: 24 };
    }
  }

  private updatePteroAnimation(dt: number): void {
    this.pteroTimer += dt;
    if (this.pteroTimer >= 0.2) {
      this.pteroTimer = 0;
      this.pteroFrame = this.pteroFrame === 0 ? 1 : 0;
    }

    for (const obs of this.obstacles) {
      if (obs.type === 'ptero') {
        obs.sprite.setTexture(this.pteroFrame === 0 ? 'ptero-1' : 'ptero-2');
      }
    }
  }

  private checkCollisions(): void {
    const dh = this.getDinoHitbox();

    for (const obs of this.obstacles) {
      if (this.aabbOverlap(dh, obs.hitbox)) {
        this.gameOver();
        return;
      }
    }
  }

  private getDinoHitbox(): { x: number; y: number; w: number; h: number } {
    if (this.dinoState === 'ducking') {
      return {
        x: this.dinoX - 28,
        y: this.groundY - 22,
        w: 50,
        h: 18,
      };
    }
    return {
      x: this.dinoX - 16,
      y: this.dino.y - 44,
      w: 32,
      h: 42,
    };
  }

  private aabbOverlap(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  private gameOver(): void {
    this.isGameOver = true;
    this.dinoState = 'dead';
    this.updateDinoAnimation(0);

    const finalScore = Math.floor(this.score);
    this.submitScore(finalScore);

    this.scene.launch('GameOver', {
      score: finalScore,
      highScore: Math.max(finalScore, this.highScore),
    });
  }

  private checkNightToggle(): void {
    const expectedToggles = Math.floor(this.score / NIGHT_TOGGLE_SCORE);
    if (expectedToggles > this.nightToggles) {
      this.nightToggles = expectedToggles;
      this.isNight = !this.isNight;
      this.applyTheme();
    }
  }

  private applyTheme(): void {
    const { width } = this.scale;
    if (this.isNight) {
      this.bgColor = 0x1a1a2e;
      this.cameras.main.setBackgroundColor(0x1a1a2e);
      this.scoreText.setColor('#e0e0e0');
      this.highScoreText.setColor('#888');
      this.groundLine.clear();
      this.groundLine.lineStyle(2, 0xe0e0e0);
      this.groundLine.lineBetween(0, this.groundY, width, this.groundY);
      this.ground1.setTint(0xe0e0e0);
      this.dino.setTint(0xe0e0e0);
      this.spawnStars();
    } else {
      this.bgColor = 0xf7f7f7;
      this.cameras.main.setBackgroundColor(0xf7f7f7);
      this.scoreText.setColor('#535353');
      this.highScoreText.setColor('#999');
      this.groundLine.clear();
      this.groundLine.lineStyle(2, 0x535353);
      this.groundLine.lineBetween(0, this.groundY, width, this.groundY);
      this.ground1.clearTint();
      this.dino.clearTint();
      this.removeStars();
    }

    for (const obs of this.obstacles) {
      if (this.isNight) {
        obs.sprite.setTint(0xe0e0e0);
      } else {
        obs.sprite.clearTint();
      }
    }
  }

  private spawnStars(): void {
    const { width } = this.scale;
    for (let i = 0; i < 12; i++) {
      const x = Math.random() * width;
      const y = Math.random() * (this.groundY * 0.6);
      const star = this.add.image(x, y, 'star');
      star.setDepth(1);
      star.setAlpha(0.5 + Math.random() * 0.5);
      this.stars.push(star);
      this.allObjects.push(star);
    }
  }

  private removeStars(): void {
    for (const s of this.stars) s.destroy();
    this.stars = [];
  }

  private spawnCloud(x: number, y: number): void {
    const cloud = this.add.image(x, y, 'cloud');
    cloud.setDepth(2);
    this.clouds.push(cloud);
    this.allObjects.push(cloud);
  }

  private updateClouds(dt: number): void {
    const { width, height } = this.scale;
    const cloudSpeed = this.speed * 0.15;

    for (let i = this.clouds.length - 1; i >= 0; i--) {
      const c = this.clouds[i]!;
      c.x -= cloudSpeed * dt;
      if (c.x < -60) {
        c.destroy();
        this.clouds.splice(i, 1);
      }
    }

    if (this.clouds.length < 4 && Math.random() < 0.005) {
      this.spawnCloud(width + 60, height * (0.1 + Math.random() * 0.25));
    }
  }

  private async fetchHighScore(): Promise<void> {
    try {
      const res = await fetch('/api/stats');
      if (!res.ok) return;
      const data = (await res.json()) as { success: boolean; stats?: { highScore: number } };
      if (data.success && data.stats) {
        this.highScore = data.stats.highScore;
        if (this.highScore > 0) {
          this.highScoreText.setText(`HI ${String(this.highScore).padStart(5, '0')}`);
          this.highScoreText.setX(this.scoreText.x - this.scoreText.width - 20);
        }
      }
    } catch {
      /* offline */
    }
  }

  private async submitScore(finalScore: number): Promise<void> {
    try {
      await fetch('/api/score/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          score: finalScore,
          distance: Math.floor(this.score * 10),
        }),
      });
    } catch {
      /* offline */
    }
  }

  restart(): void {
    this.scene.stop('GameOver');
    this.scene.restart();
  }
}
