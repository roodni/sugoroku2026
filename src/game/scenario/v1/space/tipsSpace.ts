import { Battle, PlayerBattler, Weapon, type Blocker } from "../../../battle";
import { Log, LogUtil } from "../../../log";
import type { Space } from "../../../scenario";

export const destinyTipsSpace: Space = {
  name: "演説",
  *generate(g) {
    const player = g.state.currentPlayer();
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
    const player = g.state.currentPlayer();
    yield Log.description("本屋がある。");
    yield Log.description(`${player.name}は心理テストの本を手に取った。`);
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
    const player = g.state.currentPlayer();
    yield Log.description("立て看板がある。");
    yield Log.dialog(
      "期待値10ダメージ以上の装備は法令により所持が禁止されています"
    );

    if (player.personality === "violent") {
      // 凶暴の場合、実際に違法かどうか確かめてみる
      const attacker = new PlayerBattler(player);
      const board = new BoardBlocker();
      const { knockedOut } = yield* Battle.generateAttack(g, attacker, board);
      if (knockedOut) {
        yield Log.dialog("警察には気を付けねえとな");
        yield* LogUtil.generateEarnTrophy(g, "違法チェック");
      } else {
        yield Log.dialog("ちっ");
      }
    } else {
      // それ以外は期待値を教える
      if (player.weapon === Weapon.hand) {
        yield Log.description(`${player.name}は丸腰だ。`);
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
    }
  },
};

function rubyRemovingDate(s: string): string {
  // 読み上げだと石碑が長すぎるので日付を削る
  return s.replace(/^\([^)]+\) /, "");
}

export const releaseNoteV1Space: Space = {
  name: "石碑",
  *generate(g) {
    const player = g.state.currentPlayer();
    yield Log.description("石碑に何かが刻まれている。");
    const notes = [
      "(2026-01-04) v1.0 初公開",
      "(2026-01-05) v1.1 トロフィー追加",
      "(2026-01-10) v1.2 リプレイ機能",
      "(2026-01-12) v1.3 ログ読み上げ機能",
    ];
    for (const note of notes) {
      yield Log.system(note, "neutral", rubyRemovingDate);
    }
    const comments = (() => {
      switch (player.personality) {
        case "gentle":
          return [
            "v2.0は出るのかな？",
            "読み上げがONだと自動でゲームが進むんだ",
          ];
        case "violent":
          return [
            "リプレイURLはクソ長くなるが、Xじゃあ11.5文字扱いだから問題ないぜ",
            "スマホだと読み上げ中にスリープになっちまう。気が利かねえな",
          ];
        case "phobic":
          return [
            "既に嫌なマスばかりなのに、これ以上イベントが増えたら、私は……",
            "読み上げ機能は音が鳴ります。注意してくださいね……",
          ];
        case "smart":
          return [
            "マイナーバージョンの更新ではゲームバランスが変わらないのさ",
            "フッ……ログ読み上げをBGMにカフェで作業、なんてワークスタイルはどうかな",
          ];
      }
    })();
    yield Log.dialog(comments[player.turn % comments.length]);
    yield Log.description(`${player.name}は石碑を後にした。`);
  },
};
