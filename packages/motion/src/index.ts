/**
 * @neoverse-ui/motion — the single motion contract for Neoverse UI.
 *
 * Everything animated in the library resolves to the tokens and the presence
 * engine shipped here (`@neoverse-ui/motion/css`). Components never hardcode
 * durations, easings, or keyframes for presence: they declare *which* role or
 * preset they need, and this package decides how it moves.
 */

export type {
  MotionDistance,
  MotionDuration,
  MotionEasing,
  MotionRole,
} from './foundation/motion-tokens.js';
export {
  motionDistances,
  motionDurations,
  motionEasings,
  motionRoles,
} from './foundation/motion-tokens.js';
export { prefersReducedMotion } from './foundation/reduced-motion.js';
export { syncCaretFlight } from './layout/caret-flight.js';
export { attachLayoutReflow } from './layout/layout-reflow.js';
export type { LayoutSizeMotionOptions } from './layout/layout-size.js';
export { attachLayoutSizeMotion } from './layout/layout-size.js';
export type {
  LayoutWidthAnimation,
  LayoutWidthOptions,
  LayoutWidthSample,
} from './layout/layout-width.js';
export { animateLayoutWidths, captureLayoutWidths } from './layout/layout-width.js';
export { attachSegmentedControlSlider } from './layout/segmented-control-slider.js';
export { attachSelectionIndicator } from './layout/selection-indicator.js';
export type {
  ParticleDissolveDebugState,
  ParticleDissolveHandle,
  ParticleDissolveMode,
  ParticleDissolveOptions,
  ParticleDissolvePreset,
  ParticleDissolvePresetName,
} from './particles/particle-dissolve.js';
export {
  createParticleDissolve,
  particleDissolvePresets,
  prewarmParticleDissolve,
  supportsParticleCapture,
  supportsParticleDissolve,
} from './particles/particle-dissolve.js';
export type { DisclosureAnimation, DisclosureMotionOptions } from './presence/disclosure.js';
export { animateDisclosure } from './presence/disclosure.js';
export type { PresenceFallback, PresenceOrigin, PresenceVariant } from './presence/presence.js';
export {
  presenceAppearClassName,
  presenceClassNames,
  presenceDataAttribute,
  presenceFallbackAttribute,
  presenceFallbacks,
  presenceLayerClassName,
  presenceOriginAttribute,
  presenceReplayAttribute,
  presenceStagger,
  presenceTransitionName,
  presenceVanishClassName,
  presenceVariants,
  replayPresence,
} from './presence/presence.js';
export type {
  AppearanceTransitionKind,
  AppearanceTransitionOptions,
} from './transitions/appearance-transition.js';
export {
  animateAppearanceChange,
  stopAppearanceTransition,
} from './transitions/appearance-transition.js';
export type {
  PageTransitionBackgroundMode,
  PageTransitionDirection,
  PageTransitionOrigin,
  PageTransitionScope,
  PageTransitionVariant,
  ParticlePipelinePreference,
  ViewTransitionOptions,
} from './transitions/page-transition.js';
export {
  dissolveSourceAttribute,
  incomingAttribute,
  isWholePageTransitionVariant,
  pageTransitionAttribute,
  pageTransitionBackgroundAttribute,
  pageTransitionContentAttribute,
  pageTransitionDirectionAttribute,
  pageTransitionDirections,
  pageTransitionMorphAttribute,
  pageTransitionScopeAttribute,
  pageTransitionSnapshotName,
  pageTransitionTargetAttribute,
  pageTransitionVariants,
  particleCanvasClassName,
  particleTransitionAttribute,
  startViewTransition,
  stopViewTransition,
  supportsViewTransition,
  toMorphSnapshotName,
  viewTransitionAttribute,
  wholePageTransitionVariants,
} from './transitions/page-transition.js';
