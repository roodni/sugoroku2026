import { dice } from "../util";

export type Emotion = "positive" | "neutral" | "negative";

export type Log =
  | { type: "description"; text: string; emotion: Emotion } // 地の文
  | { type: "quote"; text: string; emotion: Emotion } // 台詞
  | { type: "system"; text: string; emotion: Emotion } // フレーバーではないテキスト
  | { type: "diceRollBefore"; expression: string; isBot: boolean };

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
    yield Log.system(`(${expression}) => ${result}`);
    // yield Log.
    return result;
  },
};
