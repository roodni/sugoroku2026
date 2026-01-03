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
        gentle: "つらい",
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

export const shortCutSpace: Space = {
  name: "近道",
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("近道がある。");
    switch (player.personality) {
      case "gentle":
        yield Log.dialog("こっちに行こう");
        yield Log.description(
          `${player.name}は近道を通って2マス進んだ。`,
          "positive"
        );
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.position(player.position + 2),
          "positive"
        );
        break;
      case "violent": {
        yield Log.dialog("俺は最短ルートを行くぜ");
        yield Log.description(`${player.name}は最悪治安路地裏に踏み込んだ。`);
        yield Log.description("武装集団が抗争を繰り広げている。", "negative");
        yield Log.dialog("撃て！");
        yield Log.description(
          `${player.name}に流れ弾（BB弾）が命中した！`,
          "negative"
        );
        const { knockedOut } = yield* PlayerBattler.generateHitPlayer(
          g,
          3,
          player
        );
        if (!knockedOut) {
          yield Log.description(
            `${player.name}はどうにか路地裏を抜けて3マス進んだ。`,
            "positive"
          );
          yield* LogUtil.generatePlayerAttrChange(
            player,
            PlayerAttrChanger.position(player.position + 3),
            "positive"
          );
        }
        break;
      }
      case "phobic":
        yield Log.dialog("治安が心配です");
        yield Log.description(`${player.name}は近道を通らなかった。`);
        break;
      case "smart":
        yield Log.dialog("ふむ……急がば回れとも言うね");
        yield Log.description(`${player.name}は全然違う道を通った。`);
        yield Log.description(`${player.name}は1マス戻った。`, "negative");
        yield* LogUtil.generatePlayerAttrChange(
          player,
          PlayerAttrChanger.position(player.position - 1),
          "negative"
        );
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
        yield Log.description("あなたは更に改造されてしまった。", "negative");
        yield Log.description("あなたの脳はスマートになった。", "positive");
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
