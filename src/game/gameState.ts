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

export type DiceKind = "1d6" | "1d100";

// 駒
export type Player = {
  name: string;
  isBot: boolean;
  turn: number;
  position: number;
  goaled: boolean;
  personality: Personality;
  personalityChanged: boolean;
  hp: number;
  weapon: Weapon;
  dice: DiceKind;
  desire: number; // 煩悩
  turnSkip: number;
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
      personalityChanged: false,
      hp: INITIAL_HP,
      weapon: Weapon.hand,
      dice: "1d6",
      desire: 108,
      turnSkip: 0,
    };
  },
};

export type GameState = {
  currentPlayerIndex: number;
  players: Player[];
  cameraStart: number; // 地図で省略せず表示するマスの開始位置
  cameraPlayerIndex: number; // 地図で注目している駒
  futureDice: number[]; // デバッグ用だったが、リプレイにも流用できる
  diceHistory: number[]; // リプレイ用
  replayMode: boolean;
  trophies: { name: TrophyName; firstTime: boolean }[];
  zeusHp: number; // ゼウスのHPは永続
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
      futureDice: [],
      diceHistory: [],
      replayMode: false,
      trophies: [],
      zeusHp: 100,
    };
  },
};
