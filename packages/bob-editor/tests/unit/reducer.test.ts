import { describe, it, expect } from 'vitest';
import { reducer, initialState } from '../../src/core/state/reducer.js';
import type { Action } from '../../src/core/state/types.js';

describe('reducer', () => {
  it('content/setMarkdown updates state.markdown', () => {
    const action: Action = { type: 'content/setMarkdown', markdown: 'hello', source: 'user' };
    const next = reducer(initialState, action);
    expect(next.markdown).toBe('hello');
  });

  it('content/setMarkdown does not mutate input state', () => {
    const state = { ...initialState, markdown: 'original' };
    const next = reducer(state, {
      type: 'content/setMarkdown',
      markdown: 'changed',
      source: 'user',
    });
    expect(state.markdown).toBe('original');
    expect(next.markdown).toBe('changed');
  });

  it('mode/set with "preview" updates state.mode', () => {
    const action: Action = { type: 'mode/set', mode: 'preview' };
    const next = reducer(initialState, action);
    expect(next.mode).toBe('preview');
  });

  it('mode/set with "edit" updates state.mode', () => {
    const state = { ...initialState, mode: 'preview' as const };
    const next = reducer(state, { type: 'mode/set', mode: 'edit' });
    expect(next.mode).toBe('edit');
  });

  it('selection/set updates selection and cursor', () => {
    const action: Action = { type: 'selection/set', start: 5, end: 10, cursor: 10 };
    const next = reducer(initialState, action);
    expect(next.selection).toEqual({ start: 5, end: 10 });
    expect(next.cursor).toBe(10);
  });

  it('storage/saving sets storageStatus to "saving"', () => {
    const next = reducer(initialState, { type: 'storage/saving' });
    expect(next.storageStatus).toBe('saving');
  });

  it('storage/saved sets storageStatus to "saved" and savedAt', () => {
    const at = 1716667200000;
    const next = reducer(initialState, { type: 'storage/saved', at });
    expect(next.storageStatus).toBe('saved');
    expect(next.savedAt).toBe(at);
  });

  it('storage/error sets storageStatus to "error"', () => {
    const next = reducer(initialState, { type: 'storage/error', error: new Error('quota') });
    expect(next.storageStatus).toBe('error');
  });

  it('storage/error sets storageDisabled to true', () => {
    const next = reducer(initialState, { type: 'storage/error', error: new Error('quota') });
    expect(next.storageDisabled).toBe(true);
  });

  it('storageDisabled persists across subsequent actions', () => {
    const afterError = reducer(initialState, { type: 'storage/error', error: new Error('q') });
    const afterNext = reducer(afterError, {
      type: 'content/setMarkdown',
      markdown: 'x',
      source: 'user',
    });
    expect(afterNext.storageDisabled).toBe(true);
  });

  it('pipeline/pending sets pipeline.status to "pending"', () => {
    const next = reducer(initialState, { type: 'pipeline/pending' });
    expect(next.pipeline.status).toBe('pending');
  });

  it('pipeline/ready sets pipeline.status to "ready"', () => {
    const next = reducer(initialState, { type: 'pipeline/ready' });
    expect(next.pipeline.status).toBe('ready');
  });

  it('pipeline/error sets pipeline.status to "error" and pipeline.error', () => {
    const err = new Error('parse fail');
    const next = reducer(initialState, { type: 'pipeline/error', error: err });
    expect(next.pipeline.status).toBe('error');
    expect(next.pipeline.error).toBe(err);
  });

  it('is a pure function — same args produce structurally equal result', () => {
    const action: Action = { type: 'content/setMarkdown', markdown: 'test', source: 'user' };
    const a = reducer(initialState, action);
    const b = reducer(initialState, action);
    expect(a).toEqual(b);
  });

  it('unknown action returns state unchanged', () => {
    const action = { type: '__unknown__' } as unknown as Action;
    const next = reducer(initialState, action);
    expect(next).toBe(initialState);
  });
});
