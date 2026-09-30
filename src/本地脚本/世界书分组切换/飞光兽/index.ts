import { init } from '../switcher';

$(() => {
  init({
    groups: [{ id: 'digital_world', label: '飞光兽：数码世界', match: /^数码世界 -/ }],
  });
});
