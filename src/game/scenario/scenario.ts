import { Config } from "../config";
import { GameState, Player } from "../gameState";
import {
  PlayerAttr,
  PlayerAttrChanger,
  stringifyPlayerAttrs,
} from "../indicator";
import { Log, LogUtil } from "../log";

export class Scenario {
  // 描画に使うのでpublic。申し訳程度にReadonlyにしている
  readonly gameState: Readonly<GameState>;
  private generator: Generator<Log>;

  constructor() {
    this.gameState = GameState.initial();
    this.generator = (function* (g: GameState) {
      while (true) {
        yield* generateTurn(g);
      }
    })(this.gameState);
  }

  next(): Log | undefined {
    const result = this.generator.next();
    if (result.done) {
      return undefined;
    } else {
      return result.value;
    }
  }
}

// 1ターンを経過させる。
// ターンごとのセーブ&ロード（デバッグ用）を可能にするため、
// 1ターン分を関数に切ることでターン開始時にGameState以外の状態を参照しないことを保証している。
function* generateTurn(g: GameState): Generator<Log> {
  const player = g.players[g.currentPlayerIndex];
  player.turn += 1;

  g.cameraStart = player.position;

  // ターン開始
  yield Log.description(`${player.name}のターン。`);
  yield* generateHello(g);
  const playerAttrsText = stringifyPlayerAttrs(player, [
    PlayerAttr.position,
    PlayerAttr.personality,
    PlayerAttr.turn,
  ]);
  yield Log.system(`(${player.name}) ${playerAttrsText}`);

  // ダイス移動
  yield Log.newSection();
  const dice = yield* LogUtil.generateDiceRoll(1, 6, player.isBot);
  yield Log.description(`${player.name}は${dice}マス進んだ。`, "positive");
  let nextPos = player.position + dice;
  if (nextPos > Config.goalPosition) {
    nextPos = Config.goalPosition - (nextPos - Config.goalPosition);
    yield Log.description(`ゴールで折り返した。`, "negative");
  }
  yield* LogUtil.generatePlayerAttrChange(
    player,
    PlayerAttrChanger.position(nextPos),
    nextPos > player.position ? "positive" : "negative"
  );

  // 相席イベント
  yield* generateSharingPositionEvent(g, player);

  yield Log.turnEnd();

  // 次のプレイヤーへ
  g.currentPlayerIndex = (g.currentPlayerIndex + 1) % g.players.length;
}

// ターン開始時の独り言
function* generateHello(g: GameState): Generator<Log> {
  const player = g.players[g.currentPlayerIndex];
  const index = g.currentPlayerIndex + player.position;

  const quotes = (() => {
    switch (player.personality) {
      case "gentle":
        return [
          "がんばるぞ",
          player.position < Config.goalPosition / 2
            ? "ゴールまで遠いなあ"
            : "ゴールが近づいてきた",
          "6の目を出したい",
          "今日はどうしようかな",
          "みんな元気かな",
          "平和が一番だね",
        ];
      case "violent":
        return [
          "ブッ飛ばしてやるぜ！",
          "今日も暴れてやるか！",
          "誰でもいいから殴りてえ",
          "ククク……俺のターンだな……",
          "終わらせてやるぜ、このゲームをよォー！",
          "ヒャッハー！",
        ];
      case "phobic":
        return [
          "あ、あの……頑張ります",
          "うう、進まないと",
          "なんで私がこんなことを……",
          "帰りたい",
          "サイコロも消毒しなきゃ",
          "誰にも会いませんように……！",
        ];
      case "smart":
        return [
          "フッ、今日も知略を巡らせよう",
          "無駄な動きはしない",
          "6の目が出る確率……66.6%",
          "スマートにゴールしてみせるさ",
          "データに基づいて最適に行動するのさ",
          `あと${Math.ceil(
            (Config.goalPosition - player.position) / 3.5
          )}ターンくらいかな`,
        ];
    }
  })();

  yield Log.quote(quotes[index % quotes.length]);
}

// 相席イベント
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

  yield Log.newSection();
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
        yield Log.quote(`奇遇だね`);
        break;
    }
    yield Log.description("心が温かくなった。");
  }
}
