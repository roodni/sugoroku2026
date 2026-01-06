const HASHTAG = "新春ログすごろく";
const INTENT_BASE = "https://twitter.com/intent/tweet";
const HERE_URL = location.href;

function tweetUrl(text: string) {
  const params = new URLSearchParams();
  params.set("text", text);
  return `${INTENT_BASE}?${params.toString()}`;
}

export const Goaled: React.FC<{
  gameOverMessage: string;
  restartGame: () => void;
}> = ({ gameOverMessage, restartGame }) => {
  const text = `${gameOverMessage}\n${HERE_URL} #${HASHTAG}`;
  return (
    <div className="goaled">
      <textarea className="goaled-textarea" readOnly value={text} />
      <div className="goaled-buttons">
        <div>
          <a href={tweetUrl(text)} target="_blank">
            𝕏 (タブが開きます)
          </a>
        </div>
        <button onClick={restartGame}>はじめから</button>
      </div>
    </div>
  );
};
