// (times)d(sides)
export function dice(times: number, sides: number): number {
  let total = 0;
  for (let i = 0; i < times; i++) {
    total += Math.floor(Math.random() * sides) + 1;
  }
  return total;
}

export class ExhaustiveError extends Error {
  constructor(value: never, message = `Unsupported type: ${value}`) {
    super(message);
  }
}
