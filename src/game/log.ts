export type Emotion = "positive" | "neutral" | "negative";

export type Log =
  | { type: "description"; text: string; emotion: Emotion } // 地の文
  | { type: "dialog"; text: string } // 台詞
  | { type: "system"; text: string; emotion: Emotion; speech?: string }
  | { type: "newSection" }
  | { type: "diceRollBefore"; expression: string; isBot: boolean }
  | {
      type: "diceRollAfter";
      expression: string;
      result: number;
      details: number[];
    }
  | { type: "turnEnd" };

export const Log = {
  description(text: string, emotion: Emotion = "neutral"): Log {
    return { type: "description", text, emotion };
  },
  dialog(text: string): Log {
    return { type: "dialog", text };
  },
  system(
    text: string,
    emotion: Emotion = "neutral",
    ruby?: (s: string) => string
  ): Log {
    // システムメッセージは text が読み上げに適した形になってない場合があるので rubyで調整する
    // ただし「音声合成が漢字を読み間違える」ようなケースは ruby の対象外。
    // そういうのは logToSpeechText で対処する
    const speech = ruby?.(text);
    return { type: "system", text, emotion, speech };
  },
  diceRollBefore(expression: string, isBot: boolean): Log {
    return { type: "diceRollBefore", expression, isBot };
  },
  diceRollAfter(expression: string, result: number, details: number[]): Log {
    return { type: "diceRollAfter", expression, result, details };
  },
  newSection(): Log {
    return { type: "newSection" };
  },
  turnEnd(): Log {
    return { type: "turnEnd" };
  },
};
