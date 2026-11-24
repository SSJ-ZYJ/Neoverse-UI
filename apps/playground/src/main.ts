import { createApp } from 'vue';
import App from './App.vue';
import siteIconUrl from './assets/neoverse-site-icon.png';
import { frameView } from './frame-state';
import { mountPlaygroundEffects } from './playground-effects';
import './styles/drawers.css';
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
createApp(App).mount(root);
mountPlaygroundEffects(root);
