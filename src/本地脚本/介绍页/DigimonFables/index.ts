import { createApp } from 'vue';
import Page from './page.vue';

$(() => {
  const app = createApp(Page).use(createPinia());
  app.mount('#app');
  $(window).on('pagehide', () => app.unmount());
});
