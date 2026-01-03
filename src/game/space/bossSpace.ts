// ボス系マス

import { diceExpected } from "../../util";
import { Battle, PlayerBattler, Weapon, type Battler } from "../battle";
import { type GameState } from "../gameState";
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
        const { winner } = yield* Battle.generateBattle(
          g,
          new PlayerBattler(player),
          new BigFishBattler()
        );
        if (winner === "first") {
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

class PoliceBattler implements Battler {
  name = "警察";
  isBot = true;

  hp = 21;
  weapon = Weapon.gun;

  getHp() {
    return this.hp;
  }
  setHp(hp: number) {
    this.hp = hp;
  }

  *generateDamageVoice() {
    yield Log.dialog("ぐは！");
  }
  *generateKnockedOut() {
    yield Log.dialog("治安が……乱れていく……");
    yield* Battle.generateDefaultKnockedOut(this.name);
  }
  *generateAttackVoice() {
    yield Log.dialog("公務執行妨害！");
  }
}
export const policeSpace: Space = {
  name: "職務質問",
  *generate(g: GameState) {
    // 使いまわす処理
    function* generateBosshu() {
      yield Log.description(`${player.name}は装備を没収された。`, "negative");
      yield* LogUtil.generatePlayerAttrChange(
        player,
        PlayerAttrChanger.weapon(Weapon.hand),
        "negative"
      );
    }
    function* generateKaishin() {
      yield Log.description(`${player.name}は更生した。`, "positive");
      yield* LogUtil.generatePlayerAttrChange(
        player,
        PlayerAttrChanger.personality("gentle"),
        "positive"
      );
      yield Log.dialog("これからは真面目に生きていきます");
    }
    // ここから
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("警察が話しかけてきた。");
    yield Log.dialog("君、ちょっと持ち物を見せてもらえるかな");
    if (player.personality === "violent") {
      if (player.weapon.isIllegal) {
        // 凶暴 & 違法
        yield Log.dialog("ちっ");
        yield Log.description(
          `${player.name}は従うかわりに${player.weapon.name}を構えた。`,
          "negative"
        );
        yield Log.dialog(`${player.weapon.name}だと!?　貴様テロリストか！`);
        yield Log.dialog(`見られたからには消えてもらうぜェー！`);
        yield Log.description(
          `${player.name}は警察に襲い掛かった。`,
          "negative"
        );
        const { winner } = yield* Battle.generateBattle(
          g,
          new PlayerBattler(player),
          new PoliceBattler()
        );
        yield Log.newSection();
        if (winner === "first") {
          // 1. 凶暴 & 違法 & 勝利
          yield Log.dialog("自由を勝ち取ったぜ");
          yield* LogUtil.generateEarnTrophy(g, "凶悪犯");
        } else {
          // 2. 凶暴 & 違法 & 敗北
          yield* generateBosshu();
          yield* generateKaishin();
        }
      } else {
        // 凶暴 & 合法
        yield Log.dialog("俺は急いでるんだよー！");
        yield Log.description(`${player.name}は反抗した。`);
        yield Log.dialog("非協力的な態度。貴様まさかテロリストか？");
        yield Log.dialog("あ!?　冤罪だ！　ぶっ殺してやる！");
        yield Log.description(
          `${player.name}は警察に襲い掛かった。`,
          "negative"
        );
        const { winner } = yield* Battle.generateBattle(
          g,
          new PlayerBattler(player),
          new PoliceBattler()
        );
        yield Log.newSection();
        if (winner === "first") {
          // 3. 凶暴 & 合法 & 勝利
          yield Log.dialog("ククク……");
          yield Log.description(
            `${player.name}は警察の装備を奪った。`,
            "negative"
          );
          yield* LogUtil.generatePlayerAttrChange(
            player,
            PlayerAttrChanger.weapon(Weapon.gun),
            "positive"
          );
          yield* LogUtil.generateEarnTrophy(g, "凶悪犯");
        } else {
          // 4. 凶暴 & 合法 & 敗北
          yield* generateKaishin();
        }
      }
    } else {
      if (player.weapon === Weapon.hand) {
        // 5. 凶暴ではない + 持ち物なし
        yield Log.description(
          `${player.name}は手ぶらだったので解放された。`,
          "positive"
        );
      } else {
        // 凶暴ではない + 持ち物あり
        yield Log.dialog(
          {
            gentle: "はい",
            phobic: "え、ええ",
            smart: "ご自由に",
          }[player.personality]
        );
        yield Log.description(`${player.name}は装備を見せた。`);
        if (player.weapon.isIllegal) {
          // 凶暴ではない + 違法
          yield Log.dialog(
            `${player.weapon.name}だと!?　なぜこんなものを所持している！`
          );
          switch (player.personality) {
            case "gentle":
              // 6. 凶暴ではない + 違法 + 温厚
              yield Log.dialog("こ、これは護身用で！");
              yield Log.dialog("言い訳は署で聞かせてもらおう");
              yield* generateBosshu();
              break;
            case "smart":
              // 7. 凶暴ではない + 違法 + スマート
              yield Log.dialog("フフフ……これは護身用ですよ");
              yield Log.description(
                `${player.name}はそう言って賄賂を渡した。`,
                "negative"
              );
              yield Log.dialog("む。なら仕方ないな。次から気をつけるんだぞ？");
              yield Log.dialog("スマートに肝に銘じます");
              yield Log.description(`${player.name}は解放された。`, "positive");
              break;
            case "phobic": {
              // 凶暴ではない + 違法 + 恐怖症
              yield Log.dialog("あ、あの……これはその……");
              yield Log.dialog("言い訳は署で聞かせてもらおう。現行犯逮捕する");
              yield Log.dialog("ひっ");
              yield Log.description(
                `警察は${player.name}に手錠をかけようと手を伸ばし……`
              );
              yield Log.dialog("触らないでッ！");
              yield Log.description(
                `${player.name}は警察に襲い掛かった！`,
                "negative"
              );
              const { winner } = yield* Battle.generateBattle(
                g,
                new PlayerBattler(player),
                new PoliceBattler()
              );
              yield Log.newSection();
              if (winner === "first") {
                // 8. 凶暴ではない + 違法 + 恐怖症 + 勝利
                yield Log.description(
                  `${player.name}はその場を後にした。`,
                  "positive"
                );
                yield Log.dialog("はー、はー……");
                yield* LogUtil.generateEarnTrophy(g, "凶悪犯");
              } else {
                // 9. 凶暴ではない + 違法 + 恐怖症 + 敗北
                yield* generateBosshu();
              }
              break;
            }
          }
        } else {
          // 10. 凶暴ではない + 合法
          yield Log.dialog(
            `${player.weapon.name}ですか。なぜ持ち歩いているのですか？`
          );
          yield Log.dialog(
            {
              gentle: "いやーこれは護身用で",
              phobic: "ご、護身用に……",
              smart: "フフフ……これは護身用ですよ",
            }[player.personality]
          );
          yield Log.dialog("護身用ならいいか");
          yield Log.description(`${player.name}は解放された。`, "positive");
        }
      }
    }
  },
};
