import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MarkmdEditor } from '../../src/index';
import type { MarkmdEditorRef } from '../../src/index';

describe('MarkmdEditor', () => {
  it('is a forwardRef component', () => {
    expect(MarkmdEditor).toBeDefined();
    // forwardRef components have $$typeof === Symbol.for('react.forward_ref')
    expect((MarkmdEditor as unknown as { $$typeof: symbol }).$$typeof).toBe(
      Symbol.for('react.forward_ref'),
    );
  });

  it('renders element with data-testid="markmd-editor"', () => {
    render(<MarkmdEditor />);
    expect(screen.getByTestId('markmd-editor')).toBeInTheDocument();
  });

  it('forwards ref and getValue returns defaultValue', () => {
    const ref = createRef<MarkmdEditorRef>();
    render(<MarkmdEditor ref={ref} defaultValue="hello markmd" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getValue()).toBe('hello markmd');
  });

  it('forwards ref and getValue returns empty string when no value provided', () => {
    const ref = createRef<MarkmdEditorRef>();
    render(<MarkmdEditor ref={ref} />);
    expect(ref.current?.getValue()).toBe('');
  });

  it('setValue updates the internal value', () => {
    const ref = createRef<MarkmdEditorRef>();
    render(<MarkmdEditor ref={ref} />);
    ref.current?.setValue('updated');
    expect(ref.current?.getValue()).toBe('updated');
  });

  it('renders with custom className', () => {
    render(<MarkmdEditor className="my-editor" />);
    expect(screen.getByTestId('markmd-editor')).toHaveClass('my-editor');
  });

  it('applies inline style', () => {
    render(<MarkmdEditor style={{ height: 100 }} />);
    expect(screen.getByTestId('markmd-editor')).toHaveStyle({ height: '100px' });
  });

  it('exports MarkmdMode, MarkmdEditorProps, MarkmdEditorRef types from index', async () => {
    const module = await import('../../src/index');
    expect(module.MarkmdEditor).toBeDefined();
    // type-only exports are verified at TypeScript level (tsc --noEmit)
  });
});
