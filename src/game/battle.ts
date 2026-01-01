import { Config } from "./config";
import { GameState, Player } from "./gameState";
import { PlayerAttr, PlayerAttrChanger } from "./indicator";
import { Log, LogUtil } from "./log";
import { SPACE_MAP } from "./scenario/space/space";

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
    details: { damage: number }
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

  constructor(arg: { name: string; generateAttack: WeaponAttackGenerator }) {
    this.name = arg.name;
    this.generateAttack = arg.generateAttack;
  }

  static hand = new this({
    name: "素手",
    *generateAttack(g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(`${attacker.name}は${blocker.name}を殴った。`);
      const power = yield* LogUtil.generateDiceRoll(g, 1, 6, attacker.isBot);
      return { power };
    },
  });

  static stick = new this({
    name: "こん棒",
    *generateAttack(g: GameState, attacker: Attacker, blocker: Blocker) {
      yield Log.description(
        `${attacker.name}は${blocker.name}をこん棒で打った。`
      );
      const power = yield* LogUtil.generateDiceRoll(g, 1, 10, attacker.isBot);
      return { power };
    },
  });

  static list: Weapon[] = [this.hand, this.stick];
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
    yield* blocker.generateDamageVoice(g, { damage });
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
  *generateDamageVoice(): Generator<Log> {
    switch (this.p.personality) {
      case "gentle":
        yield Log.dialog("痛っ");
        break;
      case "violent":
        yield Log.dialog("グエッ！");
        break;
      case "phobic":
        yield Log.dialog("嫌あああ！");
        break;
      case "smart":
        yield Log.dialog("ぐはっ");
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
      PlayerAttrChanger.hp(Config.initialHp),
    ];
    yield* LogUtil.generatePlayerAttrsChange(player, attrs, "neutral");
  }

  *generateKnockedOut(): Generator<Log> {
    switch (this.p.personality) {
      case "gentle":
        yield Log.dialog("うっ");
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
    }
  ): Generator<Log, HitResult> {
    const battler = new (class extends PlayerBattler {
      override get smart() {
        if (options.unblockable) {
          return false;
        }
        return super.smart;
      }
      override *generateDamageVoice(): Generator<Log> {
        if (options.overrideDamageVoice) {
          yield Log.dialog(options.overrideDamageVoice);
        } else {
          yield* super.generateDamageVoice();
        }
      }
    })(player);
    return yield* Battle.generateHit(g, power, battler);
  }
}
