import { useMemo, useState } from "react";
import { REPLAY_KEY } from "./appConfig";

const HASHTAG = "新春ログすごろく";
const INTENT_BASE = "https://twitter.com/intent/tweet";

function tweetUrl(text: string) {
  const params = new URLSearchParams();
  params.set("text", text);
  return `${INTENT_BASE}?${params.toString()}`;
}

export const Goaled: React.FC<{
  gameOverMessage: string;
  replayCode: string;
  restartGame: () => void;
}> = ({ gameOverMessage, replayCode, restartGame }) => {
  const [sharingReplay, setSharingReplay] = useState(true);

  const hereUrl = useMemo(() => {
    const url = new URL(location.href);
    if (sharingReplay) {
      url.search = `?${REPLAY_KEY}=${replayCode}`;
    }
    return url.href;
  }, [sharingReplay, replayCode]);
  const text = `${gameOverMessage}\n${hereUrl} #${HASHTAG}`;

  return (
    <div className="goaled">
      <label>
        <input
          type="checkbox"
          checked={sharingReplay}
          onChange={(e) => setSharingReplay(e.target.checked)}
        />
        URLにリプレイを含める
      </label>
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
