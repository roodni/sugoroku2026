import { GOAL_POSITION } from "../config";
import { type GameState } from "../gameState";
import { Log } from "../log";
import * as BossSpace from "./bossSpace";
import * as HelpSpace from "./helpSpace";
import * as PersonalitySpace from "./personalitySpace";
import * as TipsSpace from "./tipsSpace";
import * as TrapSpace from "./trapSpace";

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
  7: TipsSpace.personalityTipsSpace,

  10: HelpSpace.hospitalSpace,
  12: HelpSpace.konbiniSpace,

  15: BossSpace.fishingSpace,
  16: BossSpace.ninjaSpace,

  19: TipsSpace.releaseNoteV1Space,
  20: HelpSpace.hospitalSpace,
  22: PersonalitySpace.newYearBellSpace, // 性格イベント第二弾
  23: PersonalitySpace.seminarSpace,
  24: PersonalitySpace.onlineGameSpace,
  25: PersonalitySpace.hygieneSpace,
  27: HelpSpace.weaponShopSpace,

  30: HelpSpace.hospitalSpace,
  33: TipsSpace.illegalWeaponTipsSpace, // 武器屋の6マス先が一番踏みやすい
  34: BossSpace.policeSpace,
  35: BossSpace.goddessSpace,
  36: HelpSpace.shortCutSpace,
  37: TrapSpace.LaboratorySpace,

  40: HelpSpace.hospitalSpace,
  44: TipsSpace.destinyTipsSpace,
  45: TrapSpace.spikyFloorSpace,
  49: BossSpace.godZeusSpace,
};
