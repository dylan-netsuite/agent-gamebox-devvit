export type CharacterDrawFn = (
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
  facingRight: boolean,
  teamColor: number,
) => void;
