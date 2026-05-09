export type GameMode = 'title' | 'field' | 'dialogue' | 'battle' | 'gameover';

export type TileType = 'wall' | 'floor' | 'grass' | 'road';

export type SpriteId = string | null;

export interface Entity {
  id: string;
  name: string;
  x: number;
  y: number;
  spriteId: SpriteId;
}

export interface Player extends Entity {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  exp: number;
  level: number;
}

export interface Npc extends Entity {
  dialogue: string;
}

export interface Enemy extends Entity {
  maxHp: number;
  hp: number;
  atk: number;
  def: number;
  expReward: number;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileType[];
}

export interface BattleState {
  enemy: Enemy;
  messages: string[];
  awaitingInput: boolean;
}

export interface GameState {
  mode: GameMode;
  map: GameMap;
  player: Player;
  npcs: Npc[];
  enemies: Enemy[];
  moveTarget: { x: number; y: number } | null;
  dialogueText: string;
  battle: BattleState | null;
  messageLog: string[];
}
