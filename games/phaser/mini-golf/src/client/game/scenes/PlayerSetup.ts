import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { HOLES } from '../data/holes';
import {
  PLAYER_COLORS,
  DEFAULT_PLAYER_NAMES,
  type MultiplayerConfig,
  type PlayerInfo,
  type MultiplayerScores,
} from '../../../shared/types/multiplayer';
import { fadeIn, transitionTo, SCENE_COLORS } from '../utils/transitions';

export class PlayerSetup extends Scene {
  private playerCount = 2;
  private playerNames: string[] = [];
  private allObjects: Phaser.GameObjects.GameObject[] = [];
  private inputElements: HTMLInputElement[] = [];

  constructor() {
    super('PlayerSetup');
  }

  private get sf(): number {
    return Math.min(this.scale.width / 500, this.scale.height / 800);
  }

  create() {
    this.cameras.main.setBackgroundColor(0x14381f);
    fadeIn(this, SCENE_COLORS.dark);
    this.allObjects = [];
    this.inputElements = [];
    this.playerNames = DEFAULT_PLAYER_NAMES.slice(0, 4);
    this.playerCount = 2;

    this.buildUI();

    this.scale.on('resize', () => {
      this.destroyAll();
      this.buildUI();
    });

    this.events.on('shutdown', () => {
      this.removeInputElements();
    });
  }

  private destroyAll(): void {
    for (const obj of this.allObjects) obj.destroy();
    this.allObjects = [];
    this.removeInputElements();
  }

  private removeInputElements(): void {
    for (const el of this.inputElements) {
      el.remove();
    }
    this.inputElements = [];
  }

  private buildUI(): void {
    this.removeInputElements();
    const { width, height } = this.scale;
    const cx = width / 2;
    const sf = this.sf;

    const bg = this.add.tileSprite(width / 2, height / 2, width, height, 'grass-bg');
    bg.setDepth(0);
    this.allObjects.push(bg);

    const vig = this.add.image(width / 2, height / 2, 'vignette');
    vig.setDisplaySize(width, height);
    vig.setDepth(1);
    this.allObjects.push(vig);

    const titleFontSize = Math.max(20, Math.round(32 * sf));
    const title = this.add
      .text(cx, height * 0.08, 'LOCAL MULTIPLAYER', {
        fontFamily: '"Arial Black", "Impact", sans-serif',
        fontSize: `${titleFontSize}px`,
        color: '#ff69b4',
        align: 'center',
        stroke: '#8b0a50',
        strokeThickness: Math.max(2, Math.round(2 * sf)),
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.allObjects.push(title);

    const subtitleFontSize = Math.max(10, Math.round(14 * sf));
    const subtitle = this.add
      .text(cx, height * 0.08 + titleFontSize * 0.7, 'Set up your players', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${subtitleFontSize}px`,
        color: '#8fbfa0',
        fontStyle: 'italic',
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.allObjects.push(subtitle);

    this.drawPlayerCountSelector(cx, height * 0.2, width, sf);
    this.drawPlayerList(cx, height * 0.3, width, sf);
    this.drawCourseButtons(cx, height, width, sf);
    this.drawBackButton(cx, height, sf);
  }

  private drawPlayerCountSelector(cx: number, y: number, _w: number, sf: number): void {
    const labelSize = Math.max(12, Math.round(14 * sf));
    const label = this.add
      .text(cx, y, 'PLAYERS', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${labelSize}px`,
        color: '#8fbfa0',
        letterSpacing: Math.round(3 * sf),
      })
      .setOrigin(0.5)
      .setDepth(4);
    this.allObjects.push(label);

    const btnSize = Math.max(36, Math.round(44 * sf));
    const gap = Math.max(12, Math.round(16 * sf));
    const btnY = y + labelSize + Math.round(16 * sf);

    for (let count = 2; count <= 4; count++) {
      const bx = cx + (count - 3) * (btnSize + gap);
      const isActive = count === this.playerCount;

      const container = this.add.container(bx, btnY);
      container.setDepth(10);
      this.allObjects.push(container);

      const bg = this.add.graphics();
      if (isActive) {
        bg.fillStyle(0xff69b4, 0.9);
        bg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 10);
      } else {
        bg.fillStyle(0x0d3320, 0.85);
        bg.fillRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 10);
        bg.lineStyle(2, 0xff69b4, 0.3);
        bg.strokeRoundedRect(-btnSize / 2, -btnSize / 2, btnSize, btnSize, 10);
      }
      container.add(bg);

      const numText = this.add
        .text(0, 0, `${count}`, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: `${Math.max(16, Math.round(20 * sf))}px`,
          color: isActive ? '#ffffff' : '#e0e8f0',
        })
        .setOrigin(0.5);
      container.add(numText);

      const hitArea = this.add
        .rectangle(0, 0, btnSize, btnSize)
        .setInteractive({ useHandCursor: true })
        .setAlpha(0.001);
      container.add(hitArea);

      hitArea.on('pointerdown', () => {
        this.playerCount = count;
        this.destroyAll();
        this.buildUI();
      });
    }
  }

  private drawPlayerList(cx: number, startY: number, w: number, sf: number): void {
    const rowH = Math.max(50, Math.round(60 * sf));
    const nameSize = Math.max(14, Math.round(16 * sf));
    const inputW = Math.min(w * 0.5, 200 * sf);
    const dotR = Math.max(8, Math.round(10 * sf));

    for (let i = 0; i < this.playerCount; i++) {
      const y = startY + i * rowH;
      const color = PLAYER_COLORS[i]!;

      const dot = this.add.graphics();
      dot.fillStyle(color.fill, 1);
      dot.fillCircle(cx - inputW / 2 - dotR - 12, y + rowH / 2, dotR);
      dot.fillStyle(0xffffff, 0.35);
      dot.fillCircle(cx - inputW / 2 - dotR - 12 - dotR * 0.25, y + rowH / 2 - dotR * 0.3, dotR * 0.35);
      dot.setDepth(4);
      this.allObjects.push(dot);

      const input = document.createElement('input');
      input.type = 'text';
      input.value = this.playerNames[i] || DEFAULT_PLAYER_NAMES[i]!;
      input.maxLength = 12;
      input.style.cssText = `
        position: absolute;
        font-family: "Arial Black", sans-serif;
        font-size: ${nameSize}px;
        color: ${color.hex};
        background: rgba(13, 51, 32, 0.9);
        border: 2px solid ${color.hex}44;
        border-radius: 8px;
        padding: 6px 12px;
        width: ${inputW}px;
        outline: none;
        text-align: center;
      `;

      input.addEventListener('focus', () => {
        input.style.borderColor = color.hex;
        if (input.value === DEFAULT_PLAYER_NAMES[i]) {
          input.value = '';
        }
      });

      input.addEventListener('blur', () => {
        input.style.borderColor = `${color.hex}44`;
        if (!input.value.trim()) {
          input.value = DEFAULT_PLAYER_NAMES[i]!;
        }
        this.playerNames[i] = input.value.trim();
      });

      input.addEventListener('input', () => {
        this.playerNames[i] = input.value.trim() || DEFAULT_PLAYER_NAMES[i]!;
      });

      const canvas = this.game.canvas;
      const canvasRect = canvas.getBoundingClientRect();
      const scaleX = canvasRect.width / canvas.width;
      const scaleY = canvasRect.height / canvas.height;

      const inputLeft = (cx - inputW / 2) * scaleX + canvasRect.left;
      const inputTop = (y + rowH / 2 - nameSize) * scaleY + canvasRect.top;
      input.style.left = `${inputLeft}px`;
      input.style.top = `${inputTop}px`;
      input.style.width = `${inputW * scaleX}px`;
      input.style.fontSize = `${nameSize * scaleY}px`;

      document.body.appendChild(input);
      this.inputElements.push(input);
    }
  }

  private drawCourseButtons(cx: number, h: number, w: number, sf: number): void {
    const btnW = Math.min(w * 0.75, 300 * sf);
    const btnH = Math.max(38, Math.round(44 * sf));
    const gap = Math.max(8, Math.round(12 * sf));
    const labelSize = Math.max(13, Math.round(16 * sf));
    let curY = h * 0.62;

    const sectionLabel = this.add
      .text(cx, curY, 'SELECT COURSE', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.max(10, Math.round(13 * sf))}px`,
        color: '#8fbfa0',
        letterSpacing: Math.round(4 * sf),
      })
      .setOrigin(0.5)
      .setDepth(11);
    this.allObjects.push(sectionLabel);
    curY += Math.round(24 * sf);

    const courses: { label: string; start: number; end: number; color: number }[] = [
      { label: 'FULL 18', start: 0, end: HOLES.length - 1, color: 0xff69b4 },
    ];
    if (HOLES.length > 9) {
      courses.push({ label: 'FRONT 9', start: 0, end: 8, color: 0x32cd32 });
      courses.push({ label: 'BACK 9', start: 9, end: Math.min(17, HOLES.length - 1), color: 0x00ced1 });
    }

    for (const course of courses) {
      this.addCourseButton(cx, curY, btnW, btnH, course.label, labelSize, course.color, () => {
        this.startMultiplayerGame(course.start, course.end);
      });
      curY += btnH + gap;
    }
  }

  private addCourseButton(
    cx: number,
    y: number,
    w: number,
    h: number,
    label: string,
    fontSize: number,
    color: number,
    onClick: () => void
  ): void {
    const container = this.add.container(cx, y + h / 2);
    container.setDepth(11);
    this.allObjects.push(container);

    const bg = this.add.graphics();
    bg.fillStyle(0x0d3320, 0.85);
    bg.fillRoundedRect(-w / 2, -h / 2, w, h, 12);
    bg.lineStyle(2, color, 0.4);
    bg.strokeRoundedRect(-w / 2, -h / 2, w, h, 12);
    container.add(bg);

    const text = this.add
      .text(0, 0, label, {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#e0e8f0',
      })
      .setOrigin(0.5);
    container.add(text);

    const hitArea = this.add
      .rectangle(0, 0, w, h)
      .setInteractive({ useHandCursor: true })
      .setAlpha(0.001);
    container.add(hitArea);

    hitArea.on('pointerover', () => {
      this.tweens.add({ targets: container, scaleX: 1.03, scaleY: 1.03, duration: 120, ease: 'Power2' });
    });
    hitArea.on('pointerout', () => {
      this.tweens.add({ targets: container, scaleX: 1, scaleY: 1, duration: 120, ease: 'Power2' });
    });
    hitArea.on('pointerdown', () => {
      this.tweens.add({
        targets: container,
        scaleX: 0.96,
        scaleY: 0.96,
        duration: 80,
        yoyo: true,
        ease: 'Power2',
        onComplete: onClick,
      });
    });
  }

  private drawBackButton(cx: number, h: number, sf: number): void {
    const btnY = h * 0.92;
    const fontSize = Math.max(12, Math.round(14 * sf));

    const backText = this.add
      .text(cx, btnY, '← BACK TO MENU', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${fontSize}px`,
        color: '#8fbfa0',
      })
      .setOrigin(0.5)
      .setDepth(11)
      .setInteractive({ useHandCursor: true });
    this.allObjects.push(backText);

    backText.on('pointerover', () => backText.setColor('#ffffff'));
    backText.on('pointerout', () => backText.setColor('#8fbfa0'));
    backText.on('pointerdown', () => {
      this.removeInputElements();
      transitionTo(this, 'MainMenu', undefined, SCENE_COLORS.dark);
    });
  }

  private startMultiplayerGame(startIdx: number, endIdx: number): void {
    for (let i = 0; i < this.inputElements.length; i++) {
      const val = this.inputElements[i]?.value?.trim();
      if (val) this.playerNames[i] = val;
    }

    const players: PlayerInfo[] = [];
    for (let i = 0; i < this.playerCount; i++) {
      const c = PLAYER_COLORS[i]!;
      players.push({
        id: i,
        name: this.playerNames[i] || DEFAULT_PLAYER_NAMES[i]!,
        color: c.fill,
        colorHex: c.hex,
      });
    }

    const config: MultiplayerConfig = { players };

    const scores: MultiplayerScores = {};
    for (const p of players) scores[p.id] = [];

    this.removeInputElements();
    transitionTo(
      this,
      'Game',
      {
        holeIndex: startIdx,
        endHoleIndex: endIdx,
        startHoleIndex: startIdx,
        scores: [],
        multiplayer: config,
        multiplayerScores: scores,
        currentPlayerIndex: 0,
      },
      SCENE_COLORS.dark
    );
  }
}
