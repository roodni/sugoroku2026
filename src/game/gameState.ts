import { ExhaustiveError } from "../util";
import { Weapon } from "./battle";
import { Config } from "./config";

export type Personality = "gentle" | "violent" | "phobic" | "smart";

const Personality = {
  // JSONでtypoするので
  validate(p: Personality): void {
    switch (p) {
      case "gentle":
      case "violent":
      case "phobic":
      case "smart":
        return;
      default:
        throw new ExhaustiveError(p);
    }
  },
};

// 駒
export type Player = {
  name: string;
  isBot: boolean;
  turn: number;
  position: number;
  goaled: boolean;
  personality: Personality;
  hp: number;
  weapon: Weapon;
};

type PlayerJson = {
  name: string;
  isBot: boolean;
  turn: number;
  position: number;
  goaled: boolean;
  personality: Personality;
  hp: number;
  weapon: string;
};

export const Player = {
  initial(name: string, isBot: boolean): Player {
    return {
      name,
      isBot,
      turn: 0,
      position: 0,
      goaled: false,
      personality: "gentle",
      hp: Config.initialHp,
      weapon: Weapon.hand,
    };
  },

  save(p: Player): PlayerJson {
    // 順番を制御するため全部列挙
    return {
      name: p.name,
      personality: p.personality,
      position: p.position,
      weapon: p.weapon.name,
      hp: p.hp,
      goaled: p.goaled,
      turn: p.turn,
      isBot: p.isBot,
    };
  },
  load(json: PlayerJson): Player {
    const weapon = Weapon.list.find((w) => w.name === json.weapon);
    if (!weapon) {
      throw new Error(`weapon: ${json.weapon}`);
    }
    Personality.validate(json.personality);
    return { ...json, weapon };
  },
};

export type GameState = {
  currentPlayerIndex: number;
  players: Player[];
  cameraStart: number; // 地図で省略せず表示するマスの開始位置
  cameraPlayerIndex: number; // 地図で注目している駒
  gameOverMessage: string | null; // null でなくなったときゲーム終了と判定される
  futureDice: number[]; // デバッグ用
};

export type GameStateJson = {
  currentPlayerIndex: number;
  players: PlayerJson[];
  cameraStart: number;
  cameraPlayerIndex: number;
  gameOverMessage: string | null;
  futureDice: number[];
};

export const GameState = {
  initial(): GameState {
    const players = [];
    players.push(Player.initial("あなた", false));
    for (let i = 1; i <= Config.computerPlayerNumber; i++) {
      // const nameTable = "〇一二三四五六七八九";
      // const name = [...`${i}`].map((d) => nameTable[Number(d)]).join("") + "郎";
      players.push(Player.initial(`CP${i}`, true));
    }

    return {
      currentPlayerIndex: 0,
      players,
      cameraStart: 0,
      cameraPlayerIndex: 0,
      gameOverMessage: null,
      futureDice: [],
    };
  },

  save(g: GameState): GameStateJson {
    // 順番を制御するため全部列挙
    return {
      futureDice: g.futureDice,
      currentPlayerIndex: g.currentPlayerIndex,
      cameraPlayerIndex: g.cameraPlayerIndex,
      players: g.players.map((p) => Player.save(p)),
      cameraStart: g.cameraStart,
      gameOverMessage: g.gameOverMessage,
    };
  },
  load(json: GameStateJson): GameState {
    return {
      ...json,
      players: json.players.map((p) => Player.load(p)),
    };
  },
};
