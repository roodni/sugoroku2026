import { Config } from "./config";
import { GameState } from "./gameState";
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

    yield Log.description(
      `${player.name}のターン（マス: ${player.pos}, 経過: ${player.turn}ターン）\n`
    );
    yield Log.quote("テストです");
    const dice = yield* Log.generateDiceroll(1, 6);

    yield Log.description(`${player.name}は${dice}マス進んだ。`);
    let nextPos = player.pos + dice;
    if (nextPos > Config.goalPosition) {
      nextPos = Config.goalPosition - (nextPos - Config.goalPosition);
      yield Log.description(`ゴールで折り返した。`);
    }

    // TODO: ユーザーの状態変化には専用のログを使う
    player.pos = nextPos;
    yield Log.description(`${player.name}は${player.pos}マス目に到達した。`);

    // 次のプレイヤーへ
    g.currentPlayerIndex = (g.currentPlayerIndex + 1) % g.players.length;
  }
}
