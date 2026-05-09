import './style.css';
import { createInitialState, isPassable, performBattleCommand, startBattle } from './game';
import { renderSprite } from './sprite';
import type { GameState } from './types';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('app missing');

const TILE = 40;
const state: GameState = createInitialState();

function render(): void {
  app.innerHTML = '';
  const root = document.createElement('div');
  root.className = 'game-root';

  if (state.mode === 'title') {
    const box = panel('title-screen');
    box.innerHTML = `<h1>HORUS RPG</h1><p>クリックで開始</p>`;
    box.onclick = () => { state.mode = 'field'; render(); };
    root.append(box);
    app.append(root);
    return;
  }

  if (state.mode === 'gameover') {
    const box = panel('title-screen');
    box.innerHTML = `<h1>GAME OVER</h1><p>クリックでタイトルへ</p>`;
    box.onclick = () => Object.assign(state, createInitialState());
    box.onclick = () => { Object.assign(state, createInitialState()); render(); };
    root.append(box);
    app.append(root);
    return;
  }

  const field = panel('field');
  field.style.width = `${state.map.width * TILE}px`;
  field.style.height = `${state.map.height * TILE}px`;
  field.onclick = (e) => onFieldClick(e, field);

  for (let y = 0; y < state.map.height; y++) {
    for (let x = 0; x < state.map.width; x++) {
      const t = state.map.tiles[y * state.map.width + x];
      const tile = document.createElement('div');
      tile.className = `tile tile-${t}`;
      tile.style.left = `${x * TILE}px`;
      tile.style.top = `${y * TILE}px`;
      field.append(tile);
    }
  }

  if (state.moveTarget) {
    const marker = document.createElement('div');
    marker.className = 'target-marker';
    marker.style.left = `${state.moveTarget.x * TILE}px`;
    marker.style.top = `${state.moveTarget.y * TILE}px`;
    field.append(marker);
  }

  [...state.npcs, ...state.enemies, state.player].forEach((entity) => {
    const node = renderSprite(entity.spriteId, entity.name);
    node.classList.add('entity');
    node.style.left = `${entity.x * TILE + 4}px`;
    node.style.top = `${entity.y * TILE + 4}px`;
    field.append(node);
  });

  root.append(field, statusPanel(), messageWindow());

  if (state.mode === 'battle' && state.battle) {
    root.append(battlePanel());
  }

  app.append(root);
}

function battlePanel(): HTMLElement {
  const p = panel('battle-ui');
  p.innerHTML = `<div class="battle-top"><div>${state.battle?.enemy.name} HP: ${state.battle?.enemy.hp}/${state.battle?.enemy.maxHp}</div></div>`;
  const cmd = document.createElement('div');
  cmd.className = 'commands';
  const defs = [
    ['fight', 'たたかう'], ['magic', 'まほう'], ['item', 'どうぐ'], ['run', 'にげる']
  ] as const;
  defs.forEach(([value, text]) => {
    const b = document.createElement('button');
    b.textContent = text;
    b.onclick = () => { performBattleCommand(state, value); render(); };
    cmd.append(b);
  });
  p.append(cmd);
  return p;
}

function statusPanel(): HTMLElement {
  const p = panel('status');
  p.innerHTML = `HP ${state.player.hp}/${state.player.maxHp} | LV ${state.player.level} | ATK ${state.player.atk} | DEF ${state.player.def} | EXP ${state.player.exp}`;
  return p;
}

function messageWindow(): HTMLElement {
  const p = panel('message');
  const lines = state.mode === 'battle' && state.battle ? state.battle.messages : [state.dialogueText || state.messageLog.at(-1) || '...'];
  p.innerHTML = lines.slice(-3).map((l) => `<div>${l}</div>`).join('');
  return p;
}

function onFieldClick(e: MouseEvent, field: HTMLElement): void {
  if (state.mode !== 'field' && state.mode !== 'dialogue') return;
  const rect = field.getBoundingClientRect();
  const tx = Math.floor((e.clientX - rect.left) / TILE);
  const ty = Math.floor((e.clientY - rect.top) / TILE);
  if (!isPassable(state, tx, ty)) return;
  state.mode = 'field';
  state.dialogueText = '';
  state.moveTarget = { x: tx, y: ty };
  stepMove();
  render();
}

function stepMove(): void {
  if (!state.moveTarget || state.mode !== 'field') return;
  const dx = Math.sign(state.moveTarget.x - state.player.x);
  const dy = Math.sign(state.moveTarget.y - state.player.y);
  const nx = state.player.x + (dx !== 0 ? dx : 0);
  const ny = state.player.y + (dx === 0 ? dy : 0);

  if (!isPassable(state, nx, ny)) { state.moveTarget = null; return; }

  state.player.x = nx;
  state.player.y = ny;

  const npc = state.npcs.find((n) => n.x === nx && n.y === ny);
  if (npc) {
    state.mode = 'dialogue';
    state.dialogueText = `${npc.name}: ${npc.dialogue}`;
    state.moveTarget = null;
  }

  const enemy = state.enemies.find((en) => en.x === nx && en.y === ny);
  if (enemy) {
    startBattle(state, enemy);
    render();
    return;
  }

  render();
  if (state.moveTarget && (state.player.x !== state.moveTarget.x || state.player.y !== state.moveTarget.y)) {
    window.setTimeout(stepMove, 130);
  } else {
    state.moveTarget = null;
    render();
  }
}

function panel(cls: string): HTMLDivElement {
  const d = document.createElement('div');
  d.className = `panel ${cls}`;
  return d;
}

render();
