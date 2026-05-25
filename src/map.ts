import type { EnemyDefinition, EnemySymbol, GameMap, MapObject, Npc, TileDefinition, TileId } from "./types";

export const TILE_DEFINITIONS: Record<TileId, TileDefinition> = {
  floor: { id: "floor", name: "土", walkable: true },
  grass: { id: "grass", name: "草", walkable: true },
  path: { id: "path", name: "道", walkable: true },
  wall: { id: "wall", name: "壁", walkable: false },
  water: { id: "water", name: "水", walkable: false }
};

const fieldRows = [
  "#########pp#########",
  "#gggggggppggggggggg#",
  "#ggg###gppggggggggg#",
  "#ggg#f#ppppppgggggg#",
  "#ggg###gppggg###ggg#",
  "#gggggggppggg#w#ggg#",
  "#gppppppppggg###ggg#",
  "#gpgggggggggggggggg#",
  "#gpgwwwwwgggggppppgp",
  "#gpgwgggwgggggpggpgp",
  "#gpppppppgggggpggpgp",
  "####################"
];

const tileByChar: Record<string, TileId> = {
  "#": "wall",
  "g": "grass",
  "p": "path",
  "f": "floor",
  "w": "water"
};

export const TEST_MAP: GameMap = {
  id: "test-field",
  name: "はじまりの平原",
  width: fieldRows[0].length,
  height: fieldRows.length,
  tiles: fieldRows.map((row) => [...row].map((char) => tileByChar[char] ?? "grass"))
};

const vampireRows = [
  "####################",
  "#gggggggggggggggggg#",
  "#gggppppppppppppggg#",
  "#gggpggggggggggpggg#",
  "#gggpgppppppgggpggg#",
  "#gggpgppppppgggpggg#",
  "#gggpgppppppppppggg#",
  "#gggpgpggggggggpggg#",
  "#gggppppppppppppggg#",
  "#ggggggggppgggggggg#",
  "#ggggggggppgggggggg#",
  "#########pp#########"
];

export const VAMPIRE_MAP: GameMap = {
  id: "vampire-road",
  name: "月蝕の古道",
  width: vampireRows[0].length,
  height: vampireRows.length,
  tiles: vampireRows.map((row) => [...row].map((char) => tileByChar[char] ?? "grass"))
};

const puzzleRows = [
  "####################",
  "#gggggggggggggggggg#",
  "#gppppppppppppppppg#",
  "#gpggggggggggggggpg#",
  "#gpgpppppppppppgppg#",
  "#gpgpgggggggggpgpgg#",
  "#gpgpppppppppppgpgg#",
  "#gpgggggggggggggpgg#",
  "pppppppppppppppppppp",
  "#gpgggggggggggggpgg#",
  "#gppppppppppppppppg#",
  "####################"
];

export const PUZZLE_MAP: GameMap = {
  id: "moon-riddle-garden",
  name: "頌帰の庭",
  width: puzzleRows[0].length,
  height: puzzleRows.length,
  tiles: puzzleRows.map((row) => [...row].map((char) => tileByChar[char] ?? "grass"))
};

const raidiaRows = [
  "####################",
  "#gggggggggggggggggg#",
  "#gppppppppppppppppg#",
  "#gpggggggggggggggpg#",
  "#gpgpppppppppppgpgg#",
  "#gpgpgggggggggpgpgg#",
  "#gpgpgggppppggpgpgg#",
  "#gpgpgggppppggpgpgg#",
  "pppppppppppppppppppp",
  "#gpgpgggggggggpgpgg#",
  "#gppppppppppppppppg#",
  "####################"
];

export const RAIDIA_MAP: GameMap = {
  id: "raidia-sanctum",
  name: "蒼月の奥殿",
  width: raidiaRows[0].length,
  height: raidiaRows.length,
  tiles: raidiaRows.map((row) => [...row].map((char) => tileByChar[char] ?? "grass"))
};

const kamjinRows = [
  "####################",
  "#ffffggggggggggffff#",
  "#f##fgggwwgggf##fff#",
  "#fppppppppppppppppf#",
  "#gpggg###pp###gggpg#",
  "#gpggg#f#pp#f#gggpg#",
  "#gpppppfppfpppppppg#",
  "#ggggggfppfgggggggg#",
  "ppppppppppppppppppp#",
  "#gppppppffffppppppg#",
  "#gggggff####ffggggg#",
  "####################"
];

export const KAMJIN_MAP: GameMap = {
  id: "kamjin-village",
  name: "カムジンの村",
  width: kamjinRows[0].length,
  height: kamjinRows.length,
  tiles: kamjinRows.map((row) => [...row].map((char) => tileByChar[char] ?? "grass"))
};

export const INITIAL_NPCS: Npc[] = [
  {
    id: "elder",
    name: "村人",
    type: "npc",
    mapId: TEST_MAP.id,
    x: 4,
    y: 3,
    dialogue: [
      "ここはホルス平原。まだ何もないが、冒険のはじまりには十分だ。",
      "敵に触れると戦闘になる。体力が減ったら道具を使うといい。"
    ]
  },
  {
    id: "kamjin-survivor",
    name: "負傷した村人",
    type: "npc",
    mapId: KAMJIN_MAP.id,
    x: 14,
    y: 8,
    dialogue: [
      "カムジンの村は、蹂躙埜戦姫に襲われた。",
      "あれはただ強いだけじゃない。命そのものを断ち切る即死の斬撃を使う。",
      "戦うなら、村に残された武器と魔法を全部持っていけ。"
    ]
  }
];

export const INITIAL_ENEMIES: EnemySymbol[] = [
  {
    id: "street-yankee-symbol-1",
    name: "その辺のヤンキー",
    type: "enemy",
    mapId: TEST_MAP.id,
    enemyId: "streetYankee",
    x: 14,
    y: 8,
    defeated: false
  },
  {
    id: "vampire-prince-symbol-1",
    name: "最強吸血鬼(仮)",
    type: "enemy",
    mapId: VAMPIRE_MAP.id,
    enemyId: "vampirePrince",
    x: 9,
    y: 5,
    defeated: false
  },
  {
    id: "raidia-symbol-1",
    name: "伝説の剣士レイディア",
    type: "enemy",
    mapId: RAIDIA_MAP.id,
    enemyId: "raidia",
    x: 10,
    y: 6,
    defeated: false
  }
];

export const INITIAL_OBJECTS: MapObject[] = [
  {
    id: "iris-blood-chest",
    name: "古い宝箱",
    type: "object",
    mapId: VAMPIRE_MAP.id,
    objectKind: "chest",
    x: 15,
    y: 6,
    opened: false,
    unlockSkills: ["magicSwordIris", "solidBlood"]
  },
  {
    id: "ode-monolith",
    name: "頌歌の碑",
    type: "object",
    mapId: PUZZLE_MAP.id,
    objectKind: "puzzle",
    x: 5,
    y: 5,
    opened: false,
    puzzleKey: "ode"
  },
  {
    id: "return-monolith",
    name: "帰源の碑",
    type: "object",
    mapId: PUZZLE_MAP.id,
    objectKind: "puzzle",
    x: 14,
    y: 5,
    opened: false,
    puzzleKey: "return"
  },
  {
    id: "kamjin-warning-monolith",
    name: "血文字の石碑",
    type: "object",
    mapId: KAMJIN_MAP.id,
    objectKind: "monolith",
    x: 9,
    y: 3,
    opened: false,
    message: "石碑にはこう刻まれている。『HPバーに降りかかる斬撃をクリックして即死を防げ。蹂躙埜戦姫の刃は、見逃した者の命を断つ』"
  },
  {
    id: "kamjin-weapon-rack",
    name: "折れた武器架",
    type: "object",
    mapId: KAMJIN_MAP.id,
    objectKind: "chest",
    x: 6,
    y: 6,
    opened: false,
    unlockSkills: ["myonusBlade", "hyperSlash"]
  },
  {
    id: "kamjin-arcane-cache",
    name: "煤けた魔導具箱",
    type: "object",
    mapId: KAMJIN_MAP.id,
    objectKind: "chest",
    x: 12,
    y: 6,
    opened: false,
    unlockSkills: ["dominusGrail", "snowMan", "fujinDance"]
  }
];

export const ENEMY_DEFINITIONS: Record<string, EnemyDefinition> = {
  wanderSlime: {
    id: "wanderSlime",
    name: "まよいスライム",
    stats: {
      hp: 18,
      maxHp: 18,
      attack: 7,
      defense: 2,
      exp: 0,
      level: 1
    },
    rewardExp: 12
  },
  streetYankee: {
    id: "streetYankee",
    name: "その辺のヤンキー",
    stats: {
      hp: 34,
      maxHp: 34,
      attack: 10,
      defense: 4,
      exp: 0,
      level: 2
    },
    rewardExp: 28,
    unlockSkills: ["fractureBlade", "disruptorRay"]
  },
  vampirePrince: {
    id: "vampirePrince",
    name: "最強吸血鬼(仮)",
    stats: {
      hp: 1000,
      maxHp: 1000,
      attack: 22,
      defense: 10,
      exp: 0,
      level: 9
    },
    rewardExp: 999,
    startBuff: {
      name: "闇統べる貴公子",
      attackBonus: 8
    },
    actionCount: {
      min: 1,
      max: 3
    },
    preBattleLines: {
      default: [
        "ようこそ、夜の中心へ。",
        "宝を得たならば、その刃と血で余を楽しませてみよ。"
      ],
      missingChest: [
        "そのまま挑むのか。",
        "右の方に宝箱がある。とったほうがいいよ。"
      ]
    }
  },
  raidia: {
    id: "raidia",
    name: "伝説の剣士レイディア",
    stats: {
      hp: 720,
      maxHp: 720,
      attack: 18,
      defense: 8,
      exp: 0,
      level: 8
    },
    rewardExp: 640,
    actionCount: {
      min: 2,
      max: 2
    },
    preBattleLines: {
      default: [
        "あなたが頌歌と帰源を結んだ者ね。",
        "私はレイディア。蒼月剣ルナリオン、呪月刀 景光、月殻鎧グランセリア、盾剣ノクスバリア、蒼月照準器アルテミス・サイト。",
        "五つの武具が示す剣理、そのすべてであなたを試す。"
      ],
      missingChest: [
        "ここへ来る資格はある。",
        "けれど、まだ月の謎は満ちていない。頌歌と帰源を結びなさい。"
      ]
    },
    postBattleLines: [
      "見事。あなたの刃は、月の殻を越えた。",
      "武具は持ち主を選ぶ。でも、道は使い手が選ぶもの。",
      "デバッグくん、あなたの物語を続けなさい。"
    ]
  }
};

export const RANDOM_ENCOUNTER_ENEMY_IDS = ["wanderSlime"];

export function isWalkable(map: GameMap, x: number, y: number): boolean {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) {
    return false;
  }

  return TILE_DEFINITIONS[map.tiles[y][x]].walkable;
}
