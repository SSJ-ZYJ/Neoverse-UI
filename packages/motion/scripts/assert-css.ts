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
  '@media (prefers-reduced-motion: reduce)',
  '--neoverse-motion-duration-fast: 1ms',
  '--neoverse-motion-duration-standard: 1ms',
  '--neoverse-motion-duration-expressive: 1ms',
  '--neoverse-motion-easing-standard: step-end',
  '--neoverse-motion-easing-emphasized: step-end',
  '--neoverse-motion-spatial-distance: 0px',
];
const tokenFragments = [
  '--neoverse-motion-duration-fast: 140ms',
  '--neoverse-motion-duration-standard: 240ms',
  '--neoverse-motion-duration-expressive: 420ms',
  '--neoverse-motion-easing-standard: cubic-bezier(0.22, 1, 0.36, 1)',
  '--neoverse-motion-easing-emphasized: cubic-bezier(0.16, 1, 0.3, 1)',
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
