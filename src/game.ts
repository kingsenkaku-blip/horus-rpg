import { initialEnemies, initialNpcs, villageMap } from './data';
import type { Enemy, GameState, TileType } from './types';

const PASSABLE: TileType[] = ['floor', 'grass', 'road'];

export function createInitialState(): GameState {
  return {
    mode: 'title',
    map: villageMap,
    player: {
      id: 'player', name: '勇者', x: 1, y: 1, spriteId: null,
      hp: 30, maxHp: 30, atk: 9, def: 4, exp: 0, level: 1
    },
    npcs: structuredClone(initialNpcs),
    enemies: structuredClone(initialEnemies),
    moveTarget: null,
    dialogueText: '',
    battle: null,
    messageLog: ['古いRPGプロトタイプへようこそ。']
  };
}

export function tileAt(state: GameState, x: number, y: number): TileType | null {
  if (x < 0 || y < 0 || x >= state.map.width || y >= state.map.height) return null;
  return state.map.tiles[y * state.map.width + x];
}

export function isPassable(state: GameState, x: number, y: number): boolean {
  const tile = tileAt(state, x, y);
  return tile !== null && PASSABLE.includes(tile);
}

export function gainExp(state: GameState, amount: number): string[] {
  const out: string[] = [];
  state.player.exp += amount;
  out.push(`${amount} EXP を得た。`);
  const nextLvExp = state.player.level * 20;
  if (state.player.exp >= nextLvExp) {
    state.player.level += 1;
    state.player.maxHp += 6;
    state.player.hp = state.player.maxHp;
    state.player.atk += 2;
    state.player.def += 1;
    out.push(`レベルが ${state.player.level} に上がった！`);
  }
  return out;
}

export function startBattle(state: GameState, enemy: Enemy): void {
  state.mode = 'battle';
  state.moveTarget = null;
  state.battle = { enemy: { ...enemy }, messages: [`${enemy.name} があらわれた！`], awaitingInput: true };
}

export function performBattleCommand(state: GameState, command: 'fight'|'magic'|'item'|'run'): void {
  if (!state.battle) return;
  const logs = state.battle.messages;

  if (command === 'magic' || command === 'item') {
    logs.push('まだ使えない。');
    return;
  }

  if (command === 'run') {
    logs.push('うまく逃げ切れた！');
    state.mode = 'field';
    state.battle = null;
    return;
  }

  const pDmg = Math.max(1, state.player.atk - state.battle.enemy.def);
  state.battle.enemy.hp = Math.max(0, state.battle.enemy.hp - pDmg);
  logs.push(`${state.player.name} のこうげき！ ${pDmg} ダメージ！`);

  if (state.battle.enemy.hp <= 0) {
    logs.push(`${state.battle.enemy.name} をたおした！`);
    state.messageLog.push(...gainExp(state, state.battle.enemy.expReward));
    state.enemies = state.enemies.filter((e) => e.id !== state.battle?.enemy.id);
    state.mode = 'field';
    state.battle = null;
    return;
  }

  const eDmg = Math.max(1, state.battle.enemy.atk - state.player.def);
  state.player.hp = Math.max(0, state.player.hp - eDmg);
  logs.push(`${state.battle.enemy.name} のこうげき！ ${eDmg} ダメージ！`);

  if (state.player.hp <= 0) {
    state.mode = 'gameover';
    state.battle = null;
  }
}
