<template>
  <main>
    <p>作者@Kernschmelze。</p>
    <p>“大家早就不需要超能力者了。有了无人机和计算机，谁还需要被折弯的勺子和被撬开的锁呢？”</p>
    <section>
      <h3>开场一览</h3>
      <ol>
        <li v-for="msg in starts" :key="msg">{{ msg }}</li>
      </ol>
    </section>
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
  'OZ来user家面试挖掘失传媒体的工作',
  'user在图书馆发现了看书中的OZ',
  'OZ掀开衣服露出小腹上的纹O身，本以为是魅魔淫纹，没想到是……',
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

@media screen and (max-width: 600px) {
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
@media screen and (min-width: 600px) {
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
