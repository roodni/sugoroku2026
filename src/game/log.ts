import type { GameContext } from "./game";
import type { Player } from "./gameState";
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

  *generateEarnTrophy(g: GameContext, trophyName: TrophyName): Generator<Log> {
    if (g.state.trophies.map((t) => t.name).includes(trophyName)) {
      return; // 既に周回内で獲得していたらスルー
    }

    let firstTime = false; // リプレイではトロフィーを獲得できない
    if (!g.state.replayMode) {
      firstTime = Trophy.earn(trophyName).firstTime;
    }
    g.state.trophies.push({ name: trophyName, firstTime });

    let firstTimeText = "";
    if (firstTime) {
      firstTimeText = " (new)";
    } else if (g.state.replayMode) {
      firstTimeText = "（保存されません）";
    }
    yield Log.system(
      `[トロフィー獲得] ${trophyName}${firstTimeText}`,
      "neutral",
      (s) => s.replaceAll("[トロフィー獲得] ", "トロフィー獲得。")
    );
  },
};
