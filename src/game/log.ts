import { dice } from "../util";
import type { GameState, Player } from "./gameState";
import {
  PlayerAttr,
  PlayerAttrChanger,
  stringifyPlayerAttrs,
  stringifyPlayerAttrsChange,
} from "./indicator";
import { Trophy, type TrophyName } from "./trophy";

export type Emotion = "positive" | "neutral" | "negative";

export type Log =
  | { type: "description"; text: string; emotion: Emotion } // 地の文
  | { type: "dialog"; text: string } // 台詞
  | { type: "system"; text: string; emotion: Emotion }
  | { type: "newSection" }
  | { type: "diceRollBefore"; expression: string; isBot: boolean }
  | { type: "diceRollAfter"; expression: string; result: number }
  | { type: "turnEnd" };

export const Log = {
  description(text: string, emotion: Emotion = "neutral"): Log {
    return { type: "description", text, emotion };
  },
  dialog(text: string): Log {
    return { type: "dialog", text };
  },
  system(text: string, emotion: Emotion = "neutral"): Log {
    return { type: "system", text, emotion };
  },
  diceRollBefore(expression: string, isBot: boolean): Log {
    return { type: "diceRollBefore", expression, isBot };
  },
  diceRollAfter(expression: string, result: number): Log {
    return { type: "diceRollAfter", expression, result };
  },
  newSection(): Log {
    return { type: "newSection" };
  },
  turnEnd(): Log {
    return { type: "turnEnd" };
  },
};

export const LogUtil = {
  *generateDiceRoll(
    g: GameState,
    isBot: boolean,
    times: number,
    sides: number,
    cnst: number = 0
  ): Generator<Log, number> {
    let expression = `${times}d${sides}`;
    if (cnst > 0) {
      expression += `+${cnst}`;
    } else if (cnst < 0) {
      expression += `${cnst}`;
    }
    yield Log.diceRollBefore(expression, isBot);
    let result;
    if (g.futureDice.length > 0) {
      result = g.futureDice.shift()!;
    } else {
      result = dice(times, sides) + cnst;
    }
    yield Log.diceRollAfter(expression, result);
    return result;
  },

  *generatePlayerAttrs(player: Player, attrs: PlayerAttr[]): Generator<Log> {
    const text = stringifyPlayerAttrs(player, attrs);
    yield Log.system(`(${player.name}) ${text}`);
  },

  *generatePlayerAttrsChange(
    player: Player,
    attrs: PlayerAttrChanger[],
    emotion: Emotion
  ): Generator<Log> {
    yield Log.system(
      `(${player.name}) ${stringifyPlayerAttrsChange(player, attrs)}`,
      emotion
    );
  },
  *generatePlayerAttrChange(
    player: Player,
    attr: PlayerAttrChanger,
    emotion: Emotion
  ): Generator<Log> {
    yield* this.generatePlayerAttrsChange(player, [attr], emotion);
  },

  *generateEarnTrophy(g: GameState, trophyName: TrophyName): Generator<Log> {
    if (g.trophies.map((t) => t.name).includes(trophyName)) {
      return;
    }
    const { firstTime } = Trophy.earn(trophyName);
    g.trophies.push({ name: trophyName, firstTime });
    const firstTimeText = firstTime ? " (new)" : "";
    yield Log.system(`[トロフィー獲得] ${trophyName}${firstTimeText}`);
  },
};
