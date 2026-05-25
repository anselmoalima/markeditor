export type DebouncedFn<T extends (...args: unknown[]) => void> = T & {
  cancel(): void;
};

export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  ms: number,
): DebouncedFn<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>): void => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
    }, ms);
  };

  debounced.cancel = (): void => {
    clearTimeout(timer);
  };

  return debounced as DebouncedFn<T>;
}
