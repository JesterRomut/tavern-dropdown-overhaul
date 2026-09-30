import { init } from '../switcher';

$(() => {
  init({
    groups: [{ id: 'digital_world', label: '数码世界背景', match: /^数码世界 -/ }],
  });
});
