import { init } from '../switcher';

$(() => {
  function label(name: string, desc: string) {
    return $('<div>')
      .append($(`<div>${name}</div>`))
      .append($(`<small>${desc}</small>`));
  }
  init({
    groups: [
      {
        id: 'digital_world',
        label: label('飞光兽：数码世界', '如数码世界编年史、三主机、吃穿住行。使用外置数码世界书时关闭。'),
        match: /^Digimon[\s\S]*?( - |\.)/,
        export: { name: '数码世界@飞光兽' },
      },
      {
        id: 'digimon',
        label: label('飞光兽：数码兽档案', '内置少量除飞光兽之外的数码兽档案，如杰斯兽、珀罗兽、光明兽。'),
        match: /^数码兽档案[\s\S]*? -/,
      },
      {
        id: 'flesh_fall',
        label: label('飞光兽：龙血坠地', '剧情模式。调查各地出现的异常，解开飞光兽复活危机背后的秘密。'),
        match: /^龙血坠地[\s\S]*? -/,
      },
    ],
  });
});
