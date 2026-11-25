/** Select the document transition used for an appearance change */
export type AppearanceTransitionKind = 'theme-reveal' | 'theme-fade' | 'locale';

/** Configure an appearance change without owning theme or locale state */
export interface AppearanceTransitionOptions {
  readonly kind: AppearanceTransitionKind;
  /** Use this element's center as the reveal origin, including on keyboard activation. */
  readonly origin?: Element | undefined;
  /** Defaults to the origin's document, or the current document. */
  readonly document?: Document;
  /** Identify the displayed and requested palettes to reverse a theme transition in place. */
  readonly theme?: {
    readonly current: () => string;
    readonly next: string;
  };
}

type Update = () => void | Promise<void>;

interface AppearanceRequest {
  readonly palette?: string | undefined;
  readonly update: Update;
  committed?: Promise<void>;
}

interface AppearanceRun {
  stop(): void;
  retarget?(request: AppearanceRequest): Promise<void> | undefined;
}

function applySnapshotPalette(document: Document, update: Update): void | Promise<void> {
  const running = new Set(document.getAnimations());
  const finishPaint = () => {
    for (const animation of document.getAnimations()) {
      if (!('transitionProperty' in animation) || running.has(animation)) continue;
      const property = animation.transitionProperty;
      if (typeof property !== 'string') continue;
      if (
        property === 'color' ||
        property.endsWith('-color') ||
        property === 'box-shadow' ||
        property === 'text-shadow' ||
        property === 'fill' ||
        property === 'stroke'
      ) {
        // The snapshot owns palette interpolation. A new paint transition on
        // the live page would replay the old tint after the mask has passed.
        animation.finish();
      }
    }
  };
  const updated = update();
  if (updated) return updated.then(finishPaint);
  finishPaint();
}

function commitRequest(request: AppearanceRequest, paletteDocument?: Document): Promise<void> {
  if (request.committed === undefined) {
    try {
      request.committed = Promise.resolve(
        paletteDocument ? applySnapshotPalette(paletteDocument, request.update) : request.update(),
      );
    } catch (error) {
      request.committed = Promise.reject(error);
    }
  }
  return request.committed;
}

const active = new WeakMap<Document, AppearanceRun>();
const ignoreCancellation = () => undefined;
const outgoingPseudo = '::view-transition-old(root)';
const snapshotAttribute = 'data-neoverse-theme-view-transitioning';
/**
 * Attribute set on `<html>` while a View Transition owns the page appearance.
 * Live motion inside the page is invisible until the reveal, so unrelated
 * components can commit geometry instead of animating it.
 */
export const appearanceMotionAttribute = 'data-neoverse-appearance-motion';
const liveAttribute = 'data-neoverse-appearance-live';
const tokenFadeAttribute = 'data-neoverse-theme-transitioning';
const revealCenter = '--neoverse-appearance-reveal-center';
const revealRadius = '--neoverse-appearance-reveal-radius';

/** End the current transition without dropping its pending update */
export function stopAppearanceTransition(document: Document): void {
  active.get(document)?.stop();
}

/** Apply an appearance update once, and animate it when the document supports motion */
export async function animateAppearanceChange(
  update: Update,
  options: AppearanceTransitionOptions,
): Promise<void> {
  const document = options.document ?? options.origin?.ownerDocument ?? globalThis.document;
  if (document === undefined) return update();

  const owner = document.defaultView;
  const reduced = owner?.matchMedia('(prefers-reduced-motion: reduce)');
  const previous = active.get(document);
  const theme = options.kind === 'locale' ? undefined : options.theme;
  let request: AppearanceRequest = { palette: theme?.next, update };
  if (theme && !reduced?.matches) {
    const continued = previous?.retarget?.(request);
    if (continued) return continued;
  }
  previous?.stop();
  if (!owner || reduced?.matches) return update();
  const view = owner;

  const outgoingPalette = theme?.current();
  if (theme && outgoingPalette === theme.next) return update();

  const root = document.documentElement;
  let { kind } = options;
  if (typeof document.startViewTransition !== 'function') {
    if (kind === 'locale') return update();

    root.setAttribute(tokenFadeAttribute, '');
    // Resolve the transition style before changing any of the registered color tokens.
    const duration = Number.parseFloat(view.getComputedStyle(root).transitionDuration) * 1000;
    let timer: number | undefined;
    const stop = () => {
      if (active.get(document) !== run) return;
      active.delete(document);
      root.removeAttribute(tokenFadeAttribute);
      if (timer !== undefined) view.clearTimeout(timer);
      reduced?.removeEventListener('change', stop);
    };
    const run = { stop };
    active.set(document, run);
    reduced?.addEventListener('change', stop);
    try {
      return await update();
    } finally {
      if (active.get(document) === run) timer = view.setTimeout(stop, duration + 32);
    }
  }

  if (kind === 'theme-reveal') {
    const box = options.origin?.getBoundingClientRect();
    if (!box?.width || !box.height || typeof view.CSS?.registerProperty !== 'function') {
      kind = 'theme-fade';
    } else {
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      const radius = Math.hypot(
        Math.max(x, view.innerWidth - x),
        Math.max(y, view.innerHeight - y),
      );
      root.style.setProperty(revealCenter, `${x}px ${y}px`);
      root.style.setProperty(revealRadius, `${Math.ceil(radius)}px`);
    }
  }

  root.setAttribute(appearanceMotionAttribute, kind);
  root.setAttribute(snapshotAttribute, '');
  let captureCommit: Promise<void> | undefined;
  let playback: Animation | undefined;
  let manualPlayback = false;
  let frame = 0;
  const paletteDocument = kind === 'locale' ? undefined : document;
  const apply = (next: AppearanceRequest) => commitRequest(next, paletteDocument);
  const commit = () => {
    // A skipped capture can still invoke its update. Share one result with it.
    if (captureCommit === undefined) {
      // Capture only the outgoing page. Capturing the new root makes the
      // browser skip hit-testing its real DOM until the transition ends.
      root.setAttribute(liveAttribute, '');
      root.removeAttribute(snapshotAttribute);
      captureCommit = apply(request);
    }
    return captureCommit;
  };
  const transition = document.startViewTransition(commit);
  const stop = () => {
    // The browser can still call its pending update after skipTransition.
    void commit().catch(ignoreCancellation);
    void apply(request).catch(ignoreCancellation);
    transition.skipTransition();
    finish();
  };
  const run: AppearanceRun = {
    stop,
    retarget(next) {
      if (!theme || (next.palette !== outgoingPalette && next.palette !== theme.next)) return;
      request = next;
      if (!captureCommit && next.palette === outgoingPalette) stop();
      else steer();
      return completion;
    },
  };

  function steer(): void {
    const current = playback;
    if (!current?.effect) return;
    const animation = current;
    const next = request;
    const reversing = next.palette === outgoingPalette;
    if (!reversing && !manualPlayback) return;

    // Seeking the existing effect keeps its original easing without handing
    // the View Transition layer back to the compositor at a negative rate.
    // A paused effect also keeps the snapshot alive throughout the handoff.
    manualPlayback = true;
    view.cancelAnimationFrame(frame);
    const start = Number(animation.currentTime);
    const end = reversing ? 0 : Number(current.effect.getComputedTiming().endTime);
    animation.pause();
    animation.currentTime = start;

    const release = () => {
      if (request !== next || active.get(document) !== run) return;
      frame = view.requestAnimationFrame(() => transition.skipTransition());
    };
    function startPlayback(): void {
      if (request !== next || active.get(document) !== run) return;
      const started = view.performance.now();
      const tick = (now: number) => {
        const elapsed = Math.max(0, now - started);
        const time = reversing ? Math.max(end, start - elapsed) : Math.min(end, start + elapsed);
        animation.currentTime = time;
        if (time === end) void apply(next).then(release, release);
        else frame = view.requestAnimationFrame(tick);
      };
      frame = view.requestAnimationFrame(tick);
    }

    // A tap during the final covered frame may have already applied the
    // outgoing palette. Put the incoming one back before revealing it again.
    if (!reversing && theme?.current() !== next.palette) {
      void apply(next).then(startPlayback, release);
    } else {
      startPlayback();
    }
  }

  function finish(): void {
    if (active.get(document) !== run) return;
    view.cancelAnimationFrame(frame);
    active.delete(document);
    root.removeAttribute(appearanceMotionAttribute);
    root.removeAttribute(liveAttribute);
    root.removeAttribute(snapshotAttribute);
    if (kind === 'theme-reveal') {
      root.style.removeProperty(revealCenter);
      root.style.removeProperty(revealRadius);
    }
    reduced?.removeEventListener('change', stop);
  }
  const completion = transition.finished.then(() => apply(request)).finally(finish);
  active.set(document, run);
  reduced?.addEventListener('change', stop);
  if (theme) {
    void transition.ready.then(() => {
      if (active.get(document) !== run) return;
      const name = kind === 'theme-reveal' ? 'nv-theme-reveal' : 'nv-appearance-fade';
      playback = document
        .getAnimations()
        .find(
          (animation) =>
            'animationName' in animation &&
            animation.animationName === name &&
            animation.effect instanceof view.KeyframeEffect &&
            animation.effect.pseudoElement === outgoingPseudo,
        );
      steer();
    }, ignoreCancellation);
  }
  return completion;
}
