<script setup lang="ts">
import AvatarSwitcher from '../shared/AvatarSwitcher.vue';
import { starts } from '../shared/starts';
import StartsBrowser from '../shared/StartsBrowser.vue';
import { vTooltip } from '../shared/tooltip';
</script>

<template>
  <main>
    <p>作者@Kernschmelze。OZ，只是一个因特异功能实验室倒闭而出来混饭吃的超能力者。</p>
    <p>“大家早就不需要超能力者了。有了计算机和互联网，谁还需要被折弯的勺子和被撬开的锁呢？”</p>

    <StartsBrowser path="OZ" />
    <AvatarSwitcher path="OZ.Avatar"></AvatarSwitcher>
    <p>
      除单击跳转外，新版酒馆点击右下角箭头下的<code>1/{{ starts.length + 1 }}</code
      >，也可快速跳转开场。
    </p>
    <p>
      <!-- 希尔伯特、拉格朗日、斐波那契）费迪南德 -->
      游玩出身同一实验室的开局时，给予user任意四字数学家名作为代号（如拉格朗日、克罗内克、勒文海姆）以达到最佳游玩效果。
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
<script lang="ts">
export default {
  directives: {
    tooltip: vTooltip,
  },
};
</script>
<style lang="scss">
@use '../shared/tooltip.scss';
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-685%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F685%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A400%3Bfont-display%3Aswap%3B%7D');
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fitalic.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Aitalic%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D');
:root {
  --oz-highlight: mediumpurple;
}
main {
  /* background: linear-gradient(160deg, rgba(45, 45, 45, 0.75), rgba(35, 35, 35, 0.85)); */
  background-image:
    linear-gradient(122deg, rgb(10, 10, 10), rgba(35, 35, 35, 0.85)),
    url('https://cdn.jsdelivr.net/gh/JesterRomut/tavern-resources@main/character/OZ/cover_background.png');
  background-size: cover;
  background-position: center;
  border-radius: 4px;
  background-blend-mode: multiply, normal;
  padding: var(--main-padding);
  color: aliceblue;
  font-size: 0.9rem;

  > p {
    padding: 0.5rem var(--section-padding);
  }

  > footer {
    text-align: center;
  }

  > footer h1 {
    font-family: 'ZSFT-685';
    font-weight: normal;
    font-size: 1.6rem;
  }

  > footer h2 {
    font-family: 'ZSFT-651';
    font-weight: lighter;
    font-size: 0.9rem;
    text-transform: uppercase;
  }

  > section {
    padding-left: var(--section-padding);
    padding-right: var(--section-padding);
  }
}

code {
  background-color: black;
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
