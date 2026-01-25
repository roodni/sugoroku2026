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

abstract class _Struct {
  constructor(properties: unknown) {
    Object.assign(this, properties);
  }
}
export const Struct = _Struct as abstract new <
  P extends Record<string, unknown>,
>(
  properties: P
) => P;
