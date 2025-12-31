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
import { generateSharingPositionEvent } from "./sharing";
import { SPACE_MAP } from "./space";

export class Scenario {
  // 描画に使うのでpublic
  readonly gameState: GameState;

  private generator: Generator<Log> | undefined;
  history: Log[];

  constructor() {
    this.gameState = GameState.initial();
    this.history = [];
  }

  // デバッグ用
  // ターンの切れ目でのみ安全にロードできる。
  load(json: string) {
    const obj = JSON.parse(json);
    const newState = GameState.load(obj);
    Object.assign(this.gameState, newState); // in-place更新により、一応ターン途中でロードできる
  }
  save(): string {
    const obj = GameState.save(this.gameState);
    return JSON.stringify(obj, undefined, 2);
  }

  private *generate(): Generator<Log> {
    while (true) {
      yield* generateTurn(this.gameState);
      if (this.gameState.gameOverMessage) {
        // ゲーム終了
        // メッセージはgameStateじゃなくて返値で返すべきかも
        return;
      }
      this.gameState.currentPlayerIndex += 1;
      this.gameState.currentPlayerIndex %= this.gameState.players.length;
    }
  }

  next(): Log | undefined {
    if (!this.generator) {
      this.generator = this.generate();
    }
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

// 1ターンを経過させる。
// ターンの切れ目に安全にセーブ&ロード（デバッグ用）できるように、
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
  const dice = yield* LogUtil.generateDiceRoll(g, 1, 6, player.isBot);
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
      const attrs = [
        PlayerAttr.turn,
        ...playerAttrs.filter((a) => a !== PlayerAttr.position),
      ];
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
