export type GameMode = "title" | "field" | "dialogue" | "battle" | "gameover";

export type Direction = "up" | "down" | "left" | "right";

export type Action = Direction | "confirm" | "cancel";

export type TileId = "floor" | "grass" | "path" | "wall" | "water";

export type EntityType = "player" | "npc" | "enemy" | "object";

export type BattleCommand = "fight" | "magic" | "item" | "run";

export type BattleMenu = "main" | "attack" | "magic";

export type BattleSkillId =
  | "tempestAttack"
  | "debugSlash"
  | "fractureBlade"
  | "magicSwordIris"
  | "myonusBlade"
  | "hyperSlash"
  | "seraphSwordPlus"
  | "tempestWave"
  | "debugBeam"
  | "disruptorRay"
  | "solidBlood"
  | "dominusGrail"
  | "snowMan"
  | "fujinDance";

export interface GridPoint {
  x: number;
  y: number;
}

export interface ScreenPoint {
  x: number;
  y: number;
}

export interface Stats {
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  exp: number;
  level: number;
}

export interface EntityBase {
  id: string;
  name: string;
  type: EntityType;
  x: number;
  y: number;
  spriteId?: string;
}

export interface Player extends EntityBase {
  type: "player";
  facing: Direction;
  stats: Stats;
  nextLevelExp: number;
  potions: number;
  unlockedSkills: BattleSkillId[];
}

export interface Npc extends EntityBase {
  type: "npc";
  mapId: string;
  dialogue: string[];
}

export interface EnemySymbol extends EntityBase {
  type: "enemy";
  mapId: string;
  enemyId: string;
  defeated: boolean;
}

export interface MapObject extends EntityBase {
  type: "object";
  mapId: string;
  objectKind: "chest" | "puzzle" | "monolith";
  opened: boolean;
  message?: string;
  unlockSkills?: BattleSkillId[];
  puzzleKey?: "ode" | "return";
}

export interface TileDefinition {
  id: TileId;
  name: string;
  walkable: boolean;
}

export interface GameMap {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: TileId[][];
}

export interface EnemyDefinition {
  id: string;
  name: string;
  stats: Stats;
  rewardExp: number;
  spriteId?: string;
  unlockSkills?: BattleSkillId[];
  startBuff?: {
    name: string;
    attackBonus: number;
  };
  actionCount?: {
    min: number;
    max: number;
  };
  preBattleLines?: {
    default: string[];
    missingChest: string[];
  };
  postBattleLines?: string[];
}

export interface BattleEnemy {
  symbolId?: string;
  definitionId: string;
  name: string;
  stats: Stats;
  rewardExp: number;
  spriteId?: string;
  unlockSkills?: BattleSkillId[];
  buffs: string[];
  attackBonus: number;
  actionCount: {
    min: number;
    max: number;
  };
  postBattleLines?: string[];
}

export interface BattleEffect {
  skillId: BattleSkillId;
  startedAt: number;
  durationMs: number;
}

export interface EncounterState {
  steps: number;
  target: number;
}

export interface PuzzleState {
  moonGateStep: "none" | "ode";
  moonGateSolved: boolean;
}

export interface DialogueState {
  speakerName: string;
  lines: string[];
  lineIndex: number;
}

export interface PendingBattle {
  enemyId: string;
  symbolId?: string;
}

export type BattlePhase = "intro" | "command" | "message" | "victory" | "defeat";

export type BattleOutcome = "command" | "victory" | "defeat" | "escaped";

export interface BattleState {
  enemy: BattleEnemy;
  commandIndex: number;
  menu: BattleMenu;
  effect?: BattleEffect;
  playerAttackBonus: number;
  phase: BattlePhase;
  messages: string[];
  currentMessage: string;
  nextOutcome: BattleOutcome;
}

export interface GameState {
  mode: GameMode;
  map: GameMap;
  player: Player;
  npcs: Npc[];
  enemies: EnemySymbol[];
  objects: MapObject[];
  encounter: EncounterState;
  puzzle: PuzzleState;
  selectedTile?: GridPoint;
  autoPath: GridPoint[];
  dialogue?: DialogueState;
  pendingBattle?: PendingBattle;
  battle?: BattleState;
  fieldMessage: string;
  lastMoveAt: number;
}
