import { Config } from "./config";

export type Personality = "gentle" | "violent" | "phobic" | "smart";

// 駒
export type Player = {
  name: string;
  isBot: boolean;
  turn: number;
  position: number;
  goaled: boolean;
  personality: Personality;
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
    };
  },
};

export type GameState = {
  currentPlayerIndex: number;
  players: Player[];
  cameraStart: number; // 地図で省略せず表示するマスの開始位置
  gameOverMessage: string | null; // null でなくなったときゲーム終了と判定される
};

export const GameState = {
  initial(): GameState {
    const players = [];
    players.push(Player.initial("あなた", false));
    for (let i = 1; i <= Config.computerPlayerNumber; i++) {
      players.push(Player.initial(`CP${i}`, true));
    }

    return {
      currentPlayerIndex: 0,
      players,
      cameraStart: 0,
      gameOverMessage: null,
    };
  },
};
