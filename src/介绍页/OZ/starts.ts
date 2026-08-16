export const starts: Start[] = [
  // start(1, '（自定义开局/此介绍页不会发送给AI）'),
  start(1, 'user和OZ争抢半价便当', ['偶遇']),
  start(2, 'user要求OZ脑控自己并讨论方案', ['雇佣']),
  start(3, 'OZ来user家面试挖掘失传媒体的工作', ['雇佣']),
  start(4, 'user在图书馆发现了看书的OZ', ['偶遇']),
  start(5, 'user在实验室旧址拍到了隐身的OZ', ['偶遇', '纯大纲']),
  start(6, 'user在野外徒步雇OZ当摄影师', ['雇佣']),
  start(7, 'user看见OZ被雨打湿衣服透出的高危精神病纹身', ['偶遇']),
  start(8, 'OZ发现自己的名字在21世纪已沦为无限膨胀的论战单位'),
  start(9, 'OZ在21世纪不会扫码支付，不得不求助user', ['求助', '纯大纲']),
  start(10, 'user是警察接到OZ的报案', ['求助', '纯大纲']),
  start(11, 'user和OZ出身同一实验室，正在叫OZ起床', ['旧识']),
  start(12, 'OZ读出身同一实验室的user的心，读到非常可怕的成人内容被破防', ['旧识', '雇佣']),
  NSFWstart(13, '爱爱时OZ掀开衣服露出小腹上的纹身，本以为是魅魔淫纹，没想到是……'),
  NSFWstart(14, 'OZ脑控user操自己泄欲'),
  NSFWstart(15, 'OZ被user脑子里的成人内容破防（这次真的是黄色废料了确信）'),
  NSFWstart(16, 'OZ看本子看流鼻血被抓包，嘴硬说是超能力用多了'),
];

type Start = { id: number; name: string; tags: Set<string> };
function start(id: number, name: string, tags: Array<string> = []): Start {
  return { id, name, tags: new Set(tags) };
}
function NSFWstart(id: number, name: string, tags: Array<string> = []) {
  return start(id, name, ['NSFW', ...tags]);
}
