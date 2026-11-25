import { type ComponentPropsWithRef, useRef } from 'react';
import { mergeClassNames } from '../../internal.js';
import { useTextareaCaret } from '../motion/caret-motion.js';
import { type FormControlValidation, resolveAriaInvalid } from './form-control.js';

export interface UiTextareaProps extends ComponentPropsWithRef<'textarea'> {
  validation?: FormControlValidation;
}

export function UiTextarea({
  validation = 'none',
  className,
  style,
  ref: forwardedRef,
  'aria-invalid': ariaInvalid,
  ...props
}: UiTextareaProps) {
  const control = useRef<HTMLTextAreaElement | null>(null);
  const caret = useTextareaCaret(control, props.disabled, props.readOnly, props);
  return (
    <span
      className={mergeClassNames('ui-textarea-shell', className)}
      style={style}
      data-caret={caret.showsCaret ? 'overlay' : 'native'}
    >
      <textarea
        {...props}
        ref={(node) => {
          control.current = node;
          if (typeof forwardedRef === 'function') forwardedRef(node);
          else if (forwardedRef) forwardedRef.current = node;
        }}
        className="ui-textarea"
        data-validation={validation}
        aria-invalid={resolveAriaInvalid(ariaInvalid, validation)}
        {...caret.eventProps}
      />
      {caret.showsCaret && caret.caret ? (
        <span
          className={`ui-textarea-caret${caret.holding ? ' ui-textarea-caret--holding' : ''}`}
          aria-hidden="true"
        >
          <span
            className="ui-textarea-caret__mirror"
            style={{
              width: caret.caret.width > 0 ? `${caret.caret.width}px` : undefined,
              transform: `translate(${-caret.caret.scrollLeft}px, ${-caret.caret.scrollTop}px)`,
            }}
          >
            <span className="ui-textarea-caret__prefix">{caret.caret.prefix}</span>
            <span className="ui-textarea-caret__anchor">
              <span ref={caret.glyph} className="ui-textarea-caret__glyph" />
            </span>
            <span className="ui-textarea-caret__suffix">{caret.caret.suffix || '\u200b'}</span>
          </span>
        </span>
      ) : null}
    </span>
  );
}
