// ログを描画するコンポーネント

import type { JSX } from "react";
import type { Log } from "../game/log";
import { ExhaustiveError } from "../util";

export type LogWithIndex = [number, Log];

export const TurnLogs: React.FC<{
  logs: LogWithIndex[];
}> = ({ logs }) => {
  const elements: JSX.Element[] = [];
  let isReturned = true; // 最後に改行されたかどうか
  for (const [index, log] of logs) {
    let logElement: JSX.Element | undefined = undefined;
    const newLine = () => !isReturned && "\n";
    switch (log.type) {
      case "description":
        logElement = (
          <>
            {isReturned && "　"}
            {log.text}
          </>
        );
        isReturned = false;
        break;
      case "quote":
        logElement = (
          <span>
            {newLine()}「{log.text}」{"\n"}
          </span>
        );
        isReturned = true;
        break;
      case "system":
        logElement = (
          <>
            {newLine()}
            {log.text}
            {"\n"}
          </>
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
          <>
            {newLine()}
            {`[サイコロ] ${log.expression} => `}
            {index === logs.at(-1)?.[0] && !log.isBot && (
              <span className="log-waiting">(待機中)</span>
            )}
          </>
        );
        isReturned = false;
        break;
      case "diceRollAfter":
        logElement = <>{`${log.result}\n`}</>;
        isReturned = true;
        break;
      case "turnEnd":
        logElement = (
          <>
            {newLine()}
            {"\n--- ターン終了 ---\n"}
          </>
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
  }
  return <div className="turn-logs">{elements}</div>;
};
