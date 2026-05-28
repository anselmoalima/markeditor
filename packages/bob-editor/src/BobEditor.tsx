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
import { Toolbar } from './components/Toolbar/index.js';
import { StatusBar } from './components/StatusBar.js';
import { InsertLink } from './components/Dialogs/InsertLink.js';
import { InsertImage } from './components/Dialogs/InsertImage.js';
import { InsertTable } from './components/Dialogs/InsertTable.js';
import { ShortcutsHelp } from './components/Dialogs/ShortcutsHelp.js';
import { resolveMessages } from './i18n/index.js';
import { useMonacoPrefetch } from './hooks/useMonacoPrefetch.js';
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

type OpenDialog = 'insertLink' | 'insertImage' | 'insertTable' | 'shortcutsHelp' | null;

function pickInitialMode(props: BobEditorProps): EditorMode {
  return props.mode ?? props.defaultMode ?? 'edit';
}

function pickInitialMarkdown(props: BobEditorProps): string {
  return props.value ?? props.defaultValue ?? '';
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

function generateTableMarkdown(rows: number, cols: number): string {
  const headerCells = Array.from({ length: cols }, (_, i) => `Header ${i + 1}`);
  const separatorCells = Array.from({ length: cols }, () => '---');
  const headerRow = `| ${headerCells.join(' | ')} |`;
  const separatorRow = `| ${separatorCells.join(' | ')} |`;
  const dataRows = Array.from({ length: rows - 1 }, (_, r) => {
    const cells = Array.from({ length: cols }, (_, c) => `Cell ${r + 1}-${c + 1}`);
    return `| ${cells.join(' | ')} |`;
  });
  return [headerRow, separatorRow, ...dataRows].join('\n');
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
  const containerRef = useRef<HTMLDivElement>(null);

  // Stable ref for onSave to avoid re-firing shortcuts effect
  const onSaveRef = useRef(props.onSave);
  onSaveRef.current = props.onSave;

  // Stable ref for setOpenDialog
  const [openDialog, setOpenDialog] = useState<OpenDialog>(null);
  const setOpenDialogRef = useRef(setOpenDialog);
  setOpenDialogRef.current = setOpenDialog;

  const [autoDark, setAutoDark] = useState(() => isAutoDark());
  const [managerReady, setManagerReady] = useState(false);

  const api = useMemo(
    () => createEditorApi(dispatch, () => stateRef.current, editorRef),
    [dispatch],
  );

  // Stable ref for api to avoid re-firing shortcuts effect
  const apiRef = useRef(api);
  apiRef.current = api;

  const allowedModes = props.allowedModes ?? ['edit', 'preview'];

  useMonacoPrefetch(containerRef);

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

  // Stable shortcuts props refs
  const shortcutsOverrideRef = useRef(props.shortcuts?.override);
  shortcutsOverrideRef.current = props.shortcuts?.override;
  const shortcutsDisableRef = useRef(props.shortcuts?.disable);
  shortcutsDisableRef.current = props.shortcuts?.disable;

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const manager = shortcutManagerRef.current;

    // 1. Register default shortcuts
    const defaultShortcuts: KeyboardShortcut[] = [
      { id: 'bold', keys: 'Mod+B', label: 'Bold', action: (a) => a.wrapSelection('**', '**') },
      { id: 'italic', keys: 'Mod+I', label: 'Italic', action: (a) => a.wrapSelection('*', '*') },
      {
        id: 'strikethrough',
        keys: 'Mod+Shift+X',
        label: 'Strikethrough',
        action: (a) => a.wrapSelection('~~', '~~'),
      },
      {
        id: 'heading1',
        keys: 'Mod+1',
        label: 'Heading 1',
        action: (a) => a.wrapSelection('# ', ''),
      },
      {
        id: 'heading2',
        keys: 'Mod+2',
        label: 'Heading 2',
        action: (a) => a.wrapSelection('## ', ''),
      },
      {
        id: 'heading3',
        keys: 'Mod+3',
        label: 'Heading 3',
        action: (a) => a.wrapSelection('### ', ''),
      },
      {
        id: 'heading4',
        keys: 'Mod+4',
        label: 'Heading 4',
        action: (a) => a.wrapSelection('#### ', ''),
      },
      {
        id: 'heading5',
        keys: 'Mod+5',
        label: 'Heading 5',
        action: (a) => a.wrapSelection('##### ', ''),
      },
      {
        id: 'heading6',
        keys: 'Mod+6',
        label: 'Heading 6',
        action: (a) => a.wrapSelection('###### ', ''),
      },
      {
        id: 'insert-link',
        keys: 'Mod+K',
        label: 'Insert Link',
        action: () => setOpenDialogRef.current('insertLink'),
      },
      {
        id: 'insert-image',
        keys: 'Mod+Shift+I',
        label: 'Insert Image',
        action: () => setOpenDialogRef.current('insertImage'),
      },
      {
        id: 'code',
        keys: 'Mod+`',
        label: 'Inline Code',
        action: (a) => a.wrapSelection('`', '`'),
      },
      {
        id: 'codeblock',
        keys: 'Mod+Shift+`',
        label: 'Code Block',
        action: (a) => a.wrapSelection('\n```\n', '\n```\n'),
      },
      {
        id: 'blockquote',
        keys: 'Mod+Shift+>',
        label: 'Blockquote',
        action: (a) => a.wrapSelection('> ', ''),
      },
      {
        id: 'ordered-list',
        keys: 'Mod+Shift+7',
        label: 'Ordered List',
        action: (a) => a.wrapSelection('1. ', ''),
      },
      {
        id: 'unordered-list',
        keys: 'Mod+Shift+8',
        label: 'Unordered List',
        action: (a) => a.wrapSelection('- ', ''),
      },
      {
        id: 'task-list',
        keys: 'Mod+Shift+9',
        label: 'Task List',
        action: (a) => a.wrapSelection('- [ ] ', ''),
      },
      { id: 'undo', keys: 'Mod+Z', label: 'Undo', action: () => undefined },
      { id: 'redo', keys: 'Mod+Shift+Z', label: 'Redo', action: () => undefined },
      {
        id: 'save',
        keys: 'Mod+S',
        label: 'Save',
        action: (a) => void onSaveRef.current?.(a.getValue()),
      },
      {
        id: 'shortcuts-help',
        keys: 'Ctrl+?',
        label: 'Keyboard Shortcuts',
        action: () => setOpenDialogRef.current('shortcutsHelp'),
      },
    ];

    manager.register(defaultShortcuts, apiRef.current);

    // 2. Register plugin shortcuts
    const pluginShortcuts = activePluginsRef.current.flatMap((p) => p.shortcuts ?? []);
    if (pluginShortcuts.length > 0) {
      manager.register(pluginShortcuts, apiRef.current);
    }

    // 3. Apply prop overrides
    const overrides = shortcutsOverrideRef.current ?? [];
    if (overrides.length > 0) {
      manager.register(overrides, apiRef.current);
    }

    // 4. Apply disables
    for (const id of shortcutsDisableRef.current ?? []) {
      manager.disable(id);
    }

    return () => {
      manager.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const resolvedI18n = useMemo(
    () => resolveMessages(props.locale ?? 'en', props.i18n),
    [props.locale, props.i18n],
  );

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
          {props.toolbar !== false && (
            <Toolbar
              config={props.toolbar ?? true}
              i18n={resolvedI18n}
              onOpenInsertLink={() => setOpenDialog('insertLink')}
              onOpenInsertImage={() => setOpenDialog('insertImage')}
              onOpenInsertTable={() => setOpenDialog('insertTable')}
              onOpenShortcutsHelp={() => setOpenDialog('shortcutsHelp')}
            />
          )}
          <div ref={containerRef} className="bobmd-main">
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
          <StatusBar i18n={resolvedI18n} />

          <InsertLink
            isOpen={openDialog === 'insertLink'}
            onClose={() => setOpenDialog(null)}
            onInsert={(label, url) => api.insertText(`[${label}](${url})`)}
            i18n={resolvedI18n}
          />
          <InsertImage
            isOpen={openDialog === 'insertImage'}
            onClose={() => setOpenDialog(null)}
            onInsert={(url, altText) => api.insertText(`![${altText}](${url})`)}
            i18n={resolvedI18n}
          />
          <InsertTable
            isOpen={openDialog === 'insertTable'}
            onClose={() => setOpenDialog(null)}
            onInsert={(rows, cols) => api.insertText(generateTableMarkdown(rows, cols))}
            i18n={resolvedI18n}
          />
          <ShortcutsHelp
            isOpen={openDialog === 'shortcutsHelp'}
            onClose={() => setOpenDialog(null)}
            shortcuts={shortcutManagerRef.current.getEntries()}
            i18n={resolvedI18n}
          />
        </div>
      </BobEditorApiContext.Provider>
    </BobEditorStateContext.Provider>
  );
});
