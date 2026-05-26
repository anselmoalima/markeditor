import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePreview } from '../../src/hooks/usePreview.js';
import * as pipelineBuilder from '../../src/core/pipeline/builder.js';

describe('usePreview', () => {
  it('updates preview only after debounce', async () => {
    vi.useFakeTimers();

    const { result } = renderHook(() =>
      usePreview({
        markdown: '# Hello',
        previewDebounceMs: 150,
      }),
    );

    expect(result.current.status).toBe('pending');
    expect(result.current.element).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(149);
    });
    expect(result.current.element).toBeNull();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.element).not.toBeNull();
    vi.useRealTimers();
  });

  it('discards stale generation result', async () => {
    vi.useFakeTimers();

    const stale = new Promise<null>((resolve) => setTimeout(() => resolve(null), 10));
    const fresh = Promise.resolve(<div>fresh</div>);

    const processSpy = vi.spyOn(pipelineBuilder, 'process');
    processSpy.mockReturnValueOnce(stale);
    processSpy.mockReturnValueOnce(fresh);

    const { result, rerender } = renderHook(
      ({ markdown }: { markdown: string }) =>
        usePreview({
          markdown,
          previewDebounceMs: 10,
        }),
      { initialProps: { markdown: '# first' } },
    );

    await act(async () => {
      vi.advanceTimersByTime(10);
    });

    rerender({ markdown: '# second' });

    await act(async () => {
      vi.advanceTimersByTime(10);
      await Promise.resolve();
    });

    expect(result.current.status).toBe('ready');
    expect(result.current.element).not.toBeNull();

    processSpy.mockRestore();
    vi.useRealTimers();
  });
});
