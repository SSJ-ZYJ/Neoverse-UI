import { createGlassRenderer } from '@neoverse-ui/glass-runtime';
import { createApp } from 'vue';
import App from './App.vue';
import brandIconUrl from './assets/neoverse-ui-icon.svg';
import './styles/playground-tokens.css';
import './styles/consumer-parity.css';
import './styles/shell.css';

document.documentElement.dataset.playgroundView =
  window.location.pathname === '/frame' ? 'frame' : 'shell';

const favicon =
  document.querySelector<HTMLLinkElement>('link[rel~="icon"]') ?? document.createElement('link');
favicon.rel = 'icon';
favicon.type = 'image/svg+xml';
favicon.href = brandIconUrl;
if (!favicon.isConnected) {
  document.head.append(favicon);
}

createApp(App).mount('#app');
createGlassRenderer().mount();
