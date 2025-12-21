import type { Player } from "./gameState";

// プレイヤーの各属性を文字列化する
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
export function logPlayerAttrs(player: Player, attrs: PlayerAttr[]): string {
  const attrsText = attrs
    .flatMap((attr) => {
      if (attr.isDefaultValue?.(player)) {
        return [];
      }
      return `${attr.label}: ${attr.valueString(player)}`;
    })
    .join(" / ");
  return `(${player.name}) ${attrsText}`;
}
