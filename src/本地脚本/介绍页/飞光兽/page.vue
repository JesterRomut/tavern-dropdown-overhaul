<script setup lang="ts">
import { createCDN, fetchGitHub, getFastestHost, resetCDNContext } from '@util/cdn';
import AvatarSwitcher from '../AvatarSwitcher.vue';
import InfoSwipe from '../InfoSwipe.vue';
import StartsBrowser from '../StartsBrowser.vue';
import { vTooltip } from '../tooltip';

import { starts } from '../starts';
import { useParentTheme, withCodeFont, withTypography } from '../theme';
import { format, splitPages } from '../util';
import about1 from './about.md';

const cdn = createCDN({ fetchGitHub, getFastestHost, resetCDNContext });

useParentTheme([withTypography(), withCodeFont()]);
</script>

<template>
  <main>
    <p>作者@Kernschmelze。OZ，只是一个因特异功能实验室倒闭而出来混饭吃的超能力者。</p>
    <p>“大家早就不需要超能力者了。有了计算机和互联网，谁还需要被折弯的勺子和被撬开的锁呢？”</p>

    <StartsBrowser path="Feiguangmon" />
    <AvatarSwitcher
      path="Feiguangmon.Avatar"
      :cdn="cdn"
      :manifest="{ repo: 'JesterRomut/tavern-resources', path: 'character/Feiguangmon/avatar/index.json' }"
    ></AvatarSwitcher>
    <InfoSwipe :pages="splitPages(format(about1, { max_swipes: starts.length + 1 }))"></InfoSwipe>
    <footer>
      <h1>飞光兽</h1>
      <h2>魙龙不死，昴星不升。</h2>
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
@use '../common.scss';
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-685%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F685%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A400%3Bfont-display%3Aswap%3B%7D');
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fitalic.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Aitalic%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D');
:root {
  --oz-highlight: rgb(177, 50, 75);
}
main {
  /* background: linear-gradient(16
  0deg, rgba(45, 45, 45, 0.75), rgba(35, 35, 35, 0.85)); */

  font-family: var(--theme-font-family);
  background-image:
    linear-gradient(122deg, rgb(10, 10, 10), rgba(35, 35, 35, 0.85)),
    url('https://cdn.jsdelivr.net/gh/JesterRomut/tavern-resources@main/character/Feiguangmon/cover_background.png');
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
  font-family: var(--theme-code-font-family);
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
