import {
  animateLayoutWidths,
  captureLayoutWidths,
  type LayoutWidthAnimation,
  type LayoutWidthSample,
} from '@neoverse-ui/motion';
import { onBeforeUnmount, onMounted, type Ref, type WatchSource, watch } from 'vue';

export interface LayoutWidthMotionOptions {
  /** Container that scopes `targets`; sampling and animation both run inside it. */
  readonly root: Ref<HTMLElement | null | undefined>;
  /** Selector for every box whose width follows its content. */
  readonly targets: string;
  /** Values whose change resizes the boxes; each change runs one sample/animation pair. */
  readonly trigger: WatchSource;
  /** Widths within this many CSS pixels count as unchanged. Defaults to `0.5`. */
  readonly tolerance?: number;
}

export interface LayoutWidthMotion {
  /** Drop the pending sample and stop the running animation. */
  cancel(): void;
}

/**
 * Keep a group of layout boxes in step when their content changes size.
 *
 * A language, theme, or label swap changes how much room each box needs. This
 * composable samples the visible widths before the update, then animates every
 * box from the sampled width to its natural width on the shared `spatial` role,
 * so the group moves on one curve instead of jumping box by box.
 *
 * ```vue
 * <script setup lang="ts">
 * const header = ref<HTMLElement | null>(null);
 * useLayoutWidthMotion({
 *   root: header,
 *   targets: '.brand, .navigation > [data-surface]',
 *   trigger: () => [locale.value, theme.value],
 * });
 * </script>
 * ```
 *
 * Interaction guarantees:
 * - An interrupted change continues from the frame it reached, because the
 *   running width is sampled from the animated style before the old run stops.
 * - The previous run is canceled before the DOM update, so the update measures
 *   natural widths rather than the values its fill still pins.
 * - A viewport resize, a reduced-motion change, or unmount ends the motion
 *   instead of leaving a stale endpoint behind.
 * - Nothing plays on first render or hydration: only trigger changes animate.
 */
export function useLayoutWidthMotion(options: LayoutWidthMotionOptions): LayoutWidthMotion {
  let samples: LayoutWidthSample[] = [];
  let running: LayoutWidthAnimation | undefined;
  let releaseListeners: (() => void) | undefined;

  const cancel = () => {
    running?.cancel();
    running = undefined;
  };

  watch(
    options.trigger,
    () => {
      const root = options.root.value;
      samples =
        root === null || root === undefined
          ? []
          : captureLayoutWidths(root.querySelectorAll(options.targets));
      cancel();
    },
    { flush: 'pre' },
  );

  watch(
    options.trigger,
    () => {
      running =
        options.tolerance === undefined
          ? animateLayoutWidths(samples)
          : animateLayoutWidths(samples, { tolerance: options.tolerance });
      samples = [];
    },
    { flush: 'post' },
  );

  onMounted(() => {
    window.addEventListener('resize', cancel);
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    reducedMotion.addEventListener('change', cancel);
    releaseListeners = () => {
      window.removeEventListener('resize', cancel);
      reducedMotion.removeEventListener('change', cancel);
    };
  });

  onBeforeUnmount(() => {
    releaseListeners?.();
    releaseListeners = undefined;
    cancel();
    samples = [];
  });

  return { cancel };
}
