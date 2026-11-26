import {
  focusElement,
  installFocusModality,
  isOverlayOpen,
  markPointerModality,
  stopOverlayTracking,
} from '@neoverse-ui/overlay-runtime';
import { getSurfaceClass } from '@neoverse-ui/tokens';
import {
  type ComponentPropsWithRef,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { mergeClassNames } from '../../internal.js';
import {
  type FormControlValidation,
  type FormControlValue,
  resolveAriaInvalid,
} from './form-control.js';
import {
  closeSelectPopover,
  focusSelectKeyboardTarget,
  openSelectPopover,
} from './select-overlay.js';

const popoverClasses = `ui-overlay-panel ui-select__popover ${getSurfaceClass('auto', 'overlay')} nv-presence`;

export interface UiSelectOption {
  value: FormControlValue;
  label: ReactNode;
  disabled?: boolean;
}

export interface UiSelectProps
  extends Omit<ComponentPropsWithRef<'summary'>, 'children' | 'onChange'> {
  'data-neoverse-material'?: string;
  options: readonly UiSelectOption[];
  value?: FormControlValue;
  placeholder?: ReactNode;
  name?: string;
  disabled?: boolean;
  readOnly?: boolean;
  validation?: FormControlValidation;
  onValueChange?: (value: FormControlValue) => void;
}

export function UiSelect({
  options,
  value,
  placeholder,
  name,
  disabled = false,
  readOnly = false,
  validation = 'none',
  onValueChange,
  className,
  onClick,
  onPointerDown,
  onKeyDown,
  onBlur,
  'aria-invalid': ariaInvalid,
  'data-neoverse-material': materialMode,
  ...props
}: UiSelectProps) {
  const [open, setOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const listboxId = `${useId()}-listbox`;
  const blocked = disabled || readOnly;
  useEffect(() => {
    if (!blocked) return;
    const details = detailsRef.current;
    if (details !== null) {
      details.open = false;
      closeSelectPopover(details);
    }
    setOpen(false);
  }, [blocked]);

  // The overlay runtime owns document/window listeners while a panel is open.
  // Unmounting an open Select must hand that tracking back, otherwise the
  // listeners keep detached DOM alive for the page lifetime. Tracking is keyed
  // by the overlay element, so hold that element rather than re-resolving it
  // from a ref that React has already detached.
  const overlayRef = useRef<HTMLElement | null>(null);
  // WebKit dismisses the native popover between pointerdown and click, so the
  // press itself commits an option. The click belonging to that gesture is
  // ignored, while a click dispatched without a pointer pair still selects.
  const pointerCommitAt = useRef(Number.NEGATIVE_INFINITY);
  const restoreTriggerFocus = useRef(false);
  useEffect(() => {
    installFocusModality(document);
    return () => {
      const overlay = overlayRef.current;
      if (overlay === null) return;
      stopOverlayTracking(overlay);
      if (typeof overlay.showPopover === 'function' && overlay.matches(':popover-open')) {
        overlay.hidePopover();
      }
      overlay.classList.remove('ui-select__popover--fallback-open');
    };
  }, []);
  const selected = options.find((option) => String(option.value) === String(value ?? ''));

  const focusRelativeOption = (current: HTMLButtonElement, direction: 1 | -1) => {
    const optionElements = Array.from(
      current
        .closest('.ui-select__popover')
        ?.querySelectorAll<HTMLButtonElement>('.ui-select__option:not(:disabled)') ?? [],
    );
    if (optionElements.length === 0) return;
    const index = optionElements.indexOf(current);
    focusElement(
      optionElements[(index + direction + optionElements.length) % optionElements.length],
      {
        modality: 'keyboard',
      },
    );
  };

  const onOptionKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Tab') {
      const closeOnShift = event.shiftKey;
      const details = event.currentTarget.closest('details');
      queueMicrotask(() => {
        if (closeOnShift || !overlayRef.current?.contains(document.activeElement)) {
          if (details !== null) {
            details.open = false;
            closeSelectPopover(details);
          }
          setOpen(false);
        }
      });
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      focusRelativeOption(event.currentTarget, event.key === 'ArrowDown' ? 1 : -1);
      return;
    }

    if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      const optionElements = Array.from(
        event.currentTarget
          .closest('.ui-select__popover')
          ?.querySelectorAll<HTMLButtonElement>('.ui-select__option:not(:disabled)') ?? [],
      );
      focusElement(event.key === 'Home' ? optionElements[0] : optionElements.at(-1), {
        modality: 'keyboard',
      });
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      const details = event.currentTarget.closest('details');
      if (details !== null) {
        details.open = false;
        closeSelectPopover(details);
        focusElement(details.querySelector<HTMLElement>('.ui-select'), { modality: 'keyboard' });
      }
      setOpen(false);
    }
  };

  const commitOption = (option: UiSelectOption, element: HTMLElement) => {
    if (option.disabled || disabled || readOnly) return;
    onValueChange?.(option.value);
    const details = element.closest('details');
    restoreTriggerFocus.current = details?.open === true;
    if (details !== null) {
      details.open = false;
      closeSelectPopover(details);
    }
    setOpen(false);
    focusElement(details?.querySelector<HTMLElement>('.ui-select'), { preventScroll: true });
  };

  return (
    <details
      data-neoverse-material={materialMode}
      ref={detailsRef}
      className={mergeClassNames(
        'ui-select-shell',
        disabled && 'ui-select-shell--disabled',
        readOnly && 'ui-select-shell--readonly',
      )}
      onToggle={(event) => {
        const details = event.currentTarget;
        if ((disabled || readOnly) && details.open) {
          details.open = false;
          setOpen(false);
          return;
        }
        setOpen(details.open);
        if (details.open) {
          openSelectPopover(details);
        } else {
          closeSelectPopover(details);
          // Closing the popover lets the engine move focus to the surrounding
          // dialog after the commit. Restore the trigger once it has settled.
          if (restoreTriggerFocus.current) {
            restoreTriggerFocus.current = false;
            focusElement(details.querySelector<HTMLElement>('.ui-select'), {
              preventScroll: true,
            });
          }
        }
      }}
    >
      <summary
        {...props}
        className={mergeClassNames('ui-select', getSurfaceClass('auto', 'field'), className)}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open && !blocked}
        aria-controls={listboxId}
        aria-disabled={blocked || undefined}
        aria-invalid={resolveAriaInvalid(ariaInvalid, validation)}
        data-validation={validation}
        onClick={(event) => {
          if (disabled || readOnly) event.preventDefault();
          onClick?.(event);
        }}
        onKeyDown={(event) => {
          onKeyDown?.(event);
          if (
            event.defaultPrevented ||
            blocked ||
            (event.key !== 'ArrowDown' && event.key !== 'ArrowUp')
          )
            return;
          event.preventDefault();
          const details = detailsRef.current;
          if (details === null) return;
          details.open = true;
          setOpen(true);
          openSelectPopover(details);
          focusSelectKeyboardTarget(details, event.key);
        }}
        onPointerDown={(event) => {
          event.currentTarget.dataset.neoverseFocusOrigin = 'pointer';
          markPointerModality(event.currentTarget.ownerDocument);
          onPointerDown?.(event);
        }}
        onBlur={(event) => {
          delete event.currentTarget.dataset.neoverseFocusOrigin;
          onBlur?.(event);
        }}
      >
        <span
          className={mergeClassNames(
            'ui-select__value',
            !selected && 'ui-select__value--placeholder',
          )}
        >
          {selected?.label ?? placeholder ?? ''}
        </span>
        <svg className="ui-select__indicator" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m5 12 4 4L19 6" />
        </svg>
      </summary>

      <div
        id={listboxId}
        ref={(element) => {
          // Keep the last attached element: React detaches refs before passive
          // effect cleanup, and the runtime cleanup needs the element identity.
          if (element !== null) overlayRef.current = element;
        }}
        className={popoverClasses}
        role="listbox"
        popover="auto"
        data-neoverse-motion="pop"
        data-neoverse-motion-origin="top"
        onToggle={(event) => {
          const popover = event.currentTarget;
          if (isOverlayOpen(popover, 'ui-select__popover--fallback-open')) return;
          stopOverlayTracking(popover);
          const details = popover.closest('details');
          if (details?.open) details.open = false;
          setOpen(false);
        }}
      >
        {options.map((option) => {
          const selectedOption = String(option.value) === String(value ?? '');
          return (
            <button
              key={String(option.value)}
              className="ui-select__option"
              type="button"
              tabIndex={-1}
              role="option"
              disabled={option.disabled}
              aria-selected={selectedOption}
              onPointerDown={(event) => {
                const trigger = event.currentTarget
                  .closest('details')
                  ?.querySelector<HTMLElement>('.ui-select');
                if (trigger) trigger.dataset.neoverseFocusOrigin = 'pointer';
                markPointerModality(event.currentTarget.ownerDocument);
                if (!event.isPrimary || event.button !== 0) return;
                pointerCommitAt.current = performance.now();
                commitOption(option, event.currentTarget);
              }}
              onClick={(event) => {
                if (performance.now() - pointerCommitAt.current < 500) return;
                commitOption(option, event.currentTarget);
              }}
              onKeyDown={onOptionKeyDown}
            >
              <span>{option.label}</span>
              {selectedOption ? (
                <svg
                  className="ui-select__check nv-appear"
                  data-neoverse-motion="pop"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="m5 12 4 4L19 6" />
                </svg>
              ) : null}
            </button>
          );
        })}
      </div>

      {name ? <input type="hidden" name={name} value={value ?? ''} disabled={disabled} /> : null}
    </details>
  );
}
