import { PlayerBattler, Weapon } from "../../battle";
import { INITIAL_HP } from "../../config";
import { PlayerAttrChanger } from "../../indicator";
import { Log, LogUtil } from "../../log";
import type { Space } from "./space";

// お助け系マス

export const konbiniSpace: Space = {
  name: "コンビニ",
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("コンビニがある。");
    switch (player.personality) {
      case "gentle":
        yield Log.dialog("食べ物を買っていこう");
        yield Log.description(
          `${player.name}はお弁当を食べて元気になった。`,
          "positive"
        );
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.hp(player.hp + 5),
          "positive"
        );
        break;
      case "violent":
        yield Log.dialog("装備を買っていくか");
        yield Log.description(`${player.name}はこん棒を購入した。`, "positive");
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.weapon(Weapon.stick),
          "positive"
        );
        yield Log.dialog(`1d10で殴れるぜ`);
        break;
      case "phobic":
        yield Log.dialog("胃薬……");
        yield Log.description(`${player.name}は胃薬を買って飲んだ。`);
        yield Log.description("胃が少し楽になった。", "positive");
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.hp(player.hp + 1),
          "positive"
        );
        break;
      case "smart":
        yield Log.dialog("スマートに酒を嗜むとしよう");
        yield Log.description(`${player.name}は高級ワインを購入した。`);
        yield Log.description("飲みすぎた！", "negative");
        yield* PlayerBattler.generateHitPlayer(g, 3, player, {
          unblockable: true,
          overrideDamageVoice: "オロロロロ",
        });
        break;
    }
  },
};

export const hospitalSpace: Space = {
  name: "病院",
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("病院がある。");

    if (player.hp >= INITIAL_HP) {
      yield Log.dialog(
        {
          gentle: "特に用はないね",
          violent: "どうでもいいぜ",
          phobic: "大丈夫……ですよね",
          smart: "僕の体調管理は完璧さ",
        }[player.personality]
      );
      yield Log.description(`${player.name}は病院を素通りした。`);
      return;
    }

    yield Log.description(
      `${player.name}は${INITIAL_HP - player.hp}ダメージを受けている。`,
      "negative"
    );

    const threshold = Math.floor(INITIAL_HP / 2);
    if (player.hp >= threshold) {
      yield Log.dialog(
        {
          gentle: "大げさかな",
          violent: "大したことないぜ",
          phobic: "あまり入りたくない場所です",
          smart: "西洋医学はスマートではないのさ",
        }[player.personality]
      );
      yield Log.description(
        `HPが半分以上あるので、${player.name}は病院を素通りした。`
      );
      return;
    }

    yield Log.dialog(
      {
        gentle: "つ、つらい",
        violent: "助けてくれ……",
        phobic: "痛い……苦しい！",
        smart: "流石に堪えるね",
      }[player.personality]
    );
    yield Log.description(`${player.name}は治療を受けた。`, "positive");
    yield* LogUtil.generatePlayerAttrChange(
      player,
      PlayerAttrChanger.hp(threshold),
      "positive"
    );
  },
  isHospital: true,
};
