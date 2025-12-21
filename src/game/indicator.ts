import type { Player } from "./gameState";

// プレイヤーの属性を文字列化するための仕組み
export interface PlayerAttr {
  label: string;
  valueString: (p: Player) => string;
  isDefaultValue?: (p: Player) => boolean;
}

class PositionAttr implements PlayerAttr {
  label = "現在地";
  valueString(p: Player): string {
    return `${p.position}`;
  }
}
class TurnAttr implements PlayerAttr {
  label = "ターン";
  valueString(p: Player): string {
    return `${p.turn}`;
  }
}
class PersonalityAttr implements PlayerAttr {
  label = "性格";
  valueString(p: Player): string {
    switch (p.personality) {
      case "gentle":
        return "温厚";
      case "violent":
        return "乱暴";
      case "phobic":
        return "綺麗好き";
      case "smart":
        return "スマート";
    }
  }
  isDefaultValue(p: Player) {
    return p.personality === "gentle";
  }
}

export const PlayerAttr = {
  position: new PositionAttr(),
  turn: new TurnAttr(),
  personality: new PersonalityAttr(),
};

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
      return `${attr.label}: ${attr.valueString(player)}`;
    })
    .join(attrSeparator);
  return attrsText;
}

// プレイヤーの属性を変更して、その変更をログとして出力するための仕組み
export interface PlayerAttrChanger {
  attr: PlayerAttr;
  change: (p: Player) => void;
}

class PositionChanger implements PlayerAttrChanger {
  attr = PlayerAttr.position;
  nextPosition: number;
  constructor(nextPosition: number) {
    this.nextPosition = nextPosition;
  }
  change(p: Player) {
    p.position = this.nextPosition;
  }
}

export const PlayerAttrChanger = {
  position: (nextPosition: number) => new PositionChanger(nextPosition),
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
    attrTexts.push(`${changer.attr.label}: ${before} -> ${after}`);
  }
  return attrTexts.join(attrSeparator);
}
