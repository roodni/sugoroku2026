import { TROPHY_KEY } from "./config";
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
  { name: "聖人君子", description: `${gentle}で1位になる` },
  { name: "世紀末", description: `${violent}で1位になる` },
  { name: "戦々恐々", description: `${phobic}で1位になる` },
  { name: "超スマート", description: `${smart}で1位になる` },
  { name: "池の主釣り", description: `巨大魚が倒される` },
  { name: "腰が重い", description: `最初に1マスだけ進む` },
  {
    name: "挟み撃ち",
    description: `${phobic}の人が、来た人を避けようとして前マスの人に阻まれる`,
  },
] as const satisfies Trophy[];

export type TrophyName = (typeof trophies)[number]["name"];

export const Trophy = {
  max: trophies.length,

  detail(name: TrophyName): Trophy {
    return trophies.find((t) => t.name === name)!;
  },

  load(): Trophy[] {
    const json = localStorage.getItem(TROPHY_KEY);
    if (!json) {
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
