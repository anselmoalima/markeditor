import { describe, it, expect, vi } from 'vitest';
import type { RefObject } from 'react';
import { createEditorApi, createRecursionGuard } from '../../src/core/editorApi.js';
import { initialState } from '../../src/core/state/reducer.js';
import type { Action, BobEditorState } from '../../src/core/state/types.js';

type DispatchFn = (action: Action) => void;

function makeApi(overrideState?: Partial<BobEditorState>, dispatchSpy?: DispatchFn) {
  const state = { ...initialState, ...overrideState };
  const dispatch: DispatchFn = dispatchSpy ?? vi.fn();
  const editorRef: RefObject<null> = { current: null };
  const api = createEditorApi(dispatch, () => state, editorRef);
  return { api, dispatch };
}

describe('createEditorApi', () => {
  it('getValue returns current markdown', () => {
    const { api } = makeApi({ markdown: 'hello world' });
    expect(api.getValue()).toBe('hello world');
  });

  it('setValue dispatches content/setMarkdown with source "api"', () => {
    const dispatch = vi.fn<DispatchFn>();
    const { api } = makeApi({}, dispatch);
    api.setValue('new content');
    expect(dispatch).toHaveBeenCalledWith({
      type: 'content/setMarkdown',
      markdown: 'new content',
      source: 'api',
    });
  });

  it('getMode returns current mode', () => {
    const { api } = makeApi({ mode: 'preview' });
    expect(api.getMode()).toBe('preview');
  });

  it('setMode dispatches mode/set', () => {
    const dispatch = vi.fn<DispatchFn>();
    const { api } = makeApi({}, dispatch);
    api.setMode('preview');
    expect(dispatch).toHaveBeenCalledWith({ type: 'mode/set', mode: 'preview' });
  });

  it('getCursorPosition returns current cursor', () => {
    const { api } = makeApi({ cursor: 42 });
    expect(api.getCursorPosition()).toBe(42);
  });

  it('getSelection returns selection bounds and text slice', () => {
    const { api } = makeApi({
      markdown: 'hello world',
      selection: { start: 0, end: 5 },
    });
    const sel = api.getSelection();
    expect(sel.start).toBe(0);
    expect(sel.end).toBe(5);
    expect(sel.text).toBe('hello');
  });

  describe('insertText — Monaco absent (string-splice path)', () => {
    it('inserts at provided position', () => {
      const dispatch = vi.fn<DispatchFn>();
      makeApi({ markdown: 'hello world', cursor: 5 }, dispatch).api.insertText('_new_', 5);
      expect(dispatch).toHaveBeenCalledWith({
        type: 'content/setMarkdown',
        markdown: 'hello_new_ world',
        source: 'api',
      });
    });

    it('inserts at cursor when position not provided (atCursor behavior)', () => {
      const dispatch = vi.fn<DispatchFn>();
      makeApi({ markdown: 'hello world', cursor: 5 }, dispatch).api.insertText('!');
      expect(dispatch).toHaveBeenCalledWith({
        type: 'content/setMarkdown',
        markdown: 'hello! world',
        source: 'api',
      });
    });
  });

  describe('replaceSelection — Monaco absent', () => {
    it('replaces selection range with text', () => {
      const dispatch = vi.fn<DispatchFn>();
      makeApi(
        { markdown: 'hello world', selection: { start: 6, end: 11 } },
        dispatch,
      ).api.replaceSelection('earth');
      expect(dispatch).toHaveBeenCalledWith({
        type: 'content/setMarkdown',
        markdown: 'hello earth',
        source: 'api',
      });
    });
  });

  describe('wrapSelection — Monaco absent', () => {
    it('wraps selection with before/after tokens', () => {
      const dispatch = vi.fn<DispatchFn>();
      makeApi(
        { markdown: 'hello world', selection: { start: 0, end: 5 } },
        dispatch,
      ).api.wrapSelection('**', '**');
      expect(dispatch).toHaveBeenCalledWith({
        type: 'content/setMarkdown',
        markdown: '**hello** world',
        source: 'api',
      });
    });
  });

  describe('recursion guard', () => {
    it('emits console.warn and skips dispatch when depth > 2', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const guard = createRecursionGuard();
      const dispatch = vi.fn<DispatchFn>();
      const state = { ...initialState };
      const editorRef: RefObject<null> = { current: null };
      const api = createEditorApi(dispatch, () => state, editorRef, guard);

      guard.enter(); // depth 1
      guard.enter(); // depth 2
      guard.enter(); // depth 3 — exceeds 2

      api.setValue('test');

      expect(warn).toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalled();

      warn.mockRestore();
      guard.exit();
      guard.exit();
      guard.exit();
    });

    it('does not warn and dispatches normally at depth <= 2', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const guard = createRecursionGuard();
      const dispatch = vi.fn<DispatchFn>();
      const state = { ...initialState };
      const editorRef: RefObject<null> = { current: null };
      const api = createEditorApi(dispatch, () => state, editorRef, guard);

      guard.enter(); // depth 1
      api.setValue('test');

      expect(warn).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalled();

      warn.mockRestore();
      guard.exit();
    });
  });
});

describe('createRecursionGuard', () => {
  it('starts at depth 0', () => {
    const g = createRecursionGuard();
    expect(g.depth()).toBe(0);
  });

  it('increments on enter', () => {
    const g = createRecursionGuard();
    g.enter();
    expect(g.depth()).toBe(1);
  });

  it('decrements on exit', () => {
    const g = createRecursionGuard();
    g.enter();
    g.exit();
    expect(g.depth()).toBe(0);
  });
});
