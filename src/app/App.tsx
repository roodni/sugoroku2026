import { useCallback, useEffect, useRef, useState } from "react";
import { Scenario } from "../game/scenario/scenario";
import { ExhaustiveError, Observer } from "../util";
import "./App.css";
import { GameMap } from "./GameMap";
import { TurnLogs, type LogWithIndex } from "./TurnLogs";
import { Goaled } from "./Goaled";

const WAIT = 80;

type PlayingState = Readonly<
  | { type: "beforeStart" }
  | { type: "playing"; isWaitingButton: boolean }
  | { type: "goaled" }
>;

function App() {
  const [playingState, setPlayingState] = useState<PlayingState>({
    type: "beforeStart",
  });
  const isWaitingButton =
    playingState.type === "beforeStart" ||
    (playingState.type === "playing" && playingState.isWaitingButton);

  const [scenario, setScenario] = useState(() => new Scenario());

  const [mapRenderObserver] = useState(() => new Observer<void>());
  const [turnLogs, setTurnLogs] = useState<LogWithIndex[]>([]);

  const mainButtonRef = useRef<HTMLButtonElement>(null);

  // ゲーム進行
  const stepGame = useCallback(async () => {
    while (true) {
      const logIndex = scenario.history.length;
      const lastLog = scenario.history.at(-1);

      const log = scenario.next();
      if (log === undefined) {
        setPlayingState({ type: "goaled" });
        return;
      }

      if (lastLog?.type === "turnEnd") {
        setTurnLogs([[logIndex, log]]);
      } else {
        setTurnLogs((prev) => [...prev, [logIndex, log]]);
      }
      mapRenderObserver.notify();

      // 待機の仕方を決める
      let waitType: "immediate" | "timer" | "button";
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
        await new Promise((resolve) => setTimeout(resolve, WAIT));
      } else if (waitType === "button") {
        setPlayingState({ type: "playing", isWaitingButton: true });
        break;
      }
    }
  }, [scenario, mapRenderObserver]);

  useEffect(() => {
    // ボタンをdisabledにするとフォーカスが外れるので、再度フォーカスを当てる
    if (isWaitingButton) {
      mainButtonRef.current?.focus();
    }
  }, [isWaitingButton]);

  const mainButtonHandler = useCallback(() => {
    if (playingState.type === "beforeStart") {
      setPlayingState({ type: "playing", isWaitingButton: false });
      stepGame();
    } else if (playingState.type === "playing") {
      setPlayingState({ type: "playing", isWaitingButton: false });
      stepGame();
    }
  }, [stepGame, playingState]);

  const restartGame = useCallback(() => {
    setPlayingState({ type: "beforeStart" });
    setScenario(new Scenario());
    setTurnLogs([]);
  }, []);

  const lastLog = turnLogs.at(-1)?.[1];
  const mainButtonLabel = (() => {
    if (playingState.type === "beforeStart") {
      return "始める";
    } else if (playingState.type === "playing") {
      if (!playingState.isWaitingButton) {
        return "進行中……";
      }
      switch (lastLog?.type) {
        case "diceRollBefore":
          return `サイコロを振る (${lastLog.expression})`;
        case "turnEnd":
          return "次のターンへ";
        default:
          return "次へ";
      }
    } else if (playingState.type === "goaled") {
      return "終わり";
    }
  })();

  const getGameState = useCallback(() => scenario.gameState, [scenario]);

  return (
    <div className="app">
      <main className="main">
        <div className="main-scroll">
          {playingState.type === "beforeStart" && (
            <div className="turn-logs">
              <span className="log-system-neutral">迎春すごろく2026</span>
              {"\n\n"}
              <span className="log-description-neutral">
                {"　"}
                あなたの目的は1位でゴールに辿り着くことです。画面下のボタンを押すとゲームが始まります。
              </span>
              {/* {"\n\n"}
              <span className="log-system-neutral">
                [設定] CPの数: <input type="number" value={2} max={10}></input>
              </span> */}
            </div>
          )}
          <GameMap
            getGameState={getGameState}
            renderObserver={mapRenderObserver}
          ></GameMap>
          <TurnLogs logs={turnLogs} />
          {playingState.type === "goaled" && (
            <Goaled getGameState={getGameState} restartGame={restartGame} />
          )}
        </div>
      </main>
      <footer className="footer">
        <button
          ref={mainButtonRef}
          type="button"
          onClick={mainButtonHandler}
          disabled={!isWaitingButton}
          className="main-button"
        >
          {mainButtonLabel}
        </button>
        <label>
          <input type="checkbox"></input>
          自動進行
        </label>
        {/* <label>
          <input type="checkbox"></input>
          読み上げ
        </label> */}
      </footer>
    </div>
  );
}

export default App;
