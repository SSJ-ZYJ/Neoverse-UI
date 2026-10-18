const storageKey = 'neoverse-design-lab.scroll-position';

export function saveScrollPosition(element: HTMLElement | null): void {
  if (element === null) return;

  try {
    window.sessionStorage.setItem(
      storageKey,
      JSON.stringify({
        href: window.location.href,
        top: element.scrollTop,
        left: element.scrollLeft,
      }),
    );
  } catch {
    // Storage can be unavailable in restricted browsing contexts.
  }
}

export function restoreScrollPosition(element: HTMLElement | null): boolean {
  const navigation = performance.getEntriesByType('navigation')[0] as
    | PerformanceNavigationTiming
    | undefined;
  if (element === null || navigation?.type !== 'reload') return false;

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (raw === null) return false;
    const position = JSON.parse(raw);
    if (
      position === null ||
      position.href !== window.location.href ||
      typeof position.top !== 'number' ||
      !Number.isFinite(position.top) ||
      position.top < 0 ||
      typeof position.left !== 'number' ||
      !Number.isFinite(position.left) ||
      position.left < 0
    ) {
      return false;
    }

    // Font loading changes specimen heights. Keep native scroll anchoring from
    // shifting the restored offset while the initial layout settles.
    const overflowAnchor = element.style.overflowAnchor;
    element.style.overflowAnchor = 'none';
    element.scrollTo({ top: position.top, left: position.left, behavior: 'instant' });
    const appliedTop = element.scrollTop;
    const appliedLeft = element.scrollLeft;
    void document.fonts.ready.then(() => {
      // Before fonts load the content can be too short for a saved position
      // near the bottom. Retry only if the reader has not scrolled meanwhile.
      if (
        element.isConnected &&
        window.location.href === position.href &&
        element.scrollTop === appliedTop &&
        element.scrollLeft === appliedLeft
      ) {
        element.scrollTo({ top: position.top, left: position.left, behavior: 'instant' });
      }
      element.style.overflowAnchor = overflowAnchor;
    });
    return true;
  } catch {
    return false;
  }
}
