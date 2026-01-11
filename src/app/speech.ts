// 読み上げ系

import { useLayoutEffect, useState } from "react";
import type { Log } from "../game/log";
import { ExhaustiveError } from "../util";

export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState(() => speechSynthesis.getVoices());
  useLayoutEffect(() => {
    const handleVoicesChanged = () => {
      setVoices(speechSynthesis.getVoices());
    };
    speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, []);

  // なんかモバイル版Chromeだと日本語が ja_JP (ハイフンが正しいのにアンスコ) になっているので対応
  const jpVoices = voices.filter((v) => v.lang.replace("_", "-") === "ja-JP");
  if (jpVoices.length > 0) {
    return jpVoices;
  }
  return voices;
}

export function logToSpeechText(log: Log): string | undefined {
  switch (log.type) {
    case "description":
      return log.text;
    case "dialog":
      return log.text.replace("……", "、");
    case "system":
      return log.text
        .replace("->", "から")
        .replace(" / ", "、")
        .replace("[トロフィー獲得]", "トロフィー獲得。");
    case "newSection":
      return undefined;
    case "diceRollBefore":
      return `${log.expression}`;
    case "diceRollAfter":
      return `${log.result}`;
    case "turnEnd":
      return undefined;
    default:
      throw new ExhaustiveError(log);
  }
}

// 喋る。喋り終わったタイミングでPromiseが解決する。
// タイムアウトもあるので安心
export function speakAsync(utterance: SpeechSynthesisUtterance): Promise<void> {
  return new Promise<void>((resolve) => {
    // ネットワークエラー等で始まらない場合のタイムアウト
    const beforeStartTimer = setTimeout(() => {
      console.log("speech start timeout");
      speechSynthesis.cancel();
      resolve();
    }, 2000);
    utterance.addEventListener("start", () => {
      clearTimeout(beforeStartTimer);
    });

    const done = () => {
      clearTimeout(beforeStartTimer);
      resolve();
    };
    utterance.addEventListener("end", done);
    utterance.addEventListener("error", done); // speechSynthesis.cancel でも発火する https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisErrorEvent/error
    speechSynthesis.speak(utterance);

    // デバッグ用
    utterance.addEventListener("error", (e) => {
      console.log("speech error", e);
    });
  });
}
