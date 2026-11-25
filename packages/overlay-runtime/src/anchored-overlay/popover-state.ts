export function supportsPopover(element: HTMLElement): boolean {
  return typeof element.showPopover === 'function' && typeof element.hidePopover === 'function';
}

export function isOverlayOpen(element: HTMLElement, fallbackOpenClass: string): boolean {
  if (!supportsPopover(element)) return element.classList.contains(fallbackOpenClass);
  return element.matches(':popover-open');
}
