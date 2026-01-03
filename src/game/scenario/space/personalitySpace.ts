import { GOAL_POSITION } from "../../config";
import type { GameState } from "../../gameState";
import { PlayerAttrChanger } from "../../indicator";
import { Log, LogUtil } from "../../log";
import type { Space } from "./space";

// 性格変更系マス

export const liveSpace: Space = {
  name: "ライブ会場",
  *generate(g: GameState) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("ライブ会場がある。");
    yield Log.description("暗黒デスメタルバンドが演奏している。");
    yield Log.dialog("ゴォトゥヘル");
    yield Log.description("ドガガガガ！");
    yield Log.dialog("ロックだ……");
    yield Log.description(`${player.name}は深く感銘を受けた。`);
    yield Log.description(
      `暗黒デスボイスが${player.name}の心に眠る破壊衝動を呼び覚ました。`
    );
    yield* LogUtil.generatePlayerAttrChange(
      player,
      PlayerAttrChanger.personality("violent"),
      "neutral"
    );
    yield Log.dialog("うおおお！　殴りたい！　壊したい！");
  },
};

export const librarySpace: Space = {
  name: "図書館",
  *generate(g: GameState) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("図書館がある。");
    if (player.personality === "violent") {
      yield Log.dialog("あ？　俺は本とか読まないぜ");
      yield Log.description(`${player.name}は図書館をスルーした。`);
    } else {
      yield Log.dialog("たまには本でも読むか");
      yield Log.description(`${player.name}は読書を始めた。`);
      yield Log.description(`${player.name}は読書により頭がスマートになった。`);
      yield* LogUtil.generatePlayerAttrChange(
        player,
        PlayerAttrChanger.personality("smart"),
        "neutral"
      );
      yield Log.dialog(
        "フッ……本は素晴らしい。僕たちを知らない世界へ導いてくれるのさ"
      );
    }
  },
};

export const hauntedHouseSpace: Space = {
  name: "幽霊屋敷",
  *generate(g: GameState) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("幽霊屋敷がある。");
    yield Log.description(`${player.name}は足を踏み入れた。`);
    yield Log.dialog("うらめしや……");
    if (player.personality === "violent") {
      yield Log.dialog("うるせぇ！");
      yield Log.description(`${player.name}は幽霊を殴り倒して通り抜けた。`);
    } else if (player.personality === "smart") {
      yield Log.dialog("フッ、怖くなどないさ");
      yield Log.description(`${player.name}はスマートに回れ右して退出した。`);
    } else {
      yield Log.dialog(`ギャアアアアアアアアアアアア！`);
      yield Log.description(
        `恐怖体験がトラウマとして${player.name}の心に刻み込まれた。`
      );
      yield* LogUtil.generatePlayerAttrChange(
        player,
        PlayerAttrChanger.personality("phobic"),
        "neutral"
      );
      yield Log.dialog("もう嫌だ……二度と来ない……");
    }
  },
};

export const NewYearBellSpace: Space = {
  name: "除夜の鐘",
  *generate(g: GameState) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("除夜の鐘が鳴り響く。");
    const dice = yield* LogUtil.generateDiceRoll(g, player.isBot, 1, 100, 8);
    yield Log.description(
      `${player.name}の煩悩が${dice}浄化された。`,
      "positive"
    );
    yield* LogUtil.generatePlayerAttrChange(
      player,
      PlayerAttrChanger.desire(player.desire - dice),
      "positive"
    );

    if (player.desire <= 0) {
      yield Log.description(`${player.name}は煩悩を完全に克服した。`);
      yield Log.dialog("もう迷いません……");
      yield Log.description(
        `${player.name}は導かれるようにゴールへ飛翔した。`,
        "positive"
      );
      const changers: PlayerAttrChanger[] = [
        PlayerAttrChanger.position(GOAL_POSITION),
      ];
      if (player.personality !== "gentle") {
        changers.push(PlayerAttrChanger.personality("gentle"));
      }
      yield* LogUtil.generatePlayerAttrsChange(player, changers, "positive");
      yield* LogUtil.generateEarnTrophy(g, "境地");
    } else {
      if (player.personality !== "gentle") {
        yield Log.description(`${player.name}は心が洗われた。`);
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.personality("gentle"),
          "neutral"
        );
      }
      yield Log.dialog("良い年になりますように");
    }
  },
};

export const SeminarSpace: Space = {
  name: "研修",
  *generate(g: GameState) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("あなたは研修を受講した。");
    yield Log.dialog(
      `これからの市場を生き抜くにはグローバル人材としてソリューションにコミットすることです`
    );
    yield Log.dialog("なるほどね……");
    yield Log.description(`${player.name}は意識が高まった。`);
    yield* LogUtil.generatePlayerAttrChange(
      player,
      PlayerAttrChanger.personality("smart"),
      "neutral"
    );
    yield Log.dialog("さあ、皆で歩いて一体感を高めましょう！");
    yield Log.description("無駄に一駅分行進させられた。", "negative");
    yield* LogUtil.generatePlayerAttrChange(
      player,
      PlayerAttrChanger.position(player.position + 2),
      "positive"
    );
    yield Log.dialog("自己成長の機会になったよ");
  },
};
