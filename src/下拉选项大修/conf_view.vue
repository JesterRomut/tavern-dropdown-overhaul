<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import {
  DEFAULT_STYLE,
  DEFAULT_THEME_NAME,
  normalizeStyle,
  SEARCH_THRESHOLD,
  ThemeImportSchema,
  useConfigStore,
} from './conf';

const { settings } = storeToRefs(useConfigStore());

const isDefaultTheme = computed(() => settings.value.theme.current === DEFAULT_THEME_NAME);

const isStyleModified = computed(() => {
  if (isDefaultTheme.value) return false;
  const found = settings.value.theme.customThemes.find(t => t.name === settings.value.theme.current);
  if (!found) return false;
  return normalizeStyle(found.style) !== normalizeStyle(settings.value.style);
});

const saveCurrentTheme = () => {
  if (isDefaultTheme.value) {
    toastr.info('默认内置主题为只读，如需保存请点击 + 号创建新主题！');
    return;
  }
  const found = settings.value.theme.customThemes.find(t => t.name === settings.value.theme.current);
  if (found) {
    found.style = settings.value.style;
    toastr.success(`已保存当前样式至主题 "${found.name}"！`);
  }
};

const callPopupInput = async (title: string, defaultValue = ''): Promise<string | null> => {
  if (
    SillyTavern &&
    typeof SillyTavern.callGenericPopup === 'function' &&
    SillyTavern.POPUP_TYPE?.INPUT !== undefined
  ) {
    const res = await SillyTavern.callGenericPopup(title, SillyTavern.POPUP_TYPE.INPUT, defaultValue, {
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
  if (
    SillyTavern &&
    typeof SillyTavern.callGenericPopup === 'function' &&
    SillyTavern.POPUP_TYPE?.CONFIRM !== undefined
  ) {
    const res = await SillyTavern.callGenericPopup(message, SillyTavern.POPUP_TYPE.CONFIRM, '', {
      okButton: okText,
      cancelButton: cancelText,
    });
    return res === SillyTavern.POPUP_RESULT?.AFFIRMATIVE || res === 1 || res === true;
  }
  return window.confirm(message);
};

const createNewTheme = async () => {
  const name = await callPopupInput('请输入新主题名称：', '');
  if (!name) return;

  if (name === DEFAULT_THEME_NAME || settings.value.theme.customThemes.some(t => t.name === name)) {
    toastr.warning(`主题名称 "${name}" 已存在，请使用其他名称！`);
    return;
  }

  const newTheme = {
    name,
    style: settings.value.style || DEFAULT_STYLE,
  };
  settings.value.theme.customThemes.push(newTheme);
  settings.value.theme.current = name;
  settings.value.style = newTheme.style;
  toastr.success(`已创建并切换至主题 "${name}"！`);
};

const renameCurrentTheme = async () => {
  if (isDefaultTheme.value) {
    toastr.info('默认内置主题不能重命名！');
    return;
  }
  const currentName = settings.value.theme.current;
  const newName = await callPopupInput('请输入新名称：', currentName);
  if (!newName || newName === currentName) return;

  if (newName === DEFAULT_THEME_NAME || settings.value.theme.customThemes.some(t => t.name === newName)) {
    toastr.warning(`主题名称 "${newName}" 已存在！`);
    return;
  }

  const found = settings.value.theme.customThemes.find(t => t.name === currentName);
  if (found) {
    found.name = newName;
  }
  settings.value.theme.current = newName;
  toastr.success(`主题已重命名为 "${newName}"！`);
};

const deleteCurrentTheme = async () => {
  if (isDefaultTheme.value) {
    toastr.info('默认内置主题不能删除！');
    return;
  }
  const themeName = settings.value.theme.current;
  const confirmed = await callPopupConfirm(`确定要删除主题 "${themeName}" 吗？`, '删除', '取消');
  if (!confirmed) return;

  settings.value.theme.customThemes = settings.value.theme.customThemes.filter(t => t.name !== themeName);
  settings.value.theme.current = DEFAULT_THEME_NAME;
  settings.value.style = DEFAULT_STYLE;
  toastr.success(`已删除主题 "${themeName}"，恢复为默认主题！`);
};

const exportCurrentTheme = () => {
  const currentName = settings.value.theme.current;
  const currentStyle = isDefaultTheme.value ? DEFAULT_STYLE : settings.value.style;
  const data = {
    name: currentName,
    style: currentStyle,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `下拉选项主题-${currentName}.json`;
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
        .replace(/^下拉选项主题-/, '')
        .replace(/\.json$/i, '')
        .trim() ||
      '导入主题';
    const style = parsed.data.style;

    let targetName = rawName;
    if (targetName === DEFAULT_THEME_NAME) {
      targetName = `${rawName} (自定义)`;
    }

    const existingIndex = settings.value.theme.customThemes.findIndex(t => t.name === targetName);
    if (existingIndex !== -1) {
      const overwrite = await callPopupConfirm(
        `已存在同名主题 "${targetName}"，是否覆盖？点击“取消”将自动重命名导入。`,
        '覆盖',
        '重命名导入',
      );
      if (overwrite) {
        settings.value.theme.customThemes[existingIndex].style = style;
      } else {
        let counter = 1;
        while (settings.value.theme.customThemes.some(t => t.name === `${targetName} (${counter})`)) {
          counter++;
        }
        targetName = `${targetName} (${counter})`;
        settings.value.theme.customThemes.push({ name: targetName, style });
      }
    } else {
      settings.value.theme.customThemes.push({ name: targetName, style });
    }

    settings.value.theme.current = targetName;
    settings.value.style = style;
    toastr.success(`主题 "${targetName}" 导入成功！`);
  } catch (err) {
    console.error(err);
    toastr.error('导入主题时发生错误，请查看控制台！');
  } finally {
    target.value = '';
  }
};

const toggleExampleSearch = ref(false);
const toggleExampleSelect2 = ref(false);

const exampleTexts = [
  `示例选项 - EXAMPLE`,
  `那是很多年前的事了`,
  `有人用剪刀把时间线剪断`,
  `明天和昨天就连在一起了`,
  `我知道明天会发生什么`,
  `沙丁鱼从地里钻了出来`,
  `车站的月台开了个大洞`,
  `地上的木地板也消失了`,
  `昨天的记忆已淡然逝去`,
  `但何为逝去也不太清楚`,
  `天空之上大厦而立`,
  `眼睛什么都看不见了`,
];

const currentExampleTexts = computed(() =>
  toggleExampleSearch.value ? exampleTexts : exampleTexts.slice(0, SEARCH_THRESHOLD - 1),
);

const exampleSelect2Ref = ref<HTMLSelectElement | null>(null);

const initSelect2 = async () => {
  await nextTick();
  if (!exampleSelect2Ref.value) return;
  const el: JQuery<HTMLSelectElement> & { select2: ((...args: any) => any) | undefined } = $(
    exampleSelect2Ref.value,
  ) as any;
  if (typeof el.select2 !== 'function') return;
  el.select2({ width: '100%' });
};

const destroySelect2 = () => {
  if (!exampleSelect2Ref.value) return;
  const el: JQuery<HTMLSelectElement> & { select2: ((...args: any) => any) | undefined } = $(
    exampleSelect2Ref.value,
  ) as any;
  if (!el.data('select2') || typeof el.select2 !== 'function') return;
  el.select2('destroy');
};

watch(toggleExampleSelect2, val => {
  if (val) {
    initSelect2();
  } else {
    destroySelect2();
  }
});

watch(currentExampleTexts, () => {
  if (toggleExampleSelect2.value) {
    initSelect2();
  }
});

onBeforeUnmount(destroySelect2);
</script>
<template>
  <div id="k3rn-dropdown_container" class="extension_container">
    <div class="k3rn-dropdown-extension-setting">
      <div class="inline-drawer">
        <div class="inline-drawer-toggle inline-drawer-header">
          <b>下拉选项大修</b>
          <div class="inline-drawer-icon fa-solid fa-circle-chevron-down down"></div>
        </div>
        <div class="inline-drawer-content">
          <div class="flex-container">
            <div class="flex-container">
              <h3>示例选项</h3>
            </div>
            <select
              v-if="toggleExampleSelect2"
              id="k3rn-example-select2"
              ref="exampleSelect2Ref"
              class="k3rn-example-select"
              multiple
            >
              <option v-for="(value, index) in currentExampleTexts" :key="value" :selected="index === 0">
                {{ value }}
              </option>
            </select>
            <select v-else class="k3rn-example-select">
              <option v-for="value in currentExampleTexts" :key="value">
                {{ value }}
              </option>
            </select>
            <div class="flex-container">
              <label class="checkbox_label" type="checkbox" title="开启后将接管所有 Select2 下拉框">
                <input v-model="toggleExampleSearch" type="checkbox" />
                <span>显示搜索框</span>
              </label>
            </div>
            <div class="flex-container">
              <label class="checkbox_label" type="checkbox" title="开启后将接管所有 Select2 下拉框">
                <input v-model="toggleExampleSelect2" type="checkbox" />
                <span>切换为Select2</span>
              </label>
            </div>
          </div>

          <hr class="sysHR" />
          <div class="flex-container">
            <h3>主题</h3>
          </div>

          <!-- 主题预设工具栏 -->
          <div class="flex-container k3rn-theme-toolbar">
            <select v-model="settings.theme.current" class="k3rn-theme-select" title="切换主题预设">
              <option :value="DEFAULT_THEME_NAME">{{ `默认 (内置)` }}</option>
              <option v-for="t in settings.theme.customThemes" :key="t.name" :value="t.name">
                {{ t.name }}
              </option>
            </select>
            <div
              class="menu_button fa-solid fa-save"
              :class="{ disabled: isDefaultTheme, 'is-unsaved': isStyleModified }"
              :title="
                isDefaultTheme
                  ? '默认内置主题不可覆盖'
                  : isStyleModified
                    ? '保存当前样式修改到此主题'
                    : '当前样式与库中一致'
              "
              @click="saveCurrentTheme"
            ></div>
            <div class="menu_button fa-solid fa-plus" title="新建主题 (基于当前样式)" @click="createNewTheme"></div>
            <div
              class="menu_button fa-solid fa-pen-to-square"
              :class="{ disabled: isDefaultTheme }"
              title="重命名当前主题"
              @click="renameCurrentTheme"
            ></div>
            <div
              class="menu_button red_button fa-solid fa-trash-can"
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

          <div v-if="isDefaultTheme" class="flex-container">
            <div class="info-block warning">
              <i class="fa-solid fa-lock"></i>
              <span>内置主题为只读。点击上方 <b>+</b> 号以基于此主题创建新主题。</span>
            </div>
          </div>

          <div class="flex-container">
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

          <div class="flex-container">
            <textarea
              v-model="settings.style"
              :readonly="isDefaultTheme"
              :class="{ 'is-readonly': isDefaultTheme }"
              :placeholder="DEFAULT_STYLE"
            ></textarea>
          </div>

          <hr class="sysHR" />
          <div class="flex-container">
            <h3>选项</h3>
          </div>
          <div class="flex-container">
            <label class="checkbox_label" type="checkbox" title="开启后将接管所有 Select2 下拉框">
              <input v-model="settings.overrideSelect2" type="checkbox" />
              <span>接管Select2：如世界书多选框</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.info-block.warning {
  display: flex;
  gap: 0.5rem;
  width: 100%;
}
.k3rn-example-select {
  width: 100%;
}

.k3rn-theme-toolbar {
  display: flex;
  align-items: baseline;
  gap: 5px;
  flex-wrap: wrap;
}

.k3rn-theme-toolbar .menu_button.is-unsaved {
  color: var(--SmartThemeQuoteColor, #ffc107);
}

.k3rn-theme-select {
  flex: 1 1 140px;
  min-width: 120px;
}

/* .k3rn-theme-toolbar .menu_button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  cursor: pointer;
  flex-shrink: 0;
  border-radius: 4px;
} */

/* .k3rn-theme-toolbar .menu_button.disabled {
  opacity: 0.35;
  cursor: not-allowed;
  pointer-events: none;
} */
/*
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
} */

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
