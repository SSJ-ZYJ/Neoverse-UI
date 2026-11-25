import { createApp } from 'vue';
import App from './App.vue';
import { LabBoard, LabWorkspace } from './app-views';
import siteIconUrl from './assets/neoverse-site-icon.png';
import { frameView } from './frame-state';
import { preloadLabRoute } from './lab-modules';
import { preloadComponent } from './lazy-component';
import { mountPlaygroundEffects } from './playground-effects';

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
