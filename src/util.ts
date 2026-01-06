const random = Math.random; // ちょっとだけ対策してみる

// 1d(sides)
export function dice(sides: number): number {
  return Math.floor(random() * sides) + 1;
}

// 期待値
export function diceExpected(times: number, sides: number): number {
  return (times * (sides + 1)) / 2;
}

export class ExhaustiveError extends Error {
  constructor(value: never, message = `Unsupported type: ${value}`) {
    super(message);
  }
}

export class Observer<T> {
  private listeners: ((arg: T) => void)[] = [];

  subscribe(listener: (arg: T) => void): () => void {
    this.listeners.push(listener);
    // Unsubscribe
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  notify(arg: T): void {
    this.listeners.forEach((listener) => listener(arg));
  }
}
