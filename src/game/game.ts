import { GameState } from "./gameState";
import { GameStateJson } from "./gameStateJson";
import { Log } from "./log";
import { generateTurn } from "./scenario/v1/turn";

export type TurnResult = {
  skipped: boolean; // ゴールした人のターン飛ばしに使われている
  gameOver?: string; // 共有用のメッセージが入る。入ったらゲーム終了
};

// ターン生成関数でバケツリレーする
export interface GameContext {
  get state(): GameState;
}

export class Game implements GameContext {
  // 描画に使うのでpublic
  state: GameState;

  private generator: Generator<Log> | undefined;
  history: Log[];
  loadable: boolean;

  constructor(options: { replay?: number[] }) {
    this.state = GameState.initial();
    if (options.replay) {
      this.state.replayMode = true;
      this.state.futureDice = options.replay;
    }
    this.history = [];
    this.loadable = true; // 最初はロード可能
  }

  // デバッグ用
  load(json: string) {
    if (this.loadable) {
      const obj = JSON.parse(json);
      this.state = GameStateJson.load(obj);
    } else {
      throw new Error("ターン途中ではロード禁止");
    }
  }
  save(): string {
    const obj = GameStateJson.save(this.state);
    return JSON.stringify(obj, undefined, 2);
  }

  private *generate(): Generator<Log, string> {
    this.loadable = false;
    if (this.state.replayMode) {
      yield Log.description("リプレイの再生を開始した。");
    }
    while (true) {
      const turnResult = yield* generateTurn(this);
      if (turnResult.gameOver !== undefined) {
        // ゲーム終了
        return turnResult.gameOver;
      }
      this.state.currentPlayerIndex += 1;
      this.state.currentPlayerIndex %= this.state.players.length;
      if (!turnResult.skipped) {
        this.loadable = true;
        yield Log.turnEnd(); // <- このタイミングでstateがデバッグ機能により書き変わる可能性がある
        this.loadable = false;
      }
    }
  }

  next(): Log | { type: "gameOver"; message: string } {
    if (!this.generator) {
      this.generator = this.generate();
    }
    const result = this.generator.next();
    if (result.done) {
      return { type: "gameOver", message: result.value };
    } else {
      this.history.push(result.value);
      return result.value;
    }
  }
}
