import { PlayerBattler, Weapon } from "../../../battle";
import { INITIAL_HP } from "../../../config";
import { generateDiceRoll } from "../../../dice";
import {
  generatePlayerAttrChange,
  PlayerAttrChanger,
} from "../../../indicator";
import { Log } from "../../../log";
import type { Space } from "../../../scenario";

// お助け系マス

export const konbiniSpace: Space = {
  name: "コンビニ",
  *generate(g) {
    const player = g.state.currentPlayer();
    yield Log.description("コンビニがある。");
    switch (player.personality) {
      case "gentle":
        yield Log.dialog("食べ物を買っていこう");
        yield Log.description(
          `${player.name}はお弁当を食べて元気になった。`,
          "positive"
        );
        yield* generatePlayerAttrChange(
          player,
          PlayerAttrChanger.hp(player.hp + 5),
          "positive"
        );
        break;
      case "violent":
        yield Log.dialog("装備を買っていくか");
        yield Log.description(`${player.name}はこん棒を購入した。`, "positive");
        yield* generatePlayerAttrChange(
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
        yield* generatePlayerAttrChange(
          player,
          PlayerAttrChanger.hp(player.hp + 1),
          "positive"
        );
        break;
      case "smart":
        yield Log.dialog("スマートに酒を嗜むとしよう");
        yield Log.description(`${player.name}はワインを購入した。`);
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
    const player = g.state.currentPlayer();
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
    yield* generatePlayerAttrChange(
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
    const player = g.state.currentPlayer();
    yield Log.description("近道がある。");
    switch (player.personality) {
      case "gentle":
        yield Log.dialog("こっちに行こう");
        yield Log.description(
          `${player.name}は近道を通って2マス進んだ。`,
          "positive"
        );
        yield* generatePlayerAttrChange(
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
          yield* generatePlayerAttrChange(
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
        yield* generatePlayerAttrChange(
          player,
          PlayerAttrChanger.position(player.position - 1),
          "negative"
        );
        break;
    }
  },
};

export const weaponShopSpace: Space = {
  name: "武器屋",
  *generate(g) {
    const player = g.state.currentPlayer();
    yield Log.description("武器屋がある。");
    yield Log.dialog("らっしゃい！");
    switch (player.personality) {
      case "gentle":
        yield Log.dialog("いらないかな");
        yield Log.description(`${player.name}は武器屋を後にした。`);
        return;
      case "violent":
        yield Log.dialog("強い武器が欲しいぜ");
        break;
      case "phobic":
        yield Log.dialog("まあ護身用に……");
        break;
      case "smart":
        yield Log.dialog("スマートに物色といこうか");
        break;
    }

    yield Log.newSection();
    yield Log.description("何を買う？");
    const weaponList = [
      [Weapon.chikuwa, "固定1ダメージの武器だぜ"],
      [Weapon.knuckle, "素手より3ダメージ強くなるぜ"],
      [
        Weapon.magicalStaff,
        "そいつは 1d10+3 のマジカルアイテムだ。敵をどんどん呪っていけ！",
      ],
      [
        Weapon.hammer,
        `そいつは 1d100 の超兵器！　ただし重すぎてゾロ目じゃないと外れるぜ`,
      ],
      [Weapon.darkSword, "そいつは 3d6+2 の魔剣だな。掘り出し物だぜ"],
      [Weapon.beam, "固定20ダメージの最強装備だ。ちなみに違法だぜ"],
    ] as const;
    for (let i = 1; i <= 6; i++) {
      const weapon = weaponList[i - 1][0];
      yield Log.system(`(${i}) ${weapon.name}`);
    }

    yield Log.newSection();
    const dice = yield* generateDiceRoll(g, player.isBot, 1, 6);
    const [weapon, description] = weaponList[dice - 1];
    yield Log.description(`${player.name}は${weapon.name}を購入した。`);
    if (weapon === Weapon.chikuwa && player.personality === "smart") {
      yield Log.dialog(description);
      yield Log.dialog("食べ物だよね");
      yield Log.description(`${player.name}はちくわを食べた。`, "positive");
      yield* generatePlayerAttrChange(
        player,
        PlayerAttrChanger.hp(player.hp + 5),
        "positive"
      );
    } else {
      yield* generatePlayerAttrChange(
        player,
        PlayerAttrChanger.weapon(weapon),
        "neutral"
      );
      yield Log.dialog(description);
      switch (player.personality) {
        case "violent":
          yield Log.dialog("ククク……心得た");
          break;
        case "phobic":
          yield Log.dialog("は、はい……");
          break;
        case "smart":
          yield Log.dialog("承知したよ");
          break;
      }
    }
  },
};
