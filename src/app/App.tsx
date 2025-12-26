import { useCallback, useEffect, useRef, useState } from "react";
import type { GameState } from "../game/gameState";
import type { Log } from "../game/log";
import { Scenario } from "../game/scenario";
import { ExhaustiveError, Observer } from "../util";
import "./App.css";
import { GameMap } from "./GameMap";
import { TurnLogs, type LogWithIndex } from "./TurnLogs";

type WaitType = "button" | "timer";
const WAIT = 100;

function App() {
  // ゲームの状態
  const [scenario] = useState(() => new Scenario());

  // 描画系の状態
  const [mapRenderObserver] = useState(() => new Observer<GameState>());
  const [waitType, setWaitType] = useState<WaitType>("button");
  const [turnLogs, setTurnLogs] = useState<LogWithIndex[]>([]);

  const mainButtonRef = useRef<HTMLButtonElement>(null);

  // ゲーム進行
  const allLogs = useRef<Log[]>([]);
  const stepGame = useCallback(async () => {
    while (true) {
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
      let waitType: WaitType | "immediate";
      switch (log.type) {
        case "description":
        case "quote":
        case "system":
        case "diceRollAfter":
          waitType = "timer";
          break;
        case "newSection":
          waitType = "immediate";
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

      if (waitType === "immediate") {
        continue;
      } else if (waitType === "timer") {
        setWaitType(waitType);
        await new Promise((resolve) => setTimeout(resolve, WAIT));
      } else if (waitType === "button") {
        setWaitType(waitType);
        break;
      }
    }
  }, [scenario, mapRenderObserver]);

  useEffect(() => {
    if (waitType === "button") {
      mainButtonRef.current?.focus();
    }
  }, [waitType]);

  const mainButtonHandler = useCallback(() => {
    if (waitType === "button") {
      stepGame();
    }
  }, [waitType, stepGame]);

  return (
    <div className="app">
      <main className="main">
        <GameMap renderObserver={mapRenderObserver}></GameMap>
        <TurnLogs logs={turnLogs} />
      </main>
      <footer className="footer">
        <button
          ref={mainButtonRef}
          type="button"
          onClick={mainButtonHandler}
          disabled={waitType !== "button"}
          className="main-button"
        >
          次へ
        </button>
        <label>
          <input type="checkbox"></input>
          自動
        </label>
      </footer>
    </div>
  );
}

export default App;
