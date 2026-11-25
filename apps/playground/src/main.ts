import { createApp } from 'vue';
import App from './App.vue';
import { LabBoard, LabWorkspace } from './app-views';
import siteIconUrl from './assets/neoverse-site-icon.png';
import { frameView } from './frame-state';
import { preloadLabRoute } from './lab-modules';
import { preloadComponent } from './lazy-component';
import { mountPlaygroundEffects } from './playground-effects';
import './styles/drawers.css';
import './styles/motion-page.css';
import './styles/playground-tokens.css';
import './styles/scroll-ports.css';
import './styles/shell.css';

document.documentElement.dataset.playgroundView = frameView ? 'frame' : 'shell';

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
await Promise.all([
  preloadComponent(frameView ? LabBoard : LabWorkspace),
  preloadLabRoute(window.location.hash, { frame: frameView }),
]);
createApp(App).mount(root);
mountPlaygroundEffects(root);
