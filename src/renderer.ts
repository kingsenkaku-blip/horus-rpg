import { CANVAS_HEIGHT, CANVAS_WIDTH, MAP_X, MAP_Y, TILE_SIZE } from "./layout";
import { renderSprite } from "./sprites";
import type { BattleEffect, BattleSkillId, BattleState, GameState, TileId } from "./types";
import { getBattleMenuOptions, getBattleMenuTitle } from "./gameLogic";

const PANEL_COLOR = "#0a0a0a";
const PANEL_EDGE = "#f4f4f4";
const PANEL_SHADOW = "#676767";
const TEXT = "#ffffff";
const MUTED = "#c7c7c7";
const UI_FONT_FAMILY = '"MS Gothic", monospace';
const BATTLE_VIEW = { x: 18, y: 18, width: 274, height: 110 };
const COMMAND_VISIBLE_ROWS = 4;
const COMMAND_ROW_HEIGHT = 17;

const tileColors: Record<TileId, { base: string; detail: string }> = {
  floor: { base: "#65564b", detail: "#8a7b6d" },
  grass: { base: "#315f35", detail: "#4f8a4b" },
  path: { base: "#8e744d", detail: "#b09261" },
  wall: { base: "#343434", detail: "#777777" },
  water: { base: "#284d7a", detail: "#5f8fbd" }
};

export function renderGame(context: CanvasRenderingContext2D, state: GameState): void {
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  context.fillStyle = "#000000";
  context.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  setFont(context, 12);
  context.textBaseline = "top";

  switch (state.mode) {
    case "title":
      drawTitle(context);
      break;
    case "field":
      drawField(context, state);
      break;
    case "dialogue":
      drawField(context, state);
      drawDialogue(context, state);
      break;
    case "battle":
      drawBattle(context, state);
      break;
    case "gameover":
      drawGameOver(context, state);
      break;
  }
}

function drawTitle(context: CanvasRenderingContext2D): void {
  drawWindow(context, 64, 42, 352, 174);
  context.textAlign = "center";
  context.fillStyle = TEXT;
  setFont(context, 26);
  context.fillText("HORUS RPG", CANVAS_WIDTH / 2, 72);
  setFont(context, 13);
  context.fillText("1980-1990年代風 コマンドRPG プロトタイプ", CANVAS_WIDTH / 2, 110);
  context.fillText("Enter / Space で はじめる", CANVAS_WIDTH / 2, 152);
  context.fillStyle = MUTED;
  context.fillText("矢印キー / WASD: 移動   マップクリック: 自動移動", CANVAS_WIDTH / 2, 178);
  context.textAlign = "left";
}

function drawField(context: CanvasRenderingContext2D, state: GameState): void {
  drawWindow(context, 4, 4, 328, 200);
  for (let y = 0; y < state.map.height; y += 1) {
    for (let x = 0; x < state.map.width; x += 1) {
      drawTile(context, state.map.tiles[y][x], MAP_X + x * TILE_SIZE, MAP_Y + y * TILE_SIZE);
    }
  }

  if (state.selectedTile) {
    drawSelectedTile(context, state);
  }

  const drawables = [
    ...state.objects.filter((object) => object.mapId === state.map.id && !object.opened),
    ...state.npcs.filter((npc) => npc.mapId === state.map.id),
    ...state.enemies.filter((enemy) => enemy.mapId === state.map.id && !enemy.defeated),
    state.player
  ].sort((a, b) => a.y - b.y);

  for (const entity of drawables) {
    renderSprite(
      context,
      entity.spriteId,
      MAP_X + entity.x * TILE_SIZE + 1,
      MAP_Y + entity.y * TILE_SIZE + 1,
      TILE_SIZE - 2,
      TILE_SIZE - 2,
      { entityType: entity.type }
    );
  }

  drawStatusPanel(context, state);
  drawMessagePanel(context, state);
}

function drawTile(context: CanvasRenderingContext2D, tile: TileId, x: number, y: number): void {
  const colors = tileColors[tile];
  context.fillStyle = colors.base;
  context.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  context.fillStyle = colors.detail;

  if (tile === "wall") {
    context.fillRect(x + 1, y + 1, 14, 3);
    context.fillRect(x + 2, y + 8, 12, 3);
    context.fillStyle = "#1b1b1b";
    context.fillRect(x, y + 15, 16, 1);
    return;
  }

  if (tile === "water") {
    context.fillRect(x + 2, y + 4, 5, 1);
    context.fillRect(x + 8, y + 10, 6, 1);
    return;
  }

  context.fillRect(x + 3, y + 4, 2, 2);
  context.fillRect(x + 11, y + 7, 2, 2);
  context.fillRect(x + 6, y + 12, 2, 2);
}

function drawSelectedTile(context: CanvasRenderingContext2D, state: GameState): void {
  const { selectedTile } = state;
  if (!selectedTile) {
    return;
  }

  const x = MAP_X + selectedTile.x * TILE_SIZE;
  const y = MAP_Y + selectedTile.y * TILE_SIZE;
  context.save();
  context.fillStyle = state.autoPath.length > 0 ? "rgba(255, 255, 255, 0.18)" : "rgba(255, 235, 129, 0.18)";
  context.fillRect(x + 1, y + 1, TILE_SIZE - 2, TILE_SIZE - 2);
  context.strokeStyle = state.autoPath.length > 0 ? "#ffffff" : "#ffe66b";
  context.lineWidth = 2;
  context.strokeRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  context.strokeStyle = "#000000";
  context.lineWidth = 1;
  context.strokeRect(x + 4.5, y + 4.5, TILE_SIZE - 9, TILE_SIZE - 9);
  context.restore();
}

function drawStatusPanel(context: CanvasRenderingContext2D, state: GameState): void {
  drawWindow(context, 338, 8, 134, 196);
  context.fillStyle = TEXT;
  setFont(context, 12);
  drawLabelValue(context, "場所", state.map.name, 348, 20);
  drawLabelValue(context, "名前", state.player.name, 348, 42);
  drawLabelValue(context, "LV", String(state.player.stats.level), 348, 64);
  drawLabelValue(context, "HP", `${state.player.stats.hp}/${state.player.stats.maxHp}`, 348, 86);
  drawLabelValue(context, "攻撃", String(state.player.stats.attack), 348, 108);
  drawLabelValue(context, "防御", String(state.player.stats.defense), 348, 130);
  drawLabelValue(context, "EXP", `${state.player.stats.exp}/${state.player.nextLevelExp}`, 348, 152);
  drawLabelValue(context, "薬草", String(state.player.potions), 348, 174);
  drawLabelValue(context, "遭遇", `${state.encounter.steps}/${state.encounter.target}`, 348, 190);
}

function drawMessagePanel(context: CanvasRenderingContext2D, state: GameState): void {
  drawWindow(context, 4, 210, 468, 52);
  context.fillStyle = TEXT;
  setFont(context, 13);
  const message = state.fieldMessage || "矢印キー / WASDで移動。マップをクリックすると自動移動。";
  drawWrappedText(context, message, 16, 221, 442, 17);
}

function drawDialogue(context: CanvasRenderingContext2D, state: GameState): void {
  if (!state.dialogue) {
    return;
  }

  const line = state.dialogue.lines[state.dialogue.lineIndex];
  drawWindow(context, 20, 164, 440, 82);
  context.fillStyle = MUTED;
  setFont(context, 11);
  context.fillText(state.dialogue.speakerName, 34, 176);
  context.fillStyle = TEXT;
  setFont(context, 14);
  drawWrappedText(context, line, 34, 194, 400, 18);
  context.textAlign = "right";
  context.fillText("▼", 442, 226);
  context.textAlign = "left";
}

function drawBattle(context: CanvasRenderingContext2D, state: GameState): void {
  const battle = state.battle;
  if (!battle) {
    return;
  }

  drawWindow(context, 8, 8, 294, 130);
  drawWindow(context, 308, 8, 164, 130);
  drawBattleEnemyPanel(context, battle);
  drawBattleEffect(context, battle.effect);
  drawBattleStatusPanel(context, state, battle);
  drawWindow(context, 8, 146, 464, 116);

  if (battle.phase === "command") {
    drawCommandPanel(context, state);
    context.fillStyle = TEXT;
    setFont(context, 14);
    drawWrappedText(context, getBattleMenuTitle(battle.menu), 244, 168, 190, 18);
  } else {
    context.fillStyle = TEXT;
    setFont(context, 14);
    drawWrappedText(context, battle.currentMessage, 24, 169, 420, 18);
    context.textAlign = "right";
    context.fillText("▼", 452, 236);
    context.textAlign = "left";
  }
}

function drawBattleEnemyPanel(context: CanvasRenderingContext2D, battle: BattleState): void {
  context.fillStyle = "#111111";
  context.fillRect(BATTLE_VIEW.x, BATTLE_VIEW.y, BATTLE_VIEW.width, BATTLE_VIEW.height);
  renderSprite(context, battle.enemy.spriteId, 104, 31, 104, 82, { entityType: "enemy" });
  context.fillStyle = MUTED;
  setFont(context, 12);
  context.fillText(battle.enemy.name, 24, 120);
}

function drawBattleEffect(context: CanvasRenderingContext2D, effect: BattleEffect | undefined): void {
  if (!effect) {
    return;
  }

  const progress = Math.min(1, Math.max(0, (performance.now() - effect.startedAt) / effect.durationMs));
  if (progress >= 1) {
    return;
  }

  context.save();
  context.beginPath();
  context.rect(BATTLE_VIEW.x, BATTLE_VIEW.y, BATTLE_VIEW.width, BATTLE_VIEW.height);
  context.clip();

  if (
    effect.skillId === "debugSlash" ||
    effect.skillId === "tempestAttack" ||
    effect.skillId === "magicSwordIris" ||
    effect.skillId === "seraphSwordPlus"
  ) {
    const slashColor = effect.skillId === "magicSwordIris"
      ? "#ffddff"
      : effect.skillId === "seraphSwordPlus"
        ? "#fff48a"
      : effect.skillId === "tempestAttack"
        ? "#bbf7ff"
        : "#ffffff";
    drawDiagonalSlash(context, progress, slashColor);
  } else if (effect.skillId === "fractureBlade") {
    drawFractureBlade(context, progress);
  } else if (effect.skillId === "myonusBlade") {
    drawMyonusBlade(context, progress);
  } else if (effect.skillId === "hyperSlash") {
    drawHyperSlash(context, progress);
  } else {
    drawMagicEffect(context, effect.skillId, progress);
  }

  context.restore();
}

function drawBattleStatusPanel(context: CanvasRenderingContext2D, state: GameState, battle: BattleState): void {
  context.fillStyle = TEXT;
  setFont(context, 12);
  drawLabelValue(context, "H.P.", `${state.player.stats.hp}/${state.player.stats.maxHp}`, 320, 22);
  drawLabelValue(context, "LV.", String(state.player.stats.level), 320, 44);
  drawLabelValue(context, "EXP", `${state.player.stats.exp}/${state.player.nextLevelExp}`, 320, 66);
  drawLabelValue(context, "ATK", String(state.player.stats.attack), 320, 88);
  drawLabelValue(context, "DEF", String(state.player.stats.defense), 392, 88);
  drawHpGauge(context, 320, 112, 132, state.player.stats.hp, state.player.stats.maxHp);
  context.fillStyle = MUTED;
  context.fillText(`${battle.enemy.name} HP ${battle.enemy.stats.hp}/${battle.enemy.stats.maxHp}`, 320, 122);
  if (battle.enemy.buffs.length > 0) {
    context.fillText(`敵BUF ${battle.enemy.buffs.join(",")}`, 320, 134);
  }
  if (battle.playerAttackBonus > 0) {
    context.fillText(`攻+ ${battle.playerAttackBonus}`, 410, 66);
  }
}

function drawCommandPanel(context: CanvasRenderingContext2D, state: GameState): void {
  const battle = state.battle;
  if (!battle) {
    return;
  }

  const options = getBattleMenuOptions(battle.menu, state.player);
  drawWindow(context, 22, 158, 208, 90);
  setFont(context, 13);
  const visibleStart = getVisibleCommandStart(battle.commandIndex, options.length);
  const visibleOptions = options.slice(visibleStart, visibleStart + COMMAND_VISIBLE_ROWS);

  if (visibleStart > 0) {
    context.fillStyle = MUTED;
    context.fillText("▲", 210, 164);
  }

  for (let visibleIndex = 0; visibleIndex < visibleOptions.length; visibleIndex += 1) {
    const optionIndex = visibleStart + visibleIndex;
    const y = 172 + visibleIndex * COMMAND_ROW_HEIGHT;
    context.fillStyle = optionIndex === battle.commandIndex ? TEXT : MUTED;
    context.fillText(optionIndex === battle.commandIndex ? "▶" : " ", 34, y);
    context.fillText(visibleOptions[visibleIndex].label, 52, y);
  }

  if (visibleStart + COMMAND_VISIBLE_ROWS < options.length) {
    context.fillStyle = MUTED;
    context.fillText("▼", 210, 236);
  }
}

function getVisibleCommandStart(commandIndex: number, optionCount: number): number {
  if (optionCount <= COMMAND_VISIBLE_ROWS) {
    return 0;
  }

  return Math.min(
    Math.max(0, commandIndex - COMMAND_VISIBLE_ROWS + 1),
    optionCount - COMMAND_VISIBLE_ROWS
  );
}

function drawDiagonalSlash(context: CanvasRenderingContext2D, progress: number, color: string): void {
  const start = { x: BATTLE_VIEW.x + BATTLE_VIEW.width - 28, y: BATTLE_VIEW.y + 10 };
  const end = { x: BATTLE_VIEW.x + 42, y: BATTLE_VIEW.y + BATTLE_VIEW.height - 14 };
  drawSlashStroke(context, start, end, progress, color, 8);
  drawSlashSpark(context, start, end, progress, color);
}

function drawFractureBlade(context: CanvasRenderingContext2D, progress: number): void {
  const top = BATTLE_VIEW.y + 8;
  const bottom = BATTLE_VIEW.y + BATTLE_VIEW.height - 8;
  const left = BATTLE_VIEW.x + 34;
  const right = BATTLE_VIEW.x + BATTLE_VIEW.width - 34;
  const center = BATTLE_VIEW.x + BATTLE_VIEW.width / 2;

  drawSlashStroke(context, { x: center, y: top }, { x: center, y: bottom }, progress, "#fff1a6", 7);
  drawSlashStroke(context, { x: right, y: top }, { x: left, y: bottom }, progress, "#ffffff", 7);
  drawSlashStroke(context, { x: left, y: top }, { x: right, y: bottom }, progress, "#b8f3ff", 7);

  const pulse = Math.sin(progress * Math.PI);
  context.globalAlpha = 0.38 * pulse;
  context.fillStyle = "#ffffff";
  context.fillRect(BATTLE_VIEW.x, BATTLE_VIEW.y, BATTLE_VIEW.width, BATTLE_VIEW.height);
  context.globalAlpha = 1;
}

function drawMyonusBlade(context: CanvasRenderingContext2D, progress: number): void {
  const start = { x: BATTLE_VIEW.x + 38, y: BATTLE_VIEW.y + 10 };
  const end = { x: BATTLE_VIEW.x + BATTLE_VIEW.width - 36, y: BATTLE_VIEW.y + BATTLE_VIEW.height - 12 };
  drawSlashStroke(context, start, end, progress, "#d7a7ff", 9);
  drawSlashSpark(context, start, end, progress, "#7d4dff");

  const pulse = Math.sin(progress * Math.PI);
  context.globalAlpha = 0.22 * pulse;
  context.fillStyle = "#4b1d6f";
  context.fillRect(BATTLE_VIEW.x, BATTLE_VIEW.y, BATTLE_VIEW.width, BATTLE_VIEW.height);
  context.globalAlpha = 1;
}

function drawHyperSlash(context: CanvasRenderingContext2D, progress: number): void {
  const tracks = [
    {
      start: { x: BATTLE_VIEW.x + BATTLE_VIEW.width - 34, y: BATTLE_VIEW.y + 10 },
      end: { x: BATTLE_VIEW.x + 36, y: BATTLE_VIEW.y + BATTLE_VIEW.height - 12 },
      color: "#ffffff",
      delay: 0
    },
    {
      start: { x: BATTLE_VIEW.x + 44, y: BATTLE_VIEW.y + 18 },
      end: { x: BATTLE_VIEW.x + BATTLE_VIEW.width - 44, y: BATTLE_VIEW.y + BATTLE_VIEW.height - 20 },
      color: "#fff48a",
      delay: 0.12
    },
    {
      start: { x: BATTLE_VIEW.x + BATTLE_VIEW.width - 70, y: BATTLE_VIEW.y + 8 },
      end: { x: BATTLE_VIEW.x + 74, y: BATTLE_VIEW.y + BATTLE_VIEW.height - 10 },
      color: "#84f6ff",
      delay: 0.24
    }
  ];

  for (const track of tracks) {
    const localProgress = Math.min(1, Math.max(0, (progress - track.delay) / 0.62));
    if (localProgress > 0) {
      drawSlashStroke(context, track.start, track.end, localProgress, track.color, 7);
    }
  }
}

function drawMagicEffect(context: CanvasRenderingContext2D, skillId: BattleSkillId, progress: number): void {
  if (skillId === "tempestWave") {
    drawTempestWave(context, progress);
    return;
  }

  if (skillId === "debugBeam") {
    drawDebugBeam(context, progress);
    return;
  }

  if (skillId === "solidBlood") {
    drawSolidBlood(context, progress);
    return;
  }

  if (skillId === "dominusGrail") {
    drawDominusGrail(context, progress);
    return;
  }

  if (skillId === "snowMan") {
    drawSnowMan(context, progress);
    return;
  }

  if (skillId === "fujinDance") {
    drawFujinDance(context, progress);
    return;
  }

  drawDisruptorRay(context, progress);
}

function drawTempestWave(context: CanvasRenderingContext2D, progress: number): void {
  const alpha = Math.sin(progress * Math.PI);
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = "#9ff8ff";
  context.lineWidth = 3;
  context.lineCap = "round";

  for (let i = 0; i < 4; i += 1) {
    const y = BATTLE_VIEW.y + 26 + i * 18;
    const offset = progress * 80 + i * 12;
    context.beginPath();
    for (let x = BATTLE_VIEW.x + 10; x <= BATTLE_VIEW.x + BATTLE_VIEW.width - 10; x += 8) {
      const waveY = y + Math.sin((x + offset) / 18) * 8;
      if (x === BATTLE_VIEW.x + 10) {
        context.moveTo(x, waveY);
      } else {
        context.lineTo(x, waveY);
      }
    }
    context.stroke();
  }

  context.restore();
}

function drawDebugBeam(context: CanvasRenderingContext2D, progress: number): void {
  const alpha = Math.sin(progress * Math.PI);
  const y = BATTLE_VIEW.y + 54;
  const beamWidth = Math.floor(BATTLE_VIEW.width * Math.min(1, progress * 1.35));
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = "#a9ff9d";
  context.fillRect(BATTLE_VIEW.x + 10, y - 4, beamWidth, 8);
  context.fillStyle = "#ffffff";
  context.fillRect(BATTLE_VIEW.x + 10, y - 1, beamWidth, 2);
  context.fillStyle = "#5cffef";
  for (let x = BATTLE_VIEW.x + 18; x < BATTLE_VIEW.x + 10 + beamWidth; x += 22) {
    context.fillRect(x, y - 14 + ((x + Math.floor(progress * 100)) % 3) * 7, 10, 4);
  }
  context.restore();
}

function drawDisruptorRay(context: CanvasRenderingContext2D, progress: number): void {
  const alpha = Math.sin(progress * Math.PI);
  const centerX = BATTLE_VIEW.x + BATTLE_VIEW.width / 2;
  const top = BATTLE_VIEW.y + 8;
  const bottom = BATTLE_VIEW.y + BATTLE_VIEW.height - 8;
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = "#ff8dff";
  context.lineWidth = 4;
  context.lineCap = "square";
  context.beginPath();
  context.moveTo(centerX - 46, top);
  context.lineTo(centerX + 18, BATTLE_VIEW.y + 46);
  context.lineTo(centerX - 10, BATTLE_VIEW.y + 64);
  context.lineTo(centerX + 44, bottom);
  context.stroke();

  context.strokeStyle = "#74f4ff";
  context.lineWidth = 2;
  for (let i = 0; i < 6; i += 1) {
    const y = top + i * 16;
    context.beginPath();
    context.moveTo(centerX - 66 + i * 9, y);
    context.lineTo(centerX + 66 - i * 7, y + 9);
    context.stroke();
  }
  context.restore();
}

function drawSolidBlood(context: CanvasRenderingContext2D, progress: number): void {
  const alpha = Math.sin(progress * Math.PI);
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = "#7b0928";
  context.fillRect(BATTLE_VIEW.x, BATTLE_VIEW.y, BATTLE_VIEW.width, BATTLE_VIEW.height);

  context.strokeStyle = "#ff4f78";
  context.lineWidth = 4;
  context.lineCap = "round";
  for (let i = 0; i < 5; i += 1) {
    const x = BATTLE_VIEW.x + 34 + i * 48;
    context.beginPath();
    context.moveTo(x, BATTLE_VIEW.y + 16);
    context.lineTo(x + Math.sin(progress * Math.PI * 2 + i) * 20, BATTLE_VIEW.y + 88);
    context.stroke();
  }

  context.fillStyle = "#ffd1db";
  const radius = 4 + Math.floor(progress * 8);
  context.fillRect(
    BATTLE_VIEW.x + BATTLE_VIEW.width / 2 - radius,
    BATTLE_VIEW.y + 56 - radius,
    radius * 2,
    radius * 2
  );
  context.restore();
}

function drawDominusGrail(context: CanvasRenderingContext2D, progress: number): void {
  const alpha = Math.sin(progress * Math.PI);
  const centerX = BATTLE_VIEW.x + BATTLE_VIEW.width / 2;
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = "#2b2410";
  context.fillRect(BATTLE_VIEW.x, BATTLE_VIEW.y, BATTLE_VIEW.width, BATTLE_VIEW.height);

  context.fillStyle = "#ffe58a";
  context.fillRect(centerX - 24, BATTLE_VIEW.y + 40, 48, 8);
  context.fillRect(centerX - 14, BATTLE_VIEW.y + 48, 28, 18);
  context.fillRect(centerX - 4, BATTLE_VIEW.y + 66, 8, 20);
  context.fillRect(centerX - 18, BATTLE_VIEW.y + 86, 36, 5);

  context.strokeStyle = "#ffffff";
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(centerX, BATTLE_VIEW.y + 8);
  context.lineTo(centerX, BATTLE_VIEW.y + 104);
  context.stroke();
  context.restore();
}

function drawSnowMan(context: CanvasRenderingContext2D, progress: number): void {
  const alpha = Math.sin(progress * Math.PI);
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = "#dff7ff";
  context.fillRect(BATTLE_VIEW.x, BATTLE_VIEW.y, BATTLE_VIEW.width, BATTLE_VIEW.height);
  context.fillStyle = "#ffffff";

  for (let i = 0; i < 18; i += 1) {
    const x = BATTLE_VIEW.x + 14 + ((i * 37 + progress * 80) % (BATTLE_VIEW.width - 28));
    const y = BATTLE_VIEW.y + 12 + ((i * 19 + progress * 54) % (BATTLE_VIEW.height - 24));
    context.fillRect(x, y, 4, 4);
  }

  const centerX = BATTLE_VIEW.x + BATTLE_VIEW.width / 2;
  context.fillStyle = "#ffffff";
  context.fillRect(centerX - 13, BATTLE_VIEW.y + 42, 26, 22);
  context.fillRect(centerX - 18, BATTLE_VIEW.y + 64, 36, 28);
  context.fillStyle = "#284d7a";
  context.fillRect(centerX - 6, BATTLE_VIEW.y + 50, 3, 3);
  context.fillRect(centerX + 4, BATTLE_VIEW.y + 50, 3, 3);
  context.restore();
}

function drawFujinDance(context: CanvasRenderingContext2D, progress: number): void {
  const alpha = Math.sin(progress * Math.PI);
  const centerX = BATTLE_VIEW.x + BATTLE_VIEW.width / 2;
  const centerY = BATTLE_VIEW.y + BATTLE_VIEW.height / 2;
  context.save();
  context.globalAlpha = alpha;
  context.strokeStyle = "#b6ffb0";
  context.lineWidth = 4;
  context.lineCap = "round";

  for (let i = 0; i < 5; i += 1) {
    const radius = 22 + i * 14 + progress * 18;
    const start = progress * Math.PI * 2 + i * 0.72;
    context.beginPath();
    context.arc(centerX, centerY, radius, start, start + Math.PI * 0.82);
    context.stroke();
  }

  context.strokeStyle = "#ffffff";
  context.lineWidth = 2;
  for (let i = 0; i < 4; i += 1) {
    const y = BATTLE_VIEW.y + 20 + i * 21;
    context.beginPath();
    context.moveTo(BATTLE_VIEW.x + 18, y);
    context.lineTo(BATTLE_VIEW.x + BATTLE_VIEW.width - 18, y - 8 + Math.sin(progress * 8 + i) * 12);
    context.stroke();
  }
  context.restore();
}

function drawSlashStroke(
  context: CanvasRenderingContext2D,
  start: { x: number; y: number },
  end: { x: number; y: number },
  progress: number,
  color: string,
  width: number
): void {
  const eased = easeOutCubic(progress);
  const segment = 0.32;
  const fromT = Math.max(0, eased - segment);
  const toT = Math.min(1, eased + 0.08);
  const from = lerpPoint(start, end, fromT);
  const to = lerpPoint(start, end, toT);
  const alpha = Math.sin(progress * Math.PI);

  context.save();
  context.lineCap = "round";
  context.globalAlpha = alpha;
  context.strokeStyle = color;
  context.lineWidth = width;
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();

  context.globalAlpha = Math.min(1, alpha + 0.2);
  context.strokeStyle = "#ffffff";
  context.lineWidth = Math.max(2, Math.floor(width / 3));
  context.beginPath();
  context.moveTo(from.x, from.y);
  context.lineTo(to.x, to.y);
  context.stroke();
  context.restore();
}

function drawSlashSpark(
  context: CanvasRenderingContext2D,
  start: { x: number; y: number },
  end: { x: number; y: number },
  progress: number,
  color: string
): void {
  const point = lerpPoint(start, end, easeOutCubic(progress));
  const alpha = Math.sin(progress * Math.PI);
  context.save();
  context.globalAlpha = alpha;
  context.fillStyle = color;
  context.fillRect(point.x - 5, point.y - 5, 10, 10);
  context.fillStyle = "#ffffff";
  context.fillRect(point.x - 2, point.y - 2, 4, 4);
  context.restore();
}

function lerpPoint(
  start: { x: number; y: number },
  end: { x: number; y: number },
  progress: number
): { x: number; y: number } {
  return {
    x: start.x + (end.x - start.x) * progress,
    y: start.y + (end.y - start.y) * progress
  };
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function drawGameOver(context: CanvasRenderingContext2D, state: GameState): void {
  drawWindow(context, 86, 70, 308, 130);
  context.textAlign = "center";
  context.fillStyle = TEXT;
  setFont(context, 22);
  context.fillText("GAME OVER", CANVAS_WIDTH / 2, 102);
  setFont(context, 13);
  context.fillText(`${state.player.name}は力尽きた。`, CANVAS_WIDTH / 2, 138);
  context.fillText("Enter / Space でタイトルへ戻る", CANVAS_WIDTH / 2, 166);
  context.textAlign = "left";
}

function setFont(context: CanvasRenderingContext2D, size: number): void {
  context.font = `${size}px ${UI_FONT_FAMILY}`;
}

function drawWindow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): void {
  context.fillStyle = PANEL_COLOR;
  context.fillRect(x, y, width, height);
  context.strokeStyle = PANEL_EDGE;
  context.lineWidth = 2;
  context.strokeRect(x + 1, y + 1, width - 2, height - 2);
  context.strokeStyle = PANEL_SHADOW;
  context.lineWidth = 1;
  context.strokeRect(x + 4.5, y + 4.5, width - 9, height - 9);
}

function drawLabelValue(
  context: CanvasRenderingContext2D,
  label: string,
  value: string,
  x: number,
  y: number
): void {
  context.fillStyle = MUTED;
  context.fillText(label, x, y);
  context.fillStyle = TEXT;
  context.fillText(value, x + 42, y);
}

function drawHpGauge(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  current: number,
  max: number
): void {
  context.strokeStyle = PANEL_EDGE;
  context.strokeRect(x, y, width, 6);
  context.fillStyle = "#272727";
  context.fillRect(x + 1, y + 1, width - 2, 4);
  context.fillStyle = current / max < 0.3 ? "#ff6b6b" : "#ffffff";
  context.fillRect(x + 1, y + 1, Math.max(0, Math.floor((width - 2) * (current / max))), 4);
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): void {
  let line = "";
  let currentY = y;

  for (const char of text) {
    const nextLine = line + char;
    if (line && context.measureText(nextLine).width > maxWidth) {
      context.fillText(line, x, currentY);
      line = char;
      currentY += lineHeight;
    } else {
      line = nextLine;
    }
  }

  if (line) {
    context.fillText(line, x, currentY);
  }
}
