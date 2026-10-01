import { init } from '../switcher';

$(() => {
  init({
    groups: [
      {
        id: 'digital_world',
        label: '飞光兽：数码世界',
        match: /^Digimon[\s\S]*? - /,
        export: { name: '数码世界@飞光兽' },
      },
      { id: 'digimon', label: '飞光兽：数码兽档案', match: /^数码兽档案[\s\S]*? -/ },
    ],
  });
});
