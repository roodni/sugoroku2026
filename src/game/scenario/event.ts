import { type GameState } from "../gameState";
import { PlayerAttrChanger } from "../indicator";
import { Log, LogUtil } from "../log";

// マスで発生するイベント
export interface SpaceEvent {
  name: string;
  generate?: (g: GameState) => Generator<Log>;
  isHospital?: boolean; // 復帰地点
}

export const spaceEvents: Record<number, SpaceEvent | undefined> = {
  6: {
    name: "図書館",
    *generate(g: GameState) {
      const player = g.players[g.currentPlayerIndex];
      yield Log.description("図書館がある。");
      yield* LogUtil.generatePlayerAttrChange(
        player,
        PlayerAttrChanger.personality("smart"),
        "neutral"
      );
    },
  },
};
