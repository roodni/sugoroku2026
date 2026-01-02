import type { Player } from "../gameState";

export function goaledDialog(player: Player, rank: number): string {
  const dialogs = (() => {
    if (rank === 1) {
      switch (player.personality) {
        case "gentle":
          return ["やったね", "嬉しい", "運が良かった"];
        case "violent":
          return ["俺の勝ちだァ！", "フハハハ！", "俺は全てを終わらせる"];
        case "phobic":
          return ["私が……1位？", "誰もいませんね", "勝てるものですね"];
        case "smart":
          return ["フッ、当然の結果さ", "実力を示したまで", "スマートな勝利！"];
      }
    } else {
      switch (player.personality) {
        case "gentle":
          return ["がんばった", "ぼちぼちだね", "先客がいたか"];
        case "violent":
          return [
            "遅れを取ったぜ",
            "もっと力が必要だ……",
            "ククク……覚えていろよ",
          ];
        case "phobic":
          return ["外は怖いです", "やっと帰れます", "助かった……！"];
        case "smart":
          return [
            "まだまだ、至らないね",
            "PDCAサイクルを回すのさ",
            "僕を越える者がいるとは",
          ];
      }
    }
  })();
  return dialogs[player.turn % dialogs.length];
}
