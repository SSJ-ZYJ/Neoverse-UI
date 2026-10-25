/**
 * Reference-counted ownership of the document-level native scrollbar hiding
 * class.
 *
 * `UiScrollbar` binds to document scrolling, so more than one instance can be
 * mounted at a time (for example a route-level overlay plus a local fixture).
 * Each owner acquires the class and releases it on unmount; the class is only
 * removed when the last owner is gone. A page that already carried the class
 * before the first owner mounted keeps it.
 */

const owners = new Map<HTMLElement, { count: number; original: boolean }>();

function resolveTargets(): HTMLElement[] {
  return [document.documentElement, document.body].filter((node): node is HTMLElement =>
    Boolean(node),
  );
}

export function acquireNativeScrollbarHiding(): () => void {
  const targets = resolveTargets();
  for (const target of targets) {
    const owner = owners.get(target) ?? {
      count: 0,
      original: target.classList.contains('ui-scrollbar-target'),
    };
    owner.count += 1;
    owners.set(target, owner);
    target.classList.add('ui-scrollbar-target');
  }

  return () => {
    for (const target of targets) {
      const owner = owners.get(target);
      if (owner === undefined) continue;
      owner.count -= 1;
      if (owner.count > 0) continue;
      if (!owner.original) target.classList.remove('ui-scrollbar-target');
      owners.delete(target);
    }
  };
}
