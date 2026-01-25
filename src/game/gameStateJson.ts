import { ExhaustiveError } from "../util";
import { Weapon } from "./battle";
import {
  GameState,
  Personality,
  type DiceKind,
  type Player,
} from "./gameState";
import type { TrophyName } from "./trophy";

export type GameStateJson = {
  currentPlayerIndex: number;
  players: PlayerJson[];
  cameraStart: number;
  cameraPlayerIndex: number;
  futureDice: number[];
  diceHistory: number[];
  replayMode: boolean;
  trophies: { name: TrophyName; firstTime: boolean }[];
  zeusHp: number;
};

type PlayerJson = {
  name: string;
  isBot: boolean;
  turn: number;
  position: number;
  goaled: boolean;
  personality: Personality;
  personalityChanged: boolean;
  hp: number;
  weapon: string;
  dice: DiceKind;
  desire: number;
  turnSkip: number;
};

// JSONでtypoするので
function validatePersonality(p: Personality): void {
  switch (p) {
    case "gentle":
    case "violent":
    case "phobic":
    case "smart":
      return;
    default:
      throw new ExhaustiveError(p);
  }
}

namespace PlayerJson {
  export function save(p: Player): PlayerJson {
    // 順番を制御するため全部列挙
    return {
      name: p.name,
      personality: p.personality,
      position: p.position,
      weapon: p.weapon.name,
      hp: p.hp,
      turn: p.turn,
      dice: p.dice,
      desire: p.desire,
      turnSkip: p.turnSkip,
      personalityChanged: p.personalityChanged,
      goaled: p.goaled,
      isBot: p.isBot,
    };
  }

  export function load(json: PlayerJson): Player {
    const weapon = Weapon.list.find((w) => w.name === json.weapon);
    if (!weapon) {
      throw new Error(`weapon: ${json.weapon}`);
    }
    validatePersonality(json.personality);
    return { ...json, weapon };
  }
}

export namespace GameStateJson {
  export function save(g: GameState): GameStateJson {
    // 順番を制御するため全部列挙
    return {
      futureDice: g.futureDice,
      replayMode: g.replayMode,
      currentPlayerIndex: g.currentPlayerIndex,
      cameraPlayerIndex: g.cameraPlayerIndex,
      players: g.players.map((p) => PlayerJson.save(p)),
      cameraStart: g.cameraStart,
      trophies: g.trophies,
      zeusHp: g.zeusHp,
      diceHistory: g.diceHistory, // これがインデントされるのは不本意だが……
    };
  }

  export function load(json: GameStateJson): GameState {
    return new GameState({
      ...json,
      players: json.players.map((p) => PlayerJson.load(p)),
    });
  }
}
