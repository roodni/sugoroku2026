import { Log } from "../../log";
import type { Space } from "./space";

export const destinyTipsSpace: Space = {
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("怪しい演説が聞こえる。");
    yield Log.dialog("貴方は運命を信じますか？");
    yield Log.dialog("この世界にサイコロ以外のランダム性は存在しません。");
    yield Log.dialog(
      "貴方が何気なく発するセリフもまた、運命に決定されているのです。"
    );
    yield Log.description(`${player.name}は通り過ぎた。`);
  },
};
