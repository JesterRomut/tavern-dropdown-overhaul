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

const randomName = ref('');
const mathNames = [
  // '希尔伯特',
  // '莫比乌斯',
  // '莱布尼茨',
  // '切比雪夫',
  // '拉马努金',
  // '拉普拉斯',
  // '哥德巴赫',
  '斐波那契',
  '拉格朗日',
  '莱昂哈德',
  '拉德马赫',
  '勒文海姆',
  '费迪南德',
  '埃尔米特',
  '克罗内克',
  '布尔巴基',
  '狄利克雷',
  '冯诺依曼',
  '海因里希',
  '阿基米德',
  '利普希茨',
  '麦克斯韦',
  '斯托克斯',
  '埃尔德什',
  '达朗贝尔',
  '克利福德',
  '马尔可夫',
];

function rollMathName() {
  randomName.value = mathNames[Math.floor(Math.random() * mathNames.length)];
}

function copyName() {
  navigator.clipboard.writeText(randomName.value);
  copiedName.value = true;
  setTimeout(() => {
    copiedName.value = false;
  }, 1000);
}

const copiedName = ref(false);
</script>

<template>
  <main>
    <p>作者@Kernschmelze。OZ，只是一个因特异功能实验室倒闭而出来混饭吃的超能力者。</p>
    <p>“大家早就不需要超能力者了。有了计算机和互联网，谁还需要被折弯的勺子和被撬开的锁呢？”</p>

    <StartsBrowser path="OZ" />
    <AvatarSwitcher
      path="OZ.Avatar"
      :cdn="cdn"
      :manifest="{ repo: 'JesterRomut/tavern-resources', path: 'character/OZ/avatar/index.json' }"
    ></AvatarSwitcher>
    <InfoSwipe :pages="splitPages(format(about1, { max_swipes: starts.length + 1 }))">
      <template #page-0="{ content }">
        <div v-html="content"></div>
        <div>
          <div class="name-gen">
            <button @click="rollMathName">
              <i class="fa-solid fa-dice"></i>
              <span>点击随机代号{{ randomName ? '：' : '' }}</span>
            </button>
            <button v-if="randomName" title="点击复制" @click="copyName">
              {{ randomName }}
            </button>

            <small>{{ copiedName ? '已复制到剪贴板' : '' }}</small>
          </div>
        </div>
        <div>
          非自用的二改（任何修改）都需授权。二传需标明作者及原帖
          <br />
          商业化禁止，贩子脑袋爆炸
        </div>
      </template>
    </InfoSwipe>
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
@use '../common.scss';
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-685%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F685%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A400%3Bfont-display%3Aswap%3B%7D');
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fitalic.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Aitalic%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D');
:root {
  --oz-highlight: mediumpurple;
}
main {
  /* background: linear-gradient(16
  0deg, rgba(45, 45, 45, 0.75), rgba(35, 35, 35, 0.85)); */

  font-family: var(--theme-font-family);
  background-image:
    linear-gradient(122deg, rgb(10, 10, 10), rgba(35, 35, 35, 0.85)),
    url('https://cdn.jsdelivr.net/gh/JesterRomut/tavern-resources@latest/character/OZ/cover_background.png');
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

.name-gen {
  background: rgba(255, 255, 255, 0.05);
  display: grid;

  padding: 0.125rem;
  border-radius: 4px;
  button {
    &:hover {
      color: color-mix(in srgb, aliceblue, var(--oz-highlight));
    }
  }
  button:first-of-type {
    user-select: none;
  }

  small {
    grid-column: span 2;
    min-height: 1em;
    line-height: 1em;
    opacity: 0.5;
  }

  margin-bottom: 0.5rem;
}

div:has(> .name-gen) {
  display: flex;
}

// .name-gen-wrapper {
//   display: flex;

//   flex-direction: column;

//   small {
//     min-height: 1em;
//   }
// }
</style>
