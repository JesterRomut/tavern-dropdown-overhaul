import { debounce } from 'lodash';

/* eslint-disable better-tailwindcss/no-duplicate-classes */
const REPLACED_MARKER = 'k3rn-replaced';
const TRIGGER_ACTIVE_CLASS = 'k3rn-trigger-active'; // 激活状态类
const DROPDOWN_ID = 'k3rn-global-dropdown';
const STYLE_ID = `k3rn-select-style`;
const SCROLL_NAMESPACE = 'k3rn-select-scroll'; // 用于滚动事件的命名空间

// 1. 样式定义
const styles = `
  #${DROPDOWN_ID} {
      position: absolute;
      z-index: 99999;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      max-height: 400px;
      display: flex;
      flex-direction: column;
      background: var(--SmartThemeBorderColor, #1a1a1a);
      color: var(--SmartThemeTextColor, #eee);
      border: 1px solid var(--SmartThemeBorderColor, #444);
      border-radius: 4px;
      font-size: 14px;
      overflow: hidden;
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
      font-size: 13px;
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
      background: rgba(255,255,255,0.1);
  }
  #${DROPDOWN_ID} .option-item.selected {
      background: rgba(255,255,255,0.15);
      font-weight: bold;
      border-left: 3px solid var(--SmartThemeQuoteColor, #888);
  }
  #${DROPDOWN_ID} .no-results {
      padding: 12px;
      text-align: center;
      color: rgba(255, 255, 255, 0.5);
      font-style: italic;
      display: none;
  }
`;

function injectGlobalStyles() {
  $(`#${STYLE_ID}`).remove();
  $(`<style id="${STYLE_ID}">${styles}</style>`).appendTo('head');
}

const init = () => {
  injectGlobalStyles();

  const closeDropdown = () => {
    // 1. 先处理事件清理：找到当前激活的 select
    const $activeSelect = $(`.${TRIGGER_ACTIVE_CLASS}`);
    if ($activeSelect.length) {
      // 移除该 select 所有父级元素上的滚动监听，避免内存泄漏和不必要的触发
      // add(window) 确保同时也移除了 window 上的监听
      $activeSelect.parents().add(document).off(`.${SCROLL_NAMESPACE}`);
      $activeSelect.removeClass(TRIGGER_ACTIVE_CLASS);
    }

    // 2. 移除 DOM
    $(`#${DROPDOWN_ID}`).remove();
  };

  const processSelects = () => {
    $('select')
      .not(`[${REPLACED_MARKER}]`)
      .each(function () {
        const $select = $(this);
        $select.attr(REPLACED_MARKER, 'true');

        $select.on('mousedown', function (e) {
          if (e.button !== 0) return;

          e.preventDefault();
          e.stopPropagation(); // 阻止冒泡，防止触发 document 的关闭事件
          this.focus();

          const isActive = $select.hasClass(TRIGGER_ACTIVE_CLASS);

          // 如果已经打开，再次点击则是关闭
          if (isActive) {
            closeDropdown();
            return;
          }

          // 关闭其他可能存在的下拉
          closeDropdown();

          openDropdown($select);
        });

        $select.on('keydown', function (e) {
          if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            const isActive = $select.hasClass(TRIGGER_ACTIVE_CLASS);
            closeDropdown();
            if (!isActive) openDropdown($select);
          }
        });
      });
  };

  const openDropdown = ($select: JQuery<HTMLElement>) => {
    $select.addClass(TRIGGER_ACTIVE_CLASS);

    // --- 新增功能：监听父级滚动 ---
    // 获取当前 select 的所有父级元素以及 window
    // 当父容器滚动时，下拉菜单位置会错位，因此需要关闭菜单
    const $parents = $select.parents().add(document);
    $parents.on(`scroll.${SCROLL_NAMESPACE}`, () => {
      closeDropdown();
    });
    // ---------------------------

    // 1. 构建基础结构
    const $dropdown = $(`<div id="${DROPDOWN_ID}"></div>`);
    const $searchWrapper = $(
      `<div class="search-wrapper"><input type="text" class="search-input" placeholder="搜索…" /></div>`,
    );
    const $optionsList = $(`<div class="options-list"></div>`);
    const $noResults = $(`<div class="no-results">无结果</div>`);

    const $searchInput = $searchWrapper.find('input');
    const options = $select.find('option');

    // 2. 构建选项列表 (使用 DocumentFragment 优化插入性能)
    const items: JQuery<HTMLElement>[] = [];

    options.each((_: number, opt: HTMLElement) => {
      const $opt = $(opt);
      if ($opt.css('display') === 'none') return;

      const text = $opt.text();
      const isSelected = $opt.is(':selected');

      const $item = $(`<div class="option-item ${isSelected ? 'selected' : ''}">${text}</div>`);

      // 性能关键：将搜索用的文本存入 data 属性
      $item.data('search-text', text.toLowerCase());

      $item.on('click', e => {
        // 阻止冒泡，防止触发 document 点击关闭，但我们需要先处理逻辑再关闭
        e.stopPropagation();
        $select.val($opt.val() ?? 'undefined');
        $select.trigger('change');
        closeDropdown();
      });
      // 防止在 item 上按下鼠标时触发 document 的关闭逻辑
      $item.on('mousedown touchstart touchend', e => e.stopPropagation());

      items.push($item);
    });

    $optionsList.append(items);
    $optionsList.append($noResults);
    $dropdown.append($searchWrapper).append($optionsList);
    $('body').append($dropdown);

    // 3. 搜索过滤逻辑
    $searchInput.on(
      'input',
      debounce((e: any) => {
        const val = e.target.value.toLowerCase().trim();
        let hasVisible = false;

        items.forEach($item => {
          const itemText = $item.data('search-text');
          if (!val || itemText.includes(val)) {
            $item.css('display', '');
            hasVisible = true;
          } else {
            $item.css('display', 'none');
          }
        });

        if (hasVisible) {
          $noResults.hide();
        } else {
          $noResults.show();
        }
      }, 200),
    );

    // 防止点击输入框导致 dropdown 关闭
    $searchInput.on('mousedown click touchstart touchend', e => e.stopPropagation());

    // 4. 定位计算
    const rect = $select[0].getBoundingClientRect();
    const scrollTop = $(window).scrollTop() || 0;
    const scrollLeft = $(window).scrollLeft() || 0;
    const windowHeight = $(window).height() || 0;

    const estimatedMaxHeight = 350;
    const spaceBelow = windowHeight - rect.bottom;

    let top = 0;
    if (spaceBelow < estimatedMaxHeight && rect.top > estimatedMaxHeight) {
      // 向上展开
      const actualHeight = $dropdown.outerHeight() ?? 300;
      top = rect.top + scrollTop - actualHeight - 4;
    } else {
      // 向下展开
      top = rect.bottom + scrollTop + 4;
    }

    const left = Math.max(4, rect.left + scrollLeft);

    $dropdown.css({
      top: top + 'px',
      left: left + 'px',
      minWidth: Math.max(rect.width, 200) + 'px',
    });

    // 5. 自动聚焦搜索框
    setTimeout(() => {
      $searchInput.trigger('focus');
      const $selectedItem = $optionsList.find('.selected');
      if ($selectedItem.length) {
        $optionsList.scrollTop($selectedItem[0].offsetTop - $optionsList.height()! / 2);
      }
    }, 10);
  };

  // 全局点击关闭
  // 使用 document 而不是 window，兼容性更好
  $(document).on('mousedown', () => {
    // 这里的逻辑是：
    // Trigger 的 mousedown 阻止了冒泡，不会到这里
    // Dropdown 内部的 mousedown 也阻止了冒泡，不会到这里
    // 所以只要代码执行到这里，说明点击在了外部
    closeDropdown();
  });

  processSelects();

  const observer = new MutationObserver(mutations => {
    let needsProcess = false;
    for (const mut of mutations) {
      if (mut.addedNodes.length > 0) {
        needsProcess = true;
        break;
      }
    }
    if (needsProcess) processSelects();
  });

  observer.observe(document.body, { childList: true, subtree: true });
};

$(() => {
  init();
});
