export const ConfirmReplay: React.FC<{
  yes: () => void;
  no: () => void;
}> = ({ yes, no }) => {
  return (
    <div className="confirm-replay">
      <div className="log-system-neutral">共有されたリプレイを見ますか？</div>
      <div className="confirm-replay-buttons">
        <button onClick={yes}>はい（リプレイを見る）</button>
        <button onClick={no}>いいえ（タイトルへ）</button>
      </div>
    </div>
  );
};
