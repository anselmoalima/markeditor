import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useControllableState } from '../../src/hooks/useControllableState.js';

describe('useControllableState', () => {
  describe('controlled mode (value prop defined)', () => {
    it('returns the value prop', () => {
      const { result } = renderHook(() => useControllableState({ value: 'controlled-value' }));
      expect(result.current[0]).toBe('controlled-value');
    });

    it('always returns the latest value prop on re-render', () => {
      const { result, rerender } = renderHook(
        ({ value }: { value: string }) => useControllableState({ value }),
        { initialProps: { value: 'first' } },
      );
      expect(result.current[0]).toBe('first');
      rerender({ value: 'second' });
      expect(result.current[0]).toBe('second');
    });

    it('returns value prop even after setter is called (value prop wins)', () => {
      const { result } = renderHook(() => useControllableState({ value: 'controlled' }));
      act(() => {
        result.current[1]('attempt-to-change');
      });
      expect(result.current[0]).toBe('controlled');
    });

    it('calls onChange when setter is called', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControllableState({ value: 'v', onChange }));
      act(() => {
        result.current[1]('new-value');
      });
      expect(onChange).toHaveBeenCalledWith('new-value');
      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('uncontrolled mode (no value prop)', () => {
    it('returns defaultValue initially', () => {
      const { result } = renderHook(() => useControllableState({ defaultValue: 'initial' }));
      expect(result.current[0]).toBe('initial');
    });

    it('returns empty string when no defaultValue provided', () => {
      const { result } = renderHook(() => useControllableState<string>({}));
      expect(result.current[0]).toBe('');
    });

    it('updates internal state when setter is called', () => {
      const { result } = renderHook(() => useControllableState({ defaultValue: 'initial' }));
      act(() => {
        result.current[1]('updated');
      });
      expect(result.current[0]).toBe('updated');
    });

    it('calls onChange when setter is called', () => {
      const onChange = vi.fn();
      const { result } = renderHook(() => useControllableState({ defaultValue: 'v', onChange }));
      act(() => {
        result.current[1]('new-value');
      });
      expect(onChange).toHaveBeenCalledWith('new-value');
    });
  });
});
