import { TROPHY_KEY, YOUR_NAME } from "./config";
import { Personality } from "./gameState";

// ゲームロジックは独立しているのにトロフィーだけLocalStorageに依存しているのが良くないと思いましたか？

export type Trophy = {
  name: string;
  description: string;
};

const gentle = Personality.toLabel("gentle");
const violent = Personality.toLabel("violent");
const phobic = Personality.toLabel("phobic");
const smart = Personality.toLabel("smart");
const trophies = [
  // 1位
  { name: "聖人君子", description: `${YOUR_NAME}が${gentle}で1位になる` },
  { name: "世紀末", description: `${YOUR_NAME}が${violent}で1位になる` },
  { name: "戦々恐々", description: `${YOUR_NAME}が${phobic}で1位になる` },
  { name: "超スマート", description: `${YOUR_NAME}が${smart}で1位になる` },
  // 性格
  {
    name: "挟み撃ち",
    description: `人を避けようとして前マスの人に阻まれる`,
  },
  // イベント
  { name: "腰が重い", description: `最初のターンに1マスだけ進む` },
  { name: "境地", description: `煩悩を克服する` },
  { name: "身も心も", description: `2回改造される` },
  // ボス
  { name: "池の主釣り", description: `巨大魚が倒される` },
  { name: "曲者退治", description: `忍者が倒される` },
  { name: "凶悪犯", description: `警察が倒される` },
  { name: "湖の女神", description: `女神が倒される` },
  { name: "最強神", description: `ゴッドゼウスが倒される` },
] as const satisfies Trophy[];

export type TrophyName = (typeof trophies)[number]["name"];

export const Trophy = {
  max: trophies.length,

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
