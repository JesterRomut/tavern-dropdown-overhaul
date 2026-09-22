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

const isMobile = () => Math.min(window.screen.width, window.outerWidth) <= 500;

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

const handleSelectTrigger = (e: JQuery.TriggeredEvent) => {
  if (e.button !== 0) return;
  const target = e.currentTarget as HTMLElement;
  const $select = $(target);

  if ($select.is(':disabled') || Boolean($select.prop('disabled'))) {
    return;
  }

  // 如果已被 Select2 接管，跳过 mousedown，交由 select2 专属逻辑处理
  if ($select.hasClass('select2-hidden-accessible') || Boolean($select.data('select2'))) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  const isActive = $select.hasClass(ACTIVE_CLASS);
  closeDropdown();
  if (!isActive) {
    openDropdown($select, $select);
  }
};

const init = () => {
  injectGlobalStyles();
  const targetDoc = getTargetDoc();

  // 1. 全面接管所有 Select2 下拉框（包括单选、多选及第三方插件/预设转换的 Select2）
  let isUnselecting = false;
  $(targetDoc).on(`select2:unselect.${EVENT_NAMESPACE}`, SELECT2_SELECTOR, () => {
    isUnselecting = true;
    setTimeout(() => {
      isUnselecting = false;
    }, 100);
  });

  $(targetDoc).on(`select2:opening.${EVENT_NAMESPACE}`, SELECT2_SELECTOR, function (e) {
    const $select = $(this);
    if ($select.is(':disabled') || Boolean($select.prop('disabled'))) {
      return;
    }

    e.preventDefault();
    if (isUnselecting) {
      isUnselecting = false;
      return;
    }

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

  // 2. 原生单选 select 触发拦截（排除已初始化 Select2 的元素）
  $(targetDoc).on(`mousedown.${EVENT_NAMESPACE}`, 'select:not([multiple])', handleSelectTrigger);

  $(targetDoc).on(`click.${EVENT_NAMESPACE}`, 'select:not([multiple])', function (e) {
    const $select = $(this);
    if (!$select.hasClass('select2-hidden-accessible') && !$select.data('select2')) {
      e.preventDefault();
    }
  });

  // 3. 原生单选 select 键盘交互（空格与回车展开）
  $(targetDoc).on(`keydown.${EVENT_NAMESPACE}`, 'select:not([multiple])', function (e) {
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

  $(window).on('pagehide', () => {
    closeDropdown();
    $(`#${STYLE_ID}`).remove();
    $(targetDoc).off(`.${EVENT_NAMESPACE}`);
    $(targetDoc).off(`.${SCROLL_NAMESPACE}`);
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
