import { expect, test } from 'bun:test';

import { cssVariables } from '../index.js';

test('exposes page transition token names and CSS declarations', async () => {
  const motionCss = await Bun.file(new URL('../foundation/motion.css', import.meta.url)).text();

  expect(cssVariables.motion.page).toEqual({
    duration: '--neoverse-motion-page-duration',
    expressiveDuration: '--neoverse-motion-page-expressive-duration',
    exitDuration: '--neoverse-motion-page-exit-duration',
    enterDuration: '--neoverse-motion-page-enter-duration',
    enterDelay: '--neoverse-motion-page-enter-delay',
    glideDistance: '--neoverse-motion-page-glide-distance',
    parallaxOffset: '--neoverse-motion-page-parallax-offset',
    depthInScale: '--neoverse-motion-page-depth-in-scale',
    depthOutScale: '--neoverse-motion-page-depth-out-scale',
    veilScale: '--neoverse-motion-page-veil-scale',
    blur: '--neoverse-motion-page-blur',
    feather: '--neoverse-motion-page-feather',
    backdropOpacity: '--neoverse-motion-page-backdrop-opacity',
  });

  for (const token of Object.values(cssVariables.motion.page)) {
    expect(motionCss).toContain(`${token}:`);
  }
});
