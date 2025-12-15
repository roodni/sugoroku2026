import { Log } from "./log";
import { Player } from "./player";

const goalPosition = 100;
const computerPlayerNumber = 2;

export class Game {
  nextPlayerIndex = 0;
  players: Player[];

  constructor() {
    this.players = [];
    this.players.push(new Player("あなた", { operable: true }));
    for (let i = 1; i <= computerPlayerNumber; i++) {
      this.players.push(new Player(`CP${i}`, { operable: false }));
    }
  }

  // 1ターンを経過させる。
  // ジェネレータだから全ターン経過させることも可能ではあるが、デバッグのため1ターンずつ進行する。
  // イテレータが全部回る前に再度呼び出すと当然バグるので注意。
  *genTurn(): Generator<Log> {
    const player = this.players[this.nextPlayerIndex];
    player.state.turn += 1;
    this.nextPlayerIndex = (this.nextPlayerIndex + 1) % this.players.length;

    yield Log.description(
      `${player.name}のターン（マス: ${player.state.pos}, 経過: ${player.state.turn}ターン）\n`
    );
    yield Log.quote("テストです");
    const dice = yield* Log.generateDiceroll(1, 6);

    yield Log.description(`${player.name}は${dice}マス進んだ。`);
    let nextPos = player.state.pos + dice;
    if (nextPos > goalPosition) {
      nextPos = goalPosition - (nextPos - goalPosition);
      yield Log.description(`ゴールで折り返した。`);
    }

    // TODO: ユーザーの状態変化には専用のログを使う
    player.state.pos = nextPos;
    yield Log.description(
      `${player.name}は${player.state.pos}マス目に到達した。`
    );
  }
}
