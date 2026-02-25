import { debounce } from 'lodash';

/* eslint-disable better-tailwindcss/no-duplicate-classes */
//const REPLACED_MARKER = 'k3rn-replaced';
const ACTIVE_CLASS = 'k3rn-trigger-active';
const DROPDOWN_ID = 'k3rn-global-dropdown';
const STYLE_ID = `k3rn-select-style`;
const SCROLL_NAMESPACE = 'k3rn-scroll';

const SEARCH_THRESHOLD = 7; // 7是完美的数字哦 阿门

// 1. 样式定义
const styles = `
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
      font-size: 14px;
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
      color: var(--SmartThemeBodyColor, #eee);
      font-style: italic;
      display: none;
  }
`;

const injectGlobalStyles = () => {
  $(`#${STYLE_ID}`).remove();
  $(`<style id="${STYLE_ID}">${styles}</style>`).appendTo('head');
};

const closeDropdown = () => {
  const $activeSelect = $(`.${ACTIVE_CLASS}`);
  if ($activeSelect.length) {
    $activeSelect.parents().add(document).off(`.${SCROLL_NAMESPACE}`);
    $activeSelect.removeClass(ACTIVE_CLASS);
  }
  $(`#${DROPDOWN_ID}`).remove();
};

const isMobile = () => window.innerWidth <= 768;

const openDropdown = ($select: JQuery<HTMLElement>) => {
  $select.addClass(ACTIVE_CLASS);

  const $parents = $select.parents().add(document);
  $parents.on(`scroll.${SCROLL_NAMESPACE}`, () => {
    closeDropdown();
  });

  const options = $select.find('option');
  const items: JQuery<HTMLElement>[] = [];

  // 1. 先构建选项列表，以便准确计算有效选项的数量
  options.each((_: number, opt: HTMLElement) => {
    const $opt = $(opt);
    if ($opt.css('display') === 'none') return;

    const text = $opt.text();
    const isSelected = $opt.is(':selected');
    const $item = $(`<div class="option-item ${isSelected ? 'selected' : ''}">${text}</div>`);

    $item.data('search-text', text.toLowerCase());

    $item.on('click', e => {
      e.stopPropagation();

      const value = $opt.val() ?? 'undefined';

      const nativeSelect = $select[0] as HTMLSelectElement; //这里采用native

      nativeSelect.value = value.toString();

      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
      $select.trigger('change');
      $opt.trigger('click');

      closeDropdown();
    });
    $item.on('mousedown touchstart touchend', e => e.stopPropagation());

    items.push($item);
  });

  // 2. 根据选项数量判断是否需要渲染搜索框
  const search = items.length > SEARCH_THRESHOLD;

  const $dropdown = $(`<div id="${DROPDOWN_ID}"></div>`);
  const $optionsList = $(`<div class="options-list"></div>`);
  const $noResults = $(`<div class="no-results">无结果</div>`);

  let $searchInput: JQuery<HTMLElement> | undefined;

  // 3. 条件组装 DOM 结构
  if (search) {
    const $searchWrapper = $(
      `<div class="search-wrapper"><input type="text" class="search-input" placeholder="搜索…" /></div>`,
    );
    $searchInput = $searchWrapper.find('input');

    // 搜索过滤逻辑 (仅在有搜索框时绑定)
    $searchInput.on(
      'input',
      debounce((e: any) => {
        const val = e.target.value.toLowerCase().trim();
        let somethingsHere = false;

        items.forEach($item => {
          const itemText = $item.data('search-text');
          if (!val || itemText.includes(val)) {
            $item.css('display', '');
            somethingsHere = true;
          } else {
            $item.css('display', 'none');
          }
        });

        if (somethingsHere) {
          $noResults.hide();
        } else {
          $noResults.show();
        }
      }, 200),
    );

    $searchInput.on('mousedown click touchstart touchend', e => e.stopPropagation());
    $dropdown.append($searchWrapper);
  }

  $optionsList.append(items).append($noResults);
  $dropdown.append($optionsList);
  //$('body').append($dropdown);

  const $closestDialog = $select.closest('dialog');
  if ($closestDialog.length) {
    $closestDialog.append($dropdown);
  } else {
    $('body').append($dropdown);
  }

  // 4. 定位计算
  const rect = $select[0].getBoundingClientRect();
  const scrollTop = $(window).scrollTop() || 0;
  const scrollLeft = $(window).scrollLeft() || 0;
  const windowHeight = $(window).height() || 0;

  const estimatedMaxHeight = 350;
  const spaceBelow = windowHeight - rect.bottom;

  let top = 0;
  if (spaceBelow < estimatedMaxHeight && rect.top > estimatedMaxHeight) {
    const actualHeight = $dropdown.outerHeight() ?? 300;
    top = rect.top + scrollTop - actualHeight - 4;
  } else {
    top = rect.bottom + scrollTop + 4;
  }

  const left = Math.max(4, rect.left + scrollLeft);

  $dropdown.css({
    top: top + 'px',
    left: left + 'px',
    minWidth: Math.max(rect.width, 200) + 'px',
  });

  // 5. 自动聚焦与滚动定位
  setTimeout(() => {
    // 只有在非移动端且启用了搜索框的情况下才去聚焦
    if (!isMobile() && $searchInput) {
      $searchInput.trigger('focus');
    }

    // 无论有没有搜索框，都保持滚动到选中项的逻辑
    const $selectedItem = $optionsList.find('.selected');
    if ($selectedItem.length) {
      $optionsList.scrollTop($selectedItem[0].offsetTop - $optionsList.height()! / 2);
    }
  }, 2);
};

// const processSelects = () => {
//   // 注意：如果脚本和DOM不在同一个window，请使用 $(window.parent.document).find(...)
//   const $root = window.parent.document ? $(window.parent.document) : $(document);

//   $root
//     .find('select')
//     .not(`[${REPLACED_MARKER}]`)
//     .each(function () {
//       const $select = $(this);
//       $select.attr(REPLACED_MARKER, 'true');
//       // 这里不再绑定 .on('mousedown')，交给全局委托处理
//     });
// };
// 2. 新增一个处理触发逻辑的函数，用于事件委托
const handleSelectTrigger = (e: JQuery.TriggeredEvent) => {
  // 确保是左键
  if (e.button !== 0) return;
  const target = e.currentTarget as HTMLElement;
  const $select = $(target);
  // 阻止原生菜单弹出
  e.preventDefault();
  e.stopPropagation(); // 防止冒泡给其他可能触发原生UI的脚本

  // 聚焦（为了保持键盘操作连贯性）
  target.focus();
  const isActive = $select.hasClass(ACTIVE_CLASS);
  if (isActive) {
    closeDropdown();
    return;
  }
  closeDropdown();
  openDropdown($select);
};
// 3. 修改 init 函数，使用事件委托
const init = () => {
  injectGlobalStyles();
  //processSelects();
  // 获取正确的上下文文档
  const targetDoc = window.parent.document || document;
  // === 核心修改：事件委托 ===
  // 监听 targetDoc 下所有 select 的 mousedown 事件
  // 这样即使 select 被销毁重建，只要它还是 select，就会触发这个处理函数
  $(targetDoc).on('mousedown', 'select', handleSelectTrigger);

  // 额外防御：同时阻止 click 事件的默认行为，防止漏网之鱼
  $(targetDoc).on('click', 'select', e => {
    // 如果不是我们的自定义下拉，或者为了确保原生不弹出
    e.preventDefault();
    // 如果 mousedown 没触发（极少见），可以在这里补救，但通常只需 preventDefault
  });
  // 键盘事件也可以委托
  $(targetDoc).on('keydown', 'select', function (e) {
    const $select = $(this);
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const isActive = $select.hasClass(ACTIVE_CLASS);
      closeDropdown();
      if (!isActive) openDropdown($select);
    }
  });
  // const observer = new MutationObserver(mutations => {
  //   // 即使使用了委托，我们可能仍需运行 processSelects 来打标记或做初始化处理
  //   // 但不再依赖它来绑定事件，所以不会有“僵尸属性”导致事件丢失的问题
  //   //if (mutations.some(mut => mut.addedNodes.length > 0)) processSelects();
  // });
  // observer.observe(targetDoc, { childList: true, subtree: true });
};

$(() => {
  init();

  window.parent.document.addEventListener('click', e => {
    if (!e.target) return;
    if ((e.target as Element).closest('select')?.length ?? -1 > 0) return;
    closeDropdown();
  });
});
