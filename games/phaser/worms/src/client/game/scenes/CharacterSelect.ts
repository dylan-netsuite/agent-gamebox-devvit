import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { CHARACTERS } from '../../../shared/types/characters';
import { TEAM_COLORS } from '../../../shared/types/game';
import type { GameConfig } from './GameSetup';
import { SoundManager } from '../systems/SoundManager';

const TEAM_LABELS = ['Red', 'Blue', 'Yellow', 'Purple'];
const COLS = 3;
const ROWS = 2;

export class CharacterSelect extends Scene {
  private config!: GameConfig;
  private teamSelections: number[] = [];
  private activeTeam = 0;
  private selectedIndex = 0;

  private panels: {
    container: Phaser.GameObjects.Container;
    image: Phaser.GameObjects.Image;
    border: Phaser.GameObjects.Graphics;
    nameText: Phaser.GameObjects.Text;
    overlay: Phaser.GameObjects.Graphics;
  }[] = [];

  private teamLabel!: Phaser.GameObjects.Text;
  private teamDots: Phaser.GameObjects.Graphics[] = [];
  private taglineText!: Phaser.GameObjects.Text;

  constructor() {
    super('CharacterSelect');
  }

  create(data: GameConfig) {
    this.config = data;
    this.teamSelections = new Array(data.numTeams).fill(0);
    this.activeTeam = 0;
    this.selectedIndex = 0;
    this.panels = [];

    const { width, height } = this.scale;
    const cx = width / 2;

    this.cameras.main.setBackgroundColor('#0a0a1a');

    // Title
    this.add
      .text(cx, 22, 'CHOOSE YOUR FIGHTER', {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: '14px',
        fontStyle: 'bold',
        color: '#ffffff',
        letterSpacing: 3,
      })
      .setOrigin(0.5)
      .setShadow(2, 2, '#000000', 4);

    // Team indicator
    this.teamLabel = this.add
      .text(cx, 44, '', {
        fontFamily: 'monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    // Team dots
    this.buildTeamDots(cx, 60);

    // Build the 3x2 portrait grid — tight gaps, wide portraits
    const gridTop = 72;
    const gridBottom = height - 76;
    const gridH = gridBottom - gridTop;
    const gap = 3;
    const panelW = Math.floor((width - gap * (COLS - 1)) / COLS);
    const panelH = Math.floor((gridH - gap * (ROWS - 1)) / ROWS);
    const gridLeft = (width - (panelW * COLS + gap * (COLS - 1))) / 2;

    for (let i = 0; i < CHARACTERS.length && i < COLS * ROWS; i++) {
      const char = CHARACTERS[i]!;
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      const px = gridLeft + col * (panelW + gap) + panelW / 2;
      const py = gridTop + row * (panelH + gap) + panelH / 2;

      const container = this.add.container(px, py);

      // Portrait image — fill the panel, leaving only room for the name
      const imgW = panelW - 2;
      const imgH = panelH - 14;
      const image = this.add.image(0, -7, char.portrait);
      image.setDisplaySize(imgW, imgH);

      // Dark overlay for deselected state
      const overlay = this.add.graphics();
      overlay.setDepth(2);

      // Border glow
      const border = this.add.graphics();
      border.setDepth(3);

      // Character name below portrait
      const nameText = this.add
        .text(0, panelH / 2 - 10, char.name, {
          fontFamily: '"Press Start 2P", "Courier New", monospace',
          fontSize: '7px',
          color: '#ffffff',
          align: 'center',
        })
        .setOrigin(0.5)
        .setDepth(4);

      container.add([image, overlay, border, nameText]);

      // Click to select
      const hitZone = this.add
        .zone(px, py, panelW + gap, panelH + gap)
        .setInteractive({ useHandCursor: true })
        .setDepth(5);

      hitZone.on('pointerdown', () => {
        this.selectedIndex = i;
        this.teamSelections[this.activeTeam] = i;
        this.updatePanels();
      });

      this.panels.push({ container, image, border, nameText, overlay });
    }

    // Tagline text (below grid)
    this.taglineText = this.add
      .text(cx, gridBottom + 6, '', {
        fontFamily: 'monospace',
        fontSize: '10px',
        fontStyle: 'italic',
        color: '#88aacc',
      })
      .setOrigin(0.5)
      .setDepth(10);

    // LOCK IN button
    const btnY = height - 52;
    this.buildActionButton(cx, btnY, 'LOCK IN', 0xe94560, () => this.lockIn());

    // Footer
    this.add
      .text(cx, height - 12, '← → ↑ ↓ Navigate  •  ENTER Lock In  •  ESC Back', {
        fontFamily: 'monospace',
        fontSize: '8px',
        color: '#334455',
      })
      .setOrigin(0.5);

    // Keyboard controls
    if (this.input.keyboard) {
      this.input.keyboard.on('keydown-LEFT', () => this.moveSelection(-1, 0));
      this.input.keyboard.on('keydown-RIGHT', () => this.moveSelection(1, 0));
      this.input.keyboard.on('keydown-UP', () => this.moveSelection(0, -1));
      this.input.keyboard.on('keydown-DOWN', () => this.moveSelection(0, 1));
      this.input.keyboard.on('keydown-ENTER', () => this.lockIn());
      this.input.keyboard.on('keydown-ESC', () => this.scene.start('GameSetup'));
    }

    this.updatePanels();
  }

  private isAITeam(team: number): boolean {
    return (this.config.aiTeams ?? []).includes(team);
  }

  private moveSelection(dx: number, dy: number): void {
    const col = this.selectedIndex % COLS;
    const row = Math.floor(this.selectedIndex / COLS);
    let newCol = col + dx;
    let newRow = row + dy;

    if (newCol < 0) newCol = COLS - 1;
    if (newCol >= COLS) newCol = 0;
    if (newRow < 0) newRow = ROWS - 1;
    if (newRow >= ROWS) newRow = 0;

    const newIdx = newRow * COLS + newCol;
    if (newIdx < CHARACTERS.length) {
      SoundManager.play('select');
      this.selectedIndex = newIdx;
      this.teamSelections[this.activeTeam] = newIdx;
      this.updatePanels();
    }
  }

  private updatePanels(): void {
    const teamColorStr = TEAM_COLORS[this.activeTeam % TEAM_COLORS.length]!;
    const teamColor = parseInt(teamColorStr.replace('#', ''), 16);

    this.teamLabel.setText(`Team ${TEAM_LABELS[this.activeTeam]} — Pick a character`);
    this.teamLabel.setColor(teamColorStr);

    const char = CHARACTERS[this.selectedIndex]!;
    this.taglineText.setText(`"${char.tagline}"`);

    const { width, height } = this.scale;
    const gridTop = 72;
    const gridBottom = height - 76;
    const gridH = gridBottom - gridTop;
    const gap = 3;
    const panelW = Math.floor((width - gap * (COLS - 1)) / COLS);
    const panelH = Math.floor((gridH - gap * (ROWS - 1)) / ROWS);
    const imgW = panelW - 2;
    const imgH = panelH - 14;
    const halfW = imgW / 2;
    const halfH = imgH / 2;

    for (let i = 0; i < this.panels.length; i++) {
      const panel = this.panels[i]!;
      const isSelected = i === this.selectedIndex;

      // Overlay: light darken on unselected so art is still clearly visible
      panel.overlay.clear();
      if (!isSelected) {
        panel.overlay.fillStyle(0x000000, 0.25);
        panel.overlay.fillRect(-halfW, -halfH - 7, imgW, imgH);
      }

      // Tint: slight desaturation on unselected, still bright
      if (isSelected) {
        panel.image.clearTint();
        panel.image.setAlpha(1);
      } else {
        panel.image.setTint(0x99999a);
        panel.image.setAlpha(0.85);
      }

      // Border
      panel.border.clear();
      if (isSelected) {
        panel.border.lineStyle(3, teamColor, 0.9);
        panel.border.strokeRect(
          -halfW - 2,
          -halfH - 9,
          imgW + 4,
          imgH + 4,
        );
        panel.border.lineStyle(1, 0xffffff, 0.5);
        panel.border.strokeRect(
          -halfW,
          -halfH - 7,
          imgW,
          imgH,
        );
      }

      // Name styling — unselected still readable
      if (isSelected) {
        panel.nameText.setColor('#ffffff');
        panel.nameText.setAlpha(1);
      } else {
        panel.nameText.setColor('#8899aa');
        panel.nameText.setAlpha(0.8);
      }
    }

    this.updateTeamDots();
  }

  private buildTeamDots(cx: number, y: number): void {
    this.teamDots = [];
    const totalW = this.config.numTeams * 30;
    let x = cx - totalW / 2 + 15;

    for (let t = 0; t < this.config.numTeams; t++) {
      const dot = this.add.graphics();
      this.teamDots.push(dot);
      dot.setPosition(x, y);
      x += 30;
    }
    this.updateTeamDots();
  }

  private updateTeamDots(): void {
    for (let t = 0; t < this.config.numTeams; t++) {
      const dot = this.teamDots[t]!;
      const colorStr = TEAM_COLORS[t % TEAM_COLORS.length]!;
      const color = parseInt(colorStr.replace('#', ''), 16);
      dot.clear();

      if (t === this.activeTeam) {
        dot.lineStyle(2, 0xffffff, 1);
        dot.strokeCircle(0, 0, 9);
      }
      dot.fillStyle(color, t <= this.activeTeam ? 1 : 0.3);
      dot.fillCircle(0, 0, 7);

      if (t < this.activeTeam) {
        dot.fillStyle(0xffffff, 0.9);
        dot.fillRect(-2, -1, 3, 5);
        dot.fillRect(-3, 1, 5, 2);
      }
    }
  }

  private buildActionButton(
    cx: number,
    y: number,
    label: string,
    color: number,
    onClick: () => void,
  ): void {
    const btnW = 160;
    const btnH = 38;
    const bg = this.add.graphics();
    bg.fillStyle(color, 1);
    bg.fillRoundedRect(cx - btnW / 2, y, btnW, btnH, 8);

    this.add
      .text(cx, y + btnH / 2, label, {
        fontFamily: '"Press Start 2P", "Courier New", monospace',
        fontSize: '11px',
        fontStyle: 'bold',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const zone = this.add
      .zone(cx, y + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true });

    zone.on('pointerover', () => {
      bg.clear();
      bg.fillStyle(Phaser.Display.Color.ValueToColor(color).brighten(20).color, 1);
      bg.fillRoundedRect(cx - btnW / 2, y, btnW, btnH, 8);
    });
    zone.on('pointerout', () => {
      bg.clear();
      bg.fillStyle(color, 1);
      bg.fillRoundedRect(cx - btnW / 2, y, btnW, btnH, 8);
    });
    zone.on('pointerdown', onClick);
  }

  private lockIn(): void {
    SoundManager.play('select');

    if (this.activeTeam < this.config.numTeams - 1) {
      this.activeTeam++;

      // Auto-pick random character for AI teams
      if (this.isAITeam(this.activeTeam)) {
        this.teamSelections[this.activeTeam] = Math.floor(
          Math.random() * CHARACTERS.length,
        );
        // Auto-advance through AI teams
        this.lockIn();
        return;
      }

      this.selectedIndex = this.teamSelections[this.activeTeam]!;
      this.updatePanels();

      this.cameras.main.flash(200, 255, 255, 255, false, (_cam: unknown, progress: number) => {
        if (progress >= 1) this.cameras.main.setBackgroundColor('#0a0a1a');
      });
    } else {
      this.startBattle();
    }
  }

  private startBattle(): void {
    const teamCharacters = this.teamSelections.map(
      (idx) => CHARACTERS[idx]?.id ?? 'banana-sam',
    );

    this.scene.start('GamePlay', {
      numTeams: this.config.numTeams,
      wormsPerTeam: this.config.wormsPerTeam,
      teamCharacters,
      aiTeams: this.config.aiTeams,
      mapId: this.config.mapId,
      turnTimer: this.config.turnTimer,
    } satisfies GameConfig);
  }
}
