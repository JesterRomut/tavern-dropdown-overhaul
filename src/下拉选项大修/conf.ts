export const ACTIVE_CLASS = 'k3rn-dropdown-active';
export const DROPDOWN_ID = 'k3rn-dropdown-global';
export const STYLE_ID = `k3rn-dropdown-overhaul`;
export const EVENT_NAMESPACE = 'k3rn-dropdown-overhaul';
export const SCROLL_NAMESPACE = 'k3rn-dropdown-scroll';

export const SEARCH_THRESHOLD = 7; // 7是完美的数字哦 阿门

export const DEFAULT_STYLE = `#${DROPDOWN_ID} {
    margin: 0;
    position: absolute;
    z-index: 2147483648 !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4);
    max-height: 400px;
    display: flex;
    flex-direction: column;
    background: var(--SmartThemeBlurTintColor, #1a1a1a);
    color: var(--SmartThemeBodyColor, #eee);
    border: 1px solid var(--SmartThemeBorderColor, #444);
    border-radius: 4px;

    overflow: hidden;
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
}

#${DROPDOWN_ID} .search-wrapper {
    padding: 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    flex-shrink: 0;
}

#${DROPDOWN_ID} .search-input {
    width: 100%;
    padding: 6px 8px;
    border-radius: 4px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: var(--SmartThemeBlurTintColor);
    color: inherit;
    outline: none;
    font-size: 0.9em;
}
#${DROPDOWN_ID} .search-input:focus {
    border-color: var(--SmartThemeQuoteColor, #888);
}

#${DROPDOWN_ID} .options-list {
    overflow-y: auto;
    flex-grow: 1;
    max-height: 300px;
}

#${DROPDOWN_ID} .options-list::-webkit-scrollbar {
    width: 6px;
}
#${DROPDOWN_ID} .options-list::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
}

#${DROPDOWN_ID} .option-item {
    padding: 8px 12px;
    cursor: pointer;
    transition: background 0.1s;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-sizing: border-box;
}
#${DROPDOWN_ID} .option-item:hover {
    background: rgba(128,128,128,0.1);
}
#${DROPDOWN_ID} .option-item.selected {
    background: rgba(128,128,128,0.2);
    font-weight: bold;
    border-left: 3px solid var(--SmartThemeQuoteColor, #888);
}
#${DROPDOWN_ID} .option-item.disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
}
#${DROPDOWN_ID}.is-multi .option-item::after {
    content: '';
    width: 14px;
    height: 14px;
    flex-shrink: 0;
    margin-left: 8px;
    border: 1.5px solid rgba(255, 255, 255, 0.3);
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    box-sizing: border-box;
}
#${DROPDOWN_ID}.is-multi .option-item.selected::after {
    content: '✓';
    font-size: 11px;
    font-weight: bold;
    color: #fff;
    background: var(--SmartThemeQuoteColor, #888);
    border-color: var(--SmartThemeQuoteColor, #888);
}
#${DROPDOWN_ID} .no-results {
    padding: 12px;
    text-align: center;
    color: var(--SmartThemeBodyColor, #eee);
    font-style: italic;
    display: none;
}
#${DROPDOWN_ID} .optgroup-header {
    padding: 3px 12px;
    font-size: 0.8em;
    color: var(--SmartThemeQuoteColor, #888);
    pointer-events: none;
    background: rgba(128, 128, 128, 0.2);
}
#${DROPDOWN_ID} .option-item.grouped {
    padding-left: 24px;
}
`;

export const ThemePreset = z.object({
  name: z.string().min(1, '主题名称不能为空'),
  style: z.string(),
});
export type ThemePreset = z.infer<typeof ThemePreset>;

export const ThemeImportSchema = z.object({
  name: z.string().optional(),
  style: z.string({ error: '主题 JSON 中必须包含 style 字段' }),
});
export type ThemeImportSchema = z.infer<typeof ThemeImportSchema>;

export const DEFAULT_THEME_NAME = '默认';

export const Config = z
  .object({
    currentTheme: z.string().default(DEFAULT_THEME_NAME),
    themes: z.array(ThemePreset).default([]),
    style: z.string().default(DEFAULT_STYLE),
    overrideSelect2: z.boolean().default(true),
  })
  .prefault({});

export const normalizeStyle = (s?: string): string => {
  return (s ?? '').replace(/\r\n/g, '\n').trim();
};

export const useConfigStore = defineStore('settings', () => {
  let initial = Config.parse(getVariables({ type: 'script', script_id: getScriptId() }));

  // 1. 向下兼容：如果 themes 为空但已有 style 与 DEFAULT_STYLE 不同，自动迁入一个“我的主题”
  if (initial.themes.length === 0 && initial.style && normalizeStyle(initial.style) !== normalizeStyle(DEFAULT_STYLE)) {
    initial = {
      ...initial,
      currentTheme: '我的主题',
      themes: [{ name: '我的主题', style: initial.style }],
    };
  } else if (initial.currentTheme === DEFAULT_THEME_NAME) {
    // 2. 如果当前选中的是默认主题，强制保证 style 与内置 DEFAULT_STYLE 严格一致，清理历史残留
    initial.style = DEFAULT_STYLE;
  } else {
    // 3. 如果当前选中的是自定义主题，确保 style 与该主题保存的 style 一致；若不存在则安全回退到默认
    const found = initial.themes.find(t => t.name === initial.currentTheme);
    if (found) {
      initial.style = found.style;
    } else {
      initial.currentTheme = DEFAULT_THEME_NAME;
      initial.style = DEFAULT_STYLE;
    }
  }

  const settings = ref(initial);

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

  // 监听 style 修改，若当前为自定义主题，实时同步回主题列表中
  watch(
    () => settings.value.style,
    newStyle => {
      if (settings.value.currentTheme === DEFAULT_THEME_NAME) return;
      const found = settings.value.themes.find(t => t.name === settings.value.currentTheme);
      if (found && found.style !== newStyle) {
        found.style = newStyle;
      }
    },
  );

  watch(
    () => settings.value,
    val => {
      insertOrAssignVariables(klona(val), { type: 'script', script_id: getScriptId() });
      injectGlobalStyles();
    },
    { deep: true, immediate: true },
  );

  return { settings };
});

export const isTakeOverSelect2Enabled = (): boolean => {
  if (getActivePinia()) {
    return useConfigStore()?.settings?.overrideSelect2;
  }
  try {
    const vars = getVariables({ type: 'script', script_id: getScriptId() });
    return Config.parse(vars).overrideSelect2;
  } catch {
    return true;
  }
};

export const injectGlobalStyles = () => {
  $(`#${STYLE_ID}`).remove();
  let styleContent = DEFAULT_STYLE;

  if (getActivePinia()) {
    styleContent = useConfigStore()?.settings?.style ?? DEFAULT_STYLE;
  } else {
    styleContent = Config.parse(getVariables({ type: 'script', script_id: getScriptId() })).style ?? DEFAULT_STYLE;
  }
  $(`<style id="${STYLE_ID}">${styleContent}</style>`).appendTo('head');
};
