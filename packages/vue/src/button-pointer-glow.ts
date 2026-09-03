const clampPercentage = (value: number): number =>
  Math.round(Math.min(Math.max(value, 0), 100) * 100) / 100;

export function updateButtonPointerGlow(event: PointerEvent): void {
  const target = event.currentTarget;

  if (
    target === null ||
    typeof target !== 'object' ||
    !('getBoundingClientRect' in target) ||
    typeof target.getBoundingClientRect !== 'function' ||
    !('style' in target)
  ) {
    return;
  }

  const element = target as HTMLElement;
  const rect = element.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return;
  }

  const x = clampPercentage(((event.clientX - rect.left) / rect.width) * 100);
  const y = clampPercentage(((event.clientY - rect.top) / rect.height) * 100);

  element.style.setProperty('--neoverse-button-press-x', `${x}%`);
  element.style.setProperty('--neoverse-button-press-y', `${y}%`);
}
