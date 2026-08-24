export const starts: Start[] = [
  // start(1, '（自定义开局/此介绍页不会发送给AI）'),
  // start('user和OZ争抢半价便当', ['偶遇']),
  // start('user要求OZ脑控自己并讨论方案', ['雇佣']),
  // start('OZ来user家面试挖掘失传媒体的工作', ['雇佣']),
  // start('user在图书馆发现了看书的OZ', ['偶遇']),
  // start('user在实验室旧址拍到了隐身的OZ', ['偶遇', '纯大纲']),
  // start('user看见OZ被雨打湿衣服透出的高危精神病纹身', ['偶遇']),
  // start('OZ发现自己的名字在21世纪已沦为无限膨胀的论战单位'),
  // start('OZ在21世纪不会扫码支付，不得不求助user', ['求助', '纯大纲']),
  // start('user是警察接到OZ的报案', ['求助', '纯大纲']),
  // start('user合租时面对新室友OZ', ['相处', '纯大纲']),
  // start('user雇佣OZ/通用雇佣开场', ['雇佣', '纯大纲']),
  // start('user和OZ出身同一实验室，正在叫OZ起床', ['旧识', '相处']),
  // start('OZ读出身同一实验室的user的心，读到非常可怕的成人内容被破防', ['旧识']),
  // NSFWstart('爱爱时OZ掀开衣服露出小腹上的纹身，本以为是魅魔淫纹，没想到是……'),
  // NSFWstart('OZ脑控user操自己泄欲'),
  // NSFWstart('OZ被user脑子里的成人内容破防（这次真的是黄色废料了确信）'),
  // NSFWstart('OZ看本子看流鼻血被抓包，嘴硬说是超能力用多了'),
  // NSFWstart('OZ偷偷洗脑user植入操自己指令，收到暗号就触发', ['纯大纲']),
];
//

export interface Start {
  id: number;
  name: string;
  tags: Set<string>;
  desc?: string;
}
function start(name: string, tags: Array<string> = [], desc: string | undefined = undefined): Start {
  return { id: -1, name, tags: new Set(tags), desc };
}

type RawStarts = z.infer<typeof RawStarts>;
const RawStarts = z.array(
  z.object({
    name: z.string(),
    tags: z.array(z.string()),
    desc: z.optional(z.string()),
  }),
);
// function NSFWstart(name: string, tags: Array<string> = []) {
//   return start(name, ['NSFW', ...tags]);
// }

function _main() {
  const variables = getVariables({ type: 'character' });
  // 【修正】将检查的 key 从 'OZ.Tag搜索' 改为 'OZ.TagStates' 保持一致

  try {
    const varStartsRaw: RawStarts = RawStarts.parse(_.get(variables, '介绍页.开场', {}));
    // console.log(starts);
    _.forEach(varStartsRaw, obj => {
      starts.push(start(obj.name, obj.tags, obj.desc));
    });
  } catch (e) {
    console.error('OZ前端在加载开场列表时错误！是不是乱动角色卡变量了？：', e);
    return;
  }
  starts.forEach((value, index) => {
    value.id = index + 1;
  });
}

_main();
