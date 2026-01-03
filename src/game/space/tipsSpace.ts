import { Log } from "../log";
import type { Space } from "./space";

export const destinyTipsSpace: Space = {
  name: "演説",
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("怪しい演説が聞こえる。");
    yield Log.dialog("貴方は運命を信じますか？");
    yield Log.dialog("この世界にサイコロ以外のランダム性は存在しません。");
    yield Log.dialog(
      "貴方が何気なく発するセリフもまた、運命に決定されているのです。"
    );
    yield Log.description(`${player.name}は素通りした。`);
  },
};

export const personalityTipsSpace: Space = {
  name: "性格診断",
  *generate(g) {
    const player = g.players[g.currentPlayerIndex];
    yield Log.description("あなたは性格診断の本を立ち読みした。");
    yield Log.dialog("人々の性格は4種類に分類されます");
    switch (player.personality) {
      case "gentle":
        yield Log.dialog("へー");
        yield Log.description("すぐ忘れた。");
        break;
      case "violent":
        yield Log.dialog("あっそ");
        yield Log.description("読み飛ばした。");
        break;
      case "phobic":
        yield Log.dialog("あ……手袋忘れてた");
        yield Log.description("入念に手を洗った。");
        break;
      case "smart":
        yield Log.dialog("本は知識の宝庫だね");
        yield Log.description("すぐ忘れた。");
        break;
    }
  },
};
