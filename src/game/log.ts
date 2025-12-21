import { dice } from "../util";

export type Log =
  | { type: "description"; text: string } // 地の文
  | { type: "quote"; text: string } // 台詞
  | { type: "diceRollBefore"; kind: string }
  | { type: "diceRollAfter"; kind: string; result: number };

export const Log = {
  description(text: string): Log {
    return { type: "description", text };
  },
  quote(text: string): Log {
    return { type: "quote", text };
  },
  diceRollBefore(kind: string): Log {
    return { type: "diceRollBefore", kind };
  },
  diceRollAfter(kind: string, result: number): Log {
    return { type: "diceRollAfter", kind, result };
  },

  *generateDiceRoll(times: number, sides: number): Generator<Log, number> {
    const kind = `${times}d${sides}`;
    yield Log.diceRollBefore(kind);
    // ダイス振るボタンを押す前に結果がわかるのが嫌なのでbefore/afterに分けている。意味はない
    const result = dice(times, sides);
    yield Log.diceRollAfter(kind, result);
    return result;
  },
};
