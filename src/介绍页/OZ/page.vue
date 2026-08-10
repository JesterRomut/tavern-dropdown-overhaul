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
  '[NSFW] 爱爱时OZ掀开衣服露出小腹上的纹♡身，本以为是魅魔淫纹，没想到是……',
  '[NSFW] OZ脑控user操自己泄欲',
  '[NSFW] OZ被user脑子里的成人内容破防（这次真的是黄色废料了确信）',
];
</script>

<template>
  <main>
    <p>作者@Kernschmelze。OZ，欧几里得。</p>
    <p>“大家早就不需要超能力者了。有了无人机和计算机，谁还需要被折弯的勺子和被撬开的锁呢？”</p>
    <section>
      <h3><code>></code> 开场一览</h3>
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
    <footer>
      <h1>OZ</h1>
      <h2>- In my dreams I'm beautiful... and bad. -</h2>
    </footer>
  </main>
</template>
<style>
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-685%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F685%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A400%3Bfont-display%3Aswap%3B%7D');
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fitalic.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Aitalic%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D');

main {
  /* background: linear-gradient(160deg, rgba(45, 45, 45, 0.75), rgba(35, 35, 35, 0.85)); */
  background-image:
    linear-gradient(122deg, rgb(10, 10, 10), rgba(35, 35, 35, 0.85)),
    url('https://cdn.jsdelivr.net/gh/JesterRomut/tavern-dropdown-overhaul@latest/src/%E4%BB%8B%E7%BB%8D%E9%A1%B5/OZ/cover_background.png');
  background-size: cover;
  background-position: center;
  border-radius: 4px;
  background-blend-mode: multiply, normal;
  padding: var(--main-padding);
  color: aliceblue;
  font-size: 0.9em;
}

main > section {
  padding-left: var(--section-padding);
  padding-right: var(--section-padding);
}

section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: inherit;
  box-shadow:
    0 0 0 1px #484a4c,
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  margin: 1em 0;
  padding-top: 1em;
  padding-bottom: 1em;
}

code {
  background-color: black;
}

a {
  color: mistyrose;
}

a:hover {
  color: coral;
}

ol {
  list-style-type: decimal;
  padding-left: 1.5em;
}

h3 {
  font-weight: bold;
}

main > p {
  padding: 0.5em var(--section-padding);
}

main > footer {
  text-align: center;
}

main > footer h1 {
  font-family: 'ZSFT-685';
  font-weight: normal;
  font-size: 1.6em;
}

main > footer h2 {
  font-family: 'ZSFT-651';
  font-weight: lighter;
  font-size: 0.9em;
  text-transform: uppercase;
}

@media screen and (max-width: 600px) {
  :root {
    --main-padding: 0.5rem;
    --section-padding: 0.5rem;
  }
  main {
    background-position: 65% center;
    font-size: 0.85rem;
  }
}

@media screen and (min-width: 600px) {
  :root {
    --main-padding: 1.5rem;
    --section-padding: 1rem;
  }
}
</style>
