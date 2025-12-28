// (times)d(sides)
export function dice(times: number, sides: number): number {
  // return 100;
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
