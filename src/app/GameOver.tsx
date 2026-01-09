import { useMemo, useState } from "react";
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
  const [sharingMode, setSharingMode] = useState<SharingMode>("replay");

  const hereUrl = useMemo(() => {
    const url = new URL(location.href);
    if (sharingMode === "replay" || sharingMode === "replay-only") {
      url.search = `?${REPLAY_KEY}=${replayCode}`;
    } else {
      url.search = "";
    }
    return url.href;
  }, [sharingMode, replayCode]);

  const text = (() => {
    if (sharingMode === "replay-only") {
      return hereUrl;
    } else {
      return `${gameOverMessage}\n${hereUrl}\n#${HASHTAG}`;
    }
  })();

  return (
    <div className="goaled">
      <select
        value={sharingMode}
        onChange={(e) => setSharingMode(e.target.value as SharingMode)}
      >
        <option value="replay">リプレイをURLに含める</option>
        <option value="no-replay">リプレイをURLに含めない</option>
        <option value="replay-only">URLのみ</option>
      </select>
      <textarea className="goaled-textarea" readOnly value={text} />
      <div className="goaled-buttons">
        <div>
          <a href={tweetUrl(text)} target="_blank">
            𝕏（タブが開きます）
          </a>{" "}
        </div>
        <button onClick={restartGame}>はじめから</button>
      </div>
    </div>
  );
};
