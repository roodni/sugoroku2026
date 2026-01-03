import { GOAL_POSITION } from "../config";
import { type GameState } from "../gameState";
import { Log } from "../log";
import * as BossSpace from "./bossSpace";
import * as HelpSpace from "./helpSpace";
import * as PersonalitySpace from "./personalitySpace";
import * as TipsSpace from "./tipsSpace";

// マス（で発生するイベント）の定義
export interface Space {
  name?: string; // 省略したらマップに表示されない
  generate?: (g: GameState) => Generator<Log>;
  isHospital?: boolean; // 復帰地点
}

export const SPACE_MAP: Record<number, Space | undefined> = {
  0: {
    name: "スタート",
    isHospital: true,
  },
  [GOAL_POSITION]: {
    name: "ゴール",
    isHospital: true,
  },

  // 性格イベント
  4: PersonalitySpace.liveSpace,
  5: PersonalitySpace.librarySpace,
  6: PersonalitySpace.hauntedHouseSpace,

  8: TipsSpace.personalityTipsSpace,
  9: HelpSpace.konbiniSpace,
  10: HelpSpace.hospitalSpace,

  12: BossSpace.fishingSpace,

  15: HelpSpace.weaponShopSpace,
  21: TipsSpace.illegalWeaponTipsSpace, // 武器屋の6マス先が一番踏みやすい

  19: TipsSpace.destinyTipsSpace,
  20: HelpSpace.hospitalSpace,

  // 性格イベント第二弾
  23: PersonalitySpace.newYearBellSpace,
  24: PersonalitySpace.seminarSpace,
  25: PersonalitySpace.onlineGameSpace,
  26: PersonalitySpace.hygieneSpace,

  28: HelpSpace.shortCutSpace,
  29: HelpSpace.LaboratorySpace,
  30: HelpSpace.hospitalSpace,

  35: BossSpace.policeSpace,

  40: HelpSpace.hospitalSpace,
};
