export const ConfirmReplay: React.FC<{
  yes: () => void;
  no: () => void;
}> = ({ yes, no }) => {
  return (
    <div className="turn-logs">
      <span className="log-system-neutral">
        [質問] 共有されたリプレイを再生しますか？
      </span>
      {"\n\n"}
      <button onClick={no}>いいえ（はじめから）</button>
      <button onClick={yes}>はい（リプレイ再生）</button>
    </div>
  );
};
