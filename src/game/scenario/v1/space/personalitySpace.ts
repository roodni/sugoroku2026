import { GOAL_POSITION } from "../../../config";
import type { GameContext } from "../../../game";
import { PlayerAttrChanger } from "../../../indicator";
import { Log, LogUtil } from "../../../log";
import type { Space } from "../../../scenario";

// 性格変更系マス

export const liveSpace: Space = {
  name: "ライブ会場",
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
    yield Log.description("ライブ会場がある。");
    yield Log.description("暗黒デスメタルバンドが演奏している。");
    yield Log.dialog("ゴォトゥヘル");
    yield Log.description("ドガガガガ！", "negative");
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
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
    yield Log.description("図書館がある。");
    if (player.personality === "violent") {
      yield Log.dialog("あ？　俺は本とか読まないぜ");
      yield Log.description(`${player.name}は図書館を素通りした。`);
    } else {
      yield Log.dialog("たまには本でも読むか");
      yield Log.description(`${player.name}は読書を始めた。`);
      yield Log.description(
        `${player.name}は読書により頭がスマートになった。`,
        "positive"
      );
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
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
    yield Log.description("幽霊屋敷がある。");
    yield Log.description(`${player.name}は足を踏み入れた。`);
    yield Log.dialog("うらめしや……");
    if (player.personality === "violent") {
      yield Log.dialog("邪魔くせえな");
      yield Log.description(`${player.name}は幽霊を無視して通り抜けた。`);
    } else if (player.personality === "smart") {
      yield Log.dialog("フッ、怖くなどないさ");
      yield Log.description(`${player.name}はスマートに回れ右して退出した。`);
    } else {
      yield Log.dialog(`ギャアアアアアアアアアアアア！`);
      yield Log.description(
        `恐怖体験がトラウマとして${player.name}の心に刻み込まれた。`,
        "negative"
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

export const newYearBellSpace: Space = {
  name: "除夜の鐘",
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
    yield Log.description("除夜の鐘が鳴り響く。");
    const dice = yield* LogUtil.generateDiceRoll(g, player.isBot, 1, 100, 8);
    yield Log.description(
      `${player.name}の煩悩が${dice}個浄化された。`,
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

export const seminarSpace: Space = {
  name: "研修",
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
    yield Log.description(`${player.name}は研修を受講した。`);
    yield Log.dialog(
      `これからの市場を生き抜くにはグローバル人材としてソリューションにコミットすることです`
    );
    yield Log.dialog("なるほど……");
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
      PlayerAttrChanger.position(player.position + 3),
      "positive"
    );
    yield Log.dialog("自己成長の機会になったよ");
  },
};

export const onlineGameSpace: Space = {
  name: "ネトゲ",
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
    yield Log.description(`${player.name}はオンライン対戦ゲームで遊んだ。`);
    yield Log.dialog("oh shit! noob! lagger! asshole!");
    yield Log.description("かなりエキサイトした。");
    yield Log.description(
      `${player.name}はゲームと現実の区別がつかなくなった。`,
      "negative"
    );
    yield* LogUtil.generatePlayerAttrChange(
      player,
      PlayerAttrChanger.personality("violent"),
      "neutral"
    );
    yield Log.dialog("うおおお俺は現実でも暴力を振るいたいぜ");
  },
};

export const hygieneSpace: Space = {
  name: "衛生講習会",
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
    yield Log.description(`${player.name}は衛生講習会に参加した。`);
    yield Log.dialog(
      "未加熱の食材は寄生虫に汚染されている場合があります。このように！"
    );
    yield Log.dialog("ひえええ！");
    yield Log.description(
      `衛生講習会は${player.name}のトラウマになった。`,
      "negative"
    );
    yield* LogUtil.generatePlayerAttrChange(
      player,
      PlayerAttrChanger.personality("phobic"),
      "neutral"
    );
    yield Log.dialog("怖い……もう何も食べたくない……");
  },
};
