// ログを描画するコンポーネント

import { useMemo, type JSX } from "react";
import type { Log } from "../game/log";
import { ExhaustiveError } from "../util";

function isSpaceNeededBeforeNext(sentence: string): boolean {
  switch (sentence.at(-1)) {
    case "!":
    case "?":
    case "！":
    case "？":
      return true;
    default:
      return false;
  }
}

function logsToElements(logs: Log[]): JSX.Element[] {
  const elements: JSX.Element[] = [];
  let isReturned = true; // 最後に改行されたかどうか
  let lastLog: Log | undefined = undefined;
  for (let i = 0; i < logs.length; i++) {
    const log = logs[i];
    let logElement: JSX.Element | undefined = undefined;
    const newLine = () => !isReturned && "\n";
    switch (log.type) {
      case "description":
        logElement = (
          <span className={`log-description-${log.emotion}`}>
            {isReturned && "　"}
            {lastLog?.type === "description" &&
              isSpaceNeededBeforeNext(lastLog.text) &&
              "　"}
            {log.text}
          </span>
        );
        isReturned = false;
        break;
      case "dialog":
        logElement = (
          <span className="log-quote">
            {newLine()}「{log.text}」{"\n"}
          </span>
        );
        isReturned = true;
        break;
      case "system":
        logElement = (
          <span className={`log-system-${log.emotion}`}>
            {newLine()}
            {log.text}
            {"\n"}
          </span>
        );
        isReturned = true;
        break;
      case "newSection":
        logElement = (
          <>
            {newLine()}
            {"\n"}
          </>
        );
        isReturned = true;
        break;
      case "diceRollBefore":
        logElement = (
          <span className="log-system-dice">
            {newLine()}
            {`[サイコロ] ${log.expression} => `}
            {i === logs.length - 1 && !log.isBot && (
              <span className="log-waiting">(ボタンを押してください)</span>
            )}
          </span>
        );
        isReturned = false;
        break;
      case "diceRollAfter":
        logElement = (
          <span className="log-system-dice">{`${log.result}\n`}</span>
        );
        isReturned = true;
        break;
      case "turnEnd":
        logElement = (
          <span className="log-waiting">
            {newLine()}
            {"\n--- ターン終了 ---\n"}
          </span>
        );
        isReturned = true;
        break;
      default:
        throw new ExhaustiveError(log);
    }
    if (logElement === undefined) {
      continue;
    }
    // TODO: ここをFragmentにする
    elements.push(<span key={i}>{logElement}</span>);
    lastLog = log;
  }

  return elements;
}

// TODO: 名前を変えよう
export const TurnLogs: React.FC<{
  logs: Log[];
  offset: number;
}> = ({ logs, offset }) => {
  const elements = useMemo(() => logsToElements(logs), [logs]);
  const slice = elements.slice(offset);
  return <div className="turn-logs">{slice}</div>;
};
