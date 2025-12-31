import { GameState, Player } from "./gameState";
import { PlayerAttr } from "./indicator";
import { Log, LogUtil } from "./log";

// 攻撃するもの
export interface Attacker {
  name: string;
  isBot: boolean;
  weapon: Weapon;
  attackVoice(battleTurn: number): string | undefined;
}

// 攻撃を受けるもの
export interface Blocker {
  name: string;
  getHp(): number;
  setHp(hp: number): void;
  damageVoice(beforeHp: number, damage: number): string | undefined;
  smart?: boolean;
}

export type Battler = Blocker & Attacker;

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
  damageVoice() {
    return "ぐはっ";
  }

  // attacker
  get smart() {
    return this.p.personality === "smart";
  }
  get isBot() {
    return this.p.isBot;
  }
  get weapon() {
    return this.p.weapon;
  }
  attackVoice(): string | undefined {
    return "くらえー！";
  }
}

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

  static list: Weapon[] = [this.hand];
}

export const Battle = {
  *generateHit(power: number, blocker: Blocker): Generator<Log> {
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
    const damageVoice = blocker.damageVoice(beforeHp, afterHp);
    if (damageVoice) {
      yield Log.dialog(damageVoice);
    }
    yield Log.system(
      `(${blocker.name}) ${PlayerAttr.hp.label}: ${beforeHp} -> ${afterHp}`,
      "negative"
    );
  },

  *generateAttack(
    g: GameState,
    attacker: Attacker,
    blocker: Blocker
  ): Generator<Log> {
    const { power } = yield* attacker.weapon.generateAttack(
      g,
      attacker,
      blocker
    );
    const attackVoice = attacker.attackVoice(0);
    if (attackVoice) {
      yield Log.dialog(attackVoice);
    }
    yield* this.generateHit(power, blocker);
  },
};
