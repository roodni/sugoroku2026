import { Config } from "./config";
import { GameState, Player } from "./gameState";
import {
  PlayerAttr,
  PlayerAttrChanger,
  stringifyPlayerAttrs,
} from "./indicator";
import { Log, LogUtil } from "./log";

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

    // ターン開始
    yield Log.description(`${player.name}のターン。`);
    const playerAttrsText = stringifyPlayerAttrs(player, [
      PlayerAttr.position,
      PlayerAttr.personality,
      PlayerAttr.turn,
    ]);
    yield Log.system(`(${player.name}) ${playerAttrsText}`);
    yield Log.newSection();

    // ダイス移動
    const dice = yield* LogUtil.generateDiceRoll(1, 6, player.isBot);
    yield Log.description(`${player.name}は${dice}マス進んだ。`);
    let nextPos = player.position + dice;
    if (nextPos > Config.goalPosition) {
      nextPos = Config.goalPosition - (nextPos - Config.goalPosition);
      yield Log.description(`ゴールで折り返した。`);
    }
    yield* LogUtil.generatePlayerAttrChange(
      player,
      PlayerAttrChanger.position(nextPos),
      "positive"
    );
    yield Log.newSection();

    // 相席
    yield* generateSharingPositionEvent(g, player);

    // 次のプレイヤーへ
    g.currentPlayerIndex = (g.currentPlayerIndex + 1) % g.players.length;
  }
}

// 挨拶イベント
function* generateSharingPositionEvent(
  g: GameState,
  currentPlayer: Player
): Generator<Log> {
  const others = g.players.filter(
    (p) => p !== currentPlayer && p.position === currentPlayer.position
  );
  if (others.length === 0) {
    return;
  }

  const otherNames = others.map((p) => p.name).join("と");
  yield Log.description(`マスには${otherNames}がいた。`);
  for (const other of others) {
    yield Log.description(`${currentPlayer.name}は${other.name}に挨拶した。`);
    yield Log.quote(`こんにちは！`);
    switch (other.personality) {
      case "gentle":
        yield Log.quote(`やあ`);
        break;
      case "violent":
        yield Log.quote(`おう`);
        break;
      case "phobic":
        yield Log.quote(`こ、こんにちは……`);
        break;
      case "smart":
        yield Log.quote(`今日もスマートな日だね`);
        break;
    }
    yield Log.description("心が温かくなった。");
  }
  yield Log.newSection();
}
