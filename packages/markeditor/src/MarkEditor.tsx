import { forwardRef, useImperativeHandle, useRef } from 'react';
import type { MarkEditorProps, MarkEditorRef } from './types';

export const MarkEditor = forwardRef<MarkEditorRef, MarkEditorProps>(
  function MarkEditor(props, ref) {
    const valueRef = useRef(props.value ?? props.defaultValue ?? '');
    useImperativeHandle(ref, () => ({
      getValue: () => valueRef.current,
      setValue: (v) => {
        valueRef.current = v;
      },
      focus: () => {},
    }));
    return <div data-testid="mark-editor" className={props.className} style={props.style} />;
  },
);
