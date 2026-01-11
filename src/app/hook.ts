import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STORAGE_PREFIX } from "./appConfig";

// react-use を使った方がいい

export function useLatest<T>(value: T): React.RefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export class LocalStorageKey {
  private key: string;
  constructor(name: string) {
    this.key = `${STORAGE_PREFIX}${name}`;
  }
  toString() {
    return this.key;
  }
}

function useLocalStorage<T>(
  key: LocalStorageKey,
  initialValue: T,
  options: {
    serialize: (value: T) => string;
    deserialize: (value: string) => T;
  }
): [T, (value: T) => void] {
  const [raw, setRaw] = useState(() => {
    return (
      localStorage.getItem(key.toString()) ?? options.serialize(initialValue)
    );
  });
  const value = useMemo(() => options.deserialize(raw), [options, raw]);
  const setValue = useCallback(
    (newValue: T) => {
      const s = options.serialize(newValue);
      setRaw(s);
      localStorage.setItem(key.toString(), s);
    },
    [key, options]
  );
  return [value, setValue];
}

export function useLocalStorageString(
  key: LocalStorageKey,
  initialValue: string
) {
  return useLocalStorage<string>(key, initialValue, {
    serialize: (value) => value,
    deserialize: (value) => value,
  });
}

export function useLocalStorageBoolean(
  key: LocalStorageKey,
  initialValue: boolean
) {
  return useLocalStorage<boolean>(key, initialValue, {
    serialize: (value) => (value ? "Y" : "N"),
    deserialize: (value) => value === "Y",
  });
}

export function useLocalStorageFloat(
  key: LocalStorageKey,
  initialValue: number
) {
  return useLocalStorage<number>(key, initialValue, {
    serialize: (value) => value.toString(),
    deserialize: (value) => parseFloat(value),
  });
}
