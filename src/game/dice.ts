import type { GameContext } from "./game";
import { Log } from "./log";

const random = Math.random; // ちょっとだけ対策してみる

// 1d(sides)
function dice(sides: number): number {
  return Math.floor(random() * sides) + 1;
}

// ダイスロールは全てここを通す
// (times)d(sides)+(bonus)
export function* generateDiceRoll(
  g: GameContext,
  isBot: boolean,
  times: number,
  sides: number,
  bonus: number = 0
): Generator<Log, number> {
  // 式の作成
  let expression = `${times}d${sides}`;
  if (bonus > 0) {
    expression += `+${bonus}`;
  } else if (bonus < 0) {
    expression += `${bonus}`;
  }

  // before
  yield Log.diceRollBefore(expression, isBot);

  // 振る
  let result = bonus;
  const details = [];
  for (let i = 0; i < times; i++) {
    const x = g.state.futureDice.shift() ?? dice(sides); // 綺麗に書けるもんだな
    result += x;
    details.push(x);
    g.state.diceHistory.push(x);
  }

  // after
  yield Log.diceRollAfter(expression, result, details);
  return result;
}

// 期待値
export function diceExpected(times: number, sides: number): number {
  return (times * (sides + 1)) / 2;
}
