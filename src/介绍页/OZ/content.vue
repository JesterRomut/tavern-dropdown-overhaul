<template>
  <p>作者@Kernschmelze。OZ，欧几里得。</p>
  <p>“大家早就不需要超能力者了。有了无人机和计算机，谁还需要被折弯的勺子和被撬开的锁呢？”</p>
  <section>
    <h3>开场一览</h3>
    <ol>
      <li v-for="msg in starts" :key="msg">{{ msg }}</li>
    </ol>
  </section>
  <p>
    新版酒馆点击右下角箭头下的<code>1/{{ starts.length }}</code
    >，可快速跳转开场。
  </p>
  <p>
    游玩出身同一实验室的开局时，将user命名为任意四字数学家名（如希尔伯特、拉格朗日、斐波那契）或填写user设定介绍以达到最佳游玩效果。
  </p>
  <p>
    非自用的二改（任何修改）都需授权。二传需标明作者及原帖
    <br />
    商业化禁止
  </p>
</template>
<script setup lang="ts">
const starts = [
  '（自定义开局/此介绍页不会发送给AI）',
  'user和OZ争抢半价便当',
  'user要求OZ脑♡控自己并讨论方案',
  'OZ来user家面试挖掘失传媒体的工作',
  'user在图书馆发现了看书的OZ',
  'user在实验室旧址拍到了隐身的OZ',
  'user跟OZ在野外徒步',
  'user看见OZ被雨打湿衣服透出的纹♡身',
  'OZ发现自己的名字在21世纪已沦为无限膨胀的论战单位',
  'user和OZ出身同一实验室，正在叫OZ起床',
  'OZ读出身同一实验室的user的心，读到非常可怕的成人内容被破防',
  '[NSFW]爱爱时OZ掀开衣服露出小腹上的纹♡身，本以为是魅魔淫纹，没想到是……',
  '[NSFW]OZ脑控user操自己泄欲',
  '[NSFW]OZ被user脑子里的成人内容破防（这次真的是黄色废料了确信）',
];
</script>
