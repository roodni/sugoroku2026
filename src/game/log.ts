import { dice } from "../util";
import type { Player } from "./gameState";
import {
  PlayerAttr,
  PlayerAttrChanger,
  stringifyPlayerAttrs,
  stringifyPlayerAttrsChange,
} from "./indicator";

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
    times: number,
    sides: number,
    isBot: boolean
  ): Generator<Log, number> {
    const expression = `${times}d${sides}`;
    yield Log.diceRollBefore(expression, isBot);
    // ダイス振るボタンを押す前に結果がわかるのが気分的に嫌なのでbefore/afterに分けている。
    // 意味はない。
    const result = dice(times, sides);
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
};
