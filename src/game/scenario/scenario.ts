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

type TurnResult = {
  skipped: boolean;
};

export class Scenario {
  // 描画に使うのでpublic
  gameState: GameState;

  private generator: Generator<Log> | undefined;
  history: Log[];
  loadable: boolean;

  constructor() {
    this.gameState = GameState.initial();
    this.history = [];
    this.loadable = true;
  }

  // デバッグ用
  load(json: string) {
    if (this.loadable) {
      const obj = JSON.parse(json);
      this.gameState = GameState.load(obj);
    } else {
      throw new Error("ターン途中ではロード禁止");
    }
  }
  save(): string {
    const obj = GameState.save(this.gameState);
    return JSON.stringify(obj, undefined, 2);
  }

  private *generate(): Generator<Log> {
    this.loadable = false;
    while (true) {
      const g = this.gameState;
      const turnResult = yield* generateTurn(g);
      if (g.gameOverMessage) {
        // ゲーム終了
        // メッセージはgameStateじゃなくて返値で返すべきかも
        return;
      }
      g.currentPlayerIndex += 1;
      g.currentPlayerIndex %= g.players.length;
      if (!turnResult.skipped) {
        this.loadable = true;
        yield Log.turnEnd();
        // <- このタイミングでgameStateがデバッグ機能により書き変わる可能性がある
        this.loadable = false;
      }
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
function* generateTurn(g: GameState): Generator<Log, TurnResult> {
  const player = g.players[g.currentPlayerIndex];
  if (player.goaled) {
    return { skipped: true };
  }

  player.turn += 1;
  g.cameraStart = player.position;
  g.cameraPlayerIndex = g.currentPlayerIndex;

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
      return { skipped: true }; // ゲーム終了
    }
  }

  // ここは空行を挟まなくていい
  yield Log.description("ターンが終了した。");
  return { skipped: false };
}
