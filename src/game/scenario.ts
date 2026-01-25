import type { GameContext, TurnResult } from "./game";
import type { Log } from "./log";

// マス（で発生するイベント）の定義
export type Space = {
  name?: string; // 省略したらマップに表示されない
  generate?: (g: GameContext) => Generator<Log>;
  isHospital?: boolean; // 復帰地点
};

export type Scenario = {
  spaceMap: Record<number, Space | undefined>;

  // 1ターンを経過させる関数。
  // ターンの切れ目に安全にセーブ&ロード（デバッグ用）できるように、
  // 1ターン分を関数に切ることでターン開始時にGameState以外の状態を参照しないことを保証している。
  generateTurn: (g: GameContext) => Generator<Log, TurnResult>;
};
