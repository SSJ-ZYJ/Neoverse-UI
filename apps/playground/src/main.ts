import { createGlassRenderer } from '@neoverse-ui/glass-runtime';
import { createApp } from 'vue';
import App from './App.vue';
import siteIconUrl from './assets/neoverse-site-icon.svg';
import './styles/playground-tokens.css';
import './styles/shell.css';

document.documentElement.dataset.playgroundView =
  window.location.pathname === '/frame' ? 'frame' : 'shell';

const favicon =
  document.querySelector<HTMLLinkElement>('link[rel~="icon"]') ?? document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/svg+xml';
favicon.href = siteIconUrl;
if (!favicon.isConnected) {
  document.head.append(favicon);
}

createApp(App).mount('#app');
createGlassRenderer().mount();
