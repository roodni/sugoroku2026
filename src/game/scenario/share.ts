import type { GameState, Player } from "../gameState";
import { Log } from "../log";

// 相席イベント
export function* generateSharingPositionEvent(
  g: GameState,
  currentPlayer: Player
): Generator<Log> {
  const others = g.players.filter(
    (p) => p !== currentPlayer && p.position === currentPlayer.position
  );
  if (others.length === 0) {
    return;
  }

  yield Log.newSection();
  const otherNames = others.map((p) => p.name).join("と");
  yield Log.description(`マスには${otherNames}がいた。`);
  for (const other of others) {
    yield Log.description(`${currentPlayer.name}は${other.name}に挨拶した。`);
    yield Log.dialog(`こんにちは！`);
    switch (other.personality) {
      case "gentle":
        yield Log.dialog(`やあ`);
        break;
      case "violent":
        yield Log.dialog(`おう`);
        break;
      case "phobic":
        yield Log.dialog(`こ、こんにちは……`);
        break;
      case "smart":
        yield Log.dialog(`おや奇遇だね`);
        break;
    }
    yield Log.description("心が温かくなった。");
  }
}
