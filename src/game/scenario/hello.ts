import { GOAL_POSITION } from "../config";
import type { GameState } from "../gameState";
import { Log } from "../log";

// ターン開始時の独り言
export function* generateHello(g: GameState): Generator<Log> {
  const player = g.players[g.currentPlayerIndex];
  const index = g.currentPlayerIndex + player.position;
  const desiredDice = Math.min(6, GOAL_POSITION - player.position);
  const dialogs = (() => {
    switch (player.personality) {
      case "gentle":
        return [
          "よろしくお願いします",
          player.position < GOAL_POSITION / 2
            ? "ゴールまで遠いなあ"
            : "ゴールが近づいてきた",
          `${desiredDice}の目を出したい`,
          "さあ行こう",
          "平和が一番だね",
          "みんな元気かな",
          "確実に進んでいきたい",
        ];
      case "violent":
        return [
          "ククク……俺のターンだな……",
          "ブッ飛ばしてやるぜ！",
          "オラオラ道を開けろ！",
          "誰でもいいから殴りてえ",
          "誰も俺を止められねえ！",
          "ヒャッハー！",
          "俺は全てを破壊する",
        ];
      case "phobic":
        return [
          "あ、あの……頑張ります",
          "うう、進まないと",
          "なんで私がこんなことを……",
          "帰りたい",
          "サイコロも消毒しなきゃ",
          "誰にも会いませんように……！",
          "早く行きましょう……",
        ];
      case "smart":
        return [
          "フッ、今日も知略を巡らせよう",
          "まだまだ学ぶことばかりだよ",
          "無駄な動きはしない",
          "6の目が出る確率……66.6%",
          "データに基づいて最適に行動するのさ",
          "すごろくは頭脳戦さ",
          `僕の計算によれば、あと${Math.ceil(
            (GOAL_POSITION - player.position) / 6
          )}ターンだね`,
        ];
    }
  })();

  yield Log.dialog(dialogs[index % dialogs.length]);
}
