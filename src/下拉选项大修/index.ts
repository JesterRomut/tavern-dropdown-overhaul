import { debounce } from 'lodash';

import { createScriptIdDiv, teleportStyle } from '@util/script';
import {
  ACTIVE_CLASS,
  DROPDOWN_ID,
  EVENT_NAMESPACE,
  injectGlobalStyles,
  isConvertMultiToSelect2Enabled,
  isTakeOverSelect2Enabled,
  SCROLL_NAMESPACE,
  SEARCH_THRESHOLD,
  STYLE_ID,
  useConfigStore,
} from './conf';
import view from './conf_view.vue';
import { buildDropdownOptions } from './options';
import { mountAndPositionDropdown } from './position';

export const getTargetDoc = (): Document => {
  try {
    if (window.parent && window.parent.document) {
      return window.parent.document;
    }
  } catch (_) {
    // 忽略跨域 parent 访问限制
  }
  return document;
};

// 匹配所有 Select2 的底层原生 select 元素
const SELECT2_SELECTOR = 'select';

const revertAutoMultiSelects = (root: Document | HTMLElement = getTargetDoc()) => {
  $(root)
    .find('select[data-auto-select2]')
    .each((_, el) => {
      const $el = $(el);
      if ($el.data('select2')) {
        ($el as any).select2('destroy');
      }
      $el.removeAttr('data-auto-select2');
    });
};

const closeDropdown = () => {
  const doc = getTargetDoc();

  // 仅解绑独立的滚动监听，绝对不能碰 EVENT_NAMESPACE
  $(window).add(doc).add(document).find('*').off(`.${SCROLL_NAMESPACE}`);
  $(window).add(doc).add(document).off(`.${SCROLL_NAMESPACE}`);

  const $active = $(doc).find(`.${ACTIVE_CLASS}`).add(`.${ACTIVE_CLASS}`);
  if ($active.length) {
    $active.removeClass(ACTIVE_CLASS);
  }

  $(doc).find('select').off(`.${EVENT_NAMESPACE}-sync`);
  $('select').off(`.${EVENT_NAMESPACE}-sync`);
  $(doc).find(`#${DROPDOWN_ID}`).remove();
  $(`#${DROPDOWN_ID}`).remove();
};

const isMobile = () => (SillyTavern.isMobile() ? true : Math.min(window.screen.width, window.outerWidth) <= 500);

const openDropdown = ($select: JQuery<HTMLElement>, $anchorInput?: JQuery<HTMLElement>) => {
  const doc = getTargetDoc();
  const select2 = $select.data('select2');
  const $anchor = $anchorInput || select2?.$container || $select;
  const isMulti = Boolean($select.prop('multiple') || $select.is('[multiple]'));

  $select.addClass(ACTIVE_CLASS);
  $anchor.addClass(ACTIVE_CLASS);

  // 防抖延迟绑定 scroll，使用独立 SCROLL_NAMESPACE，防止在 DOM 挂载和 focus 时同步触发微小 scroll 导致误关
  setTimeout(() => {
    if (!$select.hasClass(ACTIVE_CLASS)) return;

    const $parents = $anchor.parents().add(doc).add(window);
    $parents.on(`scroll.${SCROLL_NAMESPACE}`, (e: JQuery.TriggeredEvent) => {
      if ($(e.target).closest(`#${DROPDOWN_ID}`).length) return;
      closeDropdown();
    });
  }, 50);

  const { items, validOptionCount, syncState } = buildDropdownOptions($select, () => {
    closeDropdown();
  });

  // 监听外部 change 同步状态（例如外部点击 Select2 Chip 删除按钮时）
  $select.off(`.${EVENT_NAMESPACE}-sync`).on(`change.${EVENT_NAMESPACE}-sync`, () => {
    syncState();
  });

  const search = validOptionCount > SEARCH_THRESHOLD;

  const $dropdown = $(`<div id="${DROPDOWN_ID}" class="${isMulti ? 'is-multi' : ''}"></div>`);
  // 阻止下拉框内的所有点击冒泡到 document 触发关闭
  $dropdown.on('click mousedown touchstart', e => e.stopPropagation());

  const $optionsList = $(`<div class="options-list"></div>`);
  const $noResults = $(`<div class="no-results">无结果</div>`);

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
          const itemText = $item.data('search-text') || '';
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

  mountAndPositionDropdown($dropdown, $anchor, $select);

  setTimeout(() => {
    const $selectedItem = $optionsList.find('.selected').first();
    if ($selectedItem.length) {
      $optionsList.scrollTop($selectedItem[0].offsetTop - $optionsList.height()! / 2);
    }
  }, 10);
};

const enhanceMultiSelect = ($select: JQuery<HTMLElement>): boolean => {
  if (!isConvertMultiToSelect2Enabled()) return false;
  if ($select.hasClass('select2-hidden-accessible') || Boolean($select.data('select2'))) return false;
  if (typeof ($select as any).select2 !== 'function') return false;
  if ($select.is(':hidden')) return false;

  const isMulti = Boolean($select.prop('multiple') || $select.is('[multiple]'));
  if (!isMulti) return false;

  const placeholder = $select.attr('placeholder') || $select.attr('data-i18n') || '点击选择...';

  const $dialog = $select.closest('dialog');
  $select.attr('data-auto-select2', 'true');
  ($select as any).select2({
    width: '100%',
    placeholder,
    allowClear: true,
    closeOnSelect: false,
    ...($dialog.length ? { dropdownParent: $dialog } : {}),
  });
  return true;
};

let lastTriggerTime = 0;

const handleSelectTrigger = (e: JQuery.TriggeredEvent) => {
  if (e.button !== undefined && e.button !== 0) return;
  const target = e.currentTarget as HTMLElement;
  const $select = $(target);

  if ($select.is(':disabled') || Boolean($select.prop('disabled'))) {
    return;
  }

  // 若开启多选转换且为原生多选框，先行执行提升
  if (enhanceMultiSelect($select)) {
    e.preventDefault();
    e.stopPropagation();
    const select2 = $select.data('select2');
    const $anchor = select2?.$container || $select.next('.select2-container') || $select;
    const isActive = $select.hasClass(ACTIVE_CLASS);
    closeDropdown();
    if (!isActive) {
      $anchor.find('input, textarea').trigger('blur');
      openDropdown($select, $anchor);
    }
    return;
  }

  // 如果已被 Select2 接管，跳过，交由 select2 专属逻辑处理
  if ($select.hasClass('select2-hidden-accessible') || Boolean($select.data('select2'))) {
    return;
  }

  // 只要是原生 select，无条件阻止默认事件，杜绝系统原生菜单呼出
  e.preventDefault();
  e.stopPropagation();

  const isActive = $select.hasClass(ACTIVE_CLASS);
  closeDropdown();
  if (!isActive) {
    $select.trigger('blur');
    openDropdown($select, $select);
  }
};

const init = () => {
  injectGlobalStyles();
  const targetDoc = getTargetDoc();

  // 1. 全面接管所有 Select2 下拉框（包括单选、多选及第三方插件/预设转换的 Select2）
  let isUnselecting = false;
  let isClickingChoice = false;
  $(targetDoc).on(`select2:unselect.${EVENT_NAMESPACE}`, SELECT2_SELECTOR, () => {
    if (!isTakeOverSelect2Enabled()) {
      return;
    }
    isUnselecting = true;
    setTimeout(() => {
      isUnselecting = false;
    }, 100);
  });

  $(targetDoc).on(`select2:opening.${EVENT_NAMESPACE}`, SELECT2_SELECTOR, function (e) {
    if (!isTakeOverSelect2Enabled()) {
      return;
    }
    const $select = $(this);
    if ($select.is(':disabled') || Boolean($select.prop('disabled'))) {
      return;
    }

    e.preventDefault();
    if (isUnselecting) {
      isUnselecting = false;
      return;
    }
    if (isClickingChoice) {
      isClickingChoice = false;
      return;
    }

    const now = Date.now();
    if (now - lastTriggerTime < 250) {
      return;
    }
    lastTriggerTime = now;

    const select2 = $select.data('select2');
    const $anchor = select2?.$container || $select.next('.select2-container') || $select;

    const isActive = $select.hasClass(ACTIVE_CLASS);
    closeDropdown();
    if (!isActive) {
      // 触发失焦，隐藏 Select2 内部的闪烁光标
      $anchor.find('input, textarea').trigger('blur');
      openDropdown($select, $anchor);
    }
  });

  // 1.1 直接拦截 .select2-container 的交互，保障触屏与点击即时响应
  $(targetDoc).on(`pointerdown.${EVENT_NAMESPACE} mousedown.${EVENT_NAMESPACE}`, '.select2-container', function (e) {
    if (!isTakeOverSelect2Enabled()) {
      return;
    }
    if ($(e.target).closest('.select2-selection__choice__remove').length) {
      return;
    }
    // 点击已选胶囊卡片（如全局世界书卡片打开对应世界书），放行原生交互且不打开下拉菜单
    if ($(e.target).closest('.select2-selection__choice').length) {
      isClickingChoice = true;
      closeDropdown();
      setTimeout(() => {
        isClickingChoice = false;
      }, 200);
      return;
    }

    const $container = $(this);
    const $select = $container.prev('select');
    if (!$select.length || $select.is(':disabled') || Boolean($select.prop('disabled'))) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    if (now - lastTriggerTime < 250) {
      return;
    }
    lastTriggerTime = now;

    const isActive = $select.hasClass(ACTIVE_CLASS);
    closeDropdown();
    if (!isActive) {
      $container.find('input, textarea').trigger('blur');
      openDropdown($select, $container);
    }
  });

  // 2. 原生 select（单选与多选）触发拦截：pointerdown 唯一触发（无时间锁），mousedown 与 click 绝对拦截
  $(targetDoc).on(`pointerdown.${EVENT_NAMESPACE}`, 'select', handleSelectTrigger);

  $(targetDoc).on(`mousedown.${EVENT_NAMESPACE} click.${EVENT_NAMESPACE}`, 'select', function (e) {
    const $select = $(this);
    if (!$select.hasClass('select2-hidden-accessible') && !$select.data('select2')) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // 3. 原生 select 键盘交互（空格与回车展开）
  $(targetDoc).on(`keydown.${EVENT_NAMESPACE}`, 'select', function (e) {
    if (e.key === ' ' || e.key === 'Enter') {
      const $select = $(this);
      if ($select.hasClass('select2-hidden-accessible') || Boolean($select.data('select2'))) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const isActive = $select.hasClass(ACTIVE_CLASS);
      closeDropdown();
      if (!isActive) openDropdown($select, $select);
    }
  });

  // 4. 全局 ESC 按键支持
  $(targetDoc).on(`keydown.${EVENT_NAMESPACE}`, e => {
    if (e.key === 'Escape') {
      closeDropdown();
    }
  });

  // 5. 点击外部关闭逻辑（排除当前激活锚点与自定义浮层内部）
  $(targetDoc).on(`click.${EVENT_NAMESPACE}`, e => {
    const $target = $(e.target);
    const $activeAnchor = $(targetDoc).find(`.${ACTIVE_CLASS}`);
    const nativeEvt = e.originalEvent as MouseEvent | undefined;
    const path = nativeEvt?.composedPath ? nativeEvt.composedPath() : [];

    const isInsideDropdown = Boolean(
      $target.closest(`#${DROPDOWN_ID}`).length || path.some(node => (node as HTMLElement)?.id === DROPDOWN_ID),
    );
    const isDetachedSelect2Node =
      !e.target.isConnected &&
      Boolean(
        $target.is('.select2-selection__choice, .select2-selection__choice *, .select2-container *') ||
        $target.closest('.select2-container, .select2-selection__choice').length ||
        path.some(node => {
          const el = node as HTMLElement;
          return (
            el?.classList &&
            (el.classList.contains('select2-selection__choice') ||
              el.classList.contains('select2-container') ||
              el.classList.contains('select2-selection__choice__remove'))
          );
        }),
      );

    const isInsideAnchor = Boolean(
      ($activeAnchor.length && $target.closest($activeAnchor).length) ||
      ($activeAnchor[0] && path.includes($activeAnchor[0])) ||
      isDetachedSelect2Node,
    );

    if (isInsideDropdown || isInsideAnchor) {
      return;
    }
    closeDropdown();
  });

  const scanAndEnhance = (root: Document | HTMLElement = targetDoc) => {
    if (!isConvertMultiToSelect2Enabled()) return;
    $(root)
      .find('select[multiple]')
      .each((_, el) => {
        enhanceMultiSelect($(el));
      });
  };

  scanAndEnhance(targetDoc);

  const observer = new MutationObserver(mutations => {
    if (!isConvertMultiToSelect2Enabled()) return;
    for (const mutation of mutations) {
      for (const node of Array.from(mutation.addedNodes)) {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement;
          if (el.tagName === 'SELECT' && (el as HTMLSelectElement).multiple) {
            enhanceMultiSelect($(el));
          } else {
            $(el)
              .find('select[multiple]')
              .each((_, s) => {
                enhanceMultiSelect($(s));
              });
          }
        }
      }
    }
  });

  const observeTarget = targetDoc.body || targetDoc.documentElement;
  if (observeTarget) {
    observer.observe(observeTarget, {
      childList: true,
      subtree: true,
    });
  }

  $(window).on('pagehide', () => {
    observer.disconnect();
    closeDropdown();
    revertAutoMultiSelects(targetDoc);
    $(`#${STYLE_ID}`).remove();
    $(targetDoc).off(`.${EVENT_NAMESPACE}`);
    $(targetDoc).off(`.${SCROLL_NAMESPACE}`);
    $(`.${ACTIVE_CLASS}`).removeClass(ACTIVE_CLASS);
  });

  const app = createApp(view).use(createPinia());
  const $app = createScriptIdDiv().appendTo('#extensions_settings2');
  app.mount($app[0]);

  const store = useConfigStore();
  watch(
    () => store.settings.convertMultiToSelect2,
    enabled => {
      if (!enabled) {
        revertAutoMultiSelects(targetDoc);
      } else {
        scanAndEnhance(targetDoc);
      }
    },
  );

  const { destroy } = teleportStyle();

  $(window).on('pagehide', () => {
    app.unmount();
    $app.remove();
    destroy();
  });
};

$(init);
