import { Config } from "../config";
import type { GameState } from "../gameState";
import { Log } from "../log";

// ターン開始時の独り言
export function* generateHello(g: GameState): Generator<Log> {
  const player = g.players[g.currentPlayerIndex];
  const index = g.currentPlayerIndex + player.position;

  const quotes = (() => {
    switch (player.personality) {
      case "gentle":
        return [
          "がんばるぞ",
          player.position < Config.goalPosition / 2
            ? "ゴールまで遠いなあ"
            : "ゴールが近づいてきた",
          "6の目を出したい",
          "今日はどうしようかな",
          "みんな元気かな",
          "平和が一番だね",
        ];
      case "violent":
        return [
          "ブッ飛ばしてやるぜ！",
          "誰も俺を止められねえ！",
          "誰でもいいから殴りてえ",
          "ククク……俺のターンだな……",
          "終わらせてやるぜ、このゲームをよォ！",
          "ヒャッハー！",
        ];
      case "phobic":
        return [
          "あ、あの……頑張ります",
          "うう、進まないと",
          "なんで私がこんなことを……",
          "帰りたい",
          "サイコロも消毒しなきゃ",
          "誰にも会いませんように……！",
        ];
      case "smart":
        return [
          "フッ、今日も知略を巡らせよう",
          "無駄な動きはしない",
          "6の目が出る確率……66.6%",
          "スマートにゴールしてみせるさ",
          "データに基づいて最適に行動するのさ",
          `僕の計算によれば、あと${Math.ceil(
            (Config.goalPosition - player.position) / 6
          )}ターンだね`,
        ];
    }
  })();

  yield Log.dialog(quotes[index % quotes.length]);
}
