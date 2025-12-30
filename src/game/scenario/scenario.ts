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
  history: Log[];

  constructor() {
    this.gameState = GameState.initial();
    this.generator = generateGame(this.gameState);
    this.history = [];
  }

  next(): Log | undefined {
    const result = this.generator.next();
    if (result.done) {
      return undefined;
    } else {
      this.history.push(result.value);
      return result.value;
    }
  }
}

const playerAttrs = [PlayerAttr.position, PlayerAttr.personality];

function* generateGame(g: GameState): Generator<Log> {
  while (g.gameOverMessage === null) {
    yield* generateTurn(g);
    g.currentPlayerIndex = (g.currentPlayerIndex + 1) % g.players.length;
  }
}

// 1ターンを経過させる。
// ターンごとのセーブ&ロード（デバッグ用）を可能にするため、
// 1ターン分を関数に切ることでターン開始時にGameState以外の状態を参照しないことを保証している。
function* generateTurn(g: GameState): Generator<Log> {
  const player = g.players[g.currentPlayerIndex];
  if (player.goaled) {
    return;
  }

  player.turn += 1;
  g.cameraStart = player.position;

  // ターン開始
  yield Log.description(`${player.name}のターン${player.turn}。`);
  yield* generateHello(g);
  yield* LogUtil.generatePlayerAttrs(player, playerAttrs);

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

  // ゴールチェック
  const justGoaledPlayers = g.players.filter(
    (p) => p.position === Config.goalPosition && !p.goaled
  );
  if (justGoaledPlayers.length > 0) {
    yield Log.newSection();
    yield Log.description("おめでとう！", "positive");

    const alreadyGoaled = g.players.filter((p) => p.goaled).length;
    const rank = alreadyGoaled + 1;
    const justGoaledNames = justGoaledPlayers.map((p) => p.name).join("と");
    const goaledDescription = `${justGoaledNames}は${rank}位でゴールした。`;
    yield Log.description(goaledDescription, "positive");

    for (const p of justGoaledPlayers) {
      const dialog = goaledDialog(p, rank);
      yield Log.dialog(dialog);
      p.goaled = true;
    }

    const you = g.players[0];
    if (justGoaledPlayers.includes(you)) {
      const attrs = [PlayerAttr.turn, ...playerAttrs.slice(1)];
      const dialog = goaledDialog(you, rank);
      g.gameOverMessage = `${
        you.name
      }は${rank}位でゴールした (${stringifyPlayerAttrs(
        you,
        attrs
      )})。「${dialog}」`;
      return; // ゲーム終了
    }
  }

  // ここは空行を挟まなくていい
  yield Log.description("ターンが終了した。");
  yield Log.turnEnd();
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
          "誰も俺を止められねえ！",
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

  yield Log.dialog(quotes[index % quotes.length]);
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
        yield Log.dialog(`奇遇だね`);
        break;
    }
    yield Log.description("心が温かくなった。");
  }
}

function goaledDialog(player: Player, rank: number): string {
  const isFirst = rank === 1;
  switch (player.personality) {
    case "gentle":
      return isFirst ? `やったね` : `がんばった`;
    case "violent":
      return isFirst ? `俺の勝ちだァー！` : `チッ……遅れを取ったぜ`;
    case "phobic":
      return isFirst ? `なんとかゴールできました` : `うう……外は怖いです`;
    case "smart":
      return isFirst ? `フッ、当然の結果さ` : `まだまだ、至らないね`;
  }
}
