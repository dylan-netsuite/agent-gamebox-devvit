import type { CharacterDrawFn } from './types';
import { drawBananaSam } from './drawBananaSam';
import { drawTurtleTank } from './drawTurtleTank';
import { drawHastronaut } from './drawHastronaut';
import { drawFishAttawater } from './drawFishAttawater';
import { drawHighNoonSnoo } from './drawHighNoonSnoo';
import { drawProfessorOrange } from './drawProfessorOrange';

const registry = new Map<string, CharacterDrawFn>();

registry.set('banana-sam', drawBananaSam);
registry.set('turtle-tank', drawTurtleTank);
registry.set('hastronaut', drawHastronaut);
registry.set('fish-attawater', drawFishAttawater);
registry.set('high-noon-snoo', drawHighNoonSnoo);
registry.set('professor-orange', drawProfessorOrange);

export function getCharacterDraw(id: string): CharacterDrawFn {
  return registry.get(id) ?? drawBananaSam;
}

export function drawCharacterPreview(
  g: Phaser.GameObjects.Graphics,
  characterId: string,
  cx: number,
  cy: number,
  scale: number,
  facingRight: boolean,
  teamColor: number,
): void {
  const w = 16 * scale;
  const h = 20 * scale;
  const x = cx - w / 2;
  const y = cy - h / 2;
  getCharacterDraw(characterId)(g, x, y, w, h, facingRight, teamColor);
}
