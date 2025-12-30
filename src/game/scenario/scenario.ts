import { Config } from "../config";
import { GameState } from "../gameState";
import {
  PlayerAttr,
  PlayerAttrChanger,
  stringifyPlayerAttrs,
} from "../indicator";
import { Log, LogUtil } from "../log";
import { goaledDialog } from "./goal";
import { generateHello } from "./hello";
import { generateSharingPositionEvent } from "./share";
import { SPACE_MAP } from "./space";

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

const playerAttrs = [
  PlayerAttr.personality,
  PlayerAttr.position,
  PlayerAttr.hp,
];

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
  yield* LogUtil.generatePlayerAttrs(player, playerAttrs);
  yield* generateHello(g);

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

  // マスイベント
  const space = SPACE_MAP[player.position];
  if (space?.generate) {
    yield Log.newSection();
    yield* space.generate(g);
  }

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
