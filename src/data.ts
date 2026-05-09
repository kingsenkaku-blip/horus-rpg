import type { Enemy, GameMap, Npc, TileType } from './types';

const mapRows: TileType[][] = [
  ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall'],
  ['wall','floor','floor','grass','grass','grass','grass','grass','road','road','floor','wall'],
  ['wall','floor','floor','grass','grass','grass','grass','grass','road','floor','floor','wall'],
  ['wall','floor','floor','road','road','road','road','road','road','floor','floor','wall'],
  ['wall','floor','floor','grass','grass','grass','grass','grass','floor','floor','floor','wall'],
  ['wall','floor','floor','grass','grass','floor','floor','grass','floor','floor','floor','wall'],
  ['wall','floor','floor','floor','floor','floor','floor','grass','grass','grass','floor','wall'],
  ['wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall','wall']
];

export const villageMap: GameMap = {
  id: 'test-village',
  name: 'テスト平原',
  width: 12,
  height: 8,
  tiles: mapRows.flat()
};

export const initialNpcs: Npc[] = [
  { id: 'npc-1', name: '村人', x: 2, y: 5, spriteId: null, dialogue: 'ようこそ。北の道には敵がいるよ。' }
];

export const initialEnemies: Enemy[] = [
  { id: 'enemy-1', name: 'スライム', x: 9, y: 2, spriteId: null, maxHp: 16, hp: 16, atk: 6, def: 2, expReward: 12 }
];
