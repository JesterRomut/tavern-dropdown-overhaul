import { debounce } from 'lodash';

import { createScriptIdDiv, teleportStyle } from '@util/script';
import { ACTIVE_CLASS, DROPDOWN_ID, EVENT_NAMESPACE, injectGlobalStyles, SEARCH_THRESHOLD, STYLE_ID } from './conf';
import view from './conf_view.vue';

const closeDropdown = () => {
  const $activeSelect = $(`.${ACTIVE_CLASS}`);
  if ($activeSelect.length) {
    // 修复 1：统一使用 EVENT_NAMESPACE 解绑所有相关父级事件
    $activeSelect.parents().add(document).off(`.${EVENT_NAMESPACE}`);
    $activeSelect.removeClass(ACTIVE_CLASS);
  }
  $(`#${DROPDOWN_ID}`).remove();
};

const isMobile = () => Math.min(window.screen.width, window.outerWidth) <= 500;

const openDropdown = ($select: JQuery<HTMLElement>) => {
  $select.addClass(ACTIVE_CLASS);

  // 修复 2：防止 Firefox 在 DOM 挂载和 focus 时同步触发 scroll 导致刚打开就秒关
  setTimeout(() => {
    // 仅在菜单还存在时绑定
    if (!$select.hasClass(ACTIVE_CLASS)) return;

    const $parents = $select.parents().add(document);
    $parents.on(`scroll.${EVENT_NAMESPACE}`, e => {
      // 如果滚动发生在下拉框自身的选项列表内，不关闭
      if ($(e.target).closest(`#${DROPDOWN_ID}`).length) return;
      closeDropdown();
    });
  }, 50);

  const items: JQuery<HTMLElement>[] = [];
  let validOptionCount = 0;

  // 单个 Option 处理逻辑
  const processOption = ($opt: JQuery<HTMLElement>, $groupHeader?: JQuery<HTMLElement>) => {
    if ($opt.css('display') === 'none') return;
    validOptionCount++;
    const text = $opt.text();
    const isSelected = $opt.is(':selected');
    const groupedClass = $groupHeader ? 'grouped' : '';
    const $item = $(`<div class="option-item ${groupedClass} ${isSelected ? 'selected' : ''}">${text}</div>`);

    $item.data('type', 'option');
    $item.data('search-text', text.toLowerCase());
    if ($groupHeader) {
      $item.data('group-header', $groupHeader);
    }
    $item.on('click', e => {
      e.stopPropagation();
      const value = $opt.val() ?? 'undefined';
      const nativeSelect = $select[0] as HTMLSelectElement;
      nativeSelect.value = value.toString();
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
      $opt.trigger('click');
      closeDropdown();
    });
    $item.on('mousedown touchstart touchend', e => e.stopPropagation());
    items.push($item);
  };

  // 1. 构建选项列表
  $select.children().each((_, child) => {
    const $child = $(child);
    if (child.tagName.toLowerCase() === 'optgroup') {
      const label = $child.attr('label') || '';
      const $groupHeader = $(`<div class="optgroup-header">${label}</div>`);
      $groupHeader.data('type', 'optgroup');

      items.push($groupHeader);
      const countBefore = validOptionCount;
      $child.children('option').each((_, opt) => processOption($(opt), $groupHeader));

      if (validOptionCount === countBefore) {
        items.pop();
      }
      return;
    }
    processOption($child);
  });

  const search = validOptionCount > SEARCH_THRESHOLD;

  const $dropdown = $(`<div id="${DROPDOWN_ID}"></div>`);
  // 阻止下拉框内的所有点击冒泡到 document 触发关闭
  $dropdown.on('click mousedown touchstart', e => e.stopPropagation());

  const $optionsList = $(`<div class="options-list"></div>`);
  const $noResults = $(`<div class="no-results">无结果</div>`);

  // 2. 组装 DOM
  if (search) {
    const $searchWrapper = $(
      `<div class="search-wrapper"><input type="text" class="search-input" placeholder="搜索…" /></div>`,
    );
    const $searchInput = $searchWrapper.find('input');

    $searchInput.on(
      'input',
      debounce((e: any) => {
        const val = e.target.value.toLowerCase().trim();
        let somethingsHere = false;

        items.forEach($item => {
          if ($item.data('type') === 'optgroup') {
            $item.css('display', val ? 'none' : '');
            return;
          }
          const itemText = $item.data('search-text');
          if (!val || itemText.includes(val)) {
            $item.css('display', '');
            somethingsHere = true;
            if (val) {
              const $gh = $item.data('group-header');
              if ($gh) $gh.css('display', '');
            }
          } else {
            $item.css('display', 'none');
          }
        });

        $noResults.toggle(!somethingsHere);
      }, 200),
    );

    $dropdown.append($searchWrapper);

    setTimeout(() => {
      if (isMobile()) return;
      // preventScroll 避免 Firefox 滚动容器
      $searchInput[0]?.focus({ preventScroll: true });
    }, 20);
  }

  $optionsList.append(items).append($noResults);
  $dropdown.append($optionsList);

  const $dialog = $select.closest('dialog');
  const rect = $select[0].getBoundingClientRect();
  const windowHeight = $(window).height() || 0;
  const estimatedMaxHeight = 350;
  const spaceBelow = windowHeight - rect.bottom;
  let top = 0;
  let left = 0;

  // 3. 定位计算
  if ($dialog.length) {
    $dialog.append($dropdown);
    const actualHeight = $dropdown.outerHeight() ?? 300;
    const dialogRect = $dialog[0].getBoundingClientRect();
    const dialogScrollTop = $dialog.scrollTop() || 0;
    const dialogScrollLeft = $dialog.scrollLeft() || 0;

    const baseTop = rect.top - dialogRect.top + dialogScrollTop;
    const baseLeft = rect.left - dialogRect.left + dialogScrollLeft;
    if (spaceBelow < estimatedMaxHeight && rect.top > estimatedMaxHeight) {
      top = baseTop - actualHeight - 4;
    } else {
      top = baseTop + rect.height + 4;
    }
    left = Math.max(4, baseLeft);
  } else {
    $('body').append($dropdown);
    const actualHeight = $dropdown.outerHeight() ?? 300;
    const scrollTop = $(window).scrollTop() || 0;
    const scrollLeft = $(window).scrollLeft() || 0;
    if (spaceBelow < estimatedMaxHeight && rect.top > estimatedMaxHeight) {
      top = rect.top + scrollTop - actualHeight - 4;
    } else {
      top = rect.bottom + scrollTop + 4;
    }
    left = Math.max(4, rect.left + scrollLeft);
  }

  $dropdown.css({
    top: `${top}px`,
    left: `${left}px`,
    minWidth: `${Math.max(rect.width, 200)}px`,
  });

  setTimeout(() => {
    const $selectedItem = $optionsList.find('.selected');
    if ($selectedItem.length) {
      $optionsList.scrollTop($selectedItem[0].offsetTop - $optionsList.height()! / 2);
    }
  }, 10);
};

const handleSelectTrigger = (e: JQuery.TriggeredEvent) => {
  if (e.button !== 0) return;
  const target = e.currentTarget as HTMLElement;
  const $select = $(target);

  e.preventDefault();
  e.stopPropagation();

  const isActive = $select.hasClass(ACTIVE_CLASS);
  closeDropdown();
  if (!isActive) {
    openDropdown($select);
  }
};

const init = () => {
  injectGlobalStyles();
  let targetDoc: Document = document;
  try {
    if (window.parent && window.parent.document) {
      targetDoc = window.parent.document;
    }
  } catch (_) {
    // 忽略跨域 parent 访问限制
  }

  // 绑定原生 select 触发
  $(targetDoc).on(`mousedown.${EVENT_NAMESPACE}`, 'select:not([multiple])', handleSelectTrigger);

  $(targetDoc).on(`click.${EVENT_NAMESPACE}`, 'select:not([multiple])', e => {
    e.preventDefault();
  });

  $(targetDoc).on(`keydown.${EVENT_NAMESPACE}`, 'select:not([multiple])', function (e) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const $select = $(this);
      const isActive = $select.hasClass(ACTIVE_CLASS);
      closeDropdown();
      if (!isActive) openDropdown($select);
    }
  });

  // 修复 3：精准判断点击外部关闭逻辑
  $(targetDoc).on(`click.${EVENT_NAMESPACE}`, e => {
    const $target = $(e.target);
    // 如果点击的不是 select 且不是我们自定义的下拉菜单内部，则关闭
    if (!$target.closest(`select, #${DROPDOWN_ID}`).length) {
      closeDropdown();
    }
  });

  $(window).on('pagehide', () => {
    closeDropdown();
    $(`#${STYLE_ID}`).remove();
    $(targetDoc).off(`.${EVENT_NAMESPACE}`);
    $(`.${ACTIVE_CLASS}`).removeClass(ACTIVE_CLASS);
  });

  const app = createApp(view).use(createPinia());
  const $app = createScriptIdDiv().appendTo('#extensions_settings2');
  app.mount($app[0]);

  const { destroy } = teleportStyle();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
};

$(init);
