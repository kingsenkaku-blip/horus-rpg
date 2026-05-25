import { MAP_X, MAP_Y, TILE_SIZE } from "./layout";
import {
  ENEMY_DEFINITIONS,
  INITIAL_ENEMIES,
  INITIAL_NPCS,
  INITIAL_OBJECTS,
  KAMJIN_MAP,
  PUZZLE_MAP,
  RAIDIA_MAP,
  RANDOM_ENCOUNTER_ENEMY_IDS,
  TEST_MAP,
  VAMPIRE_MAP,
  isWalkable
} from "./map";
import type {
  BattleCommand,
  BattleEnemy,
  BattleMenu,
  BattleOutcome,
  BattleSkillId,
  BattleState,
  Direction,
  EnemySymbol,
  GameState,
  GridPoint,
  MapObject,
  Npc,
  PendingBattle,
  Player,
  ScreenPoint,
  Stats
} from "./types";
import type { InputController } from "./input";

export interface BattleMenuOption {
  id: BattleCommand | BattleSkillId;
  label: string;
}

interface BattleSkill extends BattleMenuOption {
  id: BattleSkillId;
  kind: "attack" | "magic";
  power: number;
  bonus: number;
  attackBuffGain?: number;
  healRatio?: number;
}

export const BATTLE_COMMANDS: BattleMenuOption[] = [
  { id: "fight", label: "戦闘" },
  { id: "magic", label: "魔法" },
  { id: "item", label: "道具" },
  { id: "run", label: "逃げる" }
];

export const ATTACK_COMMANDS: BattleSkill[] = [
  { id: "tempestAttack", label: "テンペストアタック", kind: "attack", power: 1.35, bonus: 2 },
  { id: "debugSlash", label: "デバッグ斬", kind: "attack", power: 1.15, bonus: 1 },
  { id: "fractureBlade", label: "フラクチャーブレイド", kind: "attack", power: 1.75, bonus: 4 },
  { id: "magicSwordIris", label: "魔法剣・アイリス", kind: "attack", power: 1.25, bonus: 3, attackBuffGain: 5 },
  { id: "myonusBlade", label: "ミョニュスブレイド", kind: "attack", power: 2.05, bonus: 8 },
  { id: "hyperSlash", label: "ハイパースラッシュ", kind: "attack", power: 2.4, bonus: 12 },
  { id: "seraphSwordPlus", label: "熾天使の剣＋", kind: "attack", power: 99, bonus: 9999, attackBuffGain: 999 }
];

export const MAGIC_COMMANDS: BattleSkill[] = [
  { id: "tempestWave", label: "テンペストウェイブ", kind: "magic", power: 1.45, bonus: 3 },
  { id: "debugBeam", label: "デバッグビーム", kind: "magic", power: 1.7, bonus: 1 },
  { id: "disruptorRay", label: "ディスラプターレイ", kind: "magic", power: 2.0, bonus: 3 },
  { id: "solidBlood", label: "ソリッドブラッド", kind: "magic", power: 3.0, bonus: 0, healRatio: 0.5 },
  { id: "dominusGrail", label: "ドミナスグレイル", kind: "magic", power: 2.5, bonus: 10 },
  { id: "snowMan", label: "スノウ・マン", kind: "magic", power: 1.95, bonus: 14 },
  { id: "fujinDance", label: "風神の乱舞", kind: "magic", power: 2.8, bonus: 8 }
];

const MOVE_INTERVAL_MS = 140;
const ENCOUNTER_MIN_STEPS = 7;
const ENCOUNTER_MAX_STEPS = 14;

const directionVectors: Record<Direction, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 }
};

type MoveResult = "moved" | "blocked" | "battle";

export function getBattleMenuOptions(menu: BattleMenu, player: Player): BattleMenuOption[] {
  if (menu === "attack") {
    return getUnlockedBattleSkills(ATTACK_COMMANDS, player);
  }

  if (menu === "magic") {
    return getUnlockedBattleSkills(MAGIC_COMMANDS, player);
  }

  return BATTLE_COMMANDS;
}

export function getBattleMenuTitle(menu: BattleMenu): string {
  if (menu === "attack") {
    return "攻撃を選べ。";
  }

  if (menu === "magic") {
    return "魔法を選べ。";
  }

  return "どうする？";
}

export function createTitleState(): GameState {
  return {
    mode: "title",
    map: TEST_MAP,
    player: createPlayer(),
    npcs: cloneNpcs(INITIAL_NPCS),
    enemies: cloneEnemies(INITIAL_ENEMIES),
    objects: cloneObjects(INITIAL_OBJECTS),
    encounter: createEncounterState(),
    puzzle: createPuzzleState(),
    autoPath: [],
    fieldMessage: "",
    lastMoveAt: 0
  };
}

export function createNewGameState(): GameState {
  return {
    mode: "field",
    map: TEST_MAP,
    player: createPlayer(),
    npcs: cloneNpcs(INITIAL_NPCS),
    enemies: cloneEnemies(INITIAL_ENEMIES),
    objects: cloneObjects(INITIAL_OBJECTS),
    encounter: createEncounterState(),
    puzzle: createPuzzleState(),
    autoPath: [],
    fieldMessage: "平原に出た。歩いていると敵にエンカウントする。",
    lastMoveAt: 0
  };
}

export function updateGame(state: GameState, input: InputController, now: number): GameState {
  switch (state.mode) {
    case "title":
      if (input.consumeAction("confirm")) {
        return createNewGameState();
      }
      return state;
    case "field":
      updateField(state, input, now);
      return state;
    case "dialogue":
      updateDialogue(state, input);
      return state;
    case "battle":
      updateBattle(state, input, now);
      return state;
    case "gameover":
      if (input.consumeAction("confirm")) {
        return createTitleState();
      }
      return state;
  }
}

function createPlayer(): Player {
  return {
    id: "player",
    name: "デバッグくん",
    type: "player",
    x: 2,
    y: 10,
    facing: "down",
    stats: {
      hp: 34,
      maxHp: 34,
      attack: 9,
      defense: 4,
      exp: 0,
      level: 1
    },
    nextLevelExp: 20,
    potions: 1,
    unlockedSkills: ["tempestAttack", "debugSlash", "tempestWave", "debugBeam"]
  };
}

function createEncounterState(): { steps: number; target: number } {
  return {
    steps: 0,
    target: rollEncounterTarget()
  };
}

function createPuzzleState(): { moonGateStep: "none" | "ode"; moonGateSolved: boolean } {
  return {
    moonGateStep: "none",
    moonGateSolved: false
  };
}

function cloneNpcs(npcs: Npc[]): Npc[] {
  return npcs.map((npc) => ({ ...npc, dialogue: [...npc.dialogue] }));
}

function cloneEnemies(enemies: EnemySymbol[]): EnemySymbol[] {
  return enemies.map((enemy) => ({ ...enemy }));
}

function cloneObjects(objects: MapObject[]): MapObject[] {
  return objects.map((object) => ({
    ...object,
    unlockSkills: object.unlockSkills ? [...object.unlockSkills] : undefined
  }));
}

function updateField(state: GameState, input: InputController, now: number): void {
  const click = input.consumeClick();
  if (click) {
    handleFieldClick(state, click);
  }

  if (input.consumeAction("confirm")) {
    state.autoPath = [];
    const npc = getFacingNpc(state);
    if (npc) {
      state.dialogue = {
        speakerName: npc.name,
        lines: npc.dialogue,
        lineIndex: 0
      };
      state.mode = "dialogue";
      state.fieldMessage = "";
      return;
    }

    const object = getFacingObject(state);
    if (object) {
      interactWithObject(state, object);
      return;
    }

    if (tryFindHiddenSeraphSword(state)) {
      return;
    }

    state.fieldMessage = "そこには何もない。";
  }

  const heldDirection = input.getHeldDirection();
  if (heldDirection) {
    state.autoPath = [];
    state.selectedTile = undefined;
    if (now - state.lastMoveAt >= MOVE_INTERVAL_MS) {
      state.lastMoveAt = now;
      tryMove(state, heldDirection);
    }
    return;
  }

  if (state.autoPath.length > 0 && now - state.lastMoveAt >= MOVE_INTERVAL_MS) {
    state.lastMoveAt = now;
    followAutoPath(state);
  }
}

function handleFieldClick(state: GameState, click: ScreenPoint): void {
  const target = screenPointToMapTile(state, click);
  if (!target) {
    return;
  }

  state.selectedTile = target;
  const enemyTarget = getEnemyAt(state, target.x, target.y);
  const npcTarget = getNpcAt(state, target.x, target.y);
  const objectTarget = getObjectAt(state, target.x, target.y);
  const path = npcTarget || objectTarget
    ? findPathToNpc(state, target)
    : findPath(state, target, Boolean(enemyTarget));

  if (!path) {
    state.autoPath = [];
    state.fieldMessage = "そこへは行けない。";
    return;
  }

  state.autoPath = path;
  if (path.length === 0) {
    state.fieldMessage = "ここにいる。";
    return;
  }

  state.fieldMessage = npcTarget || objectTarget
    ? `${(npcTarget ?? objectTarget)?.name}の近くへ移動する。`
    : "目的地へ移動する。";
}

function screenPointToMapTile(state: GameState, point: ScreenPoint): GridPoint | undefined {
  const x = Math.floor((point.x - MAP_X) / TILE_SIZE);
  const y = Math.floor((point.y - MAP_Y) / TILE_SIZE);

  if (x < 0 || y < 0 || x >= state.map.width || y >= state.map.height) {
    return undefined;
  }

  return { x, y };
}

function followAutoPath(state: GameState): void {
  const next = state.autoPath[0];
  if (!next) {
    return;
  }

  const direction = directionToPoint(state.player, next);
  if (!direction) {
    state.autoPath.shift();
    return;
  }

  const result = tryMove(state, direction);
  if (result === "moved") {
    state.autoPath.shift();
    if (state.autoPath.length === 0) {
      finishAutoMove(state);
    }
    return;
  }

  state.autoPath = [];
  if (result === "battle") {
    state.selectedTile = undefined;
  }
}

function finishAutoMove(state: GameState): void {
  const selectedTile = state.selectedTile;
  if (!selectedTile) {
    return;
  }

  const npc = getNpcAt(state, selectedTile.x, selectedTile.y);
  if (npc && isAdjacent(state.player, selectedTile)) {
    faceToward(state.player, selectedTile);
    state.fieldMessage = `${npc.name}の前に着いた。決定キーで話しかけられる。`;
    return;
  }

  const object = getObjectAt(state, selectedTile.x, selectedTile.y);
  if (object && isAdjacent(state.player, selectedTile)) {
    faceToward(state.player, selectedTile);
    state.fieldMessage = `${object.name}の前に着いた。決定キーで調べられる。`;
    return;
  }

  if (state.player.x === selectedTile.x && state.player.y === selectedTile.y) {
    state.fieldMessage = "目的地に着いた。";
  }
}

function tryMove(state: GameState, direction: Direction): MoveResult {
  state.player.facing = direction;
  const { dx, dy } = directionVectors[direction];
  const nextX = state.player.x + dx;
  const nextY = state.player.y + dy;

  if (tryMapTransition(state, nextX, nextY)) {
    return "moved";
  }

  const enemy = getEnemyAt(state, nextX, nextY);

  if (enemy) {
    startBattleOrDialogue(state, enemy);
    return "battle";
  }

  if (getNpcAt(state, nextX, nextY)) {
    state.fieldMessage = "人がいる。決定キーで話しかけられる。";
    return "blocked";
  }

  const object = getObjectAt(state, nextX, nextY);
  if (object) {
    state.fieldMessage = `${object.name}がある。決定キーで調べられる。`;
    return "blocked";
  }

  if (!isWalkable(state.map, nextX, nextY)) {
    state.fieldMessage = "これ以上は進めない。";
    return "blocked";
  }

  state.player.x = nextX;
  state.player.y = nextY;
  state.fieldMessage = "";
  if (advanceEncounter(state)) {
    return "battle";
  }
  return "moved";
}

function tryMapTransition(state: GameState, nextX: number, nextY: number): boolean {
  if (state.map.id === TEST_MAP.id && nextY < 0 && nextX >= 8 && nextX <= 10) {
    state.map = VAMPIRE_MAP;
    state.player.x = 9;
    state.player.y = VAMPIRE_MAP.height - 2;
    state.selectedTile = undefined;
    state.autoPath = [];
    resetEncounter(state);
    state.fieldMessage = "月蝕の古道へ入った。右の方には宝箱が見える。";
    return true;
  }

  if (state.map.id === TEST_MAP.id && nextX >= state.map.width && nextY >= 8 && nextY <= 10) {
    state.map = PUZZLE_MAP;
    state.player.x = 1;
    state.player.y = 8;
    state.selectedTile = undefined;
    state.autoPath = [];
    resetEncounter(state);
    state.fieldMessage = "頌帰の庭へ入った。碑は頌歌と帰源を求めている。";
    return true;
  }

  if (state.map.id === PUZZLE_MAP.id && nextX < 0 && nextY === 8) {
    state.map = TEST_MAP;
    state.player.x = TEST_MAP.width - 2;
    state.player.y = 9;
    state.selectedTile = undefined;
    state.autoPath = [];
    resetEncounter(state);
    state.fieldMessage = "はじまりの平原へ戻った。";
    return true;
  }

  if (state.map.id === PUZZLE_MAP.id && nextX >= state.map.width && nextY === 8) {
    if (!state.puzzle.moonGateSolved) {
      state.fieldMessage = "奥へ進むには、頌歌と帰源を正しく結ぶ必要がある。";
      return true;
    }

    state.map = RAIDIA_MAP;
    state.player.x = 1;
    state.player.y = 8;
    state.selectedTile = undefined;
    state.autoPath = [];
    resetEncounter(state);
    state.fieldMessage = "蒼月の奥殿へ踏み込んだ。";
    return true;
  }

  if (state.map.id === RAIDIA_MAP.id && nextX < 0 && nextY === 8) {
    state.map = PUZZLE_MAP;
    state.player.x = PUZZLE_MAP.width - 2;
    state.player.y = 8;
    state.selectedTile = undefined;
    state.autoPath = [];
    resetEncounter(state);
    state.fieldMessage = "頌帰の庭へ戻った。";
    return true;
  }

  if (state.map.id === RAIDIA_MAP.id && nextX >= state.map.width && nextY === 8) {
    state.map = KAMJIN_MAP;
    state.player.x = 1;
    state.player.y = 8;
    state.selectedTile = undefined;
    state.autoPath = [];
    resetEncounter(state);
    state.fieldMessage = "半壊したカムジンの村へ入った。蹂躙埜戦姫の爪痕が残っている。";
    return true;
  }

  if (state.map.id === KAMJIN_MAP.id && nextX < 0 && nextY === 8) {
    state.map = RAIDIA_MAP;
    state.player.x = RAIDIA_MAP.width - 2;
    state.player.y = 8;
    state.selectedTile = undefined;
    state.autoPath = [];
    resetEncounter(state);
    state.fieldMessage = "蒼月の奥殿へ戻った。";
    return true;
  }

  if (state.map.id === VAMPIRE_MAP.id && nextY >= state.map.height && nextX >= 8 && nextX <= 10) {
    state.map = TEST_MAP;
    state.player.x = 9;
    state.player.y = 1;
    state.selectedTile = undefined;
    state.autoPath = [];
    resetEncounter(state);
    state.fieldMessage = "はじまりの平原へ戻った。";
    return true;
  }

  return false;
}

function advanceEncounter(state: GameState): boolean {
  if (state.map.id !== TEST_MAP.id) {
    return false;
  }

  state.encounter.steps += 1;
  if (state.encounter.steps < state.encounter.target) {
    return false;
  }

  const enemyId = pickRandomEncounterEnemyId();
  resetEncounter(state);
  startBattleByEnemyId(state, enemyId);
  return true;
}

function resetEncounter(state: GameState): void {
  state.encounter.steps = 0;
  state.encounter.target = rollEncounterTarget();
}

function rollEncounterTarget(): number {
  const width = ENCOUNTER_MAX_STEPS - ENCOUNTER_MIN_STEPS + 1;
  return ENCOUNTER_MIN_STEPS + Math.floor(Math.random() * width);
}

function pickRandomEncounterEnemyId(): string {
  const index = Math.floor(Math.random() * RANDOM_ENCOUNTER_ENEMY_IDS.length);
  return RANDOM_ENCOUNTER_ENEMY_IDS[index];
}

function findPathToNpc(state: GameState, npcPoint: GridPoint): GridPoint[] | undefined {
  const candidates = Object.values(directionVectors)
    .map(({ dx, dy }) => ({ x: npcPoint.x + dx, y: npcPoint.y + dy }))
    .filter((point) => isAutoStepAllowed(state, point, point, false));

  let bestPath: GridPoint[] | undefined;
  for (const candidate of candidates) {
    const path = findPath(state, candidate, false);
    if (path && (!bestPath || path.length < bestPath.length)) {
      bestPath = path;
    }
  }

  return bestPath;
}

function findPath(state: GameState, target: GridPoint, allowEnemyTarget: boolean): GridPoint[] | undefined {
  const start = { x: state.player.x, y: state.player.y };
  if (start.x === target.x && start.y === target.y) {
    return [];
  }

  const queue: { point: GridPoint; path: GridPoint[] }[] = [{ point: start, path: [] }];
  const visited = new Set<string>([pointKey(start)]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    for (const { dx, dy } of Object.values(directionVectors)) {
      const next = { x: current.point.x + dx, y: current.point.y + dy };
      if (visited.has(pointKey(next)) || !isAutoStepAllowed(state, next, target, allowEnemyTarget)) {
        continue;
      }

      const path = [...current.path, next];
      if (next.x === target.x && next.y === target.y) {
        return path;
      }

      visited.add(pointKey(next));
      queue.push({ point: next, path });
    }
  }

  return undefined;
}

function isAutoStepAllowed(
  state: GameState,
  point: GridPoint,
  target: GridPoint,
  allowEnemyTarget: boolean
): boolean {
  if (!isWalkable(state.map, point.x, point.y)) {
    return false;
  }

  if (getNpcAt(state, point.x, point.y) || getObjectAt(state, point.x, point.y)) {
    return false;
  }

  const enemy = getEnemyAt(state, point.x, point.y);
  const isTarget = point.x === target.x && point.y === target.y;
  return !enemy || (allowEnemyTarget && isTarget);
}

function pointKey(point: GridPoint): string {
  return `${point.x},${point.y}`;
}

function directionToPoint(player: Player, point: GridPoint): Direction | undefined {
  const dx = point.x - player.x;
  const dy = point.y - player.y;

  if (dx === 1 && dy === 0) {
    return "right";
  }
  if (dx === -1 && dy === 0) {
    return "left";
  }
  if (dx === 0 && dy === 1) {
    return "down";
  }
  if (dx === 0 && dy === -1) {
    return "up";
  }

  return undefined;
}

function getFacingNpc(state: GameState): Npc | undefined {
  const { dx, dy } = directionVectors[state.player.facing];
  return getNpcAt(state, state.player.x + dx, state.player.y + dy);
}

function getFacingObject(state: GameState): MapObject | undefined {
  const { dx, dy } = directionVectors[state.player.facing];
  return getObjectAt(state, state.player.x + dx, state.player.y + dy);
}

function getNpcAt(state: GameState, x: number, y: number): Npc | undefined {
  return state.npcs.find((npc) => npc.mapId === state.map.id && npc.x === x && npc.y === y);
}

function getObjectAt(state: GameState, x: number, y: number): MapObject | undefined {
  return state.objects.find(
    (object) => object.mapId === state.map.id && !object.opened && object.x === x && object.y === y
  );
}

function getEnemyAt(state: GameState, x: number, y: number): EnemySymbol | undefined {
  return state.enemies.find(
    (enemy) => enemy.mapId === state.map.id && !enemy.defeated && enemy.x === x && enemy.y === y
  );
}

function isAdjacent(player: Player, point: GridPoint): boolean {
  return Math.abs(player.x - point.x) + Math.abs(player.y - point.y) === 1;
}

function faceToward(player: Player, point: GridPoint): void {
  const direction = directionToPoint(player, point);
  if (direction) {
    player.facing = direction;
  }
}

function updateDialogue(state: GameState, input: InputController): void {
  if (!state.dialogue) {
    state.mode = "field";
    return;
  }

  if (input.consumeAction("cancel")) {
    state.dialogue = undefined;
    state.pendingBattle = undefined;
    state.mode = "field";
    return;
  }

  if (!input.consumeAction("confirm")) {
    return;
  }

  if (state.dialogue.lineIndex < state.dialogue.lines.length - 1) {
    state.dialogue.lineIndex += 1;
    return;
  }

  state.dialogue = undefined;
  if (state.pendingBattle) {
    const pendingBattle = state.pendingBattle;
    state.pendingBattle = undefined;
    startBattleByPending(state, pendingBattle);
    return;
  }

  state.mode = "field";
}

function interactWithObject(state: GameState, object: MapObject): void {
  if (object.objectKind === "puzzle") {
    interactWithPuzzle(state, object);
    return;
  }

  if (object.objectKind === "monolith") {
    state.fieldMessage = object.message ?? `${object.name}には、読めない文字が刻まれている。`;
    return;
  }

  if (object.opened) {
    state.fieldMessage = "宝箱は空だ。";
    return;
  }

  object.opened = true;
  const learned = (object.unlockSkills ?? []).filter((skillId) => !state.player.unlockedSkills.includes(skillId));
  state.player.unlockedSkills.push(...learned);
  state.fieldMessage = learned.length > 0
    ? `${object.name}を調べた。${formatSkillLabels(learned)}を覚えた。`
    : `${object.name}を開けた。中は空だった。`;
}

function interactWithPuzzle(state: GameState, object: MapObject): void {
  if (state.puzzle.moonGateSolved) {
    state.fieldMessage = "二つの碑は静かに月光を返している。奥への道は開いている。";
    return;
  }

  if (object.puzzleKey === "ode") {
    state.puzzle.moonGateStep = "ode";
    state.fieldMessage = "頌歌の碑が鳴った。「讃えよ、失われた月を」";
    return;
  }

  if (object.puzzleKey === "return" && state.puzzle.moonGateStep === "ode") {
    state.puzzle.moonGateSolved = true;
    state.puzzle.moonGateStep = "none";
    state.fieldMessage = "帰源の碑が応えた。頌歌は帰源へ至り、奥への道が開いた。";
    return;
  }

  state.puzzle.moonGateStep = "none";
  state.fieldMessage = "帰源の碑は沈黙している。先に頌歌を響かせる必要がある。";
}

function tryFindHiddenSeraphSword(state: GameState): boolean {
  if (state.map.id !== TEST_MAP.id || state.player.x < 16 || state.player.y > 2) {
    return false;
  }

  if (state.player.unlockedSkills.includes("seraphSwordPlus")) {
    state.fieldMessage = "右上にはもう何もない。";
    return true;
  }

  state.player.unlockedSkills.push("seraphSwordPlus");
  state.fieldMessage = "何もない空間から熾天使の剣＋を入手した。攻撃コマンドに追加された。";
  return true;
}

function startBattleOrDialogue(state: GameState, enemySymbol: EnemySymbol): void {
  const definition = ENEMY_DEFINITIONS[enemySymbol.enemyId];
  if (!definition.preBattleLines) {
    startBattleByEnemyId(state, enemySymbol.enemyId, enemySymbol.id);
    return;
  }

  const hasOpenedChest = state.objects.some((object) => object.id === "iris-blood-chest" && object.opened);
  const lines = definition.id === "vampirePrince" && definition.preBattleLines
    ? hasOpenedChest ? definition.preBattleLines.default : definition.preBattleLines.missingChest
    : definition.preBattleLines.default;
  state.pendingBattle = {
    enemyId: enemySymbol.enemyId,
    symbolId: enemySymbol.id
  };
  state.dialogue = {
    speakerName: definition.name,
    lines,
    lineIndex: 0
  };
  state.mode = "dialogue";
  state.autoPath = [];
  state.selectedTile = undefined;
  state.fieldMessage = "";
}

function startBattleByPending(state: GameState, pendingBattle: PendingBattle): void {
  startBattleByEnemyId(state, pendingBattle.enemyId, pendingBattle.symbolId);
}

function startBattleByEnemyId(state: GameState, enemyId: string, symbolId?: string): void {
  const definition = ENEMY_DEFINITIONS[enemyId];
  const battleEnemy: BattleEnemy = {
    symbolId,
    definitionId: definition.id,
    name: definition.name,
    stats: cloneStats(definition.stats),
    rewardExp: definition.rewardExp,
    spriteId: definition.spriteId,
    unlockSkills: definition.unlockSkills ? [...definition.unlockSkills] : undefined,
    buffs: definition.startBuff ? [definition.startBuff.name] : [],
    attackBonus: definition.startBuff?.attackBonus ?? 0,
    actionCount: definition.actionCount ?? { min: 1, max: 1 },
    postBattleLines: definition.postBattleLines ? [...definition.postBattleLines] : undefined
  };
  const introMessages = definition.startBuff
    ? [`${battleEnemy.name}は「${definition.startBuff.name}」を得た。`]
    : [];

  state.battle = {
    enemy: battleEnemy,
    commandIndex: 0,
    menu: "main",
    playerAttackBonus: 0,
    phase: "intro",
    messages: introMessages,
    currentMessage: `${battleEnemy.name}があらわれた。`,
    nextOutcome: "command"
  };
  state.mode = "battle";
  state.autoPath = [];
  state.selectedTile = undefined;
  state.fieldMessage = "";
}

function updateBattle(state: GameState, input: InputController, now: number): void {
  const battle = state.battle;
  if (!battle) {
    state.mode = "field";
    return;
  }

  if (battle.phase === "command") {
    const options = getBattleMenuOptions(battle.menu, state.player);
    if (input.consumeAction("up")) {
      battle.commandIndex = (battle.commandIndex + options.length - 1) % options.length;
    } else if (input.consumeAction("down")) {
      battle.commandIndex = (battle.commandIndex + 1) % options.length;
    } else if (input.consumeAction("cancel")) {
      cancelBattleSelection(battle);
    } else if (input.consumeAction("confirm")) {
      confirmBattleSelection(state, battle, now);
    }
    return;
  }

  if (input.consumeAction("confirm", "cancel")) {
    if (battle.effect && now < battle.effect.startedAt + battle.effect.durationMs) {
      return;
    }
    battle.effect = undefined;
    advanceBattleMessage(state, battle);
  }
}

function cancelBattleSelection(battle: BattleState): void {
  if (battle.menu === "main") {
    battle.commandIndex = BATTLE_COMMANDS.length - 1;
    return;
  }

  battle.menu = "main";
  battle.commandIndex = 0;
  battle.currentMessage = getBattleMenuTitle("main");
}

function confirmBattleSelection(state: GameState, battle: BattleState, now: number): void {
  if (battle.menu === "attack") {
    resolveBattleSkill(state, getUnlockedBattleSkills(ATTACK_COMMANDS, state.player)[battle.commandIndex], now);
    return;
  }

  if (battle.menu === "magic") {
    resolveBattleSkill(state, getUnlockedBattleSkills(MAGIC_COMMANDS, state.player)[battle.commandIndex], now);
    return;
  }

  const command = BATTLE_COMMANDS[battle.commandIndex].id as BattleCommand;
  if (command === "fight") {
    battle.menu = "attack";
    battle.commandIndex = 0;
    battle.currentMessage = getBattleMenuTitle("attack");
    return;
  }

  if (command === "magic") {
    battle.menu = "magic";
    battle.commandIndex = 0;
    battle.currentMessage = getBattleMenuTitle("magic");
    return;
  }

  resolveBattleCommand(state, command);
}

function resolveBattleCommand(state: GameState, command: BattleCommand): void {
  const battle = state.battle;
  if (!battle) {
    return;
  }

  const messages: string[] = [];
  let outcome: BattleOutcome = "command";

  if (command === "item") {
    if (state.player.potions > 0 && state.player.stats.hp < state.player.stats.maxHp) {
      state.player.potions -= 1;
      const recovered = Math.min(18, state.player.stats.maxHp - state.player.stats.hp);
      state.player.stats.hp += recovered;
      messages.push(`薬草を使った。HPが${recovered}回復した。`);
    } else if (state.player.potions > 0) {
      messages.push("今は道具を使う必要がない。");
    } else {
      messages.push("使える道具がない。");
    }
    enemyAttack(state, messages);
    outcome = state.player.stats.hp <= 0 ? "defeat" : "command";
  }

  if (command === "run") {
    if (Math.random() < 0.55) {
      messages.push("うまく逃げきった。");
      outcome = "escaped";
    } else {
      messages.push("逃げられなかった。");
      enemyAttack(state, messages);
      outcome = state.player.stats.hp <= 0 ? "defeat" : "command";
    }
  }

  setBattleMessages(battle, messages, outcome);
}

function resolveBattleSkill(state: GameState, skill: BattleSkill, now: number): void {
  const battle = state.battle;
  if (!battle) {
    return;
  }

  const messages: string[] = [];
  let outcome: BattleOutcome = "command";
  battle.effect = {
    skillId: skill.id,
    startedAt: now,
    durationMs: getSkillEffectDuration(skill.id)
  };
  if (skill.attackBuffGain) {
    battle.playerAttackBonus += skill.attackBuffGain;
    messages.push(`${skill.label}が虹色に脈打つ。攻撃力が${skill.attackBuffGain}上がった。`);
  }

  const playerStats = {
    ...state.player.stats,
    attack: state.player.stats.attack + battle.playerAttackBonus
  };
  const damage = calculateSkillDamage(playerStats, battle.enemy.stats, skill.power, skill.bonus);
  battle.enemy.stats.hp = Math.max(0, battle.enemy.stats.hp - damage);
  const verb = skill.kind === "magic" ? "を放った" : "をくりだした";
  messages.push(`${state.player.name}は${skill.label}${verb}。${battle.enemy.name}に${damage}のダメージ。`);
  if (skill.healRatio) {
    const recovered = Math.min(
      state.player.stats.maxHp - state.player.stats.hp,
      Math.max(1, Math.floor(damage * skill.healRatio))
    );
    state.player.stats.hp += recovered;
    messages.push(`血の結晶がほどけ、HPが${recovered}回復した。`);
  }

  if (battle.enemy.stats.hp <= 0) {
    const levelText = grantExperience(state, battle.enemy.rewardExp);
    markEnemyDefeated(state, battle.enemy.symbolId);
    messages.push(`${battle.enemy.name}を倒した。`);
    messages.push(`${battle.enemy.rewardExp}の経験値を得た。`);
    if (levelText) {
      messages.push(levelText);
    }
    messages.push(...unlockBattleRewards(state, battle.enemy));
    outcome = "victory";
  } else {
    enemyAttack(state, messages);
    outcome = state.player.stats.hp <= 0 ? "defeat" : "command";
  }

  setBattleMessages(battle, messages, outcome);
}

function enemyAttack(state: GameState, messages: string[]): void {
  const battle = state.battle;
  if (!battle) {
    return;
  }

  if (battle.enemy.definitionId === "raidia") {
    raidiaEquipmentAttack(state, battle, messages);
    return;
  }

  const actionCount = rollEnemyActionCount(battle.enemy.actionCount.min, battle.enemy.actionCount.max);
  const enemyStats = {
    ...battle.enemy.stats,
    attack: battle.enemy.stats.attack + battle.enemy.attackBonus
  };

  for (let action = 0; action < actionCount; action += 1) {
    const damage = calculateDamage(enemyStats, state.player.stats);
    state.player.stats.hp = Math.max(0, state.player.stats.hp - damage);
    const actionText = actionCount > 1 ? `${action + 1}回目の` : "";
    messages.push(`${battle.enemy.name}の${actionText}攻撃。${state.player.name}は${damage}のダメージ。`);

    if (state.player.stats.hp <= 0) {
      messages.push(`${state.player.name}は倒れた。`);
      return;
    }
  }
}

function raidiaEquipmentAttack(state: GameState, battle: BattleState, messages: string[]): void {
  const actionCount = rollEnemyActionCount(battle.enemy.actionCount.min, battle.enemy.actionCount.max);
  const actions = [
    () => {
      const damage = calculateDamage({ ...battle.enemy.stats, attack: battle.enemy.stats.attack + 8 }, state.player.stats);
      state.player.stats.hp = Math.max(0, state.player.stats.hp - damage);
      messages.push(`蒼月剣ルナリオンが弧を描く。${state.player.name}は${damage}のダメージ。`);
    },
    () => {
      const damage = calculateDamage({ ...battle.enemy.stats, attack: battle.enemy.stats.attack + 4 }, state.player.stats);
      state.player.stats.hp = Math.max(0, state.player.stats.hp - damage);
      battle.playerAttackBonus = Math.max(0, battle.playerAttackBonus - 3);
      messages.push(`呪月刀 景光が影を断つ。${damage}のダメージ、攻撃強化が削がれた。`);
    },
    () => {
      battle.enemy.stats.defense += 2;
      battle.enemy.stats.hp = Math.min(battle.enemy.stats.maxHp, battle.enemy.stats.hp + 24);
      messages.push("月殻鎧グランセリアが閉じる。レイディアの防御が上がり、HPが24回復した。");
    },
    () => {
      const damage = calculateDamage({ ...battle.enemy.stats, attack: battle.enemy.stats.attack + 2 }, state.player.stats);
      state.player.stats.hp = Math.max(0, state.player.stats.hp - damage);
      battle.enemy.attackBonus += 1;
      messages.push(`盾剣ノクスバリアが守りから斬撃へ転じる。${damage}のダメージ、攻撃気配が増した。`);
    },
    () => {
      const damage = Math.max(1, battle.enemy.stats.attack + battle.enemy.attackBonus + 12 + Math.floor(Math.random() * 5));
      state.player.stats.hp = Math.max(0, state.player.stats.hp - damage);
      messages.push(`蒼月照準器アルテミス・サイトが急所を捕えた。防御を抜いて${damage}のダメージ。`);
    }
  ];

  for (let action = 0; action < actionCount; action += 1) {
    actions[Math.floor(Math.random() * actions.length)]();
    if (state.player.stats.hp <= 0) {
      messages.push(`${state.player.name}は倒れた。`);
      return;
    }
  }
}

function rollEnemyActionCount(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function setBattleMessages(battle: BattleState, messages: string[], outcome: BattleOutcome): void {
  battle.phase = "message";
  battle.currentMessage = messages.shift() ?? "";
  battle.messages = messages;
  battle.nextOutcome = outcome;
}

function advanceBattleMessage(state: GameState, battle: BattleState): void {
  const nextMessage = battle.messages.shift();
  if (nextMessage) {
    battle.currentMessage = nextMessage;
    return;
  }

  if (battle.nextOutcome === "victory") {
    const postBattleLines = battle.enemy.postBattleLines;
    const speakerName = battle.enemy.name;
    state.battle = undefined;
    if (postBattleLines && postBattleLines.length > 0) {
      state.dialogue = {
        speakerName,
        lines: postBattleLines,
        lineIndex: 0
      };
      state.mode = "dialogue";
      state.fieldMessage = "";
      return;
    }

    state.mode = "field";
    state.fieldMessage = "勝利した。平原は少し静かになった。";
    return;
  }

  if (battle.nextOutcome === "defeat") {
    state.battle = undefined;
    state.mode = "gameover";
    state.fieldMessage = "";
    return;
  }

  if (battle.nextOutcome === "escaped") {
    state.battle = undefined;
    state.mode = "field";
    state.fieldMessage = "戦闘から離脱した。";
    return;
  }

  battle.phase = "command";
  battle.menu = "main";
  battle.commandIndex = 0;
  battle.currentMessage = getBattleMenuTitle("main");
}

function calculateDamage(attacker: Stats, defender: Stats): number {
  const variance = Math.floor(Math.random() * 3);
  return Math.max(1, attacker.attack + variance - defender.defense);
}

function calculateSkillDamage(attacker: Stats, defender: Stats, power: number, bonus: number): number {
  return Math.max(1, Math.floor(calculateDamage(attacker, defender) * power) + bonus);
}

function getSkillEffectDuration(skillId: BattleSkillId): number {
  return [
    "fractureBlade",
    "magicSwordIris",
    "seraphSwordPlus",
    "myonusBlade",
    "hyperSlash",
    "dominusGrail",
    "snowMan",
    "fujinDance"
  ].includes(skillId)
    ? 640
    : 520;
}

function grantExperience(state: GameState, amount: number): string | undefined {
  const player = state.player;
  player.stats.exp += amount;

  if (player.stats.exp < player.nextLevelExp) {
    return undefined;
  }

  player.stats.level += 1;
  player.stats.maxHp += 8;
  player.stats.hp = player.stats.maxHp;
  player.stats.attack += 2;
  player.stats.defense += 1;
  player.nextLevelExp += 25;
  return `${player.name}はレベル${player.stats.level}になった。`;
}

function getUnlockedBattleSkills(skills: BattleSkill[], player: Player): BattleSkill[] {
  return skills.filter((skill) => player.unlockedSkills.includes(skill.id));
}

function unlockBattleRewards(state: GameState, enemy: BattleEnemy): string[] {
  if (!enemy.unlockSkills) {
    return [];
  }

  const messages: string[] = [];
  for (const skillId of enemy.unlockSkills) {
    if (state.player.unlockedSkills.includes(skillId)) {
      continue;
    }

    state.player.unlockedSkills.push(skillId);
    messages.push(`${getSkillLabel(skillId)}を覚えた。`);
  }

  return messages;
}

function getSkillLabel(skillId: BattleSkillId): string {
  const skill = [...ATTACK_COMMANDS, ...MAGIC_COMMANDS].find((candidate) => candidate.id === skillId);
  return skill?.label ?? skillId;
}

function formatSkillLabels(skillIds: BattleSkillId[]): string {
  return skillIds.map(getSkillLabel).join(" / ");
}

function markEnemyDefeated(state: GameState, symbolId: string | undefined): void {
  if (!symbolId) {
    return;
  }

  const enemy = state.enemies.find((candidate) => candidate.id === symbolId);
  if (enemy) {
    enemy.defeated = true;
  }
}

function cloneStats(stats: Stats): Stats {
  return { ...stats };
}
