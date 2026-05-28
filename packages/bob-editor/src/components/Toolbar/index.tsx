import { useEffect, useRef, useState } from 'react';
import type React from 'react';
import { useEditorApi } from '../../core/state/useEditorContext.js';
import type { ToolbarConfig, ToolbarButton as ToolbarButtonType } from '../../types.js';
import { ToolbarButton } from './ToolbarButton.js';

export interface ToolbarProps {
  config: boolean | ToolbarConfig;
  i18n: Record<string, string>;
  onOpenInsertLink: () => void;
  onOpenInsertImage: () => void;
  onOpenInsertTable: () => void;
  onOpenShortcutsHelp: () => void;
  onExportHtml?: (() => void | Promise<void>) | undefined;
  onExportMarkdown?: (() => void) | undefined;
  onExportPrint?: (() => void) | undefined;
}

interface DefaultButtonDef {
  id: string;
  labelKey: string;
  action: () => void;
}

export function Toolbar({
  config,
  i18n,
  onOpenInsertLink,
  onOpenInsertImage,
  onOpenInsertTable,
  onOpenShortcutsHelp,
  onExportHtml,
  onExportMarkdown,
  onExportPrint,
}: ToolbarProps): JSX.Element | null {
  const api = useEditorApi();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflow, setIsOverflow] = useState(false);
  const [overflowOpen, setOverflowOpen] = useState(false);

  useEffect(() => {
    if (config === false) return;
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        setIsOverflow(width < 600);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [config]);

  if (config === false) return null;

  const defaultButtons: DefaultButtonDef[] = [
    { id: 'bold', labelKey: 'bold', action: () => api.wrapSelection('**', '**') },
    { id: 'italic', labelKey: 'italic', action: () => api.wrapSelection('*', '*') },
    {
      id: 'strikethrough',
      labelKey: 'strikethrough',
      action: () => api.wrapSelection('~~', '~~'),
    },
    { id: 'heading1', labelKey: 'heading1', action: () => api.wrapSelection('# ', '') },
    { id: 'heading2', labelKey: 'heading2', action: () => api.wrapSelection('## ', '') },
    { id: 'heading3', labelKey: 'heading3', action: () => api.wrapSelection('### ', '') },
    { id: 'heading4', labelKey: 'heading4', action: () => api.wrapSelection('#### ', '') },
    { id: 'heading5', labelKey: 'heading5', action: () => api.wrapSelection('##### ', '') },
    { id: 'heading6', labelKey: 'heading6', action: () => api.wrapSelection('###### ', '') },
    { id: 'link', labelKey: 'link', action: () => onOpenInsertLink() },
    { id: 'image', labelKey: 'image', action: () => onOpenInsertImage() },
    { id: 'code', labelKey: 'code', action: () => api.wrapSelection('`', '`') },
    {
      id: 'codeblock',
      labelKey: 'codeblock',
      action: () => api.wrapSelection('\n```\n', '\n```\n'),
    },
    {
      id: 'blockquote',
      labelKey: 'blockquote',
      action: () => api.wrapSelection('> ', ''),
    },
    {
      id: 'ordered-list',
      labelKey: 'orderedList',
      action: () => api.wrapSelection('1. ', ''),
    },
    {
      id: 'unordered-list',
      labelKey: 'unorderedList',
      action: () => api.wrapSelection('- ', ''),
    },
    {
      id: 'task-list',
      labelKey: 'taskList',
      action: () => api.wrapSelection('- [ ] ', ''),
    },
    {
      id: 'undo',
      labelKey: 'undo',
      action: () => {
        document.execCommand('undo');
      },
    },
    {
      id: 'redo',
      labelKey: 'redo',
      action: () => {
        document.execCommand('redo');
      },
    },
  ];

  const defaultButtonMap = new Map(defaultButtons.map((b) => [b.id, b]));

  function renderDefaultButton(def: DefaultButtonDef): JSX.Element {
    const label = i18n[def.labelKey] ?? def.labelKey;
    return <ToolbarButton key={def.id} id={def.id} label={label} onClick={def.action} />;
  }

  function renderCustomButton(btn: ToolbarButtonType): JSX.Element {
    const label = btn.label ?? btn.title ?? btn.id;
    return (
      <ToolbarButton
        key={btn.id}
        id={btn.id}
        label={label}
        icon={btn.icon}
        isActive={btn.isActive ? btn.isActive(api) : false}
        isDisabled={btn.isDisabled ? btn.isDisabled(api) : false}
        onClick={() => btn.action(api)}
      />
    );
  }

  function renderConfigItem(item: ToolbarButtonType | string): JSX.Element | null {
    if (typeof item === 'string') {
      const def = defaultButtonMap.get(item);
      if (!def) return null;
      return renderDefaultButton(def);
    }
    return renderCustomButton(item);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>): void {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const buttons = Array.from(
      (e.currentTarget as HTMLDivElement).querySelectorAll<HTMLButtonElement>(
        'button:not([disabled])',
      ),
    );
    const focused = document.activeElement as HTMLButtonElement;
    const idx = buttons.indexOf(focused);
    if (idx === -1) return;
    let next = idx;
    if (e.key === 'ArrowRight') {
      next = (idx + 1) % buttons.length;
    } else {
      next = (idx - 1 + buttons.length) % buttons.length;
    }
    e.preventDefault();
    buttons[next]?.focus();
  }

  let buttonsToRender: JSX.Element[];
  let overflowButtons: JSX.Element[] | null = null;

  const isSticky = typeof config === 'object' && config.sticky === true;

  if (config === true) {
    const all = defaultButtons.map(renderDefaultButton);
    if (isOverflow) {
      buttonsToRender = all.slice(0, 5);
      overflowButtons = all.slice(5);
    } else {
      buttonsToRender = all;
    }
  } else {
    const items = (config as ToolbarConfig).items ?? defaultButtons.map((b) => b.id);
    const rendered = items.map((item) => renderConfigItem(item)).filter(Boolean) as JSX.Element[];
    if (isOverflow) {
      buttonsToRender = rendered.slice(0, 5);
      overflowButtons = rendered.slice(5);
    } else {
      buttonsToRender = rendered;
    }
  }

  // Unused but kept for future use via onOpenShortcutsHelp
  void onOpenInsertTable;
  void onOpenShortcutsHelp;

  const hasExport = onExportHtml != null || onExportMarkdown != null || onExportPrint != null;

  return (
    <div
      ref={containerRef}
      className={`bobmd-toolbar${isSticky ? ' bobmd-toolbar--sticky' : ''}`}
      data-testid="bobmd-toolbar"
      role="toolbar"
      aria-label="Editor toolbar"
      onKeyDown={handleKeyDown}
    >
      {buttonsToRender}
      {isOverflow && overflowButtons && overflowButtons.length > 0 && (
        <>
          <button
            type="button"
            className="bobmd-toolbar-btn"
            data-testid="bobmd-toolbar-overflow-btn"
            aria-label={i18n['moreOptions'] ?? 'More options'}
            onClick={() => setOverflowOpen((prev) => !prev)}
          >
            {i18n['moreOptions'] ?? '…'}
          </button>
          {overflowOpen && (
            <div className="bobmd-toolbar-overflow-menu" data-testid="bobmd-toolbar-overflow-menu">
              {overflowButtons}
            </div>
          )}
        </>
      )}
      {hasExport && (
        <div
          className="bobmd-export-bar"
          data-testid="bobmd-export-bar"
          role="group"
          aria-label="Export"
        >
          {onExportHtml != null && (
            <button
              type="button"
              className="bobmd-export-btn"
              data-testid="bobmd-export-html-btn"
              onClick={onExportHtml}
            >
              {i18n['exportHtml'] ?? 'Export HTML'}
            </button>
          )}
          {onExportMarkdown != null && (
            <button
              type="button"
              className="bobmd-export-btn"
              data-testid="bobmd-export-md-btn"
              onClick={onExportMarkdown}
            >
              {i18n['exportMarkdown'] ?? 'Export Markdown'}
            </button>
          )}
          {onExportPrint != null && (
            <button
              type="button"
              className="bobmd-export-btn"
              data-testid="bobmd-export-print-btn"
              onClick={onExportPrint}
            >
              {i18n['print'] ?? 'Print'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
