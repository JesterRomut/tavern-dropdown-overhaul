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
  createApp(Page).mount('#app');
});
