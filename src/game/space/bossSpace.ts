// ボス系マス

import { diceExpected } from "../../util";
import { Battle, PlayerBattler, Weapon, type Battler } from "../battle";
import type { GameState } from "../gameState";
import { PlayerAttrChanger } from "../indicator";
import { Log, LogUtil } from "../log";
import type { Space } from "./space";

class BigFishBattler implements Battler {
  name = "巨大魚";
  isBot = true;

  hp = 8;
  weapon = new Weapon({
    name: "噛みつき",
    *generateAttack(g, attacker, blocker) {
      yield Log.description(`${attacker.name}は${blocker.name}に噛みついた。`);
      const power = yield* LogUtil.generateDiceRoll(g, attacker.isBot, 2, 6);
      return { power };
    },
    expected: diceExpected(2, 6),
  });
  *generateAttackVoice(): Generator<Log> {
    yield Log.dialog("いただきます！");
  }

  getHp() {
    return this.hp;
  }
  setHp(hp: number) {
    this.hp = hp;
  }
  *generateDamageVoice() {
    yield Log.dialog("ギョエー！");
  }
  *generateKnockedOut() {
    yield Log.dialog("バカな……人間ごときに……");
    yield Log.description("巨大魚は食材になった。", "negative");
  }
}

export const fishingSpace: Space = {
  name: "釣り場",
  *generate(g: GameState) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("釣りスポットの池がある。");
    switch (player.personality) {
      case "gentle":
        yield Log.description(
          `${player.name}は釣った魚を焼いて食べた。`,
          "positive"
        );
        yield Log.dialog("おいしい");
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.hp(player.hp + 5),
          "positive"
        );
        break;
      case "violent": {
        yield Log.description(
          `${player.name}は巨大魚を釣り上げた！`,
          "positive"
        );
        yield Log.description("巨大魚は喋りだした。", "negative");
        yield Log.dialog("愚かな人間よ……");
        yield Log.dialog("うわ何だこいつ");
        yield Log.dialog(
          "我が釣られたのではない。汝が釣られたのだ。そして汝は今から我が餌食となる！"
        );
        yield Log.dialog(
          "あ!?　ナメやがって！　お前こそ丸焼きにして賞味してやるぜェー！"
        );
        yield Log.description(
          `${player.name}は巨大魚に襲い掛かった。`,
          "negative"
        );
        const res = yield* Battle.generateBattle(
          g,
          new PlayerBattler(player),
          new BigFishBattler()
        );
        if (res.secondDead) {
          yield Log.newSection();
          yield Log.description(
            `${player.name}は巨大魚を丸焼きにして賞味した。`,
            "positive"
          );
          yield Log.dialog("うまいぜ");
          yield* LogUtil.generateEarnTrophy(g, "池の主釣り");
          yield* LogUtil.generatePlayerAttrChange(
            player,
            PlayerAttrChanger.hp(player.hp + 5),
            "positive"
          );
        }
        break;
      }
      case "phobic":
        yield Log.dialog("衛生的にちょっと……");
        yield Log.description(`${player.name}は釣りをしなかった。`);
        break;
      case "smart":
        yield Log.description(
          `${player.name}はマグロを釣り上げた。`,
          "positive"
        );
        yield Log.dialog("僕のスマートな包丁捌きを見たまえ");
        yield Log.description(
          `${player.name}はマグロを活け造りにして食べた。`,
          "positive"
        );
        yield Log.description("加熱しなかったので腹を壊した！", "negative");
        yield* PlayerBattler.generateHitPlayer(g, 5, player, {
          unblockable: true,
          overrideDamageVoice: "うっ",
        });
        break;
    }
  },
};
