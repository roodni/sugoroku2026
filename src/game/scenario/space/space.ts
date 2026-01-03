import { GOAL_POSITION } from "../../config";
import { type GameState } from "../../gameState";
import { Log } from "../../log";
import * as BossSpace from "./bossSpace";
import * as HelpSpace from "./helpSpace";
import * as personalitySpace from "./personalitySpace";
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

  4: personalitySpace.liveSpace,
  5: personalitySpace.librarySpace,
  6: personalitySpace.hauntedHouseSpace,

  8: TipsSpace.personalityTipsSpace,
  9: HelpSpace.konbiniSpace,
  10: HelpSpace.hospitalSpace,

  12: BossSpace.fishingSpace,

  19: TipsSpace.destinyTipsSpace,
  20: HelpSpace.hospitalSpace,

  28: HelpSpace.LaboratorySpace,
  30: HelpSpace.hospitalSpace,

  40: HelpSpace.hospitalSpace,
};
