import { useCallback, useState } from "react";
import { ExhaustiveError, Observer } from "../util";
import "./App.css";
import { Scenario } from "../game/scenario";
import { GameMap } from "./GameMap";

function App() {
  const [mapRenderObserver] = useState(() => new Observer());

  const [scenario] = useState(() => new Scenario());
  const [logText, setLogText] = useState("迎春すごろく2026");

  const mainButtonHandler = useCallback(() => {
    const turn = scenario.generateTurn();
    let logTmp = "";

    // とりあえずターンごとに進むようにしてみよう
    // TODO: 自分だけダイス待ちする
    let iresult = turn.next();
    while (!iresult.done) {
      const log = iresult.value;
      switch (log.type) {
        case "description":
          logTmp += `${log.text}`;
          break;
        case "quote":
          logTmp += `「${log.text}」`;
          break;
        case "dicerollBefore":
          break; // noop
        case "dicerollAfter":
          logTmp += `\n(${log.kind} -> ${log.result})\n`;
          break;
        default:
          throw new ExhaustiveError(log);
      }
      iresult = turn.next();
      mapRenderObserver.notify();
    }
    setLogText(logTmp);
  }, [scenario, mapRenderObserver]);

  return (
    <>
      <main>
        <button type="button" onClick={mainButtonHandler}>
          次へ
        </button>
        <GameMap
          gameState={scenario.gameState}
          renderObserver={mapRenderObserver}
        ></GameMap>
        <pre>{logText}</pre>
      </main>
      <footer></footer>
    </>
  );
}

export default App;
