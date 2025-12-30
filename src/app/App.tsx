import { useCallback, useEffect, useRef, useState } from "react";
import { Scenario } from "../game/scenario/scenario";
import { ExhaustiveError, Observer } from "../util";
import "./App.css";
import { GameMap } from "./GameMap";
import { TurnLogs } from "./TurnLogs";
import { Goaled } from "./Goaled";
import type { Log } from "../game/log";

const WAIT = 50;

type PlayingState = Readonly<
  | { type: "beforeStart" }
  | { type: "playing"; isWaitingButton: boolean }
  | { type: "goaled" }
>;

function App() {
  const scenarioRef = useRef<Scenario>(undefined);
  if (scenarioRef.current === undefined) {
    scenarioRef.current = new Scenario();
  }

  const [playingState, setPlayingState] = useState<PlayingState>({
    type: "beforeStart",
  });
  const isWaitingButton =
    playingState.type === "beforeStart" ||
    (playingState.type === "playing" && playingState.isWaitingButton);

  const [mapRenderObserver] = useState(() => new Observer<void>());

  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [logOffset, setLogOffset] = useState(0);
  const [isAllLogsShown, setIsAllLogsShown] = useState(false);
  const logOffsetActual = isAllLogsShown ? 0 : logOffset;

  const [isAuto, setIsAuto] = useState(false);
  const isAutoRef = useRef(isAuto);
  useEffect(() => {
    isAutoRef.current = isAuto; // 非同期関数から最新値を取得するため
  }, [isAuto]);

  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const scrollerElementRef = useRef<HTMLElement>(null);

  // ゲーム進行
  const stepGame = useCallback(async () => {
    const scenario = scenarioRef.current!;
    while (true) {
      const lastLog = scenario.history.at(-1);
      const logIndex = scenario.history.length;

      const log = scenario.next();
      if (log === undefined) {
        setPlayingState({ type: "goaled" });
        return;
      }

      setAllLogs((prev) => [...prev, log]);
      if (lastLog?.type === "turnEnd") {
        setLogOffset(logIndex);
      }

      // 待機の仕方を決める
      let waitType: "immediate" | "timer" | "button";
      switch (log.type) {
        case "description":
        case "dialog":
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

      if (isAutoRef.current && waitType === "button") {
        waitType = "timer";
      }

      // 待機方法に応じて待機する
      if (waitType === "immediate") {
        continue;
      } else if (waitType === "timer") {
        await new Promise((resolve) => setTimeout(resolve, WAIT));
        mapRenderObserver.notify();
      } else if (waitType === "button") {
        setPlayingState({ type: "playing", isWaitingButton: true });
        break;
      }
    }
  }, [mapRenderObserver]); // 注意: 非同期関数なので古い状態しか参照できない

  useEffect(() => {
    // ボタンをdisabledにするとフォーカスが外れるので、再度フォーカスを当てる
    if (isWaitingButton) {
      mainButtonRef.current?.focus();
    }
  }, [isWaitingButton]);

  useEffect(() => {
    // ログの自動スクロール
    const element = scrollerElementRef.current!;
    element.scroll({ top: element.scrollHeight, behavior: "instant" });
    // console.log("scroll", element.scrollTop, element.scrollHeight);
  }, [allLogs, logOffsetActual, playingState]);

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
    scenarioRef.current = new Scenario();
    mapRenderObserver.notify();
    setPlayingState({ type: "beforeStart" });
    setAllLogs([]);
    setLogOffset(0);
  }, [mapRenderObserver]);

  const lastLog = allLogs.at(-1);
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

  const getGameState = useCallback(() => scenarioRef.current!.gameState, []);

  return (
    <div className="app">
      <main className="main" ref={scrollerElementRef}>
        <div className="main-scrollee">
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
          <TurnLogs logs={allLogs} offset={logOffsetActual} />
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
          <input
            type="checkbox"
            checked={isAuto}
            onChange={(e) => setIsAuto(e.target.checked)}
          ></input>
          自動進行
        </label>
        <label>
          <input
            type="checkbox"
            checked={isAllLogsShown}
            onChange={(e) => setIsAllLogsShown(e.target.checked)}
          ></input>
          全ログ表示
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
