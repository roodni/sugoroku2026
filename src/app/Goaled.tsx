import type { GameState } from "../game/gameState";

const HASHTAG = "sugoroku2026";
const INTENT_BASE = "https://twitter.com/intent/tweet";
const HERE_URL = location.href;

function tweetUrl(text: string, url: string, hashtags: string[]) {
  const params = new URLSearchParams();
  params.set("text", text);
  params.set("hashtags", hashtags.join(","));
  params.set("url", url);
  return `${INTENT_BASE}?${params.toString()}`;
}

export const Goaled: React.FC<{
  getGameState: () => GameState;
}> = ({ getGameState }) => {
  const gameState = getGameState();
  const text = gameState.gameOverMessage + "\n";

  if (text === null) {
    return undefined;
  }

  const url = HERE_URL;
  const allText = `${text}${HERE_URL} #${HASHTAG}`;

  return (
    <div className="goaled">
      <textarea className="goaled-textarea" readOnly>
        {allText}
      </textarea>
      <a href={tweetUrl(text, url, [HASHTAG])} target="_blank">
        ツイートする
      </a>
      <button>ログを見る</button>
      <button>はじめから</button>
    </div>
  );
};
