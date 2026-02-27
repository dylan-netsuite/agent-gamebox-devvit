import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { SoundManager } from '../systems/SoundManager';

export class LocalSetup extends Scene {
  private playerNames: string[] = ['Player 1', 'Player 2'];
  private nameInputs: HTMLInputElement[] = [];
  private inputContainer: HTMLDivElement | null = null;
  private countLabel!: Phaser.GameObjects.Text;

  constructor() {
    super('LocalSetup');
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.playerNames = ['Player 1', 'Player 2'];
    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.cameras.main.setAlpha(0);
    this.tweens.add({ targets: this.cameras.main, alpha: 1, duration: 300, ease: 'Sine.easeOut' });

    this.add
      .text(cx, 20, 'LOCAL MULTIPLAYER', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '22px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.add
      .text(cx, 48, 'Pass & play on the same device', {
        fontFamily: 'monospace',
        fontSize: '10px',
        color: '#8899aa',
      })
      .setOrigin(0.5);

    const panelW = Math.min(width - 32, 360);

    this.countLabel = this.add
      .text(cx, 72, `Players: ${this.playerNames.length}`, {
        fontFamily: 'monospace',
        fontSize: '12px',
        fontStyle: 'bold',
        color: '#3498db',
      })
      .setOrigin(0.5);

    const btnSize = 32;
    const minusBg = this.add.graphics();
    minusBg.fillStyle(0xe74c3c, 1);
    minusBg.fillRoundedRect(cx - panelW / 2, 62, btnSize, btnSize, 6);

    this.add
      .text(cx - panelW / 2 + btnSize / 2, 62 + btnSize / 2, '−', {
        fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .zone(cx - panelW / 2 + btnSize / 2, 62 + btnSize / 2, btnSize, btnSize)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.removePlayer());

    const plusBg = this.add.graphics();
    plusBg.fillStyle(0x2ecc71, 1);
    plusBg.fillRoundedRect(cx + panelW / 2 - btnSize, 62, btnSize, btnSize, 6);

    this.add
      .text(cx + panelW / 2 - btnSize / 2, 62 + btnSize / 2, '+', {
        fontFamily: 'monospace', fontSize: '18px', fontStyle: 'bold', color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .zone(cx + panelW / 2 - btnSize / 2, 62 + btnSize / 2, btnSize, btnSize)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.addPlayer());

    this.createDOMInputs();

    const startBtnY = height - 70;
    const startBtnW = 200;
    const startBtnH = 44;
    const startBg = this.add.graphics();
    startBg.fillStyle(0x2ecc71, 1);
    startBg.fillRoundedRect(cx - startBtnW / 2, startBtnY, startBtnW, startBtnH, 10);

    this.add
      .text(cx, startBtnY + startBtnH / 2, 'START GAME', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    this.add
      .zone(cx, startBtnY + startBtnH / 2, startBtnW, startBtnH)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        SoundManager.play('select');
        this.startLocalGame();
      });

    this.add
      .text(cx, height - 16, '[ ESC — Back ]', {
        fontFamily: 'monospace', fontSize: '10px', color: '#666688',
      })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        SoundManager.play('select');
        this.cleanupDOM();
        this.scene.start('ModeSelect');
      });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ESC', () => {
        SoundManager.play('select');
        this.cleanupDOM();
        this.scene.start('ModeSelect');
      });
    }
  }

  private createDOMInputs(): void {
    this.cleanupDOM();

    const gameContainer = document.getElementById('game-container');
    if (!gameContainer) return;

    this.inputContainer = document.createElement('div');
    this.inputContainer.className = 'local-setup-inputs';
    gameContainer.appendChild(this.inputContainer);

    const { width, height } = this.scale;
    const canvas = gameContainer.querySelector('canvas');
    const scaleX = canvas ? canvas.clientWidth / width : 1;
    const scaleY = canvas ? canvas.clientHeight / height : 1;

    const inputW = Math.min(width - 80, 280);
    const cx = width / 2;
    const startY = 102;
    const rowH = 44;

    this.nameInputs = [];

    for (let i = 0; i < this.playerNames.length; i++) {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = this.playerNames[i]!;
      input.maxLength = 16;
      input.placeholder = `Player ${i + 1}`;
      input.autocomplete = 'off';
      input.className = 'scatter-input';

      const left = (cx - inputW / 2) * scaleX;
      const top = (startY + i * rowH) * scaleY;

      input.style.position = 'absolute';
      input.style.left = `${left}px`;
      input.style.top = `${top}px`;
      input.style.width = `${inputW * scaleX}px`;
      input.style.height = `${34 * scaleY}px`;
      input.style.fontSize = `${14 * scaleY}px`;
      input.style.pointerEvents = 'auto';

      const idx = i;
      input.addEventListener('input', () => {
        this.playerNames[idx] = input.value || `Player ${idx + 1}`;
      });

      this.inputContainer.appendChild(input);
      this.nameInputs.push(input);
    }
  }

  private addPlayer(): void {
    if (this.playerNames.length >= 6) return;
    SoundManager.play('select');
    this.playerNames.push(`Player ${this.playerNames.length + 1}`);
    this.countLabel.setText(`Players: ${this.playerNames.length}`);
    this.createDOMInputs();
  }

  private removePlayer(): void {
    if (this.playerNames.length <= 2) return;
    SoundManager.play('select');
    this.playerNames.pop();
    this.countLabel.setText(`Players: ${this.playerNames.length}`);
    this.createDOMInputs();
  }

  private startLocalGame(): void {
    for (let i = 0; i < this.nameInputs.length; i++) {
      this.playerNames[i] = this.nameInputs[i]!.value || `Player ${i + 1}`;
    }
    this.cleanupDOM();
    this.scene.start('GamePlay', {
      mode: 'local',
      localPlayers: this.playerNames.slice(),
    });
  }

  private cleanupDOM(): void {
    if (this.inputContainer) {
      this.inputContainer.remove();
      this.inputContainer = null;
    }
    this.nameInputs = [];
  }

  shutdown(): void {
    this.cleanupDOM();
  }
}
