import Page from './page.vue';
$(() => {
  const app = createApp(Page);
  app.mount('#app');
  $(window).on('pagehide', () => app.unmount());
});
