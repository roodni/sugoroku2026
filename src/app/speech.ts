// 読み上げ系

import { useLayoutEffect, useState } from "react";
import type { Log } from "../game/log";
import { ExhaustiveError } from "../util";

export function useVoices(): SpeechSynthesisVoice[] {
  // 一部環境（lineの内部ブラウザ）だと使えないらしい
  const speechSynthesis = window?.speechSynthesis as
    | SpeechSynthesis
    | undefined;
  const [voices, setVoices] = useState(
    () => speechSynthesis?.getVoices() ?? []
  );
  useLayoutEffect(() => {
    if (!speechSynthesis) {
      return;
    }
    const handleVoicesChanged = () => {
      setVoices(speechSynthesis.getVoices());
    };
    speechSynthesis.addEventListener("voiceschanged", handleVoicesChanged);
    return () => {
      speechSynthesis.removeEventListener("voiceschanged", handleVoicesChanged);
    };
  }, [speechSynthesis]);

  // なんかモバイル版Chromeだと日本語が ja_JP (ハイフンが正しいのにアンスコ) になっているので対応
  // ついでにカタコト日本語も入れておく (Google Chrome限定)
  const jpVoices = voices.filter(
    (v) =>
      v.lang.replace("_", "-") === "ja-JP" || v.name === "Google US English"
  );
  if (jpVoices.length > 0) {
    return jpVoices;
  }
  return voices;
}

function normalizeSpeechText(s: string): string {
  // 気づいたら追加するが、そんなに頑張らない
  return s
    .replaceAll("……", "、")
    .replaceAll("頭脳戦", "頭脳せん")
    .replaceAll("後にした", "あとにした")
    .replaceAll("池の主", "池のぬし");
}

export function createUtterance(
  text: string,
  voice: SpeechSynthesisVoice,
  rate: number
): SpeechSynthesisUtterance {
  // 声ごとの調整
  if (voice.name.includes("Google")) {
    rate = Math.min(rate, 1.5); // Google系は早口すぎるとタイムアウトする
  } else if (voice.name.includes("Kyoko")) {
    text = text.replaceAll("ターン", "たーん"); // Kyokoさんは「ターン」を「トーン」と発音する
  }
  text = normalizeSpeechText(text);

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = voice;
  utterance.rate = rate;
  return utterance;
}

export function logToSpeechText(log: Log): string | undefined {
  switch (log.type) {
    case "description":
      return log.text;
    case "dialog":
      return log.text;
    case "system":
      return log.speech ?? log.text;
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
export function speakAsync(
  utterance: SpeechSynthesisUtterance
): Promise<{ complete: boolean }> {
  return new Promise((resolve) => {
    // ネットワークエラー等で始まらない場合のタイムアウト
    const beforeStartTimer = setTimeout(() => {
      console.log("speech start timeout");
      speechSynthesis.cancel();
      resolve({ complete: false });
    }, 2000);
    utterance.addEventListener("start", () => {
      clearTimeout(beforeStartTimer);
    });

    const done = (complete: boolean) => {
      clearTimeout(beforeStartTimer);
      resolve({ complete });
    };
    utterance.addEventListener("end", () => done(true));
    utterance.addEventListener("error", () => done(false)); // speechSynthesis.cancel でも発火する https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisErrorEvent/error
    speechSynthesis.speak(utterance);

    // デバッグ用
    // utterance.addEventListener("end", (e) => {
    //   console.log("speech end", e);
    // });
    // utterance.addEventListener("error", (e) => {
    //   console.log("speech error", e);
    // });
  });
}
