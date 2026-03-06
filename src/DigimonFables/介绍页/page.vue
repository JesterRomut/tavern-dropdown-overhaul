<template>
  <main>
    <p>
      作者@Kernschmelze。嘛，就是把本人之前画的<a
        href="javascript:;"
        @mouseenter="reftext = reftext2"
        @mouseleave="reftext = reftext1"
        >{{ reftext }}</a
      >做成了卡。
    </p>
    <!-- <p>
      如果三大天使真的选择了电信诈骗；如果「被选召」是一个彻头彻尾的骗局；如果我们的神圣计划只是有着后门的玩具……我们又该何去何从？
    </p> -->
    <p>
      有点毁童年，不过都是卡了，你们想写什么故事就写什么故事吧，包括让大门大往三个女主脸上一人一拳解气啥的我都没意见……
    </p>
    <section>
      <p>可选小功能：让user扮演四位主角之一，扮演时对应提示词位于user定义，世界书不发送</p>

      <div class="segmented">
        <label v-for="(chr, key) in chrs" :key="chr.realName" class="segmented-button" :for="key"
          >{{ chr.realName }}<input :id="key" v-model="currentChr" type="radio" group="chrs" :value="key"
        /></label>
      </div>

      <p>
        操作方式：创建新user - 命名为<a>{{ getCurrentChr().realName }}</a
        >或<a>{{ getCurrentChr().called }}</a> - 链接本世界书 - 复制以下内容进用户设定描述：
      </p>

      <code
        >{{ `\{\{` }}outlet::chr_{{ currentChr }}{{ `\}\}` }}{{ `\{\{` }}setvar::{{ currentChr }}_user::true{{
          `\}\}`
        }}</code
      >

      <p v-if="currentChr === `ali`">可以在此之后追加更多设定。</p>
    </section>
    <section>
      开场一览
      <ul>
        <li v-for="msg in starts" :key="msg">{{ msg }}</li>
      </ul>
    </section>

    <p>另外，这段话不会发送给AI。可以当作空白开场使用。</p>
    <p>
      <b>需要提示词模板/ejs语法/Prompt Template</b>
      <br />
      <b>卡图自绘，不可以喂ai，不可以图生图/图生视频</b>
    </p>
    <p>
      非自用的二改需授权，二传需标明作者及原帖
      <br />
      商业化禁止
    </p>
    <footer>
      <h1>Digimon Fables</h1>
      <h2>- A tale of a cruel world -</h2>
    </footer>
  </main>
</template>
<script setup lang="ts">
const reftext1 = '一篇次抛玩梗小漫画及相关的东西';
const reftext2 = `https://www.pixiv.net/artworks/141372351`;

const chrs = {
  kou: { realName: '神代工', called: '小红帽' },
  ozu: { realName: '小津梦路', called: '多萝西' },
  rapu: { realName: '美园罗浮太', called: '蕾潘泽' },
  ali: { realName: '第四人', called: '任意名字' },
};

const starts = [
  "小红帽寻思自己是神代工并和太一、拓也及user一起踢球"
]

function getCurrentChr(): (typeof chrs)[keyof typeof chrs] {
  return chrs[currentChr.value as keyof typeof chrs];
}

const reftext = ref(reftext1);
const currentChr = ref('kou');
</script>
<style>
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-685%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F685%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A400%3Bfont-display%3Aswap%3B%7D');
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fitalic.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Aitalic%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D');

@media screen and (max-width: 1000px) {
  :root {
    --main-padding: 0.5em;
    --section-padding: 0.5em;
  }
}

@media screen and (min-width: 1000px) {
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

@media screen and (max-width: 1000px) {
  .segmented {
    padding: 0.5em 0;
    display: flex;
    font-size: 0.85em;
    /* background: linear-gradient(transparent 45%, #1a1c20, transparent 55%); */
    justify-content: center;
  }

  .segmented-button {
    transition: 250ms cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 6px;
    flex-grow: 1;
    text-align: center;
    background-color: transparent;
    input {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }

    &:hover {
      background-color: #333537;
    }

    &:has(:checked) {
      background-color: #1a1c20;
    }

    &:has(:focus-visible) {
      outline: 2px solid #007acc;
    }
  }
}
/** https://freefrontend.com/css-radio-buttons/ */
@media screen and (min-width: 1000px) {
  .segmented {
    --padding: 0.2rem;
    display: flex;
    padding: var(--padding);
    border-radius: 9999px;
    anchor-name: --segmented-button-hover;
    font-size: 0.85em;

    &::before,
    &::after {
      content: '';
      position: absolute;
      border-radius: inherit;
      transition: inset 250ms cubic-bezier(0.4, 0, 0.2, 1);
      inset: calc(anchor(start) + var(--padding)) calc(anchor(end) + var(--padding)) calc(anchor(end) + var(--padding))
        calc(anchor(start) + var(--padding));
    }

    &::before {
      background-color: #1a1c20;
      position-anchor: --segmented-button-hover;
    }

    &::after {
      background-color: #333537;
      position-anchor: --segmented-button-checked;
      box-shadow:
        0 0 0 1px #484a4c,
        0 1px 3px 0 rgb(0 0 0 / 0.1),
        0 1px 2px -1px rgb(0 0 0 / 0.1);
    }
  }

  .segmented-button {
    background-color: transparent;
    border: none;
    border-radius: inherit;
    padding: 0.65rem 1.3rem;
    font-size: inherit;
    cursor: default;
    z-index: 1;
    anchor-name: var(--anchor-name-1, --a), var(--anchor-name-2, --b);

    &:hover {
      --anchor-name-1: --segmented-button-hover;
    }

    &:has(:checked) {
      --anchor-name-2: --segmented-button-checked;
    }

    &:has(:focus-visible) {
      outline: 2px solid #007acc;
    }

    input {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  }
}
</style>
