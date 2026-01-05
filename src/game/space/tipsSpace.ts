import { Battle, PlayerBattler, Weapon, type Blocker } from "../battle";
import { Log } from "../log";
import type { Space } from "./space";

export const destinyTipsSpace: Space = {
  name: "演説",
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("演説が聞こえる。");
    yield Log.dialog("貴方は運命を信じますか？");
    yield Log.description("内容は胡散臭い。");
    yield Log.dialog(
      "この世界にサイコロ以外のランダム性は存在しません。ターン開始の独り言すら、運命に決定されているのです"
    );
    switch (player.personality) {
      case "gentle":
        yield Log.dialog("へー");
        break;
      case "violent":
        yield Log.dialog("どうでもいいぜ");
        break;
      case "phobic":
        yield Log.dialog("うるさい……離れよう");
        break;
      case "smart":
        yield Log.dialog("サイコロが未来を切り開くってことだね");
        break;
    }
    yield Log.description(`${player.name}は素通りした。`);
  },
};

export const personalityTipsSpace: Space = {
  name: "本屋",
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description(`${player.name}は心理テストの本を立ち読みした。`);
    yield Log.dialog("人々の性格は4種類に分類されます");
    switch (player.personality) {
      case "gentle":
        yield Log.dialog("へー");
        yield Log.description("すぐ忘れた。");
        break;
      case "violent":
        yield Log.dialog("あっそ");
        yield Log.description("読み飛ばした。");
        break;
      case "phobic":
        yield Log.dialog("あ……手袋忘れてた");
        yield Log.description("入念に手を洗った。");
        break;
      case "smart":
        yield Log.dialog("本は知識の宝庫だね");
        yield Log.description("すぐ忘れた。");
        break;
    }
  },
};

class BoardBlocker implements Blocker {
  name = "立て看板";
  hp = 10;
  getHp() {
    return this.hp;
  }
  setHp(hp: number) {
    this.hp = hp;
  }
  *generateDamageVoice(): Generator<never> {}
  *generateKnockedOut() {
    yield Log.description(`${this.name}は木っ端微塵になった。`);
  }
}

export const illegalWeaponTipsSpace: Space = {
  name: "立て看板",
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("立て看板がある。");
    yield Log.dialog(
      "期待値10ダメージ以上の装備は法令により所持が禁止されています"
    );

    if (player.weapon === Weapon.hand) {
      yield Log.description(`${player.name}は装備を持っていない。`);
    } else if (player.weapon.isIllegal) {
      yield Log.description(
        `${player.name}の${player.weapon.name} (${player.weapon.expected}) は違法だ。`,
        "negative"
      );
    } else {
      yield Log.description(
        `${player.name}の${player.weapon.name} (${player.weapon.expected}) は合法だ。`,
        "positive"
      );
    }

    if (player.personality === "violent") {
      const attacker = new PlayerBattler(player);
      const board = new BoardBlocker();
      const { knockedOut } = yield* Battle.generateAttack(g, attacker, board);
      if (knockedOut) {
        yield Log.dialog("警察には気を付けねえとな");
      } else {
        yield Log.dialog("ちっ");
      }
    }
  },
};
