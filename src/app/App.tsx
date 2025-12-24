import { useCallback, useRef, useState } from "react";
import type { GameState } from "../game/gameState";
import type { Log } from "../game/log";
import { Scenario } from "../game/scenario";
import { ExhaustiveError, Observer } from "../util";
import "./App.css";
import { GameMap } from "./GameMap";
import { TurnLogs, type LogWithIndex } from "./TurnLogs";

type WaitType = "button" | "timer";
const WAIT = 50;

function App() {
  // ゲームの状態
  const [scenario] = useState(() => new Scenario());

  // 描画系の状態
  const [mapRenderObserver] = useState(() => new Observer<GameState>());
  const [waitType, setWaitType] = useState<WaitType>("button");
  const [turnLogs, setTurnLogs] = useState<LogWithIndex[]>([]);

  // ゲーム進行
  const allLogs = useRef<Log[]>([]);
  const stepGame = useCallback(() => {
    // 非常に危なっかしい。コンポーネント内で定義した関数で再帰するのは問題を起こすことが目に見えている。
    const recFn = () => {
      const log = scenario.next();
      if (log === undefined) {
        return;
      }

      const index = allLogs.current.length;
      const lastLog = allLogs.current.at(-1);
      allLogs.current.push(log);

      if (lastLog?.type === "turnEnd") {
        setTurnLogs([[index, log]]);
      } else {
        setTurnLogs((prev) => [...prev, [index, log]]);
      }
      mapRenderObserver.notify(scenario.gameState);

      // 待機の仕方を決める
      let waitType: WaitType;
      switch (log.type) {
        case "description":
        case "quote":
        case "system":
        case "newSection":
          waitType = "timer";
          break;
        case "diceRollBefore":
          waitType = log.isBot ? "timer" : "button";
          break;
        case "turnEnd":
          waitType = "button";
          break;
        default:
          throw new ExhaustiveError(log);
      }
      setWaitType(waitType);
      if (waitType === "timer") {
        setTimeout(recFn, WAIT);
      }
    };
    recFn();
  }, [scenario, mapRenderObserver]);

  const mainButtonHandler = useCallback(() => {
    if (waitType === "button") {
      stepGame();
    }
  }, [waitType, stepGame]);

  return (
    <>
      <footer>
        <button
          type="button"
          onClick={mainButtonHandler}
          disabled={waitType !== "button"}
        >
          次へ
        </button>
      </footer>
      <main>
        <GameMap renderObserver={mapRenderObserver}></GameMap>
        <TurnLogs logs={turnLogs} />
      </main>
    </>
  );
}

export default App;
