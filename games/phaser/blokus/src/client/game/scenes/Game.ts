import { Scene } from 'phaser';
import * as Phaser from 'phaser';
import { BoardLogic, BOARD_SIZE, PLAYER_COLORS, PLAYER_COLOR_NAMES, START_POSITIONS } from '../logic/BoardLogic';
import { AIPlayer } from '../logic/AIPlayer';
import { PIECE_DEFINITIONS, getTransformedCells } from '../data/pieces';
import { SoundManager } from '../audio/SoundManager';
import type { MultiplayerManager } from '../systems/MultiplayerManager';
import type { MultiplayerMessage, BlokusMove } from '../../../shared/types/multiplayer';

type SizeFilter = 'all' | '1-2' | '3' | '4' | '5';

const SIZE_TABS: { label: string; filter: SizeFilter }[] = [
  { label: 'ALL', filter: 'all' },
  { label: '1-2', filter: '1-2' },
  { label: '3', filter: '3' },
  { label: '4', filter: '4' },
  { label: '5', filter: '5' },
];

function pieceFitsFilter(size: number, filter: SizeFilter): boolean {
  if (filter === 'all') return true;
  if (filter === '1-2') return size <= 2;
  return size === Number(filter);
}

interface UndoSnapshot {
  playerPieceId: string;
  playerCells: [number, number][];
  aiPieceId: string | null;
  aiCells: [number, number][] | null;
}

interface GameSceneData {
  multiplayer?: boolean;
  mp?: MultiplayerManager;
  playerNumber?: 1 | 2;
  opponentName?: string;
}

export class Game extends Scene {
  private board: BoardLogic;
  private ai: AIPlayer;
  private currentPlayer: 1 | 2 = 1;
  private selectedPieceId: string | null = null;
  private rotation = 0;
  private flipped = false;

  // Multiplayer state
  private isMultiplayer = false;
  private mp: MultiplayerManager | null = null;
  private myPlayerNumber: 1 | 2 = 1;
  private opponentName = 'Opponent';
  private messageHandler: ((msg: MultiplayerMessage) => void) | null = null;

  private boardGraphics: Phaser.GameObjects.Graphics;
  private pieceGraphics: Phaser.GameObjects.Graphics;
  private ghostGraphics: Phaser.GameObjects.Graphics;
  private trayGraphics: Phaser.GameObjects.Graphics;
  private uiGraphics: Phaser.GameObjects.Graphics;
  private dragGhostGraphics: Phaser.GameObjects.Graphics;

  private turnText: Phaser.GameObjects.Text;
  private scoreText: Phaser.GameObjects.Text;
  private statusText: Phaser.GameObjects.Text;

  private boardX = 0;
  private boardY = 0;
  private cellSize = 0;

  private trayAreaY = 0;
  private trayAreaH = 0;
  private trayStripY = 0;
  private trayStripH = 0;
  private trayScrollX = 0;

  private playerSkipped = [false, false];
  private gameOver = false;
  private isAiThinking = false;

  private sizeFilter: SizeFilter = 'all';
  private tabBounds: { filter: SizeFilter; x: number; y: number; w: number; h: number }[] = [];
  private trayPiecePositions: Map<string, { x: number; y: number; w: number; h: number }> = new Map();
  private btnBounds: { action: string; x: number; y: number; w: number; h: number }[] = [];

  private playablePieceCache: Set<string> = new Set();
  private playableCacheDirty = true;

  private isDraggingTray = false;
  private dragStartX = 0;
  private dragStartScrollX = 0;

  private isDraggingPiece = false;
  private dragPieceId: string | null = null;
  private dragPointerX = 0;
  private dragPointerY = 0;
  private dragDistanceSq = 0;
  private dragOriginX = 0;
  private dragOriginY = 0;
  private static readonly DRAG_THRESHOLD_SQ = 64;

  private undoSnapshot: UndoSnapshot | null = null;

  constructor() {
    super('Game');
  }

  create(data?: GameSceneData) {
    this.board = new BoardLogic();
    this.ai = new AIPlayer('medium');
    this.currentPlayer = 1;
    this.selectedPieceId = null;
    this.rotation = 0;
    this.flipped = false;
    this.playerSkipped = [false, false];
    this.gameOver = false;
    this.isAiThinking = false;
    this.trayScrollX = 0;
    this.sizeFilter = 'all';
    this.playableCacheDirty = true;
    this.isDraggingPiece = false;
    this.dragPieceId = null;
    this.undoSnapshot = null;

    this.isMultiplayer = data?.multiplayer ?? false;
    this.mp = data?.mp ?? null;
    this.myPlayerNumber = data?.playerNumber ?? 1;
    this.opponentName = data?.opponentName ?? 'Opponent';

    if (this.isMultiplayer && this.mp) {
      this.setupMultiplayerListeners();
    }

    this.cameras.main.setBackgroundColor(0x0d0d1a);
    this.cameras.main.fadeIn(400, 0, 0, 0);

    this.boardGraphics = this.add.graphics();
    this.pieceGraphics = this.add.graphics();
    this.ghostGraphics = this.add.graphics();
    this.trayGraphics = this.add.graphics();
    this.uiGraphics = this.add.graphics();
    this.dragGhostGraphics = this.add.graphics().setDepth(100);

    const { width, height } = this.scale;
    const sf = this.getSf();

    this.turnText = this.add.text(0, 0, '', {
      fontFamily: '"Arial Black", sans-serif',
      fontSize: `${Math.round(18 * sf)}px`,
      color: '#ffffff',
    });

    this.scoreText = this.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.round(14 * sf)}px`,
      color: '#8899aa',
    });

    this.statusText = this.add.text(0, 0, '', {
      fontFamily: 'Arial, sans-serif',
      fontSize: `${Math.round(12 * sf)}px`,
      color: '#aabbcc',
    });

    this.layout(width, height);
    this.drawBoard();
    this.drawTray();
    this.drawControls();
    this.updateUI();

    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingPiece) {
        this.dragPointerX = pointer.x;
        this.dragPointerY = pointer.y;
        this.dragDistanceSq =
          (pointer.x - this.dragOriginX) ** 2 + (pointer.y - this.dragOriginY) ** 2;
        this.drawDragGhost();
        return;
      }
      if (this.isDraggingTray) {
        this.trayScrollX = this.dragStartScrollX + (this.dragStartX - pointer.x);
        this.trayScrollX = Math.max(0, this.trayScrollX);
        this.drawTray();
        return;
      }
      this.handlePointerMove(pointer);
    });

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handlePointerDown(pointer);
    });

    this.input.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (this.isDraggingPiece) {
        this.handleDragDrop(pointer);
        return;
      }
      this.isDraggingTray = false;
    });

    this.input.keyboard?.on('keydown-R', () => {
      if (this.canAct()) {
        this.rotation = (this.rotation + 1) % 4;
        SoundManager.playRotate();
        this.drawTray();
        this.updateUI();
      }
    });

    this.input.keyboard?.on('keydown-E', () => {
      if (this.canAct()) {
        this.rotation = (this.rotation + 3) % 4;
        SoundManager.playRotate();
        this.drawTray();
        this.updateUI();
      }
    });

    this.input.keyboard?.on('keydown-F', () => {
      if (this.canAct()) {
        this.flipped = !this.flipped;
        SoundManager.playRotate();
        this.drawTray();
        this.updateUI();
      }
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.deselectPiece();
    });

    this.input.keyboard?.on('keydown-Z', () => {
      if (!this.isMultiplayer) {
        this.handleUndo();
      }
    });

    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.layout(gameSize.width, gameSize.height);
      this.drawBoard();
      this.drawPlacedPieces();
      this.drawTray();
      this.drawControls();
      this.updateUI();
    });

    if (this.isMyTurn()) {
      this.selectFirstAvailable();
    }
    this.drawTray();
    this.updateUI();
  }

  // ── Multiplayer ──

  private setupMultiplayerListeners(): void {
    this.messageHandler = (msg: MultiplayerMessage) => {
      switch (msg.type) {
        case 'player-move':
          this.handleRemoteMove(msg.move);
          break;
        case 'player-pass':
          this.handleRemotePass(msg.player);
          break;
        case 'game-over':
          if (!this.gameOver) {
            this.finishGame();
          }
          break;
        case 'player-left':
          this.handleOpponentLeft();
          break;
      }
    };
    this.mp!.onMessage(this.messageHandler);
  }

  private handleRemoteMove(move: BlokusMove): void {
    if (move.player === this.myPlayerNumber) return;

    this.board.placePiece(move.pieceId, move.cells, move.player);
    this.playerSkipped[move.player - 1] = false;

    SoundManager.playAiMove();

    for (const [r, c] of move.cells) {
      const flash = this.add.graphics();
      flash.fillStyle(0xffffff, 0.6);
      flash.fillRoundedRect(
        this.boardX + c * this.cellSize + 1,
        this.boardY + r * this.cellSize + 1,
        this.cellSize - 2,
        this.cellSize - 2,
        3,
      );
      this.tweens.add({
        targets: flash,
        alpha: 0,
        duration: 400,
        onComplete: () => flash.destroy(),
      });
    }

    this.drawPlacedPieces();

    this.currentPlayer = this.myPlayerNumber;
    this.playableCacheDirty = true;

    if (this.board.isGameOver() || (this.playerSkipped[0] && this.playerSkipped[1])) {
      this.finishGame();
      return;
    }

    if (!this.board.hasValidMoves(this.myPlayerNumber)) {
      this.playerSkipped[this.myPlayerNumber - 1] = true;
      if (this.playerSkipped[0] && this.playerSkipped[1]) {
        this.finishGame();
        return;
      }
      this.mp?.sendPass(this.myPlayerNumber);
      this.currentPlayer = this.opponentPlayerNumber();
      this.updateUI();
      return;
    }

    this.selectFirstAvailable();
    this.rotation = 0;
    this.flipped = false;
    this.drawTray();
    this.drawControls();
    this.updateUI();
  }

  private handleRemotePass(player: 1 | 2): void {
    if (player === this.myPlayerNumber) return;

    this.playerSkipped[player - 1] = true;

    if (this.playerSkipped[0] && this.playerSkipped[1]) {
      this.finishGame();
      return;
    }

    this.currentPlayer = this.myPlayerNumber;
    this.playableCacheDirty = true;

    if (!this.board.hasValidMoves(this.myPlayerNumber)) {
      this.playerSkipped[this.myPlayerNumber - 1] = true;
      this.mp?.sendPass(this.myPlayerNumber);
      this.finishGame();
      return;
    }

    this.selectFirstAvailable();
    this.rotation = 0;
    this.flipped = false;
    this.drawTray();
    this.drawControls();
    this.updateUI();
  }

  private handleOpponentLeft(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.ghostGraphics.clear();

    const sf = this.getSf();
    const { width, height } = this.scale;

    const overlay = this.add.graphics();
    overlay.fillStyle(0x000000, 0.7);
    overlay.fillRect(0, 0, width, height);
    overlay.setDepth(200);

    this.add
      .text(width / 2, height / 2 - 30, 'Opponent Left', {
        fontFamily: '"Arial Black", sans-serif',
        fontSize: `${Math.round(28 * sf)}px`,
        color: '#e8913a',
      })
      .setOrigin(0.5)
      .setDepth(201);

    this.add
      .text(width / 2, height / 2 + 10, 'You win by forfeit!', {
        fontFamily: 'Arial, sans-serif',
        fontSize: `${Math.round(16 * sf)}px`,
        color: '#44cc44',
      })
      .setOrigin(0.5)
      .setDepth(201);

    this.time.delayedCall(2500, () => {
      this.cleanupMultiplayer();
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.start('GameOver', {
          playerScore: this.board.calculateScore(this.myPlayerNumber),
          aiScore: this.board.calculateScore(this.opponentPlayerNumber()),
          playerPiecesPlaced: this.board.getPiecesPlaced(this.myPlayerNumber),
          aiPiecesPlaced: this.board.getPiecesPlaced(this.opponentPlayerNumber()),
          won: true,
          perfect: false,
          multiplayer: true,
          opponentName: this.opponentName,
        });
      });
    });
  }

  private opponentPlayerNumber(): 1 | 2 {
    return this.myPlayerNumber === 1 ? 2 : 1;
  }

  private isMyTurn(): boolean {
    if (!this.isMultiplayer) return this.currentPlayer === 1;
    return this.currentPlayer === this.myPlayerNumber;
  }

  private cleanupMultiplayer(): void {
    if (this.mp && this.messageHandler) {
      this.mp.offMessage(this.messageHandler);
      this.messageHandler = null;
    }
  }

  // ── Core ──

  private getSf(): number {
    const { width, height } = this.scale;
    return Math.min(width / 800, height / 600, 1.5);
  }

  private canAct(): boolean {
    if (this.gameOver || this.isAiThinking) return false;
    if (this.isMultiplayer) return this.currentPlayer === this.myPlayerNumber;
    return this.currentPlayer === 1;
  }

  private myDisplayPlayer(): 1 | 2 {
    return this.isMultiplayer ? this.myPlayerNumber : 1;
  }

  private layout(width: number, height: number) {
    const padding = 10;
    const topBarH = 44;
    const tabBarH = 32;
    const btnBarH = 44;
    const trayPadding = 8;

    this.trayStripH = Math.max(64, Math.round(height * 0.18));
    this.trayAreaH = tabBarH + this.trayStripH + btnBarH + trayPadding * 3;
    this.trayAreaY = height - this.trayAreaH;
    this.trayStripY = this.trayAreaY + tabBarH + trayPadding;

    const boardMaxW = width - padding * 2;
    const boardMaxH = this.trayAreaY - topBarH - padding * 2;
    const boardSide = Math.min(boardMaxW, boardMaxH);

    this.cellSize = Math.floor(boardSide / BOARD_SIZE);
    const actualBoardSide = this.cellSize * BOARD_SIZE;

    this.boardX = Math.round((width - actualBoardSide) / 2);
    this.boardY = topBarH + Math.round((boardMaxH - actualBoardSide) / 2) + padding;
  }

  // ── Board Drawing ──

  private drawBoard() {
    this.boardGraphics.clear();
    const { boardX, boardY, cellSize } = this;
    const boardSide = cellSize * BOARD_SIZE;

    this.boardGraphics.fillStyle(0x1a1a2e, 1);
    this.boardGraphics.fillRect(boardX, boardY, boardSide, boardSide);

    this.boardGraphics.lineStyle(1, 0x2a2a4e, 0.5);
    for (let i = 0; i <= BOARD_SIZE; i++) {
      this.boardGraphics.lineBetween(boardX + i * cellSize, boardY, boardX + i * cellSize, boardY + boardSide);
      this.boardGraphics.lineBetween(boardX, boardY + i * cellSize, boardX + boardSide, boardY + i * cellSize);
    }

    for (let p = 0; p < 2; p++) {
      const [sr, sc] = START_POSITIONS[p]!;
      const color = PLAYER_COLORS[p]!;
      this.boardGraphics.lineStyle(2, color, 0.4);
      this.boardGraphics.strokeRect(
        boardX + sc * cellSize + 2,
        boardY + sr * cellSize + 2,
        cellSize - 4,
        cellSize - 4,
      );
    }

    this.boardGraphics.lineStyle(2, 0x3a3a5e, 1);
    this.boardGraphics.strokeRect(boardX, boardY, boardSide, boardSide);

    this.drawPlacedPieces();
  }

  private drawPlacedPieces() {
    this.pieceGraphics.clear();
    const { boardX, boardY, cellSize } = this;

    for (const placed of this.board.placedPieces) {
      const color = PLAYER_COLORS[placed.player - 1]!;
      this.pieceGraphics.fillStyle(color, 0.85);

      for (const [r, c] of placed.cells) {
        this.pieceGraphics.fillRoundedRect(
          boardX + c * cellSize + 1,
          boardY + r * cellSize + 1,
          cellSize - 2,
          cellSize - 2,
          3,
        );
      }

      this.pieceGraphics.fillStyle(0xffffff, 0.08);
      for (const [r, c] of placed.cells) {
        this.pieceGraphics.fillRect(
          boardX + c * cellSize + 2,
          boardY + r * cellSize + 2,
          cellSize - 4,
          (cellSize - 4) * 0.3,
        );
      }
    }
  }

  // ── Tray Drawing ──

  private refreshPlayableCache() {
    if (!this.playableCacheDirty) return;
    this.playablePieceCache.clear();

    const myP = this.myDisplayPlayer();
    const remaining = this.board.remainingPieces.get(myP);
    if (!remaining) return;

    const corners = this.board.getCornerPositions(myP);
    if (corners.size === 0 && !this.board.isFirstMove(myP)) return;

    for (const pieceId of remaining) {
      const piece = PIECE_DEFINITIONS.find((p) => p.id === pieceId);
      if (!piece) continue;

      let found = false;
      for (let rot = 0; rot < 4 && !found; rot++) {
        for (const flip of [false, true]) {
          if (found) break;
          const cells = getTransformedCells(piece.cells, rot, flip);
          for (const cornerStr of corners) {
            if (found) break;
            const [cr, cc] = cornerStr.split(',').map(Number) as [number, number];
            for (const [cellR, cellC] of cells) {
              const placed = cells.map(([r, c]): [number, number] => [cr - cellR + r, cc - cellC + c]);
              if (this.board.isValidPlacement(placed, myP)) {
                this.playablePieceCache.add(pieceId);
                found = true;
                break;
              }
            }
          }
        }
      }
    }
    this.playableCacheDirty = false;
  }

  private drawTray() {
    this.trayGraphics.clear();
    this.trayPiecePositions.clear();
    this.tabBounds = [];

    const { width } = this.scale;
    const sf = this.getSf();
    const myP = this.myDisplayPlayer();
    const remaining = this.board.remainingPieces.get(myP);
    const allPieceIds = remaining ?? new Set<string>();

    this.refreshPlayableCache();

    this.trayGraphics.fillStyle(0x111122, 0.95);
    this.trayGraphics.fillRoundedRect(0, this.trayAreaY, width, this.trayAreaH, { tl: 12, tr: 12, bl: 0, br: 0 });
    this.trayGraphics.lineStyle(1, 0x2a2a4e, 0.8);
    this.trayGraphics.lineBetween(0, this.trayAreaY, width, this.trayAreaY);

    const tabW = Math.round(Math.min(60 * sf, (width - 20) / SIZE_TABS.length));
    const tabH = 26;
    const tabY = this.trayAreaY + 4;
    const tabTotalW = tabW * SIZE_TABS.length + (SIZE_TABS.length - 1) * 4;
    let tabX = Math.round((width - tabTotalW) / 2);

    const playerColor = PLAYER_COLORS[myP - 1]!;

    for (const tab of SIZE_TABS) {
      const isActive = this.sizeFilter === tab.filter;

      if (isActive) {
        this.trayGraphics.fillStyle(playerColor, 0.3);
        this.trayGraphics.fillRoundedRect(tabX, tabY, tabW, tabH, 6);
        this.trayGraphics.lineStyle(1, playerColor, 0.7);
        this.trayGraphics.strokeRoundedRect(tabX, tabY, tabW, tabH, 6);
      } else {
        this.trayGraphics.fillStyle(0x1a1a2e, 0.6);
        this.trayGraphics.fillRoundedRect(tabX, tabY, tabW, tabH, 6);
      }

      this.add
        .text(tabX + tabW / 2, tabY + tabH / 2, tab.label, {
          fontFamily: '"Arial Black", sans-serif',
          fontSize: `${Math.round(10 * sf)}px`,
          color: isActive ? '#4a90d9' : '#667788',
        })
        .setOrigin(0.5, 0.5)
        .setData('_trayLabel', true);

      this.tabBounds.push({ filter: tab.filter, x: tabX, y: tabY, w: tabW, h: tabH });
      tabX += tabW + 4;
    }

    const cellSz = Math.round(Math.max(14, 18 * sf));
    const gap = Math.round(12 * sf);
    const stripPadding = 12;

    const filteredPieces = PIECE_DEFINITIONS.filter((p) => pieceFitsFilter(p.size, this.sizeFilter));

    let curX = stripPadding - this.trayScrollX;
    const stripCenterY = this.trayStripY + this.trayStripH / 2;

    for (const piece of filteredPieces) {
      const isRemaining = allPieceIds.has(piece.id);
      const isPlayable = this.playablePieceCache.has(piece.id);
      const isSelected = this.selectedPieceId === piece.id;

      const cells =
        isSelected
          ? getTransformedCells(piece.cells, this.rotation, this.flipped)
          : piece.cells.map(([r, c]): [number, number] => [r, c]);

      const maxR = Math.max(...cells.map(([r]) => r));
      const maxC = Math.max(...cells.map(([, c]) => c));
      const pieceW = (maxC + 1) * (cellSz + 1);
      const pieceH = (maxR + 1) * (cellSz + 1);

      const slotW = pieceW + 12;
      const slotH = pieceH + 12;
      const px = curX;
      const py = stripCenterY - slotH / 2;

      if (px + slotW > -50 && px < width + 50) {
        if (isSelected) {
          this.trayGraphics.fillStyle(playerColor, 0.15);
          this.trayGraphics.fillRoundedRect(px, py, slotW, slotH, 6);
          this.trayGraphics.lineStyle(2, playerColor, 0.8);
          this.trayGraphics.strokeRoundedRect(px, py, slotW, slotH, 6);
        }

        const alpha = isRemaining ? (isPlayable ? 0.9 : 0.35) : 0.12;
        this.trayGraphics.fillStyle(isRemaining ? playerColor : 0x334455, alpha);

        const cellOffX = px + (slotW - pieceW) / 2;
        const cellOffY = py + (slotH - pieceH) / 2;

        for (const [r, c] of cells) {
          this.trayGraphics.fillRoundedRect(cellOffX + c * (cellSz + 1), cellOffY + r * (cellSz + 1), cellSz, cellSz, 3);
        }

        if (isRemaining && !isPlayable) {
          const dotR = 4;
          this.trayGraphics.fillStyle(0xcc4444, 0.8);
          this.trayGraphics.fillCircle(px + slotW - dotR - 2, py + dotR + 2, dotR);
        }

        if (isRemaining) {
          this.trayPiecePositions.set(piece.id, { x: px, y: py, w: slotW, h: slotH });
        }
      }

      curX += slotW + gap;
    }

    this.children.list
      .filter((c) => c instanceof Phaser.GameObjects.Text && c.getData('_trayLabel'))
      .forEach((c) => c.destroy());
  }

  // ── Control Buttons ──

  private drawControls() {
    this.uiGraphics.clear();
    this.btnBounds = [];

    const { width } = this.scale;
    const sf = this.getSf();
    const btnH = Math.round(36 * sf);
    const btnGap = 6;
    const btnY = this.trayStripY + this.trayStripH + 8;

    const canUndo = !this.isMultiplayer && this.undoSnapshot !== null && this.canAct();

    const buttons = [
      { action: 'rotateCCW', label: '↺', color: 0x3a6ea5, enabled: true },
      { action: 'rotateCW', label: '↻', color: 0x3a6ea5, enabled: true },
      { action: 'flip', label: '↔ Flip', color: 0x3a6ea5, enabled: true },
      ...(this.isMultiplayer
        ? []
        : [{ action: 'undo', label: '↩ Undo', color: canUndo ? 0x7a6ea5 : 0x333344, enabled: canUndo }]),
      { action: 'deselect', label: '✕', color: 0x555566, enabled: true },
      { action: 'pass', label: '⏭ Pass', color: 0x994444, enabled: true },
    ];

    const btnW = Math.round(Math.min(78 * sf, (width - btnGap * (buttons.length + 1)) / buttons.length));
    const totalW = btnW * buttons.length + btnGap * (buttons.length - 1);
    let bx = Math.round((width - totalW) / 2);

    for (const btn of buttons) {
      const alpha = btn.enabled ? 0.5 : 0.2;
      this.uiGraphics.fillStyle(btn.color, alpha);
      this.uiGraphics.fillRoundedRect(bx, btnY, btnW, btnH, 8);
      this.uiGraphics.lineStyle(1, btn.color, btn.enabled ? 0.7 : 0.3);
      this.uiGraphics.strokeRoundedRect(bx, btnY, btnW, btnH, 8);

      this.add
        .text(bx + btnW / 2, btnY + btnH / 2, btn.label, {
          fontFamily: 'Arial, sans-serif',
          fontSize: `${Math.round(11 * sf)}px`,
          color: btn.enabled ? '#ccddee' : '#556666',
        })
        .setOrigin(0.5, 0.5)
        .setData('_ctrlLabel', true);

      this.btnBounds.push({ action: btn.action, x: bx, y: btnY, w: btnW, h: btnH });
      bx += btnW + btnGap;
    }
  }

  // ── Drag-and-Drop ──

  private drawDragGhost() {
    this.dragGhostGraphics.clear();
    this.ghostGraphics.clear();

    if (!this.dragPieceId || this.dragDistanceSq < Game.DRAG_THRESHOLD_SQ) return;

    const piece = PIECE_DEFINITIONS.find((p) => p.id === this.dragPieceId);
    if (!piece) return;

    const cells = getTransformedCells(piece.cells, this.rotation, this.flipped);
    const { boardX, boardY, cellSize } = this;
    const myP = this.myDisplayPlayer();
    const playerColor = PLAYER_COLORS[myP - 1]!;

    const col = Math.floor((this.dragPointerX - boardX) / cellSize);
    const row = Math.floor((this.dragPointerY - boardY) / cellSize);
    const overBoard = row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

    if (overBoard) {
      const placedCells = cells.map(([r, c]): [number, number] => [row + r, col + c]);
      const valid = this.board.isValidPlacement(placedCells, myP);
      const ghostColor = valid ? 0x44cc44 : 0xcc4444;
      const ghostAlpha = valid ? 0.4 : 0.25;

      this.ghostGraphics.fillStyle(ghostColor, ghostAlpha);
      for (const [r, c] of placedCells) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          this.ghostGraphics.fillRoundedRect(
            boardX + c * cellSize + 1,
            boardY + r * cellSize + 1,
            cellSize - 2,
            cellSize - 2,
            3,
          );
        }
      }
      if (valid) {
        this.ghostGraphics.lineStyle(2, 0x44cc44, 0.6);
        for (const [r, c] of placedCells) {
          if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            this.ghostGraphics.strokeRoundedRect(
              boardX + c * cellSize + 1,
              boardY + r * cellSize + 1,
              cellSize - 2,
              cellSize - 2,
              3,
            );
          }
        }
      }
    } else {
      const dragCellSz = Math.round(cellSize * 0.8);
      this.dragGhostGraphics.fillStyle(playerColor, 0.6);
      for (const [r, c] of cells) {
        this.dragGhostGraphics.fillRoundedRect(
          this.dragPointerX + c * (dragCellSz + 1) - dragCellSz,
          this.dragPointerY + r * (dragCellSz + 1) - dragCellSz,
          dragCellSz,
          dragCellSz,
          3,
        );
      }
    }
  }

  private handleDragDrop(pointer: Phaser.Input.Pointer) {
    this.dragGhostGraphics.clear();
    this.ghostGraphics.clear();

    const wasDragging = this.isDraggingPiece && this.dragDistanceSq >= Game.DRAG_THRESHOLD_SQ;
    this.isDraggingPiece = false;

    if (!wasDragging || !this.dragPieceId || !this.canAct()) {
      this.dragPieceId = null;
      return;
    }

    const piece = PIECE_DEFINITIONS.find((p) => p.id === this.dragPieceId);
    if (!piece) { this.dragPieceId = null; return; }

    const { boardX, boardY, cellSize } = this;
    const col = Math.floor((pointer.x - boardX) / cellSize);
    const row = Math.floor((pointer.y - boardY) / cellSize);
    const myP = this.myDisplayPlayer();

    if (row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE) {
      const cells = getTransformedCells(piece.cells, this.rotation, this.flipped);
      const placedCells = cells.map(([r, c]): [number, number] => [row + r, col + c]);

      if (this.board.placePiece(this.dragPieceId, placedCells, myP)) {
        SoundManager.playPlace();
        if (!this.isMultiplayer) {
          this.saveUndoSnapshot(this.dragPieceId, placedCells);
        }
        if (this.isMultiplayer && this.mp) {
          this.mp.sendMove({ pieceId: this.dragPieceId, cells: placedCells, player: myP });
        }
        this.selectedPieceId = null;
        this.rotation = 0;
        this.flipped = false;
        this.playableCacheDirty = true;
        this.drawPlacedPieces();
        this.playerSkipped[myP - 1] = false;
        this.dragPieceId = null;
        this.endTurn();
        return;
      } else {
        SoundManager.playInvalid();
      }
    }

    this.dragPieceId = null;
    this.drawTray();
    this.updateUI();
  }

  // ── Input Handling ──

  private handlePointerMove(pointer: Phaser.Input.Pointer) {
    this.ghostGraphics.clear();
    if (!this.selectedPieceId || !this.canAct()) return;

    const { boardX, boardY, cellSize } = this;
    const col = Math.floor((pointer.x - boardX) / cellSize);
    const row = Math.floor((pointer.y - boardY) / cellSize);

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;

    const piece = PIECE_DEFINITIONS.find((p) => p.id === this.selectedPieceId);
    if (!piece) return;

    const myP = this.myDisplayPlayer();
    const cells = getTransformedCells(piece.cells, this.rotation, this.flipped);
    const placedCells = cells.map(([r, c]): [number, number] => [row + r, col + c]);

    const valid = this.board.isValidPlacement(placedCells, myP);
    const ghostColor = valid ? 0x44cc44 : 0xcc4444;
    const ghostAlpha = valid ? 0.4 : 0.25;

    this.ghostGraphics.fillStyle(ghostColor, ghostAlpha);
    for (const [r, c] of placedCells) {
      if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
        this.ghostGraphics.fillRoundedRect(
          boardX + c * cellSize + 1,
          boardY + r * cellSize + 1,
          cellSize - 2,
          cellSize - 2,
          3,
        );
      }
    }

    if (valid) {
      this.ghostGraphics.lineStyle(2, 0x44cc44, 0.6);
      for (const [r, c] of placedCells) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          this.ghostGraphics.strokeRoundedRect(
            boardX + c * cellSize + 1,
            boardY + r * cellSize + 1,
            cellSize - 2,
            cellSize - 2,
            3,
          );
        }
      }
    }
  }

  private handlePointerDown(pointer: Phaser.Input.Pointer) {
    if (this.gameOver || this.isAiThinking) return;
    if (!this.canAct()) return;

    for (const tab of this.tabBounds) {
      if (pointer.x >= tab.x && pointer.x <= tab.x + tab.w && pointer.y >= tab.y && pointer.y <= tab.y + tab.h) {
        this.sizeFilter = tab.filter;
        this.trayScrollX = 0;
        SoundManager.playRotate();
        this.drawTray();
        return;
      }
    }

    for (const btn of this.btnBounds) {
      if (pointer.x >= btn.x && pointer.x <= btn.x + btn.w && pointer.y >= btn.y && pointer.y <= btn.y + btn.h) {
        this.handleButtonAction(btn.action);
        return;
      }
    }

    for (const [pieceId, bounds] of this.trayPiecePositions) {
      if (
        pointer.x >= bounds.x &&
        pointer.x <= bounds.x + bounds.w &&
        pointer.y >= bounds.y &&
        pointer.y <= bounds.y + bounds.h
      ) {
        this.isDraggingPiece = true;
        this.dragPieceId = pieceId;
        this.dragPointerX = pointer.x;
        this.dragPointerY = pointer.y;
        this.dragOriginX = pointer.x;
        this.dragOriginY = pointer.y;
        this.dragDistanceSq = 0;

        this.selectedPieceId = pieceId;
        this.rotation = 0;
        this.flipped = false;
        SoundManager.playSelect();
        this.ghostGraphics.clear();
        this.drawTray();
        this.updateUI();
        return;
      }
    }

    if (pointer.y >= this.trayStripY && pointer.y <= this.trayStripY + this.trayStripH) {
      this.isDraggingTray = true;
      this.dragStartX = pointer.x;
      this.dragStartScrollX = this.trayScrollX;
      return;
    }

    if (!this.selectedPieceId) return;

    const { boardX, boardY, cellSize } = this;
    const col = Math.floor((pointer.x - boardX) / cellSize);
    const row = Math.floor((pointer.y - boardY) / cellSize);

    if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;

    const piece = PIECE_DEFINITIONS.find((p) => p.id === this.selectedPieceId);
    if (!piece) return;

    const myP = this.myDisplayPlayer();
    const cells = getTransformedCells(piece.cells, this.rotation, this.flipped);
    const placedCells = cells.map(([r, c]): [number, number] => [row + r, col + c]);

    if (this.board.placePiece(this.selectedPieceId, placedCells, myP)) {
      SoundManager.playPlace();
      if (!this.isMultiplayer) {
        this.saveUndoSnapshot(this.selectedPieceId, placedCells);
      }
      if (this.isMultiplayer && this.mp) {
        this.mp.sendMove({ pieceId: this.selectedPieceId, cells: placedCells, player: myP });
      }
      this.ghostGraphics.clear();
      this.selectedPieceId = null;
      this.rotation = 0;
      this.flipped = false;
      this.playableCacheDirty = true;
      this.drawPlacedPieces();
      this.playerSkipped[myP - 1] = false;
      this.endTurn();
    } else {
      SoundManager.playInvalid();
    }
  }

  private handleButtonAction(action: string) {
    switch (action) {
      case 'rotateCW':
        if (this.canAct()) {
          this.rotation = (this.rotation + 1) % 4;
          SoundManager.playRotate();
          this.drawTray();
          this.updateUI();
        }
        break;
      case 'rotateCCW':
        if (this.canAct()) {
          this.rotation = (this.rotation + 3) % 4;
          SoundManager.playRotate();
          this.drawTray();
          this.updateUI();
        }
        break;
      case 'flip':
        if (this.canAct()) {
          this.flipped = !this.flipped;
          SoundManager.playRotate();
          this.drawTray();
          this.updateUI();
        }
        break;
      case 'undo':
        if (!this.isMultiplayer) {
          this.handleUndo();
        }
        break;
      case 'deselect':
        this.deselectPiece();
        break;
      case 'pass':
        void this.handlePass();
        break;
    }
  }

  private deselectPiece() {
    if (this.selectedPieceId) {
      this.selectedPieceId = null;
      this.rotation = 0;
      this.flipped = false;
      this.ghostGraphics.clear();
      this.drawTray();
      this.updateUI();
    }
  }

  private selectFirstAvailable() {
    const myP = this.myDisplayPlayer();
    const remaining = this.board.remainingPieces.get(myP);
    if (remaining && remaining.size > 0) {
      this.refreshPlayableCache();
      for (const pid of remaining) {
        if (this.playablePieceCache.has(pid)) {
          this.selectedPieceId = pid;
          return;
        }
      }
      this.selectedPieceId = [...remaining][0] ?? null;
    }
  }

  // ── Undo (single-player only) ──

  private saveUndoSnapshot(pieceId: string, cells: [number, number][]) {
    this.undoSnapshot = {
      playerPieceId: pieceId,
      playerCells: cells.map(([r, c]) => [r, c]),
      aiPieceId: null,
      aiCells: null,
    };
  }

  private handleUndo() {
    if (!this.undoSnapshot || !this.canAct() || this.isMultiplayer) return;

    const snap = this.undoSnapshot;

    if (snap.aiPieceId) {
      this.board.removePiece(snap.aiPieceId, 2);
    }
    this.board.removePiece(snap.playerPieceId, 1);

    SoundManager.playUndo();
    this.undoSnapshot = null;
    this.playableCacheDirty = true;
    this.selectedPieceId = snap.playerPieceId;
    this.rotation = 0;
    this.flipped = false;

    this.drawBoard();
    this.drawPlacedPieces();
    this.drawTray();
    this.drawControls();
    this.updateUI();
  }

  // ── Turn Management ──

  private async handlePass() {
    if (!this.canAct()) return;
    SoundManager.playPass();

    const myP = this.myDisplayPlayer();
    this.playerSkipped[myP - 1] = true;
    this.selectedPieceId = null;
    this.ghostGraphics.clear();

    if (!this.isMultiplayer) {
      this.undoSnapshot = null;
    }

    if (this.isMultiplayer && this.mp) {
      this.mp.sendPass(myP);
    }

    this.endTurn();
  }

  private endTurn() {
    if (this.board.isGameOver() || (this.playerSkipped[0] && this.playerSkipped[1])) {
      this.finishGame();
      return;
    }

    if (this.isMultiplayer) {
      this.currentPlayer = this.opponentPlayerNumber();
      this.updateUI();
      this.drawTray();
      this.drawControls();
      return;
    }

    // Single-player: AI turn
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;

    if (this.currentPlayer === 2) {
      this.isAiThinking = true;
      this.updateUI();
      this.time.delayedCall(500, () => {
        this.doAiTurn();
      });
    } else {
      this.playableCacheDirty = true;
      this.selectFirstAvailable();
      this.rotation = 0;
      this.flipped = false;
      this.drawTray();
      this.drawControls();
      this.updateUI();
    }
  }

  private doAiTurn() {
    const move = this.ai.chooseMove(this.board, 2);

    if (move) {
      this.board.placePiece(move.pieceId, move.cells, 2);
      this.playerSkipped[1] = false;

      if (this.undoSnapshot) {
        this.undoSnapshot.aiPieceId = move.pieceId;
        this.undoSnapshot.aiCells = move.cells.map(([r, c]): [number, number] => [r, c]);
      }

      SoundManager.playAiMove();

      for (const [r, c] of move.cells) {
        const flash = this.add.graphics();
        flash.fillStyle(0xffffff, 0.6);
        flash.fillRoundedRect(
          this.boardX + c * this.cellSize + 1,
          this.boardY + r * this.cellSize + 1,
          this.cellSize - 2,
          this.cellSize - 2,
          3,
        );
        this.tweens.add({
          targets: flash,
          alpha: 0,
          duration: 400,
          onComplete: () => flash.destroy(),
        });
      }

      this.drawPlacedPieces();
    } else {
      this.playerSkipped[1] = true;
    }

    this.isAiThinking = false;
    this.currentPlayer = 1;
    this.playableCacheDirty = true;

    if (this.board.isGameOver() || (this.playerSkipped[0] && this.playerSkipped[1])) {
      this.finishGame();
      return;
    }

    if (!this.board.hasValidMoves(1)) {
      this.playerSkipped[0] = true;
      if (this.playerSkipped[1]) {
        this.finishGame();
        return;
      }
      this.currentPlayer = 2;
      this.updateUI();
      this.time.delayedCall(500, () => {
        this.doAiTurn();
      });
      return;
    }

    this.selectFirstAvailable();
    this.rotation = 0;
    this.flipped = false;
    this.drawTray();
    this.drawControls();
    this.updateUI();
  }

  private finishGame() {
    this.gameOver = true;
    this.ghostGraphics.clear();
    this.undoSnapshot = null;

    const myP = this.myDisplayPlayer();
    const oppP = this.isMultiplayer ? this.opponentPlayerNumber() : 2;

    const myScore = this.board.calculateScore(myP);
    const oppScore = this.board.calculateScore(oppP);
    const myPlaced = this.board.getPiecesPlaced(myP);
    const oppPlaced = this.board.getPiecesPlaced(oppP);
    const won = myScore > oppScore;
    const perfect = (this.board.remainingPieces.get(myP)?.size ?? 1) === 0;

    SoundManager.playGameOver(won);

    if (this.isMultiplayer && this.mp) {
      const winnerPlayer = myScore > oppScore ? myP : (oppScore > myScore ? oppP : null);
      this.mp.sendGameOver(
        winnerPlayer,
        this.board.calculateScore(1),
        this.board.calculateScore(2),
      );
    }

    void this.submitResult(myScore, oppScore, myPlaced, won, perfect);

    this.cleanupMultiplayer();

    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('GameOver', {
        playerScore: myScore,
        aiScore: oppScore,
        playerPiecesPlaced: myPlaced,
        aiPiecesPlaced: oppPlaced,
        won,
        perfect,
        multiplayer: this.isMultiplayer,
        opponentName: this.opponentName,
      });
    });
  }

  private async submitResult(
    playerScore: number,
    aiScore: number,
    playerPiecesPlaced: number,
    won: boolean,
    perfect: boolean,
  ) {
    try {
      await fetch('/api/stats/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerScore, aiScore, playerPiecesPlaced, won, perfect }),
      });
    } catch {
      // non-fatal
    }
  }

  // ── UI ──

  private updateUI() {
    const { width } = this.scale;
    const sf = this.getSf();
    const padding = 10;

    const myP = this.myDisplayPlayer();
    const oppP = this.isMultiplayer ? this.opponentPlayerNumber() : 2;
    const myScore = this.board.calculateScore(myP);
    const oppScore = this.board.calculateScore(oppP);

    let turnLabel: string;
    if (this.isMultiplayer) {
      if (this.isMyTurn()) {
        turnLabel = `Your turn (${PLAYER_COLOR_NAMES[myP - 1]})`;
      } else {
        turnLabel = `${this.opponentName}'s turn...`;
      }
    } else {
      turnLabel = this.isAiThinking
        ? 'AI is thinking...'
        : this.currentPlayer === 1
          ? `Your turn (${PLAYER_COLOR_NAMES[0]})`
          : `AI turn (${PLAYER_COLOR_NAMES[1]})`;
    }

    const turnColor = this.isMyTurn()
      ? (myP === 1 ? '#4a90d9' : '#e8913a')
      : (myP === 1 ? '#e8913a' : '#4a90d9');

    this.turnText
      .setPosition(padding, 10)
      .setText(turnLabel)
      .setFontSize(Math.round(16 * sf))
      .setColor(turnColor);

    const oppLabel = this.isMultiplayer ? this.opponentName : 'AI';
    this.scoreText
      .setPosition(width - padding, 10)
      .setOrigin(1, 0)
      .setText(`You: ${myScore}  |  ${oppLabel}: ${oppScore}`)
      .setFontSize(Math.round(13 * sf));

    let statusMsg: string;
    if (!this.canAct()) {
      statusMsg = this.isMultiplayer ? `Waiting for ${this.opponentName}...` : '';
    } else if (this.selectedPieceId) {
      const pName = PIECE_DEFINITIONS.find((p) => p.id === this.selectedPieceId)?.name ?? '';
      const deg = this.rotation * 90;
      const orient = deg === 0 && !this.flipped
        ? ''
        : `${deg}°${this.flipped ? ' flipped' : ''}`;
      statusMsg = orient ? `${pName}  (${orient})` : pName;
    } else {
      statusMsg = 'Tap a piece below to select';
    }

    this.statusText
      .setPosition(width / 2, this.trayAreaY - Math.round(16 * sf))
      .setOrigin(0.5, 1)
      .setText(statusMsg)
      .setFontSize(Math.round(11 * sf));

    this.children.list
      .filter((c) => c instanceof Phaser.GameObjects.Text && c.getData('_ctrlLabel'))
      .forEach((c) => c.destroy());
    this.drawControls();
  }

  shutdown(): void {
    this.cleanupMultiplayer();
  }
}
