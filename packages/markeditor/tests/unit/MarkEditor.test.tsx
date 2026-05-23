import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MarkEditor } from '../../src/index';
import type { MarkEditorRef } from '../../src/index';

describe('MarkEditor', () => {
  it('is a forwardRef component', () => {
    expect(MarkEditor).toBeDefined();
    // forwardRef components have $$typeof === Symbol.for('react.forward_ref')
    expect((MarkEditor as unknown as { $$typeof: symbol }).$$typeof).toBe(
      Symbol.for('react.forward_ref'),
    );
  });

  it('renders element with data-testid="mark-editor"', () => {
    render(<MarkEditor />);
    expect(screen.getByTestId('mark-editor')).toBeInTheDocument();
  });

  it('forwards ref and getValue returns defaultValue', () => {
    const ref = createRef<MarkEditorRef>();
    render(<MarkEditor ref={ref} defaultValue="hello markeditor" />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getValue()).toBe('hello markeditor');
  });

  it('forwards ref and getValue returns empty string when no value provided', () => {
    const ref = createRef<MarkEditorRef>();
    render(<MarkEditor ref={ref} />);
    expect(ref.current?.getValue()).toBe('');
  });

  it('setValue updates the internal value', () => {
    const ref = createRef<MarkEditorRef>();
    render(<MarkEditor ref={ref} />);
    ref.current?.setValue('updated');
    expect(ref.current?.getValue()).toBe('updated');
  });

  it('renders with custom className', () => {
    render(<MarkEditor className="my-editor" />);
    expect(screen.getByTestId('mark-editor')).toHaveClass('my-editor');
  });

  it('applies inline style', () => {
    render(<MarkEditor style={{ height: 100 }} />);
    expect(screen.getByTestId('mark-editor')).toHaveStyle({ height: '100px' });
  });

  it('exports MarkMode, MarkEditorProps, MarkEditorRef types from index', async () => {
    const module = await import('../../src/index');
    expect(module.MarkEditor).toBeDefined();
    // type-only exports are verified at TypeScript level (tsc --noEmit)
  });
});
