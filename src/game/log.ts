import { dice } from "./util";

export type Log =
  | { type: "description"; text: string }
  | { type: "quote"; text: string }
  | { type: "dicerollBefore"; kind: string }
  | { type: "dicerollAfter"; kind: string; result: number };

export const Log = {
  description(text: string): Log {
    return { type: "description", text };
  },
  quote(text: string): Log {
    return { type: "quote", text };
  },
  dicerollBefore(kind: string): Log {
    return { type: "dicerollBefore", kind };
  },
  dicerollAfter(kind: string, result: number): Log {
    return { type: "dicerollAfter", kind, result };
  },

  *generateDiceroll(times: number, sides: number): Generator<Log, number> {
    const kind = `${times}d${sides}`;
    yield Log.dicerollBefore(kind);
    // ダイス振るボタンを押す前に結果がわかるのが嫌なのでbefore/afterに分けている。意味はない
    const result = dice(times, sides);
    yield Log.dicerollAfter(kind, result);
    return result;
  },
};
