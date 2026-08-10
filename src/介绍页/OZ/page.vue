<script setup lang="ts">
import Page_content from './content.vue';
</script>

<template>
  <main>
    <Page_content></Page_content>
    <footer>
      <h1>OZ</h1>
      <h2>- In my dreams I'm beautiful... and bad. -</h2>
    </footer>
  </main>
</template>
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
  /* background: linear-gradient(160deg, rgba(45, 45, 45, 0.75), rgba(35, 35, 35, 0.85)); */
  background-image:
    linear-gradient(122deg, rgb(10, 10, 10), rgba(35, 35, 35, 0.85)), url('https://files.catbox.moe/1wskfw.png');
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
</style>
