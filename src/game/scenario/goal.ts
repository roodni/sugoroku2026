import type { Player } from "../gameState";

export function goaledDialog(player: Player, rank: number): string {
  const isFirst = rank === 1;
  switch (player.personality) {
    case "gentle":
      return isFirst ? `やったね` : `がんばった`;
    case "violent":
      return isFirst ? `俺の勝ちだァ！` : `遅れを取ったぜ`;
    case "phobic":
      return isFirst ? `なんとかゴールできました` : `うう……外は怖いです`;
    case "smart":
      return isFirst ? `フッ、当然の結果さ` : `まだまだ、至らないね`;
  }
}
