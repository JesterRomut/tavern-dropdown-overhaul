<template>
  <div id="k3rn-dropdown_container" class="extension_container">
    <div class="k3rn-dropdown-extension-setting">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>{{ `下拉选项大修` }}</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <div class="k3rn-dropdown-extension_block flex-container">
            <h3>{{ `样式修改` }}</h3>
          </div>

          <!-- 主题预设工具栏 -->
          <div class="k3rn-dropdown-extension_block flex-container k3rn-theme-toolbar">
            <select v-model="settings.currentTheme" class="k3rn-theme-select" title="切换主题预设">
              <option :value="DEFAULT_THEME_NAME">{{ `默认 (内置)` }}</option>
              <option v-for="t in settings.themes" :key="t.name" :value="t.name">
                {{ t.name }}
              </option>
            </select>
            <div class="menu_button fa-solid fa-plus" title="新建主题 (基于当前样式)" @click="createNewTheme"></div>
            <div
              class="menu_button fa-solid fa-pen-to-square"
              :class="{ disabled: isDefaultTheme }"
              title="重命名当前主题"
              @click="renameCurrentTheme"
            ></div>
            <div
              class="menu_button fa-solid fa-trash-can"
              :class="{ disabled: isDefaultTheme }"
              title="删除当前主题"
              @click="deleteCurrentTheme"
            ></div>
            <div
              class="menu_button fa-solid fa-file-export"
              title="导出当前主题为 JSON"
              @click="exportCurrentTheme"
            ></div>
            <div class="menu_button fa-solid fa-file-import" title="导入主题 JSON" @click="triggerImport"></div>
            <input ref="fileInputRef" type="file" accept=".json" style="display: none" @change="handleFileImport" />
          </div>

          <div v-if="isDefaultTheme" class="k3rn-dropdown-extension_block flex-container">
            <div class="k3rn-readonly-tip">
              <i class="fa-solid fa-lock"></i>
              <span>内置主题为只读。点击上方 <b>+</b> 号以基于此主题创建新主题。</span>
            </div>
          </div>

          <div class="k3rn-dropdown-extension_block flex-container">
            <label for="k3rn-dropdown-extension-setting">{{ `主题色表 - 随酒馆主题变动` }}</label>
            <br />
            <span>CSS使用例：<code>var(--SmartThemeBodyColor)</code></span>
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
            <textarea
              v-model="settings.style"
              :readonly="isDefaultTheme"
              :class="{ 'is-readonly': isDefaultTheme }"
              :placeholder="DEFAULT_STYLE"
            ></textarea>
          </div>

          <div class="k3rn-dropdown-extension_block flex-container">
            <input
              class="menu_button"
              type="submit"
              :value="isDefaultTheme ? `重置默认` : `恢复默认`"
              @click="fillOverrideWithDefaults"
            />
          </div>

          <hr class="sysHR" />

          <div class="k3rn-dropdown-extension_block flex-container">
            <label class="checkbox_label" type="checkbox" title="开启后将接管所有 Select2 下拉框">
              <input v-model="settings.overrideSelect2" type="checkbox" />
              <span>接管Select2：如世界书多选框</span>
            </label>
          </div>
          <hr class="sysHR" />

          <div class="k3rn-dropdown-extension_block flex-container">
            <select>
              <option>示例选项 - EXAMPLE</option>
              <option>That is not dead</option>
              <option>which can eternal lie,</option>
              <option>And with strange aeons</option>
              <option>even death may die.</option>
            </select>
            <select>
              <option>示例选项(长) - EXAMPLE</option>
              <option>那是很多年前的事了</option>
              <option>有人用剪刀把时间线剪断</option>
              <option>明天和昨天就连在一起了</option>
              <option>我知道明天会发生什么</option>
              <option>沙丁鱼从地里钻了出来</option>
              <option>车站的月台开了个大洞</option>
              <option>地上的木地板也消失了</option>
              <option>昨天的记忆已淡然逝去</option>
              <option>但何为逝去也不太清楚</option>
              <option>天空之上大厦而立</option>
              <option>眼睛什么都看不见了</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, ref, watch } from 'vue';
import { DEFAULT_STYLE, DEFAULT_THEME_NAME, ThemeImportSchema, useConfigStore } from './conf';

const { settings } = storeToRefs(useConfigStore());

const isDefaultTheme = computed(() => settings.value.currentTheme === DEFAULT_THEME_NAME);

// 监听当前主题切换，自动载入对应样式
watch(
  () => settings.value.currentTheme,
  newTheme => {
    if (newTheme === DEFAULT_THEME_NAME) {
      settings.value.style = DEFAULT_STYLE;
    } else {
      const found = settings.value.themes.find(t => t.name === newTheme);
      if (found) {
        settings.value.style = found.style;
      }
    }
  },
);

// 监听 textarea 样式修改，若当前为自定义主题，实时同步回自定义主题列表中
watch(
  () => settings.value.style,
  newStyle => {
    if (isDefaultTheme.value) return;
    const found = settings.value.themes.find(t => t.name === settings.value.currentTheme);
    if (found && found.style !== newStyle) {
      found.style = newStyle;
    }
  },
);

const getSillyTavern = (): any => {
  return (
    (window as any).SillyTavern ||
    (window.parent as any)?.SillyTavern ||
    (typeof SillyTavern !== 'undefined' ? SillyTavern : undefined)
  );
};

const callPopupInput = async (title: string, defaultValue = ''): Promise<string | null> => {
  const st = getSillyTavern();
  if (st && typeof st.callGenericPopup === 'function' && st.POPUP_TYPE?.INPUT !== undefined) {
    const res = await st.callGenericPopup(title, st.POPUP_TYPE.INPUT, defaultValue, {
      okButton: '确定',
      cancelButton: '取消',
    });
    if (typeof res === 'string') {
      return res.trim();
    }
    return null;
  }
  const res = window.prompt(title, defaultValue);
  return res ? res.trim() : null;
};

const callPopupConfirm = async (message: string, okText = '确定', cancelText = '取消'): Promise<boolean> => {
  const st = getSillyTavern();
  if (st && typeof st.callGenericPopup === 'function' && st.POPUP_TYPE?.CONFIRM !== undefined) {
    const res = await st.callGenericPopup(message, st.POPUP_TYPE.CONFIRM, '', {
      okButton: okText,
      cancelButton: cancelText,
    });
    return res === st.POPUP_RESULT?.AFFIRMATIVE || res === 1 || res === true;
  }
  return window.confirm(message);
};

const createNewTheme = async () => {
  const name = await callPopupInput('请输入新主题名称：', '');
  if (!name) return;

  if (name === DEFAULT_THEME_NAME || settings.value.themes.some(t => t.name === name)) {
    toastr.warning(`主题名称 "${name}" 已存在，请使用其他名称！`);
    return;
  }

  const newTheme = {
    name,
    style: settings.value.style || DEFAULT_STYLE,
  };
  settings.value.themes.push(newTheme);
  settings.value.currentTheme = name;
  settings.value.style = newTheme.style;
  toastr.success(`已创建并切换至主题 "${name}"！`);
};

const renameCurrentTheme = async () => {
  if (isDefaultTheme.value) {
    toastr.info('默认内置主题不能重命名！');
    return;
  }
  const currentName = settings.value.currentTheme;
  const newName = await callPopupInput('请输入新名称：', currentName);
  if (!newName || newName === currentName) return;

  if (newName === DEFAULT_THEME_NAME || settings.value.themes.some(t => t.name === newName)) {
    toastr.warning(`主题名称 "${newName}" 已存在！`);
    return;
  }

  const found = settings.value.themes.find(t => t.name === currentName);
  if (found) {
    found.name = newName;
  }
  settings.value.currentTheme = newName;
  toastr.success(`主题已重命名为 "${newName}"！`);
};

const deleteCurrentTheme = async () => {
  if (isDefaultTheme.value) {
    toastr.info('默认内置主题不能删除！');
    return;
  }
  const themeName = settings.value.currentTheme;
  const confirmed = await callPopupConfirm(`确定要删除主题 "${themeName}" 吗？`, '删除', '取消');
  if (!confirmed) return;

  settings.value.themes = settings.value.themes.filter(t => t.name !== themeName);
  settings.value.currentTheme = DEFAULT_THEME_NAME;
  settings.value.style = DEFAULT_STYLE;
  toastr.success(`已删除主题 "${themeName}"，已恢复为默认主题！`);
};

const exportCurrentTheme = () => {
  const currentName = settings.value.currentTheme;
  const currentStyle = isDefaultTheme.value ? DEFAULT_STYLE : settings.value.style;
  const data = {
    name: currentName,
    style: currentStyle,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `k3rn-dropdown-theme-${encodeURIComponent(currentName)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toastr.success(`已导出主题 "${currentName}"！`);
};

const fileInputRef = ref<HTMLInputElement | null>(null);

const triggerImport = () => {
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
    fileInputRef.value.click();
  }
};

const handleFileImport = async (e: Event) => {
  const target = e.target as HTMLInputElement;
  const files = target.files;
  if (!files || files.length === 0) return;
  const file = files[0];

  try {
    const text = await file.text();
    let json: any;
    try {
      json = JSON.parse(text);
    } catch {
      toastr.error('无法解析 JSON 文件，请检查文件格式！');
      return;
    }

    const parsed = ThemeImportSchema.safeParse(json);
    if (!parsed.success) {
      const errMsg = parsed.error.issues.map(i => i.message).join('; ');
      toastr.error(`主题格式校验失败: ${errMsg}`);
      return;
    }

    const rawName =
      parsed.data.name?.trim() ||
      file.name
        .replace(/^k3rn-dropdown-theme-/, '')
        .replace(/\.json$/i, '')
        .trim() ||
      '导入主题';
    const style = parsed.data.style;

    let targetName = rawName;
    if (targetName === DEFAULT_THEME_NAME) {
      targetName = `${rawName} (自定义)`;
    }

    const existingIndex = settings.value.themes.findIndex(t => t.name === targetName);
    if (existingIndex !== -1) {
      const overwrite = await callPopupConfirm(
        `已存在同名主题 "${targetName}"，是否覆盖？点击“取消”将自动重命名导入。`,
        '覆盖',
        '重命名导入',
      );
      if (overwrite) {
        settings.value.themes[existingIndex].style = style;
      } else {
        let counter = 1;
        while (settings.value.themes.some(t => t.name === `${targetName} (${counter})`)) {
          counter++;
        }
        targetName = `${targetName} (${counter})`;
        settings.value.themes.push({ name: targetName, style });
      }
    } else {
      settings.value.themes.push({ name: targetName, style });
    }

    settings.value.currentTheme = targetName;
    settings.value.style = style;
    toastr.success(`主题 "${targetName}" 导入成功！`);
  } catch (err) {
    console.error(err);
    toastr.error('导入主题时发生未知错误！');
  } finally {
    target.value = '';
  }
};

const fillOverrideWithDefaults = async () => {
  if (isDefaultTheme.value) {
    settings.value.style = DEFAULT_STYLE;
    toastr.success('已是默认样式！');
    return;
  }

  const confirmed = await callPopupConfirm('确定将当前主题的内容重置为内置默认样式吗？', '重置', '取消');
  if (!confirmed) return;

  settings.value.style = DEFAULT_STYLE;
  const found = settings.value.themes.find(t => t.name === settings.value.currentTheme);
  if (found) {
    found.style = DEFAULT_STYLE;
  }
  toastr.success('当前主题已重置为默认样式！');
};
</script>

<style scoped>
select {
  border: 2px rgba(128, 128, 128, 0.5) solid !important;
}

.k3rn-theme-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.k3rn-theme-select {
  flex: 1 1 140px;
  min-width: 120px;
}

.k3rn-theme-toolbar .menu_button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 4px;
}

.k3rn-theme-toolbar .menu_button.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
}

.k3rn-readonly-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 193, 7, 0.12);
  border-left: 3px solid #ffc107;
  border-radius: 4px;
  font-size: 0.85em;
  color: var(--SmartThemeBodyColor, #eee);
  width: 100%;
  box-sizing: border-box;
}

.k3rn-readonly-tip i {
  color: #ffc107;
  font-size: 1.1em;
  flex-shrink: 0;
}

textarea.is-readonly {
  opacity: 0.8;
  background: rgba(0, 0, 0, 0.15);
  cursor: not-allowed;
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
