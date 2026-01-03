// 罠系のマス

import { PlayerBattler } from "../battle";
import { PlayerAttrChanger } from "../indicator";
import { Log, LogUtil } from "../log";
import type { Space } from "./space";

export const spikyFloorSpace: Space = {
  name: "トゲ床",
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("床がトゲトゲになっている。", "negative");
    yield Log.description(`${player.name}は踏んでしまった。`);
    yield* PlayerBattler.generateHitPlayer(g, 4, player, {});
    switch (player.personality) {
      case "gentle":
        yield Log.dialog("どうして……");
        break;
      case "violent":
        yield Log.dialog("ふざけんな！");
        break;
      case "phobic":
        yield Log.dialog("もう嫌だ……");
        break;
      case "smart":
        yield Log.dialog("フッ……下手を打ったね");
        break;
    }
  },
};

export const LaboratorySpace: Space = {
  // クソイベ
  name: "研究所",
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    if (player.dice !== "1d100") {
      // 初回
      yield Log.description("研究所がある。");
      yield Log.dialog(
        "ワシは人体改造研究所の所長じゃ。君の体も改造してあげよう"
      );
      if (player.personality === "phobic") {
        yield Log.dialog("絶対に嫌です");
        yield Log.description(`${player.name}は研究所を後にした。`, "positive");
      } else {
        yield Log.dialog(
          {
            gentle: "お願いします",
            violent: "おう頼むわ",
            smart: "よろしく頼むよ",
          }[player.personality]
        );
        yield Log.description(`${player.name}は改造手術を受けた。`);
        yield Log.description(
          `${player.name}にジェットエンジンが取り付けられた。`,
          "negative"
        );
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.dice("1d100"),
          "negative"
        );
        yield Log.dialog("ホッホッホ、これで君も高速移動できるぞい");
        yield Log.description(`${player.name}は研究所から放り出された。`);
      }
    } else {
      // 2回目
      yield Log.description("人体改造研究所がある。", "negative");
      yield Log.dialog("ホッホッホ、ジェットエンジンの調子はどうかね？");
      if (player.personality === "smart") {
        yield Log.dialog("フッ……どうにか扱えそうだよ");
        yield Log.dialog("マジか");
        yield Log.description(`${player.name}は研究所を後にした。`);
      } else {
        yield Log.description(`${player.name}は文句を言った。`);
        switch (player.personality) {
          case "gentle":
            yield Log.dialog("ゴールで止まれないんですが");
            break;
          case "violent":
            yield Log.dialog("ふざけんな！　全然制御できねえぞ!?");
            break;
          case "phobic":
            yield Log.dialog("よくも……よくも私の体を、こんな……！");
        }
        yield Log.dialog("ならば脳にも改造が必要じゃな");
        yield Log.description(
          `${player.name}は更に改造されてしまった。`,
          "negative"
        );
        yield Log.description(
          `${player.name}の脳はスマートになった。`,
          "positive"
        );
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.personality("smart"),
          "positive"
        );
        yield Log.dialog("感謝します……ドクター……");
        yield* LogUtil.generateEarnTrophy(g, "身も心も");
      }
    }
  },
};
