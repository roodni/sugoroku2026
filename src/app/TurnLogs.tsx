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
    const newLine = () => {
      if (!isReturned) {
        text += "\n";
      }
    };
    switch (log.type) {
      case "description":
        if (isReturned) {
          text += "　";
        }
        text += log.text;
        isReturned = false;
        break;
      case "quote":
        newLine();
        text += `「${log.text}」\n`;
        isReturned = true;
        break;
      case "system":
        newLine();
        text += `${log.text}\n`;
        isReturned = true;
        break;
      case "newSection":
        newLine();
        text += "\n";
        isReturned = true;
        break;
      case "diceRollBefore":
        newLine();
        text += `[サイコロ] ${log.expression} => `;
        if (index === logs.at(-1)?.[0] && !log.isBot) {
          text += "(サイコロを振ってください)";
        }
        break;
      case "diceRollAfter":
        text += `${log.result}\n`;
        isReturned = true;
        break;
      case "turnEnd":
        newLine();
        text += "\n--- ターン終了 ---\n";
        isReturned = true;
        break;
      default:
        throw new ExhaustiveError(log);
    }

    if (text === "") {
      continue;
    }
    elements.push(<span key={index}>{text}</span>);
  }
  return <pre className="turn-logs">{elements}</pre>;
};
