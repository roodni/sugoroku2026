import { dice } from "../util";
import type { Player } from "./gameState";
import { PlayerAttrChanger, stringifyPlayerAttrsChange } from "./indicator";

export type Emotion = "positive" | "neutral" | "negative";

export type Log =
  | { type: "description"; text: string; emotion: Emotion } // 地の文
  | { type: "quote"; text: string; emotion: Emotion } // 台詞
  | { type: "system"; text: string; emotion: Emotion }
  | { type: "newSection" }
  | { type: "diceRollBefore"; expression: string; isBot: boolean }
  | { type: "turnEnd" };

export const Log = {
  description(text: string, emotion: Emotion = "neutral"): Log {
    return { type: "description", text, emotion };
  },
  quote(text: string, emotion: Emotion = "neutral"): Log {
    return { type: "quote", text, emotion };
  },
  system(text: string, emotion: Emotion = "neutral"): Log {
    return { type: "system", text, emotion };
  },
  diceRollBefore(expression: string, isBot: boolean): Log {
    return { type: "diceRollBefore", expression, isBot };
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
    yield Log.system(`[${expression}] ${result}`);
    return result;
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
