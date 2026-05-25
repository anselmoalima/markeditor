import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';

afterEach(cleanup);
import userEvent from '@testing-library/user-event';
import React, { useReducer, useRef, useMemo } from 'react';
import { BobEditorStateContext, BobEditorApiContext } from '../../src/core/state/contexts.js';
import { useEditorState, useEditorApi } from '../../src/core/state/useEditorContext.js';
import { reducer, initialState } from '../../src/core/state/reducer.js';
import { createEditorApi } from '../../src/core/editorApi.js';
import type { EditorAPI } from '../../src/types.js';
import type { Action } from '../../src/core/state/types.js';

// Minimal test provider wiring both contexts
function TestProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const editorRef = useRef<null>(null);
  const api = useMemo<EditorAPI>(
    () => createEditorApi(dispatch, () => stateRef.current, editorRef),
    // dispatch is stable from useReducer; intentionally created once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <BobEditorStateContext.Provider value={state}>
      <BobEditorApiContext.Provider value={api}>{children}</BobEditorApiContext.Provider>
    </BobEditorStateContext.Provider>
  );
}

function StateDisplay() {
  const state = useEditorState();
  return <div data-testid="markdown">{state.markdown}</div>;
}

function ModeDisplay() {
  const state = useEditorState();
  return <div data-testid="mode">{state.mode}</div>;
}

function SetValueButton() {
  const api = useEditorApi();
  return (
    <button data-testid="set-value" onClick={() => api.setValue('updated content')}>
      set
    </button>
  );
}

describe('contexts integration', () => {
  it('consumer reads correct initial state from provider', () => {
    render(
      <TestProvider>
        <StateDisplay />
        <ModeDisplay />
      </TestProvider>,
    );
    expect(screen.getByTestId('markdown').textContent).toBe('');
    expect(screen.getByTestId('mode').textContent).toBe('edit');
  });

  it('state updates propagate to state context consumers', async () => {
    const user = userEvent.setup();
    render(
      <TestProvider>
        <StateDisplay />
        <SetValueButton />
      </TestProvider>,
    );
    expect(screen.getByTestId('markdown').textContent).toBe('');
    await user.click(screen.getByTestId('set-value'));
    expect(screen.getByTestId('markdown').textContent).toBe('updated content');
  });

  it('BobEditorApiContext consumers do not re-render when markdown changes (with React.memo)', async () => {
    const user = userEvent.setup();
    const renderCount = { current: 0 };

    // React.memo + stable context value = no re-render on state change
    const ApiRenderCounter = React.memo(function ApiRenderCounter() {
      useEditorApi();
      renderCount.current++;
      return null;
    });

    function DispatchButton() {
      const api = useEditorApi();
      return (
        <button
          data-testid="dispatch"
          onClick={() => api.setValue('trigger re-render of state ctx')}
        >
          go
        </button>
      );
    }

    function Parent() {
      const [state, dispatch] = useReducer(reducer, initialState);
      const stateRef = useRef(state);
      stateRef.current = state;
      const editorRef = useRef<null>(null);
      const api = useMemo<EditorAPI>(
        () => createEditorApi(dispatch as (a: Action) => void, () => stateRef.current, editorRef),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
      );

      return (
        <BobEditorStateContext.Provider value={state}>
          <BobEditorApiContext.Provider value={api}>
            <StateDisplay />
            <DispatchButton />
            <ApiRenderCounter />
          </BobEditorApiContext.Provider>
        </BobEditorStateContext.Provider>
      );
    }

    render(<Parent />);
    const rendersAfterMount = renderCount.current;

    await user.click(screen.getByTestId('dispatch'));

    // StateDisplay re-rendered (state context changed)
    expect(screen.getByTestId('markdown').textContent).toBe('trigger re-render of state ctx');
    // ApiRenderCounter did NOT re-render — React.memo bails out because
    // the api context value reference is stable (same useMemo object)
    expect(renderCount.current).toBe(rendersAfterMount);
  });
});
