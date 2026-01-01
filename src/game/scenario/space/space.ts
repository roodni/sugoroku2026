import { Config } from "../../config";
import { type GameState } from "../../gameState";
import * as PersonalityEvent from "./personalityEvent";
import * as HelpEvent from "./helpEvent";
import { Log } from "../../log";

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

  4: PersonalityEvent.liveSpace,
  5: PersonalityEvent.librarySpace,
  6: PersonalityEvent.hauntedHouseSpace,
  8: HelpEvent.konbiniSpace,
};
