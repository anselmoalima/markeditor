type Loader<T = unknown> = () => Promise<T>;

const cache = new Map<string, Promise<unknown>>();

export const LazyRegistry = {
  register<T>(name: string, loader: Loader<T>): void {
    if (!cache.has(name)) {
      cache.set(name, loader());
    }
  },

  get<T = unknown>(name: string): Promise<T> {
    const entry = cache.get(name);
    if (!entry) {
      throw new Error(`LazyRegistry: no loader registered for "${name}"`);
    }
    return entry as Promise<T>;
  },

  prime<T>(name: string, loader: Loader<T>): Promise<T> {
    if (!cache.has(name)) {
      cache.set(name, loader());
    }
    return cache.get(name) as Promise<T>;
  },

  isLoaded(name: string): boolean {
    return cache.has(name);
  },

  /** Only for testing — clears all cached entries. */
  _reset(): void {
    cache.clear();
  },
};
