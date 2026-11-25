import {
  type AnchoredOverlayOptions,
  focusElement,
  hideAnchoredOverlay,
  showAnchoredOverlay,
} from '@neoverse-ui/overlay-runtime';

// Keyboard entry resumes on the selected option and falls back to the first or
// last enabled one. The panel's display is transitioned with `allow-discrete`,
// so the option only accepts focus on the frame after the open class lands;
// retry across frames until the focus actually sticks.
export function focusSelectKeyboardTarget(details: HTMLDetailsElement, key: string, attempt = 0) {
  const enabled = details.querySelectorAll<HTMLButtonElement>('.ui-select__option:not(:disabled)');
  const selectedOption = details.querySelector<HTMLButtonElement>(
    '.ui-select__option[aria-selected="true"]:not(:disabled)',
  );
  const target = selectedOption ?? (key === 'ArrowDown' ? enabled[0] : enabled[enabled.length - 1]);
  if (target === undefined) return;
  focusElement(target, { modality: 'keyboard' });
  if (document.activeElement === target || !details.open || attempt >= 6) return;
  requestAnimationFrame(() => {
    if (details.open) focusSelectKeyboardTarget(details, key, attempt + 1);
  });
}

function selectOverlayOptions(details: HTMLDetailsElement): AnchoredOverlayOptions | undefined {
  const popover = details.querySelector<HTMLElement>('.ui-select__popover');
  const trigger = details.querySelector<HTMLElement>('.ui-select');
  if (popover === null || trigger === null) return undefined;

  return {
    trigger,
    overlay: popover,
    gapVariable: '--neoverse-select-popover-gap',
    leftVariable: '--neoverse-select-popover-left',
    topVariable: '--neoverse-select-popover-top',
    inlineSizeVariable: '--neoverse-select-popover-inline-size',
    matchTriggerWidth: true,
    fallbackOpenClass: 'ui-select__popover--fallback-open',
    onDismiss: () => {
      details.open = false;
    },
  };
}

export function openSelectPopover(details: HTMLDetailsElement) {
  const options = selectOverlayOptions(details);
  if (options !== undefined) showAnchoredOverlay(options);
}

export function closeSelectPopover(details: HTMLDetailsElement) {
  const options = selectOverlayOptions(details);
  if (options !== undefined) hideAnchoredOverlay(options);
}
