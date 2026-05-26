import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react';
import type React from 'react';
import type { editor as MonacoEditorNS } from 'monaco-editor';
import { buildProcessor, process as processPipeline } from './core/pipeline/builder.js';
import { createEditorApi } from './core/editorApi.js';
import { createPluginManager } from './core/pluginManager.js';
import { createShortcutManager } from './core/shortcutManager.js';
import { BobEditorApiContext, BobEditorStateContext } from './core/state/contexts.js';
import { initialState, reducer } from './core/state/reducer.js';
import { Editor } from './components/Editor/index.js';
import { Preview } from './components/Preview/index.js';
import { ModeToggle } from './components/ModeToggle.js';
import type {
  BobEditorProps,
  BobEditorRef,
  BobEditorPlugin,
  BobmdTheme,
  EditorMode,
  KeyboardShortcut,
} from './types.js';
import { lightTheme } from './themes/light.js';
import { darkTheme } from './themes/dark.js';
import { isAutoDark } from './themes/auto.js';

function pickInitialMode(props: BobEditorProps): EditorMode {
  return props.mode ?? props.defaultMode ?? 'edit';
}

function pickInitialMarkdown(props: BobEditorProps): string {
  return props.value ?? props.defaultValue ?? '';
}

function mergeShortcuts(
  plugins: readonly BobEditorPlugin[],
  override?: KeyboardShortcut[],
): KeyboardShortcut[] {
  const fromPlugins = plugins.flatMap((plugin) => plugin.shortcuts ?? []);
  return [...fromPlugins, ...(override ?? [])];
}

function getMergedPluginSignature(plugins: readonly BobEditorPlugin[]): string {
  return plugins.map((plugin) => `${plugin.name}@${plugin.version ?? '0'}`).join('|');
}

function getResolvedTheme(theme: BobEditorProps['theme'], autoDark: boolean): BobmdTheme {
  if (!theme || theme === 'light') return lightTheme;
  if (theme === 'dark') return darkTheme;
  if (theme === 'auto') return autoDark ? darkTheme : lightTheme;
  return theme;
}

function toStyleObject(theme: BobmdTheme): React.CSSProperties {
  const style: React.CSSProperties = {};
  for (const [key, value] of Object.entries(theme)) {
    (style as Record<string, string>)[key] = value;
  }
  return style;
}

export const BobEditor = forwardRef<BobEditorRef, BobEditorProps>(function BobEditor(props, ref) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    markdown: pickInitialMarkdown(props),
    mode: pickInitialMode(props),
  });
  const stateRef = useRef(state);
  stateRef.current = state;

  const editorRef = useRef<MonacoEditorNS.IStandaloneCodeEditor | null>(null);
  const pluginManagerRef = useRef(createPluginManager());
  const shortcutManagerRef = useRef(createShortcutManager());
  const pluginCleanupsRef = useRef<(() => void)[]>([]);
  const activePluginsRef = useRef<readonly BobEditorPlugin[]>([]);
  const onMountCalledRef = useRef(false);

  const [autoDark, setAutoDark] = useState(() => isAutoDark());
  const [managerReady, setManagerReady] = useState(false);

  const api = useMemo(
    () => createEditorApi(dispatch, () => stateRef.current, editorRef),
    [dispatch],
  );

  const allowedModes = props.allowedModes ?? ['edit', 'preview'];

  useEffect(() => {
    if (props.theme !== 'auto' || typeof window === 'undefined' || !window.matchMedia) {
      return;
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setAutoDark(media.matches);
    setAutoDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [props.theme]);

  useEffect(() => {
    const plugins = props.plugins ?? [];
    const manager = pluginManagerRef.current;
    const registered = manager.register(plugins, api);
    activePluginsRef.current = registered;
    const cleanups = manager.invokeOnMount(registered, api);
    pluginCleanupsRef.current = cleanups;
    setManagerReady(true);

    return () => {
      manager.invokeCleanup(pluginCleanupsRef.current);
      pluginCleanupsRef.current = [];
      activePluginsRef.current = [];
      setManagerReady(false);
    };
  }, [props.plugins, api]);

  useEffect(() => {
    if (!managerReady || !props.onMount || onMountCalledRef.current) return;
    const timer = setTimeout(() => {
      if (onMountCalledRef.current) return;
      onMountCalledRef.current = true;
      props.onMount?.(api);
    }, 0);
    return () => clearTimeout(timer);
  }, [managerReady, props.onMount, api]);

  useEffect(() => {
    if (props.value !== undefined && props.value !== state.markdown) {
      dispatch({ type: 'content/setMarkdown', markdown: props.value, source: 'api' });
    }
  }, [props.value, state.markdown]);

  useEffect(() => {
    if (props.mode !== undefined && props.mode !== state.mode) {
      dispatch({ type: 'mode/set', mode: props.mode });
    }
  }, [props.mode, state.mode]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const manager = shortcutManagerRef.current;
    const shortcuts = mergeShortcuts(activePluginsRef.current, props.shortcuts?.override);
    if (shortcuts.length > 0) {
      manager.register(shortcuts, api);
    }
    for (const id of props.shortcuts?.disable ?? []) {
      manager.disable(id);
    }
    return () => {
      manager.destroy();
    };
  }, [props.shortcuts, api]);

  const setMarkdown = (markdown: string, source: 'user' | 'monaco' | 'api' | 'storage'): void => {
    dispatch({ type: 'content/setMarkdown', markdown, source });
    props.onChange?.(markdown);
    pluginManagerRef.current.invokeOnChange(activePluginsRef.current, markdown, api);
  };

  const setMode = (nextMode: EditorMode): void => {
    if (!allowedModes.includes(nextMode)) return;
    dispatch({ type: 'mode/set', mode: nextMode });
    props.onModeChange?.(nextMode);
  };

  const mergedRemarkPlugins = useMemo(() => {
    const list = [...(props.remarkPlugins ?? [])];
    for (const plugin of activePluginsRef.current) {
      if (plugin.remarkPlugins) {
        list.push(...plugin.remarkPlugins);
      }
    }
    return list;
  }, [props.remarkPlugins, props.plugins]);

  const mergedRehypePlugins = useMemo(() => {
    const list = [...(props.rehypePlugins ?? [])];
    for (const plugin of activePluginsRef.current) {
      if (plugin.rehypePlugins) {
        list.push(...plugin.rehypePlugins);
      }
    }
    return list;
  }, [props.rehypePlugins, props.plugins]);

  const mergedComponents = useMemo(() => {
    const merged: Record<string, React.ComponentType<unknown>> = {};
    for (const plugin of activePluginsRef.current) {
      if (plugin.components) {
        Object.assign(merged, plugin.components);
      }
    }
    Object.assign(merged, props.components ?? {});
    return merged;
  }, [props.components, props.plugins]);

  const resolvedTheme = getResolvedTheme(props.theme, autoDark);

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => stateRef.current.markdown,
      setValue: (value) => {
        setMarkdown(value, 'api');
      },
      focus: () => api.focus(),
      blur: () => api.blur(),
      getMode: () => stateRef.current.mode,
      setMode: (mode) => setMode(mode),
      insertText: (text, opts) => {
        if (opts?.position !== undefined) {
          api.insertText(text, opts.position);
          return;
        }
        api.insertText(text);
      },
      getSelection: () => api.getSelection(),
      exportAsHtml: async () => {
        const { renderToStaticMarkup } = await import('react-dom/server');
        const processor = buildProcessor({
          remarkPlugins: mergedRemarkPlugins,
          rehypePlugins: mergedRehypePlugins,
          components: mergedComponents,
          sanitizeSchema: pluginManagerRef.current.getActiveSchema(),
        });
        const generationRef = { current: 1 };
        const element = await processPipeline(
          stateRef.current.markdown,
          processor,
          1,
          generationRef,
        );
        return element ? renderToStaticMarkup(element) : '';
      },
      exportAsMarkdown: () => stateRef.current.markdown,
    }),
    [api, mergedComponents, mergedRehypePlugins, mergedRemarkPlugins],
  );

  return (
    <BobEditorStateContext.Provider value={state}>
      <BobEditorApiContext.Provider value={api}>
        <div className="bobmd-root" data-testid="bobmd-root" style={toStyleObject(resolvedTheme)}>
          <div className="bobmd-main">
            <ModeToggle mode={state.mode} allowedModes={allowedModes} onToggle={setMode} />
            {state.mode === 'edit' ? (
              <Editor
                markdown={state.markdown}
                editorRef={editorRef}
                onChange={(value, source) => setMarkdown(value, source)}
                onSelectionChange={(selection) =>
                  dispatch({
                    type: 'selection/set',
                    start: selection.start,
                    end: selection.end,
                    cursor: selection.cursor,
                  })
                }
                {...(props.placeholder !== undefined ? { placeholder: props.placeholder } : {})}
                {...(props.readOnly !== undefined ? { readOnly: props.readOnly } : {})}
                {...(props.editorOptions ? { editorOptions: props.editorOptions } : {})}
              />
            ) : (
              <Preview
                markdown={state.markdown}
                components={mergedComponents}
                pluginSignature={getMergedPluginSignature(activePluginsRef.current)}
                onError={(error) => {
                  dispatch({ type: 'pipeline/error', error });
                  props.onError?.(error);
                }}
                {...(props.previewDebounceMs !== undefined
                  ? { previewDebounceMs: props.previewDebounceMs }
                  : {})}
                {...(mergedRemarkPlugins.length > 0 ? { remarkPlugins: mergedRemarkPlugins } : {})}
                {...(mergedRehypePlugins.length > 0 ? { rehypePlugins: mergedRehypePlugins } : {})}
                sanitizeSchema={pluginManagerRef.current.getActiveSchema()}
              />
            )}
          </div>
        </div>
      </BobEditorApiContext.Provider>
    </BobEditorStateContext.Provider>
  );
});
