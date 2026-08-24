//import { createMemoryHistory, createRouter } from 'vue-router';
import Page from './page.vue';
// const router = createRouter({
//   history: createMemoryHistory(),
//   routes: [
//     { path: '/', component: Page },
//   ],
// });
// router.replace('/日记');
$(() => {
  const app = createApp(Page);
  //app.use(tooltip);
  app.mount('#app');
});
