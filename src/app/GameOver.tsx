import { useCallback, useMemo, useState } from "react";
import { REPLAY_KEY } from "./appConfig";

const HASHTAG = "新春ログすごろく";
const INTENT_BASE = "https://twitter.com/intent/tweet";

function tweetUrl(text: string) {
  const params = new URLSearchParams();
  params.set("text", text);
  return `${INTENT_BASE}?${params.toString()}`;
}

type SharingMode = "replay" | "no-replay" | "replay-only";

export const GameOver: React.FC<{
  gameOverMessage: string;
  replayCode: string;
  restartGame: () => void;
}> = ({ gameOverMessage, replayCode, restartGame }) => {
  const [sharingMode, _setSharingMode] = useState<SharingMode>("replay");
  const [copied, setCopied] = useState(false);

  const hereUrl = useMemo(() => {
    const url = new URL(location.href);
    if (sharingMode === "replay" || sharingMode === "replay-only") {
      url.search = `?${REPLAY_KEY}=${replayCode}`;
    } else {
      url.search = "";
    }
    return url.href;
  }, [sharingMode, replayCode]);

  const text = useMemo(() => {
    if (sharingMode === "replay-only") {
      return hereUrl;
    } else {
      return `${gameOverMessage}\n${hereUrl}\n#${HASHTAG}`;
    }
  }, [gameOverMessage, hereUrl, sharingMode]);

  const copy = useCallback(() => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true);
      })
      .catch(() => {
        alert("コピーに失敗しました。");
      });
  }, [text]);

  const setSharingMode = useCallback((mode: SharingMode) => {
    _setSharingMode(mode);
    setCopied(false);
  }, []);

  return (
    <div className="goaled">
      <select
        value={sharingMode}
        onChange={(e) => setSharingMode(e.target.value as SharingMode)}
      >
        <option value="replay">リプレイを共有する</option>
        <option value="no-replay">リプレイを共有しない</option>
        <option value="replay-only">URLのみ</option>
      </select>
      <textarea className="goaled-textarea" readOnly value={text} />
      <div className="goaled-buttons">
        <div>
          <a href={tweetUrl(text)} target="_blank">
            𝕏（タブが開きます）
          </a>{" "}
        </div>
        <button onClick={copy} disabled={copied}>
          コピー
        </button>
        <button onClick={restartGame} className="game-over-restart">
          はじめから
        </button>
      </div>
    </div>
  );
};
