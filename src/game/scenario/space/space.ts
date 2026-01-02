import { GOAL_POSITION } from "../../config";
import { type GameState } from "../../gameState";
import { Log, LogUtil } from "../../log";
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
  1: {
    *generate(g) {
      const player = g.players[g.currentPlayerIndex];
      if (player.turn === 1) {
        yield Log.dialog("1しか進めなかった");
        if (!player.isBot) {
          yield* LogUtil.generateEarnTrophy(g, "腰が重い");
        }
      }
    },
  },

  4: personalitySpace.liveSpace,
  5: personalitySpace.librarySpace,
  6: personalitySpace.hauntedHouseSpace,
  8: HelpSpace.konbiniSpace,
  9: TipsSpace.destinyTipsSpace,
  10: HelpSpace.hospitalSpace,
  12: BossSpace.fishingSpace,
};
