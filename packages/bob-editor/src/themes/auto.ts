import type { BobmdTheme } from '../types.js';
import { lightTheme } from './light.js';
import { darkTheme } from './dark.js';

export function resolveAutoTheme(): BobmdTheme {
  if (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  ) {
    return darkTheme;
  }
  return lightTheme;
}

export const autoTheme: BobmdTheme = resolveAutoTheme();

export function isAutoDark(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}
