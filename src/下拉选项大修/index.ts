import { debounce } from 'lodash';

import { createScriptIdDiv, teleportStyle } from '@util/script';
import {
  ACTIVE_CLASS,
  DROPDOWN_ID,
  EVENT_NAMESPACE,
  injectGlobalStyles,
  SCROLL_NAMESPACE,
  SEARCH_THRESHOLD,
  STYLE_ID,
} from './conf';
import view from './conf_view.vue';

//const REPLACED_MARKER = 'k3rn-replaced';

const closeDropdown = () => {
  const $activeSelect = $(`.${ACTIVE_CLASS}`);
  if ($activeSelect.length) {
    $activeSelect.parents().add(document).off(`.${SCROLL_NAMESPACE}`);
    $activeSelect.removeClass(ACTIVE_CLASS);
  }
  $(`#${DROPDOWN_ID}`).remove();
};

const isMobile = () => Math.min(window.screen.width, window.outerWidth) <= 500;

const openDropdown = ($select: JQuery<HTMLElement>) => {
  $select.addClass(ACTIVE_CLASS);

  const $parents = $select.parents().add(document);
  $parents.on(`scroll.${EVENT_NAMESPACE}`, () => {
    closeDropdown();
  });

  //const options = $select.find('option');
  const items: JQuery<HTMLElement>[] = [];
  let validOptionCount = 0;
  // 抽离出来的单个 Option 处理逻辑
  const processOption = ($opt: JQuery<HTMLElement>, $groupHeader?: JQuery<HTMLElement>) => {
    if ($opt.css('display') === 'none') return;
    validOptionCount++;
    const text = $opt.text();
    const isSelected = $opt.is(':selected');
    const groupedClass = $groupHeader ? 'grouped' : '';
    const $item = $(`<div class="option-item ${groupedClass} ${isSelected ? 'selected' : ''}">${text}</div>`);
    // 记录元数据供搜索用
    $item.data('type', 'option');
    $item.data('search-text', text.toLowerCase());
    if ($groupHeader) {
      $item.data('group-header', $groupHeader);
    }
    $item.on('click', e => {
      e.stopPropagation();
      const value = $opt.val() ?? 'undefined';
      const nativeSelect = $select[0] as HTMLSelectElement; // 这里采用native
      nativeSelect.value = value.toString();
      nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
      $select.trigger('change');
      $opt.trigger('click');
      closeDropdown();
    });
    $item.on('mousedown touchstart touchend', e => e.stopPropagation());
    items.push($item);
  };

  // 1. 构建选项列表，支持 optgroup 渲染
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
  const $optionsList = $(`<div class="options-list"></div>`);
  const $noResults = $(`<div class="no-results">无结果</div>`);

  //let $searchInput: JQuery<HTMLElement> | undefined;

  // 3. 条件组装 DOM 结构
  if (search) {
    const $searchWrapper = $(
      `<div class="search-wrapper"><input type="text" class="search-input" placeholder="搜索…" /></div>`,
    );
    const $searchInput = $searchWrapper.find('input');

    // 搜索过滤逻辑 (仅在有搜索框时绑定)
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

            // 搜索命中时，同步将该选项对应的组标题展示出来
            if (val) {
              const $gh = $item.data('group-header');
              if ($gh) $gh.css('display', '');
            }
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

    setTimeout(() => {
      if (isMobile()) return;
      $searchInput[0].focus();
      $searchInput.trigger('focus');
    }, 6);
  }

  $optionsList.append(items).append($noResults);
  $dropdown.append($optionsList);
  //$('body').append($dropdown);

  const $dialog = $select.closest('dialog');
  if ($dialog.length) {
    $dialog.append($dropdown);
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

  setTimeout(() => {
    const $selectedItem = $optionsList.find('.selected');
    if ($selectedItem.length) {
      $optionsList.scrollTop($selectedItem[0].offsetTop - $optionsList.height()! / 2); //滚一滚
    }
  }, 7); //依旧7是最完美的数字
};

const handleSelectTrigger = (e: JQuery.TriggeredEvent) => {
  // 确保是左键
  if (e.button !== 0) return;
  const target = e.currentTarget as HTMLElement;
  const $select = $(target);

  e.preventDefault();
  e.stopPropagation();

  // 聚焦（为了保持键盘操作连贯性）
  //target.focus();
  const isActive = $select.hasClass(ACTIVE_CLASS);
  if (isActive) {
    closeDropdown();
    return;
  }
  closeDropdown();
  openDropdown($select);
};

// 使用事件委托
const init = () => {
  injectGlobalStyles();
  const targetDoc = window.parent.document || document;
  $(targetDoc).on(`mousedown.${EVENT_NAMESPACE}`, 'select', handleSelectTrigger);

  $(targetDoc).on(`click.${EVENT_NAMESPACE}`, 'select', e => {
    e.preventDefault();
    // 如果 mousedown 没触发（极少见），可以在这里补救，但通常只需 preventDefault
  });

  // 键盘事件也可以委托
  $(targetDoc).on(`keydown.${EVENT_NAMESPACE}`, 'select', function (e) {
    const $select = $(this);
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
      const isActive = $select.hasClass(ACTIVE_CLASS);
      closeDropdown();
      if (!isActive) openDropdown($select);
    }
  });

  $(targetDoc).on(`click.${EVENT_NAMESPACE}`, e => {
    if (!e.target) return;
    if ((e.target as any).closest('select')?.length ?? -1 > 0) return;
    closeDropdown();
  });

  $(window).on('pagehide', cleanup);
};

const cleanup = () => {
  const doc = window.parent.document || document;

  closeDropdown();
  $(`#${STYLE_ID}`).remove();
  $(doc).off(`.${EVENT_NAMESPACE}`);

  $(`.${ACTIVE_CLASS}`).removeClass(ACTIVE_CLASS);
};

$(init);

$(() => {
  const app = createApp(view).use(createPinia());

  const $app = createScriptIdDiv().appendTo('#extensions_settings2');
  app.mount($app[0]);

  const { destroy } = teleportStyle();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
});
