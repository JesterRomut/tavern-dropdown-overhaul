<script setup lang="ts">
const { localVersion, remoteVersion, changelogText } = defineProps<{
  localVersion: string;
  remoteVersion: string;
  changelogText: string;
}>();

const html = builtin.renderMarkdown(changelogText);
</script>
<template>
  <main>
    <!-- <h3 style="">
      <span>角色卡更新提示</span>
    </h3> -->
    <section>
      <div>
        当前版本：<code>{{ localVersion }}</code>
      </div>
      <div>
        最新版本：<code>{{ remoteVersion }}</code>
      </div>
    </section>
    <footer v-html="html"></footer>
    <!--不能用noscript-->
  </main>
</template>
<style lang="scss">
main {
  font-family: inherit;
  line-height: 1.6;
  overflow-y: auto;
  text-align: left;
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  // > h3 {
  //   font-size: 1.15em;
  //   font-weight: bold;
  //   margin-bottom: 10px;
  //   display: flex;
  //   align-items: center;
  //   gap: 6px;
  // }
  > section {
    background: rgba(255, 255, 255, 0.06);
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 14px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.9rem;
    > div:first-of-type {
      code {
        padding: 2px 6px;
        border-radius: 4px;
        background: rgba(0, 0, 0, 0.25);
      }
    }
    > div:last-of-type {
      font-weight: bold;
      code {
        padding: 2px 6px;
        border-radius: 4px;
        border: none;
        background: color-mix(in srgb, var(--SmartThemeQuoteColor) 20%, transparent);
      }
    }
  }
  > footer {
    background: linear-gradient(180deg, var(--SmartThemeShadowColor) 6rem, transparent);
    background-attachment: fixed;
    // border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    font-size: 0.95rem;
    flex: 1;

    h1 {
      font-size: small;
      margin: 0;
      background-color: color-mix(in srgb, var(--SmartThemeQuoteColor) 70%, transparent);
      color: color-mix(in srgb, var(--SmartThemeBlurTintColor), black);
      border-radius: 8px 8px 0 0;
      display: flex;
      justify-content: center;
      font-weight: 500;
      text-shadow: none;
    }

    h2 {
      margin: 0;
      padding: 0.5rem 0rem 0rem 1rem;
      background: linear-gradient(90deg, var(--SmartThemeShadowColor), transparent);
      font-size: small;
      &:not(&:first-of-type) {
        border-top: 1px solid color-mix(in srgb, var(--SmartThemeQuoteColor) 70%, transparent);
      }
    }
  }

  &::-webkit-scrollbar {
    width: 6px;
    @media screen and (max-width: 600px) {
      width: 4px;
    }
    height: 6px; /* 横向滚动条高度变细 */
    @media screen and (max-width: 600px) {
      height: 4px;
    }
  }

  &::-webkit-scrollbar-track {
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.3);
    // border: 1px solid #666;
  }

  &::-webkit-scrollbar-thumb {
    border-radius: 8px;
    background-color: #666;
  }
}
</style>
