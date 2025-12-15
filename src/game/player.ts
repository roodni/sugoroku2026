export type Personality = "gentle" | "violent" | "phobic" | "smart";

export type PlayerState = {
  turn: number;
  pos: number;
  goaled: boolean;
  personality: Personality;
};

export const initialPlayerState = (): PlayerState => ({
  turn: 0,
  pos: 0,
  goaled: false,
  personality: "gentle",
});

// 駒
export class Player {
  name: string;
  operable: boolean;
  state: PlayerState;

  constructor(name: string, options: { operable: boolean }) {
    this.name = name;
    this.operable = options.operable;
    this.state = initialPlayerState();
  }
}
