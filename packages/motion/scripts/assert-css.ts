const motionOutput = new URL('../dist/motion.css', import.meta.url);
const tokenOutput = new URL('../../tokens/dist/tokens.css', import.meta.url);
const motionCss = await Bun.file(motionOutput).text();
const tokenCss = await Bun.file(tokenOutput).text();

const motionFragments = [
  "@import '@neoverse-ui/tokens/css';",
  '--neoverse-motion-feedback-duration: var(--neoverse-motion-duration-fast)',
  '--neoverse-motion-feedback-easing: var(--neoverse-motion-easing-standard)',
  '--neoverse-motion-state-duration: var(--neoverse-motion-duration-standard)',
  '--neoverse-motion-spatial-duration: var(--neoverse-motion-duration-expressive)',
  '--neoverse-motion-enter-duration: var(--neoverse-motion-duration-standard)',
  '--neoverse-motion-exit-duration: var(--neoverse-motion-duration-fast)',
  /* Presence engine contract. */
  '.nv-enter-active',
  '.nv-leave-active',
  '.nv-enter-from',
  '.nv-leave-to',
  '.nv-move',
  '.nv-presence:popover-open',
  '@starting-style',
  'allow-discrete',
  "[data-neoverse-motion='rise']",
  "[data-neoverse-motion='pop']",
  "[data-neoverse-motion='veil']",
  'data-neoverse-view-transitioning',
  /* Pointer transparency: transitions run in parallel with the user. */
  '::view-transition',
  'pointer-events: none',
  /* Particle dissolve choreography. */
  '.nv-particle-canvas',
  '.nv-particle-source',
  '[data-neoverse-particle-capture]',
  'animation: none !important',
  '[data-neoverse-particle-transitioning]',
  '[data-neoverse-motion-incoming]',
  'neoverse-motion-particle-enter',
  '@media (prefers-reduced-motion: reduce)',
  '--neoverse-motion-duration-fast: 1ms',
  '--neoverse-motion-duration-standard: 1ms',
  '--neoverse-motion-duration-expressive: 1ms',
  '--neoverse-motion-easing-standard: step-end',
  '--neoverse-motion-easing-emphasized: step-end',
  '--neoverse-motion-easing-accelerate: step-end',
  '--neoverse-motion-spatial-distance: 0px',
  '--neoverse-motion-distance-near: 0px',
  '--neoverse-motion-distance-mid: 0px',
  '--neoverse-motion-distance-far: 0px',
  '--neoverse-motion-scale-near: 1',
  '--neoverse-motion-veil-blur: 0px',
];
const tokenFragments = [
  '--neoverse-motion-duration-fast: 140ms',
  '--neoverse-motion-duration-standard: 240ms',
  '--neoverse-motion-duration-expressive: 420ms',
  '--neoverse-motion-easing-standard: cubic-bezier(0.22, 1, 0.36, 1)',
  '--neoverse-motion-easing-emphasized: cubic-bezier(0.16, 1, 0.3, 1)',
  '--neoverse-motion-easing-accelerate: cubic-bezier(0.5, 0, 0.75, 0)',
  '--neoverse-motion-distance-near: var(--neoverse-space-2)',
  '--neoverse-motion-distance-mid: var(--neoverse-space-4)',
  '--neoverse-motion-distance-far: var(--neoverse-space-8)',
  '--neoverse-motion-scale-near: 0.97',
  '--neoverse-motion-scale-far: 0.92',
  '--neoverse-motion-veil-blur: 8px',
  '--neoverse-motion-particle-duration: 910ms',
  '--neoverse-motion-particle-enter-delay: 455ms',
  '--neoverse-motion-particle-enter-duration: 234ms',
];
const missingFragments = [
  ...motionFragments.filter((fragment) => !motionCss.includes(fragment)),
  ...tokenFragments.filter((fragment) => !tokenCss.includes(fragment)),
];

if (missingFragments.length > 0) {
  throw new Error(`Motion CSS contract failed. Missing: ${missingFragments.join(', ')}`);
}

console.log(
  `Motion CSS contract passed with ${motionFragments.length + tokenFragments.length} fragments.`,
);
