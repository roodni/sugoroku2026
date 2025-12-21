import { Config } from "./config";
import { GameState } from "./gameState";
import { logPlayerAttrs, PlayerAttr } from "./indicator";
import { Log } from "./log";

export class Scenario {
  gameState: GameState;

  constructor() {
    this.gameState = GameState.initial();
  }

  *generateTurn(): Generator<Log> {
    const g = this.gameState;
    const player = g.players[g.currentPlayerIndex];
    player.turn += 1;

    g.cameraStart = player.position;

    yield Log.system(
      logPlayerAttrs(player, [
        PlayerAttr.position,
        PlayerAttr.personality,
        PlayerAttr.turn,
      ])
    );
    yield Log.system(`${player.name}のターン。`);
    const dice = yield* Log.generateDiceRoll(1, 6, player.isBot);

    yield Log.description(`${player.name}は${dice}マス進んだ。`);
    let nextPos = player.position + dice;
    if (nextPos > Config.goalPosition) {
      nextPos = Config.goalPosition - (nextPos - Config.goalPosition);
      yield Log.description(`ゴールで折り返した。`);
    }

    // TODO: ユーザーの状態変化には専用のログを使う
    player.position = nextPos;
    yield Log.description(
      `${player.name}は${player.position}マス目に到達した。`
    );

    // 次のプレイヤーへ
    g.currentPlayerIndex = (g.currentPlayerIndex + 1) % g.players.length;
  }
}
