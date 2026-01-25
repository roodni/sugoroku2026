import { TROPHY_KEY, YOUR_NAME } from "./config";
import type { GameContext } from "./game";
import { Log } from "./log";

// ゲームロジックは独立しているのにトロフィーだけLocalStorageに依存しているのが良くないと思いましたか？

export type Trophy = {
  name: string;
  description: string;
};

const trophies = [
  // 1位
  { name: "聖人君子", description: `${YOUR_NAME}が温厚で1位になる` },
  { name: "世紀末", description: `${YOUR_NAME}が凶暴で1位になる` },
  { name: "戦々恐々", description: `${YOUR_NAME}が恐怖症で1位になる` },
  { name: "超スマート", description: `${YOUR_NAME}がスマートで1位になる` },
  // 性格
  { name: "情緒安定", description: `性格を変えずにゴールする` },
  {
    name: "因果応報",
    description: `返り討ちにされる`,
  },
  {
    name: "挟み撃ち",
    description: `人を避けようとして前マスの人に阻まれる`,
  },
  {
    name: "ぴったり賞",
    description: `スマートに急停止せずゴールする`,
  },
  // 雑多なもの
  { name: "腰が重い", description: `最初のターンに1マスだけ進む` },
  { name: "境地", description: `煩悩を克服する` },
  { name: "一撃粉砕", description: `100tハンマーで敵を倒す` },
  { name: "違法チェック", description: `立て看板を破壊する` },
  { name: "身も心も", description: `2回改造される` },
  // ボス
  { name: "池の主釣り", description: `巨大魚を倒す` },
  { name: "曲者退治", description: `忍者を倒す` },
  { name: "凶悪犯", description: `警察を倒す` },
  { name: "湖の女神", description: `女神を倒す` },
  { name: "最強神", description: `ゴッドゼウスを倒す` },
] as const satisfies Trophy[];

export type TrophyName = (typeof trophies)[number]["name"];

export const Trophy = {
  all: trophies,

  detail(name: TrophyName): Trophy {
    return trophies.find((t) => t.name === name)!;
  },

  load(): Trophy[] {
    const json = localStorage.getItem(TROPHY_KEY);
    if (json === null) {
      return [];
    }
    const raw = JSON.parse(json) as TrophyName[];
    return trophies.filter((t) => raw.includes(t.name));
  },

  earn(name: TrophyName): { firstTime: boolean } {
    const current = this.load().map((t) => t.name);
    if (current.includes(name)) {
      return { firstTime: false };
    }
    const updated = [...current, name];
    localStorage.setItem(TROPHY_KEY, JSON.stringify(updated));
    return { firstTime: true };
  },
};

export function* generateEarnTrophy(
  g: GameContext,
  trophyName: TrophyName
): Generator<Log> {
  if (g.state.trophies.map((t) => t.name).includes(trophyName)) {
    return; // 既に周回内で獲得していたらスルー
  }

  let firstTime = false; // リプレイではトロフィーを獲得できない
  if (!g.state.replayMode) {
    firstTime = Trophy.earn(trophyName).firstTime;
  }
  g.state.trophies.push({ name: trophyName, firstTime });

  let firstTimeText = "";
  if (firstTime) {
    firstTimeText = " (new)";
  } else if (g.state.replayMode) {
    firstTimeText = "（保存されません）";
  }
  yield Log.system(
    `[トロフィー獲得] ${trophyName}${firstTimeText}`,
    "neutral",
    (s) => s.replaceAll("[トロフィー獲得] ", "トロフィー獲得。")
  );
}
