import { describe, it, expect } from 'vitest';
import { hash } from '../../src/utils/hash.js';

describe('hash (FNV-1a)', () => {
  it('returns a stable 32-bit number across invocations', () => {
    expect(hash('hello')).toBe(hash('hello'));
  });

  it('returns different values for different inputs', () => {
    expect(hash('hello')).not.toBe(hash('world'));
  });

  it('returns a non-negative integer', () => {
    const result = hash('test');
    expect(typeof result).toBe('number');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(Number.isInteger(result)).toBe(true);
  });

  it('handles empty string', () => {
    const result = hash('');
    expect(typeof result).toBe('number');
    expect(hash('')).toBe(hash(''));
  });

  it('returns different values for similar strings', () => {
    expect(hash('abc')).not.toBe(hash('abd'));
    expect(hash('abc')).not.toBe(hash('Abc'));
  });

  it('returns a 32-bit unsigned integer (fits in 2^32)', () => {
    const result = hash('arbitrary long string with various characters!@#$%^&*()');
    expect(result).toBeGreaterThanOrEqual(0);
    expect(result).toBeLessThanOrEqual(0xffffffff);
  });
});
