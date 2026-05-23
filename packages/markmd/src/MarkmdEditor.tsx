import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { MarkmdEditorProps, MarkmdEditorRef } from './types';

export const MarkmdEditor = forwardRef<MarkmdEditorRef, MarkmdEditorProps>(
  function MarkmdEditor(props, ref) {
    const valueRef = useRef(props.value ?? props.defaultValue ?? '');
    useImperativeHandle(ref, () => ({
      getValue: () => valueRef.current,
      setValue: (v) => {
        valueRef.current = v;
      },
      focus: () => {},
    }));
    return <div data-testid="markmd-editor" className={props.className} style={props.style} />;
  },
);
