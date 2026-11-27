import { createApp } from 'vue';
import App from './app/App.vue';
import { LabBoard, LabWorkspace } from './app/app-views';
import { frameView } from './app/frame-state';
import { preloadComponent } from './app/lazy-component';
import siteIconUrl from './assets/neoverse-site-icon.png';
import { preloadLabRoute } from './features/catalogue/lab-modules';
import { mountPlaygroundEffects } from './runtime/playground-effects';

const favicon =
  document.querySelector<HTMLLinkElement>('link[rel~="icon"]') ?? document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/png';
favicon.href = siteIconUrl;
if (!favicon.isConnected) {
  document.head.append(favicon);
}

const root = document.getElementById('app');
if (root === null) throw new Error('Playground root is missing.');
if (frameView) {
  await Promise.all([
    preloadComponent(LabBoard),
    preloadLabRoute(window.location.hash, { frame: true }),
  ]);
} else {
  await preloadComponent(LabWorkspace);
}
createApp(App).mount(root);
delete document.documentElement.dataset.startupPersistent;
delete document.documentElement.dataset.startupBackground;
mountPlaygroundEffects(root);
