import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { TEAM_COLORS } from '../../../shared/types/game';
import { MAP_PRESETS } from '../../../shared/types/maps';
import { SoundManager } from '../systems/SoundManager';

export interface GameConfig {
  numTeams: number;
  wormsPerTeam: number;
  teamCharacters?: string[];
  aiTeams?: number[];
  mapId?: string;
  turnTimer?: number;
}

const TEAM_NAMES = ['Red', 'Blue', 'Yellow', 'Purple'];

const TIMER_PRESETS = [
  { value: 15, label: '15s', desc: 'Blitz' },
  { value: 30, label: '30s', desc: 'Quick' },
  { value: 45, label: '45s', desc: 'Normal' },
  { value: 60, label: '60s', desc: 'Relaxed' },
  { value: 0, label: '∞', desc: 'Unlimited' },
];
const DEFAULT_TIMER_INDEX = 2; // 45s Normal

export class GameSetup extends Scene {
  private numTeams = 2;
  private wormsPerTeam = 2;
  private vsCPU = false;
  private mapIndex = 0;
  private timerIndex = DEFAULT_TIMER_INDEX;

  private teamCountText!: Phaser.GameObjects.Text;
  private wormCountText!: Phaser.GameObjects.Text;
  private teamPreview!: Phaser.GameObjects.Container;
  private mapNameText!: Phaser.GameObjects.Text;
  private mapDescText!: Phaser.GameObjects.Text;
  private timerValueText!: Phaser.GameObjects.Text;
  private timerDescText!: Phaser.GameObjects.Text;
  private cpuToggleBg!: Phaser.GameObjects.Graphics;
  private cpuToggleText!: Phaser.GameObjects.Text;
  private soundToggleBg!: Phaser.GameObjects.Graphics;
  private soundToggleText!: Phaser.GameObjects.Text;

  constructor() {
    super('GameSetup');
  }

  create() {
    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor('#1a1a2e');

    this.add
      .text(cx, 28, '🪱 WORMS', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '32px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    this.add
      .text(cx, 60, 'GAME SETUP', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#00e5ff',
        letterSpacing: 4,
      })
      .setOrigin(0.5);

    const panelY = 80;
    const panelW = Math.min(width - 24, 400);
    const panelX = cx - panelW / 2;

    const panelH = 320;
    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x16213e, 0.9);
    panelBg.fillRoundedRect(panelX, panelY, panelW, panelH, 12);
    panelBg.lineStyle(1, 0x2a3a5a, 0.6);
    panelBg.strokeRoundedRect(panelX, panelY, panelW, panelH, 12);

    const rowH = 40;
    const rowY1 = panelY + 16;
    const rowY2 = rowY1 + rowH + 4;
    const rowY3 = rowY2 + rowH + 4;
    const rowY4 = rowY3 + rowH + 4;
    const rowY5 = rowY4 + rowH + 10;

    // Teams row
    this.buildRow(cx, rowY1, panelW, 'TEAMS', 2, 4, this.numTeams, (val) => {
      this.numTeams = val;
      this.updateDisplay();
    });

    // Worms per team row
    this.buildRow(cx, rowY2, panelW, 'WORMS PER TEAM', 1, 3, this.wormsPerTeam, (val) => {
      this.wormsPerTeam = val;
      this.updateDisplay();
    });

    // Map selection row
    this.buildMapRow(cx, rowY3, panelW);

    // Timer selection row
    this.buildTimerRow(cx, rowY4, panelW);

    // VS CPU toggle
    this.buildCPUToggle(cx, rowY5, panelW);

    // Sound toggle
    this.buildSoundToggle(cx, rowY5 + 36, panelW);

    // Team preview dots
    this.teamPreview = this.add.container(cx, panelY + panelH - 28);
    this.updateTeamPreview();

    // Start button
    const btnY = panelY + panelH + 10;
    const btnW = 180;
    const btnH = 44;
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xe94560, 1);
    btnBg.fillRoundedRect(cx - btnW / 2, btnY, btnW, btnH, 10);

    this.add
      .text(cx, btnY + btnH / 2, '⚔ START BATTLE', {
        fontFamily: 'Segoe UI, system-ui, sans-serif',
        fontSize: '15px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const btnZone = this.add
      .zone(cx, btnY + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true });

    btnZone.on('pointerover', () => {
      btnBg.clear();
      btnBg.fillStyle(0xff6b81, 1);
      btnBg.fillRoundedRect(cx - btnW / 2, btnY, btnW, btnH, 10);
    });
    btnZone.on('pointerout', () => {
      btnBg.clear();
      btnBg.fillStyle(0xe94560, 1);
      btnBg.fillRoundedRect(cx - btnW / 2, btnY, btnW, btnH, 10);
    });
    btnZone.on('pointerdown', () => {
      SoundManager.play('select');
      this.startGame();
    });

    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-ENTER', () => {
        SoundManager.play('select');
        this.startGame();
      });
    }

    const totalWorms = this.numTeams * this.wormsPerTeam;
    this.add
      .text(cx, height - 12, `${totalWorms} worms • Destructible Terrain • Turn-Based`, {
        fontFamily: 'monospace',
        fontSize: '9px',
        color: '#555577',
      })
      .setOrigin(0.5);
  }

  private buildRow(
    cx: number,
    y: number,
    panelW: number,
    label: string,
    min: number,
    max: number,
    initial: number,
    onChange: (val: number) => void,
  ): void {
    const labelX = cx - panelW / 2 + 20;

    this.add.text(labelX, y, label, {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#8899aa',
      letterSpacing: 1,
    });

    const controlX = cx + panelW / 2 - 20;
    const btnSize = 28;

    const minusBg = this.add.graphics();
    minusBg.fillStyle(0x2a3a5a, 1);
    minusBg.fillRoundedRect(controlX - 100, y - 2, btnSize, btnSize, 6);

    const minusText = this.add
      .text(controlX - 100 + btnSize / 2, y - 2 + btnSize / 2, '−', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const minusZone = this.add
      .zone(controlX - 100 + btnSize / 2, y - 2 + btnSize / 2, btnSize, btnSize)
      .setInteractive({ useHandCursor: true });

    const valueText = this.add
      .text(controlX - 50, y - 2 + btnSize / 2, `${initial}`, {
        fontSize: '18px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const plusBg = this.add.graphics();
    plusBg.fillStyle(0x2a3a5a, 1);
    plusBg.fillRoundedRect(controlX - 20, y - 2, btnSize, btnSize, 6);

    const plusText = this.add
      .text(controlX - 20 + btnSize / 2, y - 2 + btnSize / 2, '+', {
        fontSize: '16px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const plusZone = this.add
      .zone(controlX - 20 + btnSize / 2, y - 2 + btnSize / 2, btnSize, btnSize)
      .setInteractive({ useHandCursor: true });

    let value = initial;

    const updateBtns = () => {
      minusText.setColor(value > min ? '#ffffff' : '#444466');
      plusText.setColor(value < max ? '#ffffff' : '#444466');
    };
    updateBtns();

    minusZone.on('pointerdown', () => {
      if (value > min) {
        value--;
        valueText.setText(`${value}`);
        SoundManager.play('select');
        onChange(value);
        updateBtns();
      }
    });

    plusZone.on('pointerdown', () => {
      if (value < max) {
        value++;
        valueText.setText(`${value}`);
        SoundManager.play('select');
        onChange(value);
        updateBtns();
      }
    });

    if (label === 'TEAMS') {
      this.teamCountText = valueText;
    } else {
      this.wormCountText = valueText;
    }
  }

  private buildMapRow(cx: number, y: number, panelW: number): void {
    const labelX = cx - panelW / 2 + 20;
    this.add.text(labelX, y, 'MAP', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#8899aa',
      letterSpacing: 1,
    });

    const controlX = cx + panelW / 2 - 20;
    const btnSize = 28;

    const leftBg = this.add.graphics();
    leftBg.fillStyle(0x2a3a5a, 1);
    leftBg.fillRoundedRect(controlX - 160, y - 2, btnSize, btnSize, 6);

    this.add
      .text(controlX - 160 + btnSize / 2, y - 2 + btnSize / 2, '◀', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const leftZone = this.add
      .zone(controlX - 160 + btnSize / 2, y - 2 + btnSize / 2, btnSize, btnSize)
      .setInteractive({ useHandCursor: true });

    this.mapNameText = this.add
      .text(controlX - 80, y - 2 + btnSize / 2, MAP_PRESETS[0]!.name, {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const rightBg = this.add.graphics();
    rightBg.fillStyle(0x2a3a5a, 1);
    rightBg.fillRoundedRect(controlX - 20, y - 2, btnSize, btnSize, 6);

    this.add
      .text(controlX - 20 + btnSize / 2, y - 2 + btnSize / 2, '▶', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const rightZone = this.add
      .zone(controlX - 20 + btnSize / 2, y - 2 + btnSize / 2, btnSize, btnSize)
      .setInteractive({ useHandCursor: true });

    this.mapDescText = this.add
      .text(cx, y + btnSize + 4, MAP_PRESETS[0]!.description, {
        fontSize: '8px',
        color: '#6e7681',
        fontFamily: 'monospace',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    leftZone.on('pointerdown', () => {
      this.mapIndex = (this.mapIndex - 1 + MAP_PRESETS.length) % MAP_PRESETS.length;
      SoundManager.play('select');
      this.updateMapDisplay();
    });

    rightZone.on('pointerdown', () => {
      this.mapIndex = (this.mapIndex + 1) % MAP_PRESETS.length;
      SoundManager.play('select');
      this.updateMapDisplay();
    });
  }

  private updateMapDisplay(): void {
    const map = MAP_PRESETS[this.mapIndex]!;
    this.mapNameText.setText(map.name);
    this.mapDescText.setText(map.description);
  }

  private buildTimerRow(cx: number, y: number, panelW: number): void {
    const labelX = cx - panelW / 2 + 20;
    this.add.text(labelX, y, 'TIMER', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#8899aa',
      letterSpacing: 1,
    });

    const controlX = cx + panelW / 2 - 20;
    const btnSize = 28;

    const leftBg = this.add.graphics();
    leftBg.fillStyle(0x2a3a5a, 1);
    leftBg.fillRoundedRect(controlX - 160, y - 2, btnSize, btnSize, 6);

    this.add
      .text(controlX - 160 + btnSize / 2, y - 2 + btnSize / 2, '◀', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const leftZone = this.add
      .zone(controlX - 160 + btnSize / 2, y - 2 + btnSize / 2, btnSize, btnSize)
      .setInteractive({ useHandCursor: true });

    this.timerValueText = this.add
      .text(controlX - 80, y - 2 + btnSize / 2, '', {
        fontSize: '12px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    const rightBg = this.add.graphics();
    rightBg.fillStyle(0x2a3a5a, 1);
    rightBg.fillRoundedRect(controlX - 20, y - 2, btnSize, btnSize, 6);

    this.add
      .text(controlX - 20 + btnSize / 2, y - 2 + btnSize / 2, '▶', {
        fontSize: '14px',
        color: '#ffffff',
        fontFamily: 'monospace',
      })
      .setOrigin(0.5);

    const rightZone = this.add
      .zone(controlX - 20 + btnSize / 2, y - 2 + btnSize / 2, btnSize, btnSize)
      .setInteractive({ useHandCursor: true });

    this.timerDescText = this.add
      .text(cx, y + btnSize + 4, '', {
        fontSize: '8px',
        color: '#6e7681',
        fontFamily: 'monospace',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    leftZone.on('pointerdown', () => {
      this.timerIndex = (this.timerIndex - 1 + TIMER_PRESETS.length) % TIMER_PRESETS.length;
      SoundManager.play('select');
      this.updateTimerDisplay();
    });

    rightZone.on('pointerdown', () => {
      this.timerIndex = (this.timerIndex + 1) % TIMER_PRESETS.length;
      SoundManager.play('select');
      this.updateTimerDisplay();
    });

    this.updateTimerDisplay();
  }

  private updateTimerDisplay(): void {
    const preset = TIMER_PRESETS[this.timerIndex]!;
    this.timerValueText.setText(preset.label);
    this.timerDescText.setText(preset.desc);
  }

  private buildCPUToggle(cx: number, y: number, panelW: number): void {
    const labelX = cx - panelW / 2 + 20;
    this.add.text(labelX, y + 4, 'VS CPU', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#8899aa',
      letterSpacing: 1,
    });

    const controlX = cx + panelW / 2 - 60;
    const toggleW = 48;
    const toggleH = 22;

    this.cpuToggleBg = this.add.graphics();
    this.cpuToggleText = this.add
      .text(controlX + toggleW / 2, y + 4 + toggleH / 2, 'OFF', {
        fontSize: '10px',
        color: '#888888',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.drawCPUToggle(controlX, y + 4, toggleW, toggleH);

    const zone = this.add
      .zone(controlX + toggleW / 2, y + 4 + toggleH / 2, toggleW, toggleH)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerdown', () => {
      this.vsCPU = !this.vsCPU;
      SoundManager.play('select');
      this.drawCPUToggle(controlX, y + 4, toggleW, toggleH);
    });
  }

  private drawCPUToggle(x: number, y: number, w: number, h: number): void {
    this.cpuToggleBg.clear();
    if (this.vsCPU) {
      this.cpuToggleBg.fillStyle(0x3fb950, 0.9);
      this.cpuToggleBg.fillRoundedRect(x, y, w, h, 6);
      this.cpuToggleText.setText('ON');
      this.cpuToggleText.setColor('#ffffff');
    } else {
      this.cpuToggleBg.fillStyle(0x2a3a5a, 0.9);
      this.cpuToggleBg.fillRoundedRect(x, y, w, h, 6);
      this.cpuToggleText.setText('OFF');
      this.cpuToggleText.setColor('#888888');
    }
  }

  private buildSoundToggle(cx: number, y: number, panelW: number): void {
    const labelX = cx - panelW / 2 + 20;
    this.add.text(labelX, y + 4, 'SOUND', {
      fontFamily: 'monospace',
      fontSize: '10px',
      fontStyle: 'bold',
      color: '#8899aa',
      letterSpacing: 1,
    });

    const controlX = cx + panelW / 2 - 60;
    const toggleW = 48;
    const toggleH = 22;

    this.soundToggleBg = this.add.graphics();
    this.soundToggleText = this.add
      .text(controlX + toggleW / 2, y + 4 + toggleH / 2, 'ON', {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'monospace',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);

    this.drawSoundToggle(controlX, y + 4, toggleW, toggleH);

    const zone = this.add
      .zone(controlX + toggleW / 2, y + 4 + toggleH / 2, toggleW, toggleH)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerdown', () => {
      SoundManager.mute(!SoundManager.isMuted());
      SoundManager.play('select');
      this.drawSoundToggle(controlX, y + 4, toggleW, toggleH);
    });
  }

  private drawSoundToggle(x: number, y: number, w: number, h: number): void {
    this.soundToggleBg.clear();
    if (!SoundManager.isMuted()) {
      this.soundToggleBg.fillStyle(0x3fb950, 0.9);
      this.soundToggleBg.fillRoundedRect(x, y, w, h, 6);
      this.soundToggleText.setText('ON');
      this.soundToggleText.setColor('#ffffff');
    } else {
      this.soundToggleBg.fillStyle(0x2a3a5a, 0.9);
      this.soundToggleBg.fillRoundedRect(x, y, w, h, 6);
      this.soundToggleText.setText('OFF');
      this.soundToggleText.setColor('#888888');
    }
  }

  private updateDisplay(): void {
    this.updateTeamPreview();
  }

  private updateTeamPreview(): void {
    this.teamPreview.removeAll(true);

    const totalW = this.numTeams * 70;
    let x = -totalW / 2 + 35;

    for (let t = 0; t < this.numTeams; t++) {
      const colorStr = TEAM_COLORS[t % TEAM_COLORS.length]!;
      const color = parseInt(colorStr.replace('#', ''), 16);

      const dot = this.add.graphics();
      dot.fillStyle(color, 1);
      dot.fillCircle(0, 0, 8);
      dot.setPosition(x, 0);
      this.teamPreview.add(dot);

      const name = this.add
        .text(x, 14, TEAM_NAMES[t]!, {
          fontSize: '9px',
          color: colorStr,
          fontFamily: 'monospace',
          fontStyle: 'bold',
        })
        .setOrigin(0.5, 0);
      this.teamPreview.add(name);

      const wormIcons = '🪱'.repeat(this.wormsPerTeam);
      const icons = this.add
        .text(x, -16, wormIcons, { fontSize: '8px' })
        .setOrigin(0.5, 1);
      this.teamPreview.add(icons);

      // CPU label
      if (this.vsCPU && t > 0) {
        const cpuLabel = this.add
          .text(x, 26, '🤖 CPU', {
            fontSize: '7px',
            color: '#ff8844',
            fontFamily: 'monospace',
            fontStyle: 'bold',
          })
          .setOrigin(0.5, 0);
        this.teamPreview.add(cpuLabel);
      }

      x += 70;
    }
  }

  private startGame(): void {
    const aiTeams: number[] = [];
    if (this.vsCPU) {
      for (let t = 1; t < this.numTeams; t++) {
        aiTeams.push(t);
      }
    }

    this.scene.start('CharacterSelect', {
      numTeams: this.numTeams,
      wormsPerTeam: this.wormsPerTeam,
      aiTeams,
      mapId: MAP_PRESETS[this.mapIndex]!.id,
      turnTimer: TIMER_PRESETS[this.timerIndex]!.value,
    } satisfies GameConfig);
  }
}
