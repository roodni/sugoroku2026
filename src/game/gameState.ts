import { ExhaustiveError } from "../util";
import { Weapon } from "./battle";
import {
  COMPUTER_NAME_TABLE,
  COMPUTER_PLAYER_NUMBER,
  INITIAL_HP,
  YOUR_NAME,
} from "./config";
import type { TrophyName } from "./trophy";

export type Personality = "gentle" | "violent" | "phobic" | "smart";
export const Personality = {
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
  toLabel(p: Personality): string {
    switch (p) {
      case "gentle":
        return "温厚";
      case "violent":
        return "凶暴";
      case "phobic":
        return "恐怖症";
      case "smart":
        return "スマート";
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
      hp: INITIAL_HP,
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
  trophies: { name: TrophyName; firstTime: boolean }[];
};

export type GameStateJson = {
  currentPlayerIndex: number;
  players: PlayerJson[];
  cameraStart: number;
  cameraPlayerIndex: number;
  gameOverMessage: string | null;
  futureDice: number[];
  trophies: { name: TrophyName; firstTime: boolean }[];
};

export const GameState = {
  initial(): GameState {
    const players = [];
    players.push(Player.initial(YOUR_NAME, false));
    for (let i = 1; i <= COMPUTER_PLAYER_NUMBER; i++) {
      const name = COMPUTER_NAME_TABLE.at(i - 1) ?? `CP${i}`;
      players.push(Player.initial(name, true));
    }

    return {
      currentPlayerIndex: 0,
      players,
      cameraStart: 0,
      cameraPlayerIndex: 0,
      gameOverMessage: null,
      futureDice: [],
      trophies: [],
    };
  },

  save(g: GameState): GameStateJson {
    // 順番を制御するため全部列挙
    return {
      futureDice: g.futureDice,
      currentPlayerIndex: g.currentPlayerIndex,
      cameraPlayerIndex: g.cameraPlayerIndex,
      players: g.players.map((p) => Player.save(p)),
      trophies: g.trophies,
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
