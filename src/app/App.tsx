import React, { useCallback, useEffect, useRef, useState } from "react";
import { Game } from "../game/game";
import type { Log } from "../game/log";
import { ExhaustiveError, Observer } from "../util";
import "./App.css";
import { REPLAY_KEY, WAIT } from "./appConfig";
import { ConfirmReplay } from "./ConfirmReplay";
import { GameMap } from "./GameMap";
import { GameOver } from "./GameOver";
import {
  LocalStorageKey,
  useLatest,
  useLocalStorageBoolean,
  useLocalStorageFloat,
  useLocalStorageString,
} from "./hook";
import { Logs } from "./Logs";
import "./misc";
import { createReplayUrl, decodeReplay, encodeReplay } from "./replay";
import {
  createUtterance,
  logToSpeechText,
  speakAsync,
  useVoices,
} from "./speech";
import { Title } from "./Title";

type Scene = Readonly<
  | { type: "loading" }
  | { type: "confirmReplay"; replayData: number[] }
  | { type: "title" }
  | { type: "playing"; isWaitingButton: boolean }
  | { type: "gameOver"; message: string; replay: string }
>;

function App() {
  // ゲームオブジェクト
  const gameRef = useRef<Game>(undefined);
  const [isReplay, setIsReplay] = useState(false);

  // Scene
  const [scene, setScene] = useState<Scene>({
    type: "loading",
  });
  const isGameScene = scene.type === "playing" || scene.type === "gameOver"; // ゲーム画面を表示しているかどうか
  const isWaitingButton =
    scene.type === "title" ||
    (scene.type === "playing" && scene.isWaitingButton);

  // 地図系
  const [mapRenderObserver] = useState(() => new Observer<void>());
  const [mapShowAll, setMapShowAll] = useState(false);

  // ログ系
  const [allLogs, setAllLogs] = useState<Log[]>([]);
  const [logOffset, setLogOffset] = useState(0);
  const [isAllLogsShown, setIsAllLogsShown] = useState(false);
  const logOffsetActual = isAllLogsShown ? 0 : logOffset;
  const lastLog = allLogs.at(-1);

  // 高速ログ送り
  const [highSpeed, setHighSpeed] = useLocalStorageBoolean(
    new LocalStorageKey("highSpeed"),
    false
  );
  const highSpeedLatest = useLatest(highSpeed);

  // 読み上げ系
  const [speechEnabled, _setSpeechEnabled] = useState(false); //  音が鳴るので永続化せずfalse
  const setSpeechEnabled = useCallback((v: boolean) => {
    _setSpeechEnabled(v);
    if (!v) {
      window.speechSynthesis?.cancel();
    }
  }, []);
  const speechEnabledLatest = useLatest(speechEnabled);

  const voices = useVoices();
  // ユーザーが選択した声。最初はselect要素と必ずしも一致しない
  const [voiceURIUserSelected, setVoiceURIUserSelected] = useLocalStorageString(
    new LocalStorageKey("voiceURI"),
    ""
  );
  const voice =
    voices.find((v) => v.voiceURI === voiceURIUserSelected) ??
    voices.find((v) => v.default) ??
    voices.at(0);
  const voiceLatest = useLatest(voice);

  const [speechRate, setSpeechRate] = useLocalStorageFloat(
    new LocalStorageKey("speechRate"),
    1.0
  );
  const speechRateLatest = useLatest(speechRate);

  // デバッグ系
  const [isDebug, setIsDebug] = useState(false);
  const [debugJson, setDebugJson] = useState(""); // テキストエリアの内容
  const [debugJsonHistory, setDebugJsonHistory] = useState<{
    undo: string[];
    current: string;
    redo: string[];
  }>({ undo: [], current: "", redo: [] }); // currentはゲームとほぼ同期させる
  const isLoadableNow = lastLog === undefined || lastLog.type === "turnEnd";

  // デバッグ盤の内容をゲームにロードする
  const loadDebugJson = useCallback(
    (json: string) => {
      try {
        gameRef.current!.load(json);
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
  const undoDebugJson = useCallback(() => {
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
  }, [debugJsonHistory, loadDebugJson]);
  const redoDebugJson = useCallback(() => {
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
  }, [debugJsonHistory, loadDebugJson]);

  // @ を押すとデバッグ盤が開く
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "@" && !e.repeat) {
        setIsDebug((v) => !v);
        requestAnimationFrame(() => debugTextareaRef.current?.focus());
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

  // element系
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const scrollerElementRef = useRef<HTMLElement>(null);
  const scrolleeElementRef = useRef<HTMLDivElement>(null);
  const debugTextareaRef = useRef<HTMLTextAreaElement>(null);

  // ゲーム初期化
  // 冪等な操作だし、依存配列が空なので、useEffectで呼んでもなんとかなる
  const initializeGame = useCallback(
    (options: { initializeJson: boolean; replayData?: number[] }) => {
      // ゲームオブジェクト
      const game = new Game();
      if (options.replayData !== undefined) {
        // こんなことが許されると思っているのか!?
        // コンストラクタの引数で受け取るべきだろ！
        game.gameState.futureDice = options.replayData;
        game.gameState.replayMode = true;
      }
      setIsReplay(game.gameState.replayMode);
      gameRef.current = game;

      if (options.replayData === undefined) {
        // リプレイモードではないなら、URLからクエリを消しておく
        const url = createReplayUrl(location.href, undefined);
        window.history.replaceState(null, "", url);
      }

      // ログ系
      setAllLogs([]);
      setLogOffset(0);

      // デバッグ系
      const initialJson = game.save();
      setDebugJsonHistory({
        undo: [],
        current: initialJson,
        redo: [],
      });
      if (options.initializeJson) {
        setDebugJson(initialJson);
      }
    },
    []
  );

  // ゲーム読み込み時の処理
  useEffect(() => {
    if (scene.type !== "loading") {
      return; // 開発中のhot reloadで最初に戻らないように
    }
    (async () => {
      // リプレイがあるかどうか見る
      const replayQuery = new URL(location.href).searchParams.get(REPLAY_KEY);
      let replayData = undefined;
      if (replayQuery) {
        try {
          replayData = await decodeReplay(replayQuery);
        } catch (e) {
          console.log("リプレイ読み込み失敗", e);
        }
      }
      // シーン遷移
      if (replayData === undefined) {
        // リプレイがなければ普通にタイトルへ
        initializeGame({ initializeJson: true });
        setScene({ type: "title" });
      } else {
        // リプレイがあれば再生するか確認を取る
        setScene({ type: "confirmReplay", replayData });
      }
    })();
  }, [initializeGame, scene]);

  // ゲームやりなおしの処理
  const restartGame = useCallback(() => {
    setScene({ type: "title" });
    initializeGame({ initializeJson: false }); // クリア直前の状態をロードできるようにしておく
  }, [initializeGame]);

  // ゲーム進行
  const stepGame = useCallback(async () => {
    const game = gameRef.current!;
    while (true) {
      const log = game.next();

      // ログ描画
      // 全ログ描画は重いのでバックグラウンドでは省略する
      // ただしシーン遷移直前には描画する
      if (!document.hidden || log.type === "gameOver") {
        setAllLogs([...game.history]);
        // オフセットを探す
        let offset = 0;
        for (let i = game.history.length - 2; i >= 0; i--) {
          // 1個前のログから調べて、最後のターンの切れ目を探す
          const l = game.history[i];
          if (l.type === "turnEnd") {
            offset = i + 1;
            break;
          }
        }
        setLogOffset(offset);
      }

      // ゴール処理
      if (log.type === "gameOver") {
        const replay = await encodeReplay(game.gameState.diceHistory);
        setScene({ type: "gameOver", message: log.message, replay });
        // ゴールしたらURLにリプレイ情報を含める
        const url = createReplayUrl(location.href, replay);
        window.history.replaceState(null, "", url);
        return;
      }

      if (log.type === "turnEnd") {
        // ターンの切れ目でデバッグ盤に反映する
        const next = game.save();
        setDebugJsonHistory(({ undo, current }) => ({
          undo: [current, ...undo],
          current: next,
          redo: [],
        }));
        setDebugJson(next);
      }

      // wait処理
      if (speechEnabledLatest.current && voiceLatest.current) {
        // 読み上げする場合
        let utterance: SpeechSynthesisUtterance | undefined = undefined;
        const speechText = logToSpeechText(log);
        if (speechText) {
          utterance = createUtterance(
            speechText,
            voiceLatest.current,
            speechRateLatest.current
          );
        }

        if (utterance) {
          // 読み上げる内容があるならば、それをwait処理とする
          // setTimeoutを使わないのでバックグラウンドでも動作が遅くなりにくい
          mapRenderObserver.notify();
          const { complete } = await speakAsync(utterance);
          if (!complete) {
            // Android版Chromeだと、ホーム画面に戻ったとき読み上げが一瞬でエラーになるためキングクリムゾンする
            // なのでエラーが起きたらフォアグラウンドに戻るまで待機する
            await new Promise((resolve) => requestAnimationFrame(resolve));
          }
        } else {
          // 読み上げる内容がなければ全く待たない
          // noop
        }
      } else {
        // 読み上げしない場合
        let waitType: "immediate" | "wait" | "button";
        switch (log.type) {
          case "description":
          case "dialog":
          case "system":
          case "diceRollAfter":
            waitType = "wait";
            break;
          case "newSection":
            waitType = "immediate";
            break;
          case "diceRollBefore":
            waitType = log.isBot ? "wait" : "button";
            break;
          case "turnEnd":
            waitType = "button";
            break;
          default:
            throw new ExhaustiveError(log);
        }

        if (waitType === "immediate") {
          // noop
        } else if (waitType === "wait") {
          mapRenderObserver.notify();
          if (highSpeedLatest.current) {
            // これを immediate にすると流石に速すぎて微妙だった
            await new Promise((resolve) => requestAnimationFrame(resolve));
          } else {
            await new Promise((resolve) => setTimeout(resolve, WAIT));
          }
        } else if (waitType === "button") {
          mapRenderObserver.notify();
          setScene({ type: "playing", isWaitingButton: true });
          return; // ループを脱出
        } else {
          throw new ExhaustiveError(waitType);
        }
      }
    }
  }, [
    mapRenderObserver,
    speechEnabledLatest,
    voiceLatest,
    speechRateLatest,
    highSpeedLatest,
  ]); // 注意: 非同期関数なので古い状態しか参照できない

  // メインボタンが有効なら、とりあえずフォーカスする
  // (disabledでフォーカスが消える対策)
  // タイトル画面でもとりあえずフォーカスしておきたい
  useEffect(() => {
    if (isWaitingButton) {
      mainButtonRef.current?.focus();
    }
  }, [isWaitingButton]);

  // リプレイ確認画面の応答
  const replayYes = useCallback(() => {
    if (scene.type !== "confirmReplay") {
      return;
    }
    initializeGame({ initializeJson: true, replayData: scene.replayData });
    setScene({ type: "playing", isWaitingButton: false });
    stepGame();
  }, [scene, initializeGame, stepGame]);
  const replayNo = useCallback(() => {
    initializeGame({ initializeJson: true });
    setScene({ type: "title" });
  }, [initializeGame]);

  // ログの自動スクロール
  useEffect(() => {
    if (!isGameScene) {
      // ゲーム画面以外では自動スクロールしない
      return;
    }
    const observer = new ResizeObserver(() => {
      const scroller = scrollerElementRef.current!;
      scroller.scroll({
        top: scroller.scrollHeight - scroller.clientHeight,
        behavior: "instant",
      });
    });
    const scrollee = scrolleeElementRef.current!;
    observer.observe(scrollee);
    return () => {
      observer.disconnect();
    };
  }, [isGameScene]);

  // メインボタンに関すること
  const mainButtonHandler = useCallback(() => {
    if (scene.type === "title") {
      setScene({ type: "playing", isWaitingButton: false });
      stepGame();
    } else if (scene.type === "playing") {
      setScene({ type: "playing", isWaitingButton: false });
      stepGame();
    }
  }, [stepGame, scene]);

  const mainButtonLabel = (() => {
    switch (scene.type) {
      case "loading":
        return "禁"; // 一瞬
      case "confirmReplay":
        return "禁";
      case "title":
        return "始める";
      case "playing":
        if (!scene.isWaitingButton) {
          return "進行中……";
        }
        switch (lastLog?.type) {
          case "diceRollBefore":
            return `サイコロを振る (${lastLog.expression})`;
          case "turnEnd":
            return "次のターンへ";
          default:
            return "次へ"; // ここを踏むことはないはず
        }
      case "gameOver":
        return "終わり";
      default:
        throw new ExhaustiveError(scene);
    }
  })();

  const getGameState = useCallback(() => gameRef.current!.gameState, []);

  return (
    <div className="app">
      <main className="main" ref={scrollerElementRef}>
        <div className="main-scrollee" ref={scrolleeElementRef}>
          {scene.type === "confirmReplay" && (
            <ConfirmReplay yes={replayYes} no={replayNo} />
          )}
          {scene.type === "title" && <Title></Title>}
          {isGameScene && (
            <>
              {isReplay && (
                <div className="replay-notice">
                  <div className="log-system-negative">
                    これはリプレイです。トロフィーは保存されません。
                  </div>
                  <button
                    onClick={restartGame}
                    disabled={!isWaitingButton && scene.type !== "gameOver"}
                  >
                    タイトルへ
                  </button>
                </div>
              )}
              <GameMap
                getGameState={getGameState}
                renderObserver={mapRenderObserver}
                showAll={mapShowAll}
              ></GameMap>
              <Logs logs={allLogs} offset={logOffsetActual} />
            </>
          )}
          {scene.type === "gameOver" && (
            <GameOver
              gameOverMessage={scene.message}
              replayCode={scene.replay}
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
              Load
              {!isLoadableNow && " (wait)"}
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

        {/* メインボタン */}
        <div className="footer-row-scroll">
          <button
            ref={mainButtonRef}
            type="button"
            onClick={mainButtonHandler}
            disabled={!isWaitingButton}
            className="main-button"
          >
            {mainButtonLabel}
          </button>
        </div>

        {/* 読み上げ系 */}
        {speechEnabled && voice !== undefined && (
          <div className="footer-row-speech-settings">
            <label>
              声{" "}
              <select
                value={voice.voiceURI}
                onChange={(e) => setVoiceURIUserSelected(e.target.value)}
                disabled={voices.length === 0}
              >
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              速さ{" "}
              <input
                type="range"
                min="1"
                max="5.0"
                step="0.5"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              ></input>
              ({speechRate.toFixed(1)}x)
            </label>
          </div>
        )}

        {/* 設定系はこの行 */}
        <div className="footer-row-scroll">
          <label className={voice === undefined ? "disabled-label" : ""}>
            <input
              type="checkbox"
              checked={speechEnabled}
              disabled={voice === undefined}
              onChange={(e) => setSpeechEnabled(e.target.checked)}
            ></input>
            <span
              className={
                speechEnabled &&
                scene.type === "playing" &&
                !scene.isWaitingButton
                  ? "auto-stepping"
                  : ""
              }
            >
              読み上げ
            </span>
          </label>
          <label className={speechEnabled ? "disabled-label" : ""}>
            <input
              type="checkbox"
              checked={highSpeed}
              onChange={(e) => setHighSpeed(e.target.checked)}
              disabled={speechEnabled}
            ></input>
            高速
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
      </footer>
    </div>
  );
}

export default App;
