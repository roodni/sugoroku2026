// vite-node で実行できる

import { Scenario } from "./scenario/scenario";
import { Trophy } from "./trophy";

globalThis.localStorage = {
  ...globalThis.localStorage,
  getItem() {
    return null;
  },
  setItem() {
    return;
  },
};

const loop = 5000;
const result: Record<string, number> = {};
for (let i = 0; i < loop; i++) {
  const game = new Scenario();
  while (true) {
    const log = game.next();
    if (log.type === "gameOver") {
      // console.log(game.gameState.trophies.map((t) => t.name));
      for (const trophy of game.gameState.trophies) {
        result[trophy.name] = (result[trophy.name] ?? 0) + 1;
      }
      break;
    }
    // const text = logToSpeechText(log);
    // if (text !== undefined) {
    //   console.log(num, text);
    // }
    // num++;
  }
}

for (const trophy of Trophy.all) {
  const count = result[trophy.name] ?? 0;

  // const name = [...trophy.name]
  //   .map(() => "？")
  //   .join("");
  const name = trophy.name;

  console.log(
    name.padEnd(6, "　"),
    ":",
    ((count / loop) * 100).toFixed(1) + "%"
  );
}
