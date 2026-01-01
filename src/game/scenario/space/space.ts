import { Config } from "../../config";
import { type GameState } from "../../gameState";
import { Log } from "../../log";
import * as BossSpace from "./bossSpace";
import * as HelpSpace from "./helpSpace";
import * as personalitySpace from "./personalitySpace";

// マス（で発生するイベント）の定義
export interface Space {
  name: string;
  generate?: (g: GameState) => Generator<Log>;
  isHospital?: boolean; // 復帰地点
}

export const SPACE_MAP: Record<number, Space | undefined> = {
  0: {
    name: "スタート",
    isHospital: true,
  },
  [Config.goalPosition]: {
    name: "ゴール",
    isHospital: true,
  },

  4: personalitySpace.liveSpace,
  5: personalitySpace.librarySpace,
  6: personalitySpace.hauntedHouseSpace,
  8: HelpSpace.konbiniSpace,
  10: HelpSpace.hospitalSpace,
  12: BossSpace.fishingSpace,
};
