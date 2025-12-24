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
    let text = "";
    switch (log.type) {
      case "description":
        if (isReturned) {
          text += "　";
        }
        text += log.text;
        isReturned = false;
        break;
      case "quote":
        if (!isReturned) {
          text += "\n";
        }
        text += `「${log.text}」\n`;
        isReturned = true;
        break;
      case "system":
        if (!isReturned) {
          text += "\n";
        }
        text += `${log.text}\n`;
        isReturned = true;
        break;
      case "newSection":
        if (!isReturned) {
          text += "\n";
        }
        text += "\n";
        isReturned = true;
        break;
      case "diceRollBefore":
        break;
      case "turnEnd":
        if (!isReturned) {
          text += "\n";
        }
        text += "--- ターンエンド ---";
        isReturned = false;
        break;
      default:
        throw new ExhaustiveError(log);
    }

    if (text === "") {
      continue;
    }
    elements.push(<span key={index}>{text}</span>);
  }
  return <pre>{elements}</pre>;
};
