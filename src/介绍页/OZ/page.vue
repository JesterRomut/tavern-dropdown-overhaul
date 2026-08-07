<template>
  <main>
    <p>作者@Kernschmelze。OZ，欧几里得。</p>
    <p>“大家早就不需要超能力者了。有了无人机和计算机，谁还需要被折弯的勺子和被撬开的锁呢？”</p>
    <section>
      <h3>开场一览</h3>
      <ol>
        <li v-for="msg in starts" :key="msg">{{ msg }}</li>
      </ol>
    </section>
    <p>新版酒馆点击右下角箭头下的1/{{ starts.length }}，可快速跳转开场。</p>
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
<script setup lang="ts">
const starts = [
  '（自定义开局/此介绍页不会发送给AI）',
  'user和OZ争抢半价便当',
  'OZ来user家面试挖掘失传媒体的工作',
  'user在图书馆发现了看书的OZ',
  'user在实验室旧址拍到了隐身的OZ',
  'user跟OZ在野外徒步',
  'user看见OZ被雨打湿衣服透出的纹O身',
  '爱爱时OZ掀开衣服露出小腹上的纹O身，本以为是魅魔淫纹，没想到是……',
];
</script>
<style>
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-685%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F685%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A400%3Bfont-display%3Aswap%3B%7D');
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fitalic.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Aitalic%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D');

@media screen and (max-width: 600px) {
  :root {
    --main-padding: 0.5em;
    --section-padding: 0.5em;
  }
}

@media screen and (min-width: 600px) {
  :root {
    --main-padding: 1.5em;
    --section-padding: 1em;
  }
}

main {
  background: linear-gradient(160deg, rgba(45, 45, 45, 0.75), rgba(35, 35, 35, 0.85));
  border-radius: 4px;
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
</style>
