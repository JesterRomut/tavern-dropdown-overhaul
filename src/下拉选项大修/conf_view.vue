<template>
  <div class="k3rn-dropdown-extension-settings">
    <div class="inline-drawer">
      <div class="inline-drawer-toggle inline-drawer-header">
        <b>{{ `下拉选项大修` }}</b>
        <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
      </div>
      <div class="inline-drawer-content">
        <div class="k3rn-dropdown-extension_block flex-container">
          <select>
            <option>示例选项 - EXAMPLE</option>
            <option>That is not dead</option>
            <option>which can eternal lie,</option>
            <option>And with strange aeons</option>
            <option>even death may die.</option>
          </select>
        </div>

        <hr class="sysHR" />

        <div class="k3rn-dropdown-extension_block flex-container">
          <label for="example_setting">{{ `变量对应色表（随酒馆主题变动）` }}</label>
          <div class="k3rn-color-grid">
            <!--
            --SmartThemeEmColor: rgba(150, 150, 150, 1);
    --SmartThemeUnderlineColor: rgba(79, 154, 255, 0.9);
    --SmartThemeQuoteColor: rgba(89, 146, 221, 1);
    --SmartThemeBlurTintColor: rgba(52, 58, 62, 0.8);
    --SmartThemeChatTintColor: rgba(42, 42, 42, 0);
    --SmartThemeUserMesBlurTintColor: rgba(32, 32, 32, 0.57);
    --SmartThemeBotMesBlurTintColor: rgba(0, 0, 0, 0.61);
    --SmartThemeShadowColor: rgba(32, 33, 36, 1);
    --SmartThemeBorderColor: rgba(32, 33, 36, 1);
            -->
            <div>--SmartThemeBodyColor</div>
            <div></div>
            <div>--SmartThemeEmColor</div>
            <div></div>
            <div>--SmartThemeUnderlineColor</div>
            <div></div>
            <div>--SmartThemeQuoteColor</div>
            <div></div>
            <div>--SmartThemeBlurTintColor</div>
            <div></div>
            <div>--SmartThemeChatTintColor</div>
            <div></div>
            <div>--SmartThemeUserMesBlurTintColor</div>
            <div></div>
            <div>--SmartThemeBotMesBlurTintColor</div>
            <div></div>
            <div>--SmartThemeShadowColor</div>
            <div></div>
            <div>--SmartThemeBorderColor</div>
            <div></div>
          </div>
        </div>

        <div class="k3rn-dropdown-extension_block flex-container">
          <input class="menu_button" type="submit" :value="`恢复默认`" @click="fillOverrideWithDefaults" />
        </div>

        <div class="k3rn-dropdown-extension_block flex-container">
          <textarea v-model="settings.style" :placeholder="DEFAULT_STYLE"></textarea>
        </div>

        <hr class="sysHR" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { DEFAULT_STYLE, useConfigStore } from './conf';

const { settings } = storeToRefs(useConfigStore());

const fillOverrideWithDefaults = () => {
  toastr.success('已恢复默认样式！');
  useConfigStore().$patch({ settings: { style: DEFAULT_STYLE } });
};
</script>

<style scoped>
select {
  border: 2px rgba(128, 128, 128, 0.5) solid !important;
}

.k3rn-color-grid {
  display: grid;
  width: max(80%, 400px);
  grid-template-columns: repeat(2, minmax(0, 1fr));
  font-size: 0.8em;
  font-family: 'Consolas', Courier, monospace;
}

.k3rn-color-grid > div:nth-child(even) {
  width: 100%;
}

/**
--SmartThemeEmColor: rgba(150, 150, 150, 1);
    --SmartThemeUnderlineColor: rgba(79, 154, 255, 0.9);
    --SmartThemeQuoteColor: rgba(89, 146, 221, 1);
    --SmartThemeBlurTintColor: rgba(52, 58, 62, 0.8);
    --SmartThemeChatTintColor: rgba(42, 42, 42, 0);
    --SmartThemeUserMesBlurTintColor: rgba(32, 32, 32, 0.57);
    --SmartThemeBotMesBlurTintColor: rgba(0, 0, 0, 0.61);
    --SmartThemeShadowColor: rgba(32, 33, 36, 1);
    --SmartThemeBorderColor: rgba(32, 33, 36, 1);
     */

.k3rn-color-grid > div:nth-child(2) {
  background-color: var(--SmartThemeBodyColor, #000);
}
.k3rn-color-grid > div:nth-child(4) {
  background-color: var(--SmartThemeEmColor, #000);
}
.k3rn-color-grid > div:nth-child(6) {
  background-color: var(--SmartThemeUnderlineColor, #000);
}
.k3rn-color-grid > div:nth-child(8) {
  background-color: var(--SmartThemeQuoteColor, #000);
}
.k3rn-color-grid > div:nth-child(10) {
  background-color: var(--SmartThemeBlurTintColor, #000);
}
.k3rn-color-grid > div:nth-child(12) {
  background-color: var(--SmartThemeChatTintColor, #000);
}
.k3rn-color-grid > div:nth-child(14) {
  background-color: var(--SmartThemeUserMesBlurTintColor, #000);
}
.k3rn-color-grid > div:nth-child(16) {
  background-color: var(--SmartThemeBotMesBlurTintColor, #000);
}
.k3rn-color-grid > div:nth-child(18) {
  background-color: var(--SmartThemeShadowColor, #000);
}
.k3rn-color-grid > div:nth-child(20) {
  background-color: var(--SmartThemeBorderColor, #000);
}
</style>
