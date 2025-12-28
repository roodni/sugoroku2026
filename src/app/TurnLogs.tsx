// ログを描画するコンポーネント

import type { JSX } from "react";
import type { Log } from "../game/log";
import { ExhaustiveError } from "../util";

export type LogWithIndex = [number, Log];

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

export const TurnLogs: React.FC<{
  logs: LogWithIndex[];
}> = ({ logs }) => {
  const elements: JSX.Element[] = [];
  let isReturned = true; // 最後に改行されたかどうか
  let lastLog: Log | undefined = undefined;
  for (const [index, log] of logs) {
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
            {index === logs.at(-1)?.[0] && !log.isBot && (
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
    elements.push(<span key={index}>{logElement}</span>);
    lastLog = log;
  }
  return <div className="turn-logs">{elements}</div>;
};
