// ボス系マス

import { diceExpected } from "../../../../util";
import { Battle, PlayerBattler, Weapon, type Battler } from "../../../battle";
import { GOAL_POSITION } from "../../../config";
import type { GameContext } from "../../../game";
import { Player } from "../../../gameState";
import { PlayerAttrChanger } from "../../../indicator";
import { Log, LogUtil } from "../../../log";
import type { Space } from "../../../scenario";

class BigFishBattler implements Battler {
  name = "巨大魚";
  isBot = true;

  hp = 9;
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
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
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
          PlayerAttrChanger.hp(player.hp + 3),
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
          `${player.name}は巨大魚に襲いかかった。`,
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
          yield* LogUtil.generatePlayerAttrChange(
            player,
            PlayerAttrChanger.hp(player.hp + 5),
            "positive"
          );
          yield* LogUtil.generateEarnTrophy(g, "池の主釣り");
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
  *generate(g: GameContext) {
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
    const player = g.state.currentPlayer();
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
          `${player.name}は警察に襲いかかった。`,
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
          `${player.name}は警察に襲いかかった。`,
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
                `${player.name}は警察に襲いかかった！`,
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

class GoddessBattler implements Battler {
  name = "女神";
  player: Player;
  get isBot() {
    return this.player.isBot; // ログが長いので、ダイスで止まるようにする
  }

  hp = 100;
  weapon: Weapon;

  constructor(weapon: Weapon, player: Player) {
    this.weapon = weapon;
    this.player = player;
  }

  getHp() {
    return this.hp;
  }
  setHp(hp: number) {
    this.hp = hp;
  }

  *generateDamageVoice(
    _g: GameContext,
    details: { beforeHp: number; damage: number }
  ): Generator<Log> {
    if (details.beforeHp === 100) {
      yield Log.dialog("あらあら");
    }
  }
  *generateKnockedOut() {
    yield Log.dialog("バカな……人間ごときに……？");
    yield* Battle.generateDefaultKnockedOut(this.name);
  }
  *generateAttackVoice(): Generator<Log> {
    yield Log.dialog("お仕置きです");
  }
}

export const goddessSpace: Space = {
  name: "湖",
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
    yield Log.description("湖がある。");
    if (player.weapon === Weapon.hand) {
      // 1. 素手
      yield Log.description("特に何も起こらなかった。");
      return;
    }
    if (player.weapon === Weapon.goldenAxe) {
      // 2. 周回済み
      yield Log.dialog(
        {
          gentle: `斧を落とさないように注意しないと`,
          violent: `もうここには近づきたくないぜ`,
          phobic: `嫌なこと思い出した……`,
          smart: `フッ……近づかないのが賢明だね`,
        }[player.personality]
      );
      yield Log.description(`${player.name}は湖を素通りした。`);
      return;
    }
    yield Log.description(
      `${player.name}は装備を湖に落としてしまった。`,
      "negative"
    );
    const droppedWeapon = player.weapon;
    yield* LogUtil.generatePlayerAttrChange(
      player,
      PlayerAttrChanger.weapon(Weapon.hand),
      "negative"
    );
    yield Log.description("湖から女神が現れた。", "positive");
    yield Log.dialog(
      `貴方が落としたのは${droppedWeapon.name}ですか？　それとも、この金の斧ですか？`
    );
    const goddess = new GoddessBattler(droppedWeapon, player);
    const playerBattler = new PlayerBattler(player);
    switch (player.personality) {
      case "gentle":
        // 3. 温厚
        yield Log.dialog(`${droppedWeapon.name}です`);
        yield Log.description("女神は微笑んだ。", "positive");
        yield Log.dialog("正直者の貴方には金の斧を与えましょう");
        // yield Log.description(`${player.name}は金の斧を貰った。`);
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.weapon(Weapon.goldenAxe),
          "neutral"
        );
        yield Log.dialog("ありがとうございます");
        break;
      case "violent": {
        yield Log.description(`${player.name}は質問した。`);
        yield Log.dialog(`金の斧ってダメージいくつだ？`);
        yield Log.dialog(`${Weapon.goldenAxe.expected}ダメージですね`);
        if (Weapon.goldenAxe.expected > droppedWeapon.expected) {
          // 4. 凶暴 => 弱装備
          yield Log.dialog(`じゃあ俺が落としたのは金の斧です`);
          yield Log.description("女神は微笑んだ。", "negative");
          yield Log.dialog(`……なら、金の斧をお渡しします`);
          yield* LogUtil.generatePlayerAttrChange(
            player,
            PlayerAttrChanger.weapon(Weapon.goldenAxe),
            "positive"
          );
          yield Log.dialog("マジ？　やったぜ");
          yield Log.dialog("ただし");
          yield Log.description(`女神は冷たく言った。`);
          yield Log.dialog("嘘をついた報いを今受けてもらいますよ");
          yield Log.description(
            `女神は${player.name}に襲いかかった！`,
            "negative"
          );
          const { winner } = yield* Battle.generateBattle(
            g,
            playerBattler,
            goddess
          );
          if (winner === "first") {
            // 凶暴 => 金の斧 => 勝利
            yield Log.newSection();
            yield Log.description(
              `${player.name}は女神の力の一片を得た。`,
              "positive"
            );
            yield* LogUtil.generatePlayerAttrChange(
              player,
              PlayerAttrChanger.hp(player.hp + 100),
              "positive"
            );
            yield Log.dialog("オオオオ！　力が湧き出て止まらないぜ！");
            yield* LogUtil.generateEarnTrophy(g, "湖の女神");
          } else {
            // 凶暴 => 金の斧 => 敗北
            // noop
          }
        } else {
          // 5. 凶暴 => 強装備
          yield Log.dialog(`じゃあ俺が落としたのは${droppedWeapon.name}です`);
          yield Log.description("女神は微笑んだ。", "negative");
          yield Log.dialog(`……正直物の貴方には金の斧を与えましょう`);
          yield* LogUtil.generatePlayerAttrChange(
            player,
            PlayerAttrChanger.weapon(Weapon.goldenAxe),
            "positive"
          );
          yield Log.dialog(`いや${droppedWeapon.name}を返してくれよ`);
          yield Log.dialog(`それは人の手に余る代物です。斧で我慢なさい`);
          yield Log.description(`女神は湖の底に消えていった。`, "negative");
          yield Log.dialog("おい待てコラ！");
        }
        break;
      }
      case "phobic":
        // 6. 恐怖症
        yield Log.dialog(`${droppedWeapon.name}です……`);
        yield Log.description("女神は微笑んだ。", "positive");
        yield Log.dialog("正直者の貴方には金の斧を与えましょう");
        yield Log.dialog(
          `そんな、（水辺から出たものは触りたくないので）受け取れません`
        );
        yield Log.description(
          `${player.name}は断ったが、女神は更に気に入った様子だった。`,
          "negative"
        );
        yield Log.dialog(`なんと謙虚な人間。貴方こそが金の斧にふさわしい`);
        yield Log.dialog(`いや本当にいらな……`);
        yield Log.dialog(`受け取れって言ってるでしょッ！`);
        goddess.weapon = Weapon.goldenAxe;
        yield* Battle.generateAttack(g, goddess, playerBattler, {
          skipAttackVoice: true,
        });
        yield Log.description(
          `女神の呪いで、斧が${player.name}の手から離れなくなった！`,
          "positive"
        );
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.weapon(Weapon.goldenAxe),
          "positive"
        );
        yield Log.dialog("嫌゛あ゛あ゛あ゛！゛");
        break;
      case "smart":
        // 7. スマート
        yield Log.description(`${player.name}は女神の手を取って言った。`);
        yield Log.dialog("君が欲しい……");
        yield Log.dialog("は？");
        yield* Battle.generateAttack(g, goddess, playerBattler, {
          skipAttackVoice: true,
        });
        yield Log.dialog(`不敬ぞ`);
        goddess.weapon = Weapon.goldenAxe;
        yield* Battle.generateAttack(g, goddess, playerBattler, {
          skipAttackVoice: true,
        });
        yield Log.description(`女神は湖の底に消えていった。`, "negative");
        yield Log.description(`${player.name}は金の斧を拾った。`, "positive");
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.weapon(Weapon.goldenAxe),
          "positive"
        );
        yield Log.dialog(`あはは……スマートが過ぎたかな`);
        break;
    }
  },
};

class NinjaBattler implements Battler {
  name = "忍者";
  isBot = true;

  hp = 14;
  weapon = Weapon.ninjaStar;

  getHp() {
    return this.hp;
  }
  setHp(hp: number) {
    this.hp = hp;
  }

  *generateDamageVoice() {
    yield Log.dialog("あなや！");
  }
  *generateKnockedOut() {
    yield Log.dialog("無念……");
    yield* Battle.generateDefaultKnockedOut(this.name);
  }
  *generateAttackVoice(): Generator<Log> {
    yield Log.dialog("アチョー！");
  }
}

export const ninjaSpace: Space = {
  name: "和風庭園",
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
    yield Log.description("和風庭園がある。");
    yield Log.description("突然、忍者が現れた！", "negative");
    yield Log.dialog("ニンニン……");
    switch (player.personality) {
      case "gentle":
        yield Log.description(`${player.name}は忍者に挨拶した。`);
        yield Log.dialog("こんにちは！");
        yield Log.dialog("朗らかな一日でござるな");
        yield Log.description("心が温かくなった。");
        yield Log.description("忍者は兵糧丸を分けてくれた。", "positive");
        yield Log.dialog("何とも言えない味だね");
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.hp(player.hp + 3),
          "positive"
        );
        yield Log.description("忍者はドロンと消えた。");
        break;
      case "violent": {
        yield Log.dialog("うわっ何だお前");
        yield Log.dialog("お覚悟召されよ！");
        yield Log.description(
          `忍者は${player.name}に襲いかかった。`,
          "negative"
        );
        const { winner } = yield* Battle.generateBattle(
          g,
          new PlayerBattler(player),
          new NinjaBattler()
        );
        if (winner === "first") {
          yield Log.newSection();
          yield Log.dialog("何だったんだ……");
          yield Log.description(
            `${player.name}は忍者の武器を拾った。`,
            "positive"
          );
          yield* LogUtil.generatePlayerAttrChange(
            player,
            PlayerAttrChanger.weapon(Weapon.ninjaStar),
            "positive"
          );
          yield* LogUtil.generateEarnTrophy(g, "曲者退治");
        }
        break;
      }
      case "phobic": {
        yield Log.dialog("うわあっ！");
        const add = 4;
        yield Log.description(
          `${player.name}は全力疾走で逃げて${add}マス進んだ。`,
          "positive"
        );
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.position(player.position + add),
          "positive"
        );
        yield Log.description("しかし忍者に追いつかれてしまった！", "negative");
        yield Log.dialog("ひいいい！");
        yield Log.dialog("拙者、走力には自信がござるよ");
        yield Log.description("忍者は自慢げにドロンと消えた。");
        yield Log.description(`${player.name}は疲れ果てた。`, "negative");
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.turnSkip(1),
          "negative"
        );
        yield Log.dialog("はあ、はあ……");
        break;
      }
      case "smart":
        yield Log.description(`${player.name}は忍者に指摘した。`);
        yield Log.dialog("時代錯誤ではないかい？");
        yield Log.dialog("忍者も良いものでござるよ。お近づきの印にこれを");
        yield Log.description("忍者は手裏剣を分けてくれた。", "positive");
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.weapon(Weapon.ninjaStar),
          "positive"
        );
        yield Log.dialog("フッ……使ってみるよ");
        yield Log.description("忍者は満足げに頷いてドロンと消えた。");
        break;
    }
  },
};

class GodZeusBattler implements Battler {
  name = "ゴッドゼウス";
  isBot = true;
  g: GameContext;

  constructor(gameState: GameContext) {
    this.g = gameState;
  }

  getHp() {
    return this.g.state.zeusHp;
  }
  setHp(hp: number) {
    this.g.state.zeusHp = hp;
  }
  weapon = Weapon.lightning;

  *generateDamageVoice(
    _g: GameContext,
    details: { beforeHp: number; damage: number }
  ) {
    if (details.beforeHp > details.damage) {
      yield Log.dialog("愚か");
    } else {
      yield Log.dialog("な……");
    }
  }
  *generateKnockedOut() {
    yield Log.dialog("バカな……我が……人間ごときに……！");
    yield* Battle.generateDefaultKnockedOut(this.name);
  }
  *generateAttackVoice(): Generator<Log> {
    yield Log.dialog("滅びよ");
  }
}

export const godZeusSpace: Space = {
  name: "神殿",
  *generate(g: GameContext) {
    const player = g.state.currentPlayer();
    const alreadyMet = g.state.zeusHp < 100;
    yield Log.description(
      `${alreadyMet ? "ゴッドゼウス" : "謎"}の神殿がある。`,
      alreadyMet ? "negative" : "neutral"
    );
    if (g.state.zeusHp <= 0) {
      yield Log.description(`ゴッドゼウスは一時的に不在のようだ。`, "positive");
      return;
    }

    yield Log.description(
      `${alreadyMet ? "神" : "何か"}が${player.name}に語りかけた。`
    );
    yield Log.dialog("愚かな人間よ……");

    if (player.personality === "gentle") {
      yield Log.description(`${player.name}は挨拶した。`);
      yield Log.dialog("こんにちは！");
      yield Log.dialog("ほう、挨拶とは殊勝な");
      yield Log.description("心が温かくなった。");
      yield Log.description(
        `呼応するように追い風が吹き、${player.name}は${
          GOAL_POSITION - player.position
        }マス進んだ。`,
        "positive"
      );
      yield* LogUtil.generatePlayerAttrChange(
        player,
        PlayerAttrChanger.position(GOAL_POSITION),
        "positive"
      );
      return;
    }

    if (g.state.zeusHp === 100) {
      yield Log.dialog(
        {
          violent: "あ!?　何だてめえ！　姿を見せろ！",
          phobic: "ひいっ！　誰!?　どこ!?",
          smart: "いきなりマウントとは驚いたね。まず名前を教えてくれないかな？",
        }[player.personality]
      );
      yield Log.description(`それは${player.name}の眼前に降臨した。`);
      yield Log.dialog(`我は最強神ゴッドゼウス。裁きの時は来たれり`);
    } else {
      yield Log.description(`怒り狂った神が降臨した。`);
      yield Log.dialog("何度でも裁きを下そうぞ");
      yield Log.dialog(
        {
          violent: "まだいやがったか！",
          phobic: "私が何をしたって言うんですか！",
          smart: "フッ……どうやら、HP消耗は累積するようだね",
        }[player.personality]
      );
    }
    yield Log.description(
      `ゴッドゼウスは${player.name}に襲いかかった！`,
      "negative"
    );

    const { winner } = yield* Battle.generateBattle(
      g,
      new PlayerBattler(player),
      new GodZeusBattler(g)
    );
    if (winner === "first") {
      yield Log.newSection();
      yield Log.description(`${player.name}は神の力の一片を得た。`, "positive");
      yield* LogUtil.generatePlayerAttrChange(
        player,
        PlayerAttrChanger.weapon(Weapon.lightning),
        "positive"
      );
      yield Log.dialog(
        {
          violent: "ハハハハ！　これで俺が最強神！",
          phobic: "こんなのいらない……",
          smart: "確かに人間は愚かさ。だからこそ僕たちはスマートを追求するんだ",
        }[player.personality]
      );
      yield* LogUtil.generateEarnTrophy(g, "最強神");
    }
  },
};
