import { dice } from "../util";

export type Emotion = "positive" | "neutral" | "negative";

export type Log =
  | { type: "description"; text: string; emotion: Emotion } // 地の文
  | { type: "quote"; text: string; emotion: Emotion } // 台詞
  | { type: "diceRollBefore"; kind: string; isBot: boolean }
  | { type: "diceRollAfter"; kind: string; result: number };

export const Log = {
  description(text: string, emotion: Emotion = "neutral"): Log {
    return { type: "description", text, emotion };
  },
  quote(text: string, emotion: Emotion = "neutral"): Log {
    return { type: "quote", text, emotion };
  },
  diceRollBefore(kind: string, isBot: boolean): Log {
    return { type: "diceRollBefore", kind, isBot };
  },
  diceRollAfter(kind: string, result: number): Log {
    return { type: "diceRollAfter", kind, result };
  },

  *generateDiceRoll(
    times: number,
    sides: number,
    isBot: boolean
  ): Generator<Log, number> {
    const kind = `${times}d${sides}`;
    yield Log.diceRollBefore(kind, isBot);
    // ダイス振るボタンを押す前に結果がわかるのが嫌なのでbefore/afterに分けている。意味はない
    const result = dice(times, sides);
    yield Log.diceRollAfter(kind, result);
    return result;
  },
};
