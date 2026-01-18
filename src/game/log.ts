import { dice } from "../util";
import type { GameState, Player } from "./gameState";
import {
  attrSeparator,
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

export const LogUtil = {
  // ダイスロールは全てここを通す
  // (times)d(sides)+(cnst)
  *generateDiceRoll(
    g: GameState,
    isBot: boolean,
    times: number,
    sides: number,
    cnst: number = 0
  ): Generator<Log, number> {
    // 式の作成
    let expression = `${times}d${sides}`;
    if (cnst > 0) {
      expression += `+${cnst}`;
    } else if (cnst < 0) {
      expression += `${cnst}`;
    }

    // before
    yield Log.diceRollBefore(expression, isBot);

    // 振る
    let result = cnst;
    const details = [];
    for (let i = 0; i < times; i++) {
      const x = g.futureDice.shift() ?? dice(sides); // 綺麗に書けるもんだな
      result += x;
      details.push(x);
      g.diceHistory.push(x);
    }

    // after
    yield Log.diceRollAfter(expression, result, details);
    return result;
  },

  *generatePlayerAttrs(player: Player, attrs: PlayerAttr[]): Generator<Log> {
    const text = stringifyPlayerAttrs(player, attrs);
    yield Log.system(`(${player.name}) ${text}`, "neutral", (s) =>
      s.replaceAll(attrSeparator, "、")
    );
  },

  *generatePlayerAttrsChange(
    player: Player,
    attrs: PlayerAttrChanger[],
    emotion: Emotion
  ): Generator<Log> {
    yield Log.system(
      `(${player.name}) ${stringifyPlayerAttrsChange(player, attrs)}`,
      emotion,
      (s) => s.replaceAll("->", "から").replaceAll(attrSeparator, "、")
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
      return; // 既に周回内で獲得していたらスルー
    }

    let firstTime = false; // リプレイではトロフィーを獲得できない
    if (!g.replayMode) {
      firstTime = Trophy.earn(trophyName).firstTime;
    }
    g.trophies.push({ name: trophyName, firstTime });

    let firstTimeText = "";
    if (firstTime) {
      firstTimeText = " (new)";
    } else if (g.replayMode) {
      firstTimeText = "（保存されません）";
    }
    yield Log.system(
      `[トロフィー獲得] ${trophyName}${firstTimeText}`,
      "neutral",
      (s) => s.replaceAll("[トロフィー獲得] ", "トロフィー獲得。")
    );
  },
};
