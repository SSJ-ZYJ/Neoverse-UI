interface FocusContainer<NodeType> {
  contains(node: NodeType | null): boolean;
}

interface FocusTarget {
  focus(options?: FocusOptions): void;
}

/** A mounted component's root element, when Vue resolved it to an HTMLElement */
export function elementOf(instance: { $el?: unknown } | null | undefined): HTMLElement | null {
  const element = instance?.$el;
  return element instanceof HTMLElement ? element : null;
}

/**
 * Move focus to a scene's stable control only when the control being removed
 * owns it. Configuration changes raised elsewhere keep their own focus.
 */
export function focusAfterRemoval<NodeType>(
  removing: FocusContainer<NodeType> | null | undefined,
  fallback: FocusTarget | null | undefined,
  active: NodeType | null,
): boolean {
  if (removing === null || removing === undefined) return false;
  if (fallback === null || fallback === undefined) return false;
  if (active === null || !removing.contains(active)) return false;
  fallback.focus();
  return true;
}
