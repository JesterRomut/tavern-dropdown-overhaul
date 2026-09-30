import { init } from '../switcher';

$(() => {
  init({
    groups: [
      { id: 'old_setting', label: '[旧] 设定条目', match: /^\[旧\]/ },
      { id: 'optional', label: '(选开) 条目', match: /\(选开\)/ },
      { id: 'nsfw', label: 'NSFW 相关', match: /NSFW/i },
      { id: 'digital_world', label: '数码世界背景', match: /^数码世界 -/ },
    ],
  });
});
