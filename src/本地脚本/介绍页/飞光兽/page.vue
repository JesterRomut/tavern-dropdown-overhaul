<script setup lang="ts">
import { createCDN, fetchGitHub, getAvailableHost, resetCDNContext } from '@util/cdn';
import AvatarSwitcher from '../AvatarSwitcher.vue';
import InfoSwipe from '../InfoSwipe.vue';
import StartsBrowser from '../StartsBrowser.vue';
import { vTooltip } from '../tooltip';

import { useParentTheme, withCodeFont, withTypography } from '@util/theme';
import { starts } from '../starts';
import { format, splitPages } from '../util';
import about1 from './about.md';

const cdn = createCDN({ fetchGitHub, getAvailableHost, resetCDNContext });

useParentTheme([withTypography(), withCodeFont()]);
</script>

<template>
  <main>
    <p>
      作者@Kernschmelze。飞光兽，是香巴拉风味光明兽性转。名字来自《苦昼短》。以防你不知道光明兽是谁？嗯……是个人畜无害的小男孩。
    </p>

    <StartsBrowser path="Feiguangmon" />
    <AvatarSwitcher
      path="Feiguangmon.Avatar"
      :cdn="cdn"
      :manifest="{ repo: 'JesterRomut/tavern-resources', path: 'character/Feiguangmon/avatar/index.json' }"
    ></AvatarSwitcher>
    <InfoSwipe :pages="splitPages(format(about1, { max_swipes: starts.length + 1 }))"></InfoSwipe>
    <footer>
      <h1>飞光兽</h1>
      <h2>· 老者不死 少者不哭 ·</h2>
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
@import url('https://fontsapi.zeoseven.com/236/main/result.css');
@import url('https://fontsapi.zeoseven.com/820/main/result.css');
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
    font-family: '峄山碑篆体';
    font-weight: normal;
    font-size: 1.6rem;
  }

  > footer h2 {
    font-family: 'Chong Xi Small Seal';
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
