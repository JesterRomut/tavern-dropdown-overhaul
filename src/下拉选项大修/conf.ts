export const ACTIVE_CLASS = 'k3rn-dropdown-active';
export const DROPDOWN_ID = 'k3rn-dropdown-global';
export const STYLE_ID = `k3rn-dropdown-overhaul`;
export const EVENT_NAMESPACE = 'k3rn-dropdown-overhaul';
export const SCROLL_NAMESPACE = 'k3rn-dropdown-scroll';

export const SEARCH_THRESHOLD = 7; // 7是完美的数字哦 阿门

export const DEFAULT_STYLE = `
  #${DROPDOWN_ID} {
      margin: 0;
      position: fixed;
      z-index: 99999;
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
      background: rgba(0, 0, 0, 0.2);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      flex-shrink: 0;
  }

  #${DROPDOWN_ID} .search-input {
      width: 100%;
      padding: 6px 8px;
      border-radius: 4px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      background: rgba(0, 0, 0, 0.3);
      color: inherit;
      outline: none;
      font-size: 0.9em;
  }
  #${DROPDOWN_ID} .search-input:focus {
      border-color: var(--SmartThemeQuoteColor, #888);
      background: rgba(0, 0, 0, 0.5);
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
  }
  #${DROPDOWN_ID} .option-item:hover {
      background: rgba(128,128,128,0.1);
  }
  #${DROPDOWN_ID} .option-item.selected {
      background: rgba(128,128,128,0.2);
      font-weight: bold;
      border-left: 3px solid var(--SmartThemeQuoteColor, #888);
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

export const Config = z
  .object({
    style: z.string().default(DEFAULT_STYLE),
  })
  .prefault({});

export const useConfigStore = defineStore('settings', () => {
  const settings = ref(Config.parse(getVariables({ type: 'script', script_id: getScriptId() })));

  watchEffect(() => {
    insertOrAssignVariables(klona(settings.value), { type: 'script', script_id: getScriptId() });
    injectGlobalStyles();
  });

  return { settings };
});

export const injectGlobalStyles = () => {
  $(`#${STYLE_ID}`).remove();
  $(
    `<style id="${STYLE_ID}">${Config.parse(getVariables({ type: 'script', script_id: getScriptId() })).style ?? DEFAULT_STYLE}</style>`,
  ).appendTo('head');
};
