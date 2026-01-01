import { PlayerBattler, Weapon } from "../../battle";
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
        yield Log.description("あなたは嘔吐した。", "negative");
        yield* PlayerBattler.generateHitPlayer(g, 3, player, {
          unblockable: true,
          overrideDamageVoice: "オロロロロ",
        });
        break;
    }
  },
};
