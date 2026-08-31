import { createApp } from 'vue';
import { createGlassRenderer } from '@neoverse-ui/glass-runtime';
import App from './App.vue';

createApp(App).mount('#app');
createGlassRenderer().mount();
