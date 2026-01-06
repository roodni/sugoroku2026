import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Log } from "../game/log";
import { Scenario } from "../game/scenario/scenario";
import { ExhaustiveError, Observer } from "../util";
import "./App.css";
import { GameMap } from "./GameMap";
import { Goaled } from "./Goaled";
import { Logs } from "./Logs";
import { Start } from "./Start";
import "./misc";

const WAIT = 80;

type PlayingState = Readonly<
  | { type: "beforeStart" }
  | { type: "playing"; isWaitingButton: boolean }
  | { type: "goaled"; message: string }
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
  const [mapShowAll, setMapShowAll] = useState(false);

  // ログ系
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [logOffset, setLogOffset] = useState(0);
  const [isAllLogsShown, setIsAllLogsShown] = useState(false);
  const logOffsetActual = isAllLogsShown ? 0 : logOffset;
  const lastLog = allLogs.at(-1);

  // 自動進行系
  const [isAuto, setIsAuto] = useState(false);
  const isAutoRef = useRef(isAuto);
  useEffect(() => {
    isAutoRef.current = isAuto; // 非同期関数から最新値を取得するため
  }, [isAuto]);

  // デバッグ系
  const [isDebug, setIsDebug] = useState(false);
  const [debugJson, setDebugJson] = useState(""); // テキストエリアの内容
  const [debugJsonHistory, setDebugJsonHistory] = useState<{
    undo: string[];
    current: string;
    redo: string[];
  }>({ undo: [], current: "", redo: [] }); // currentはゲームとほぼ同期させる
  const isLoadableNow = lastLog === undefined || lastLog.type === "turnEnd";

  // デバッグ盤をゲーム初期化に合わせて初期化する
  useEffect(() => {
    const json = scenarioRef.current!.save();
    setDebugJsonHistory({ undo: [], current: json, redo: [] });
    setDebugJson(json);
  }, []);

  // デバッグ盤の内容をゲームにロードする
  const loadDebugJson = useCallback(
    (json: string) => {
      try {
        scenarioRef.current!.load(json);
      } catch (e) {
        console.error("ロード失敗", e);
        alert(e);
        return;
      }
      setDebugJsonHistory(({ undo, redo }) => ({
        undo,
        current: json,
        redo,
      }));
      mapRenderObserver.notify();
    },
    [mapRenderObserver]
  );

  // ゲームの状態をUndo / Redoする
  const undoDebugJson = () => {
    const { undo, current, redo } = debugJsonHistory;
    if (undo.length === 0) {
      return;
    }
    setDebugJsonHistory({
      undo: undo.slice(1),
      current: undo[0],
      redo: [current, ...redo],
    });
    loadDebugJson(undo[0]);
    setDebugJson(undo[0]);
  };
  const redoDebugJson = () => {
    const { undo, current, redo } = debugJsonHistory;
    if (redo.length === 0) {
      return;
    }
    setDebugJsonHistory({
      undo: [current, ...undo],
      current: redo[0],
      redo: redo.slice(1),
    });
    loadDebugJson(redo[0]);
    setDebugJson(redo[0]);
  };

  // @ を押すとデバッグ盤が開く
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "@" && !e.repeat) {
        setIsDebug((v) => !v);
        setTimeout(() => debugTextareaRef.current?.focus(), 10);
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  // Ctrl + Enterでロード
  const debugTextareaKeyboardHandler = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        loadDebugJson(debugJson);
      }
    },
    [loadDebugJson, debugJson]
  );

  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const scrollerElementRef = useRef<HTMLElement>(null);
  const debugTextareaRef = useRef<HTMLTextAreaElement>(null);

  // はじめから
  const restartGame = useCallback(() => {
    scenarioRef.current = new Scenario();
    setPlayingState({ type: "beforeStart" });
    setAllLogs([]);
    setLogOffset(0);

    setDebugJsonHistory({
      undo: [],
      current: scenarioRef.current.save(),
      redo: [],
    });
    // デバッグ盤は変えなくていい。前ゲームのゴール直前の状態を使いたいことがある
    mapRenderObserver.notify();
  }, [mapRenderObserver]);

  // ゲーム進行
  const stepGame = useCallback(async () => {
    const scenario = scenarioRef.current!;
    while (true) {
      const lastLog = scenario.history.at(-1);
      const logIndex = scenario.history.length;

      const log = scenario.next();
      if (log.type === "gameOver") {
        setPlayingState({ type: "goaled", message: log.message });
        return;
      }

      setAllLogs((prev) => [...prev, log]);
      if (lastLog?.type === "turnEnd") {
        setLogOffset(logIndex);
      }

      if (log.type === "turnEnd") {
        // ターンの切れ目でデバッグ盤に反映する
        const next = scenario.save();
        setDebugJsonHistory(({ undo, current }) => ({
          undo: [current, ...undo],
          current: next,
          redo: [],
        }));
        setDebugJson(next);
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
        mapRenderObserver.notify();
        await new Promise((resolve) => setTimeout(resolve, WAIT));
      } else if (waitType === "button") {
        mapRenderObserver.notify();
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
          {playingState.type === "beforeStart" && <Start></Start>}
          {playingState.type !== "beforeStart" && (
            <GameMap
              getGameState={getGameState}
              renderObserver={mapRenderObserver}
              showAll={mapShowAll}
            ></GameMap>
          )}
          <Logs logs={allLogs} offset={logOffsetActual} />
          {playingState.type === "goaled" && (
            <Goaled
              gameOverMessage={playingState.message}
              restartGame={restartGame}
            />
          )}
        </div>
      </main>
      <footer className="footer">
        {isDebug && (
          <div className="debug">
            デバッグ盤
            <button onClick={() => setIsDebug(false)}>閉じてね</button>
            <button
              onClick={() => loadDebugJson(debugJson)}
              disabled={
                !isLoadableNow || debugJson === debugJsonHistory.current
              }
            >
              ロード
              {!isLoadableNow && " (禁止)"}
            </button>
            <button
              onClick={undoDebugJson}
              disabled={!isLoadableNow || debugJsonHistory.undo.length === 0}
            >
              Undo
            </button>
            <button
              onClick={redoDebugJson}
              disabled={!isLoadableNow || debugJsonHistory.redo.length === 0}
            >
              Redo
            </button>
            <textarea
              name="debug-textarea"
              value={debugJson}
              onChange={(e) => setDebugJson(e.target.value)}
              spellCheck={false}
              ref={debugTextareaRef}
              onKeyDown={debugTextareaKeyboardHandler}
            ></textarea>
          </div>
        )}
        <div className="footer-row">
          <div className="footer-row-scrollee">
            <button
              ref={mainButtonRef}
              type="button"
              onClick={mainButtonHandler}
              disabled={!isWaitingButton}
              className="main-button"
            >
              {mainButtonLabel}
            </button>
            <label
              className={
                isAuto &&
                playingState.type === "playing" &&
                !playingState.isWaitingButton
                  ? "auto-stepping"
                  : ""
              }
            >
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
            <label>
              <input
                type="checkbox"
                checked={mapShowAll}
                onChange={(e) => setMapShowAll(e.target.checked)}
              ></input>
              全マス表示
            </label>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
