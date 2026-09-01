import { createGlassRenderer } from '@neoverse-ui/glass-runtime';
import { createApp } from 'vue';
import App from './App.vue';

// Every playground token is rem-based, so raising the root font size on wide
// viewports mirrors a 125% browser zoom at 100% zoom. The threshold matches
// Tailwind's 64rem large breakpoint in CSS px; a real 125% zoom shrinks the
// CSS viewport below it, so the two never compound.
const LARGE_VIEWPORT_MIN_WIDTH = 1280;
const LARGE_ROOT_FONT_SIZE = '20px';

function applyViewportScale(): void {
  const referenceWindow = window.parent !== window ? window.parent : window;
  const isLargeViewport = referenceWindow.innerWidth >= LARGE_VIEWPORT_MIN_WIDTH;
  document.documentElement.style.fontSize = isLargeViewport ? LARGE_ROOT_FONT_SIZE : '';
}

applyViewportScale();
window.addEventListener('resize', applyViewportScale);
if (window.parent !== window) {
  window.parent.addEventListener('resize', applyViewportScale);
}

createApp(App).mount('#app');
createGlassRenderer().mount();
