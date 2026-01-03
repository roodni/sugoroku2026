import { diceExpected } from "../util";
import { INITIAL_HP } from "./config";
import { GameState, Player } from "./gameState";
import { PlayerAttr, PlayerAttrChanger } from "./indicator";
import { Log, LogUtil } from "./log";
import { SPACE_MAP } from "./space/space";

// 攻撃するもの
export interface Attacker {
  name: string;
  isBot: boolean;
  weapon: Weapon;
  generateAttackVoice(g: GameState): Generator<Log>;
}

// 攻撃を受けるもの
export interface Blocker {
  name: string;
  getHp(): number;
  setHp(hp: number): void;
  smart?: boolean;
  generateDamageVoice(
    g: GameState,
    details: { beforeHp: number; damage: number }
  ): Generator<Log>;
  generateKnockedOut(g: GameState): Generator<Log>;
}

export type Battler = Blocker & Attacker;

// 武器の処理
type WeaponAttackGenerator = (
  g: GameState,
  attacker: Attacker,
  blocker: Blocker
) => Generator<Log, { power: number }>;

// 武器
export class Weapon {
  name: string;
  generateAttack: WeaponAttackGenerator;
  expected: number; // 期待値

  constructor(arg: {
    name: string;
    generateAttack: WeaponAttackGenerator;
    expected: number;
  }) {
    this.name = arg.name;
    this.generateAttack = arg.generateAttack;
    this.expected = arg.expected;
  }

  static hand = new this({
    name: "素手",
    *generateAttack(g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(`${attacker.name}は${blocker.name}を殴った。`);
      const power = yield* LogUtil.generateDiceRoll(g, attacker.isBot, 1, 6);
      return { power };
    },
    expected: diceExpected(1, 6),
  });
  static stick = new this({
    name: "こん棒",
    *generateAttack(g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(
        `${attacker.name}は${blocker.name}を${this.name}で殴った。`
      );
      const power = yield* LogUtil.generateDiceRoll(g, attacker.isBot, 1, 10);
      return { power };
    },
    expected: diceExpected(1, 10),
  });

  // 武器屋のラインナップ
  static chikuwa = new this({
    name: "ちくわ",
    *generateAttack(_g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(
        `${attacker.name}は${blocker.name}を${this.name}で殴った。`
      );
      return { power: 1 };
    },
    expected: 1,
  });
  static knuckle = new this({
    name: "ナックル",
    *generateAttack(g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(
        `${attacker.name}は${blocker.name}を${this.name}で殴った。`
      );
      const power = yield* LogUtil.generateDiceRoll(g, attacker.isBot, 1, 6, 3);
      return { power };
    },
    expected: diceExpected(1, 6) + 3,
  });
  static magicalStaff = new this({
    name: "魔法の杖",
    *generateAttack(g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(
        `${attacker.name}${blocker.name}を${this.name}で呪った。`
      );
      const power = yield* LogUtil.generateDiceRoll(
        g,
        attacker.isBot,
        1,
        10,
        3
      );
      return { power };
    },
    expected: diceExpected(1, 10) + 3,
  });
  static hammer = new this({
    name: "100tハンマー",
    *generateAttack(g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(
        `${attacker.name}は${blocker.name}に向かって${this.name}を振りかぶった。`
      );
      const power = yield* LogUtil.generateDiceRoll(g, attacker.isBot, 1, 100);
      // ぞろ目
      if (power % 11 === 0 || power === 100) {
        yield Log.description("ゾロ目だ！", "positive");
        yield Log.description("強烈な一撃！", "negative");
        return { power };
      } else {
        yield Log.description("ゾロ目以外なので攻撃は外れた。", "negative");
        return { power: 0 };
      }
    },
    expected: (11 + 22 + 33 + 44 + 55 + 66 + 77 + 88 + 99 + 100) / 100, // 5.95
  });
  static darkSword = new this({
    name: "暗黒破壊剣",
    *generateAttack(g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(
        `${attacker.name}は${blocker.name}を${this.name}で斬った。`
      );
      const power = yield* LogUtil.generateDiceRoll(g, attacker.isBot, 3, 6, 2);
      return { power };
    },
    expected: diceExpected(3, 6) + 2,
  });
  static beam = new this({
    name: "ビーム砲",
    *generateAttack(_g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(
        `${attacker.name}は${blocker.name}にビーム砲を発射した。`
      );
      return { power: 20 };
    },
    expected: 20,
  });

  // ボス
  static ninjaStar = new this({
    name: "手裏剣",
    *generateAttack(g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(
        `${attacker.name}は${blocker.name}に${this.name}を投げた。`
      );
      const power = yield* LogUtil.generateDiceRoll(g, attacker.isBot, 2, 6);
      return { power };
    },
    expected: diceExpected(2, 6),
  });

  static list: Weapon[] = [
    this.hand,
    this.stick,
    this.chikuwa,
    this.knuckle,
    this.magicalStaff,
    this.hammer,
    this.darkSword,
    this.beam,
    this.ninjaStar,
  ];
}

type HitResult = { knockedOut: boolean };
type BattleResult = { firstDead: boolean; secondDead: boolean };

export const Battle = {
  *generateHit(
    g: GameState,
    power: number,
    blocker: Blocker
  ): Generator<Log, HitResult> {
    let damage = power;
    if (blocker.smart) {
      yield Log.description(
        "スマートな身のこなしがダメージを半減する。",
        "positive"
      );
      damage = Math.ceil(power / 2);
    }
    const beforeHp = blocker.getHp();
    const afterHp = beforeHp - damage;
    blocker.setHp(afterHp);
    yield Log.description(
      `${blocker.name}は${damage}ダメージを受けた。`,
      "negative"
    );
    yield* blocker.generateDamageVoice(g, { beforeHp, damage });
    yield Log.system(
      `(${blocker.name}) ${PlayerAttr.hp.label}: ${beforeHp} -> ${afterHp}`,
      "negative"
    );
    if (afterHp <= 0) {
      yield* blocker.generateKnockedOut(g);
      return { knockedOut: true };
    }
    return { knockedOut: false };
  },

  *generateAttack(
    g: GameState,
    attacker: Attacker,
    blocker: Blocker,
    options: { skipAttackVoice?: boolean } = {}
  ): Generator<Log, HitResult> {
    if (!options?.skipAttackVoice) {
      yield* attacker.generateAttackVoice(g);
    }
    const { power } = yield* attacker.weapon.generateAttack(
      g,
      attacker,
      blocker
    );
    if (power === 0) {
      return { knockedOut: false };
    }
    return yield* this.generateHit(g, power, blocker);
  },

  *generateBattle(
    g: GameState,
    first: Battler,
    second: Battler
  ): Generator<Log, BattleResult> {
    yield Log.newSection();
    yield Log.system("<戦闘開始>");
    const battleResult = { firstDead: false, secondDead: false };
    while (true) {
      if ((yield* this.generateAttack(g, first, second)).knockedOut) {
        battleResult.secondDead = true;
        break;
      }
      if ((yield* this.generateAttack(g, second, first)).knockedOut) {
        battleResult.firstDead = true;
        break;
      }
    }
    return battleResult;
  },
};

// Player
export class PlayerBattler implements Battler {
  p: Player;
  constructor(p: Player) {
    this.p = p;
  }

  // blocker
  get name() {
    return this.p.name;
  }
  getHp() {
    return this.p.hp;
  }
  setHp(hp: number): void {
    this.p.hp = hp;
  }
  *generateDamageVoice(
    _g: GameState,
    details: { beforeHp: number; damage: number }
  ): Generator<Log> {
    const fatal = details.damage * 4 >= details.beforeHp;
    switch (this.p.personality) {
      case "gentle":
        yield Log.dialog(fatal ? "うっ" : "痛っ");
        break;
      case "violent":
        yield Log.dialog(fatal ? "グエッ！" : "痛って！");
        break;
      case "phobic":
        yield Log.dialog("嫌あああ！");
        break;
      case "smart":
        yield Log.dialog(fatal ? "ぐはっ" : "その程度かい？");
        break;
    }
  }

  static *generateToHospital(player: Player) {
    yield Log.description(`${player.name}は気絶した。`, "negative");
    yield Log.description(`${player.name}は最寄りの病院に運ばれた。`);

    // 病院を探す
    let hospitalPosition = 0;
    for (let pos = player.position; pos >= 0; pos--) {
      if (SPACE_MAP[pos]?.isHospital) {
        hospitalPosition = pos;
        break;
      }
    }

    const attrs = [
      PlayerAttrChanger.position(hospitalPosition),
      PlayerAttrChanger.hp(INITIAL_HP),
    ];
    yield* LogUtil.generatePlayerAttrsChange(player, attrs, "neutral");
  }

  *generateKnockedOut(): Generator<Log> {
    switch (this.p.personality) {
      case "gentle":
        yield Log.dialog("ひどい……");
        break;
      case "violent":
        yield Log.dialog("ゴハアッ");
        break;
      case "phobic":
        yield Log.dialog("呪ってやる……！");
        break;
      case "smart":
        yield Log.dialog("バカな……この僕が……");
        break;
    }
    yield* PlayerBattler.generateToHospital(this.p);
  }

  get smart() {
    return this.p.personality === "smart";
  }

  // attacker
  get isBot() {
    return this.p.isBot;
  }
  get weapon() {
    return this.p.weapon;
  }
  *generateAttackVoice(): Generator<Log> {
    switch (this.p.personality) {
      case "gentle":
        // 温厚なやつが攻撃することはないかも
        yield Log.dialog("くらえー！");
        break;
      case "violent":
        yield Log.dialog("オラー！");
        break;
      case "phobic":
        // 手が出るタイプ
        yield Log.dialog("消えて！");
        break;
      case "smart":
        yield Log.dialog("僕の力を見せてあげよう");
        // ・圧倒的な力を見るがいい
        // ・僕に勝てると思っているのかな？
        // ・少しは楽しませてもらおうか
        break;
    }
  }

  static *generateHitPlayer(
    g: GameState,
    power: number,
    player: Player,
    options: {
      overrideDamageVoice?: string;
      unblockable?: boolean; // スマートガード不能
    } = {}
  ): Generator<Log, HitResult> {
    const battler = new (class extends PlayerBattler {
      override get smart() {
        if (options.unblockable) {
          return false;
        }
        return super.smart;
      }
      override *generateDamageVoice(
        g: GameState,
        details: { beforeHp: number; damage: number }
      ): Generator<Log> {
        if (options.overrideDamageVoice) {
          yield Log.dialog(options.overrideDamageVoice);
        } else {
          yield* super.generateDamageVoice(g, details);
        }
      }
    })(player);
    return yield* Battle.generateHit(g, power, battler);
  }
}
