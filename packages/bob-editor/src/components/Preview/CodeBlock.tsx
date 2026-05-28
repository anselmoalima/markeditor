import { useState, Children, isValidElement, type ReactNode } from 'react';
import type React from 'react';
import { MermaidDiagram } from './MermaidDiagram.js';

function extractText(node: ReactNode): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!isValidElement(node)) return '';
  const children = (node as React.ReactElement<{ children?: ReactNode }>).props?.children;
  if (!children) return '';
  return Children.toArray(children).map(extractText).join('');
}

function extractLanguage(className: string | undefined): string | null {
  if (!className) return null;
  const match = className.match(/language-(\w+)/);
  return match?.[1] ?? null;
}

async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Fallback for older browsers
  const el = document.createElement('textarea');
  el.value = text;
  el.style.position = 'fixed';
  el.style.opacity = '0';
  document.body.appendChild(el);
  el.focus();
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
}

function CopyButton({ code }: { code: string }): JSX.Element {
  const [copied, setCopied] = useState(false);

  const handleCopy = (): void => {
    copyToClipboard(code)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  };

  return (
    <button
      type="button"
      className="bobmd-copy-btn"
      aria-label={copied ? 'Copied!' : 'Copy code'}
      onClick={handleCopy}
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

interface CodeBlockProps {
  children?: ReactNode;
  className?: string;
}

export function CodeBlock({ children, className }: CodeBlockProps): JSX.Element {
  // children is a single <code> element inside <pre>
  const childArray = Children.toArray(children);
  const codeEl = childArray[0];

  let language: string | null = null;
  let code = '';

  if (isValidElement(codeEl)) {
    const codeProps = (codeEl as React.ReactElement<{ className?: string; children?: ReactNode }>)
      .props;
    language = extractLanguage(codeProps.className);
    code = extractText(codeProps.children);
  } else {
    code = extractText(children);
  }

  if (language === 'mermaid') {
    return <MermaidDiagram code={code.trim()} />;
  }

  return (
    <div className="bobmd-code-block">
      {language && <span className="bobmd-code-lang">{language}</span>}
      <pre className={className}>{children}</pre>
      <CopyButton code={code} />
    </div>
  );
}
