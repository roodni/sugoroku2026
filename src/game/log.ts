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
  system(text: string, emotion: Emotion = "neutral"): Log {
    return { type: "system", text, emotion };
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
