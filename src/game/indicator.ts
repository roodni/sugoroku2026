import { Weapon } from "./battle";
import { INITIAL_HP } from "./config";
import { Personality, type DiceKind, type Player } from "./gameState";

// プレイヤーの属性を文字列化するための仕組み
export class PlayerAttr {
  label: string | undefined;
  valueString: (p: Player) => string;
  isDefaultValue?: (p: Player) => boolean;

  constructor(
    label: string | undefined,
    valueString: (p: Player) => string,
    isDefaultValue?: (p: Player) => boolean
  ) {
    this.label = label;
    this.valueString = valueString;
    this.isDefaultValue = isDefaultValue;
  }

  static position = new this("現在地", (p: Player) => `${p.position}`);
  static turn = new this(undefined, (p: Player) => `ターン${p.turn}`);
  static personality = new this(
    "性格",
    (p: Player) => Personality.toLabel(p.personality),
    (p: Player) => p.personality === "gentle"
  );
  static hp = new this(
    "HP",
    (p: Player) => `${p.hp}`,
    (p: Player) => p.hp === INITIAL_HP
  );
  static weapon = new this(
    "装備",
    (p: Player) => p.weapon.name,
    (p: Player) => p.weapon === Weapon.hand
  );
  static dice = new this(
    "サイコロ",
    (p: Player) => p.dice,
    (p: Player) => p.dice === "1d6"
  );
  static desire = new this(
    "煩悩",
    (p: Player) => `${p.desire}`,
    (p: Player) => p.desire === 108
  );
  static turnSkip = new this(
    undefined,
    (p: Player) => `${p.turnSkip}回休み`,
    (p: Player) => p.turnSkip === 0
  );

  static attrsShownInTurnStart = [
    PlayerAttr.turnSkip,
    PlayerAttr.personality,
    PlayerAttr.position,
    PlayerAttr.hp,
    PlayerAttr.weapon,
    PlayerAttr.dice,
    PlayerAttr.desire,
  ];
}

// プレイヤーの属性をほぼ全てログ出力用に文字列化する
const attrSeparator = " / ";
export function stringifyPlayerAttrs(
  player: Player,
  attrs: PlayerAttr[]
): string {
  const attrsText = attrs
    .flatMap((attr) => {
      if (attr.isDefaultValue?.(player)) {
        return [];
      }
      if (attr.label === undefined) {
        return attr.valueString(player);
      } else {
        return `${attr.label}: ${attr.valueString(player)}`;
      }
    })
    .join(attrSeparator);
  return attrsText;
}

// プレイヤーの属性を変更して、その変更をログとして出力するための仕組み
export interface PlayerAttrChanger {
  attr: PlayerAttr;
  change: (p: Player) => void;
}

class GeneralChanger<K extends keyof Player> implements PlayerAttrChanger {
  attr: PlayerAttr;
  key: K;
  value: Player[K];
  constructor(attr: PlayerAttr, key: K, value: Player[K]) {
    this.attr = attr;
    this.key = key;
    this.value = value;
  }
  change(p: Player) {
    p[this.key] = this.value;
  }
}

export const PlayerAttrChanger = {
  position: (next: number) =>
    new GeneralChanger(PlayerAttr.position, "position", next),
  personality: (next: Personality) =>
    new GeneralChanger(PlayerAttr.personality, "personality", next),
  hp: (next: number) => new GeneralChanger(PlayerAttr.hp, "hp", next),
  weapon: (next: Weapon) =>
    new GeneralChanger(PlayerAttr.weapon, "weapon", next),
  dice: (next: DiceKind) => new GeneralChanger(PlayerAttr.dice, "dice", next),
  desire: (next: number) =>
    new GeneralChanger(PlayerAttr.desire, "desire", next),
  turnSkip: (next: number) =>
    new GeneralChanger(PlayerAttr.turnSkip, "turnSkip", next),
};

// プレイヤーの属性を変更した後で、その変更内容を文字列化して返す
export function stringifyPlayerAttrsChange(
  player: Player,
  changers: PlayerAttrChanger[]
): string {
  const attrTexts = [];
  for (const changer of changers) {
    const before = changer.attr.valueString(player);
    changer.change(player);
    const after = changer.attr.valueString(player);
    if (changer.attr.label === undefined) {
      attrTexts.push(`${before} -> ${after}`);
    } else {
      attrTexts.push(`${changer.attr.label}: ${before} -> ${after}`);
    }
  }
  return attrTexts.join(attrSeparator);
}
