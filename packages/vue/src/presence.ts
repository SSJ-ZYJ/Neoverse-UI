import {
  type PresenceOrigin,
  type PresenceVariant,
  presenceDataAttribute,
  presenceOriginAttribute,
  presenceStagger,
} from '@neoverse-ui/motion';
import type { CSSProperties } from 'vue';

export interface PresenceAttrs {
  'data-neoverse-motion': PresenceVariant;
  'data-neoverse-motion-origin'?: PresenceOrigin;
}

/**
 * Bind the shared presence preset onto any element that enters or exits via
 * `<Transition name="nv">` (or any adapter speaking the same class contract).
 *
 * @example
 * ```vue
 * <Transition name="nv">
 *   <span v-if="open" v-bind="presence('pop', 'top')">…</span>
 * </Transition>
 * ```
 */
export function presence(variant: PresenceVariant, origin?: PresenceOrigin): PresenceAttrs {
  return origin === undefined
    ? { [presenceDataAttribute]: variant }
    : { [presenceDataAttribute]: variant, [presenceOriginAttribute]: origin };
}

export type StaggerStyle = CSSProperties;

/**
 * Style map for `<TransitionGroup>` children so siblings enter as a wave.
 * Bind with the child's index in the list; exits stay immediate.
 */
export function staggerStyle(
  index: number,
  options?: { step?: number; max?: number },
): StaggerStyle {
  return presenceStagger(index, options);
}
