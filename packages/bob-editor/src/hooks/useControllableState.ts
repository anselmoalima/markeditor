import { useState, useCallback } from 'react';

interface Options<T> {
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
}

export function useControllableState<T>(opts: Options<T>): [T, (value: T) => void] {
  const { value, defaultValue, onChange } = opts;
  const controlled = value !== undefined;

  const [internalValue, setInternal] = useState<T>(() =>
    controlled ? (value as T) : (defaultValue ?? ('' as unknown as T)),
  );

  const setValue = useCallback(
    (next: T) => {
      if (!controlled) {
        setInternal(next);
      }
      onChange?.(next);
    },
    // onChange identity is the caller's responsibility; controlled is stable per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [controlled, onChange],
  );

  return [controlled ? (value as T) : internalValue, setValue];
}
