export interface ProcessedOptionItem {
  $el: JQuery<HTMLElement>;
  type: 'option' | 'optgroup';
  searchText?: string;
  $groupHeader?: JQuery<HTMLElement>;
}

export interface BuildOptionsResult {
  items: JQuery<HTMLElement>[];
  validOptionCount: number;
  syncState: () => void;
}

/**
 * 解析原生 <select> 内部的所有 option 和 optgroup，构建美化下拉选项列表
 * 统一处理单选与多选的选择、回写与事件派发机制
 */
export const buildDropdownOptions = (
  $select: JQuery<HTMLElement>,
  onSingleSelectDone: () => void,
): BuildOptionsResult => {
  const isMulti = Boolean($select.prop('multiple') || $select.is('[multiple]'));
  const items: JQuery<HTMLElement>[] = [];
  const optionMap = new Map<HTMLOptionElement, JQuery<HTMLElement>>();
  let validOptionCount = 0;

  const processOption = ($opt: JQuery<HTMLElement>, $groupHeader?: JQuery<HTMLElement>) => {
    if (!$opt[0] || $opt[0].tagName?.toLowerCase() !== 'option') return;
    if ($opt.css('display') === 'none') return;
    validOptionCount++;

    const text = $opt.text();
    const isSelected = $opt.is(':selected');
    const isDisabled = $opt.is(':disabled') || Boolean($opt.prop('disabled'));
    const groupedClass = $groupHeader ? 'grouped' : '';
    const $item = $(
      `<div class="option-item ${groupedClass} ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}"><span class="option-text">${text}</span></div>`,
    );

    $item.data('type', 'option');
    $item.data('search-text', text.toLowerCase());
    if ($groupHeader) {
      $item.data('group-header', $groupHeader);
    }

    const nativeOpt = $opt[0] as HTMLOptionElement;
    optionMap.set(nativeOpt, $item);

    $item.on('click', (e: JQuery.TriggeredEvent) => {
      e.stopPropagation();
      if (isDisabled) return;
      const nativeSelect = $select[0] as HTMLSelectElement;

      if (isMulti) {
        // 多选模式：切换当前状态，不关闭下拉面板
        const willSelect = !nativeOpt.selected;
        nativeOpt.selected = willSelect;
        $opt.prop('selected', willSelect);
        $item.toggleClass('selected', willSelect);

        // 派发事件，通知 Select2 刷新 Chip 标签并触发宿主监听
        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
        $select.trigger('change');
      } else {
        // 单选模式：更新值并派发事件，立即关闭下拉面板
        const value = $opt.val() ?? '';
        $select.find('option').prop('selected', false);
        nativeOpt.selected = true;
        $opt.prop('selected', true);
        nativeSelect.value = value.toString();

        nativeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        nativeSelect.dispatchEvent(new Event('input', { bubbles: true }));
        $select.trigger('change');
        $opt.trigger('click');

        onSingleSelectDone();
      }
    });

    $item.on('mousedown touchstart touchend', (e: JQuery.TriggeredEvent) => e.stopPropagation());
    items.push($item);
  };

  // 遍历子节点构建列表
  $select.children().each((_, child) => {
    const $child = $(child);
    if (child.tagName.toLowerCase() === 'optgroup') {
      const label = $child.attr('label') || '';
      const $groupHeader = $(`<div class="optgroup-header">${label}</div>`);
      $groupHeader.data('type', 'optgroup');

      items.push($groupHeader);
      const countBefore = validOptionCount;
      $child.children('option').each((_, opt) => processOption($(opt), $groupHeader));

      // 若 optgroup 下没有可见项，移除其表头
      if (validOptionCount === countBefore) {
        items.pop();
      }
      return;
    }
    processOption($child);
  });

  // 同步外部变更状态（例如外部点击 Select2 Chip 删除按钮时同步取消勾选）
  const syncState = () => {
    optionMap.forEach(($item, nativeOpt) => {
      $item.toggleClass('selected', nativeOpt.selected);
    });
  };

  return { items, validOptionCount, syncState };
};
