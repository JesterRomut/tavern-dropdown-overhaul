export interface PositionResult {
  top: number;
  left: number;
  minWidth: number;
  isDropUp: boolean;
}

/**
 * 计算下拉菜单挂载与绝对定位位置
 * 支持原生 <select> 与 Select2 容器等任意 $anchor 锚点
 */
export const mountAndPositionDropdown = (
  $dropdown: JQuery<HTMLElement>,
  $anchor: JQuery<HTMLElement>,
  $select: JQuery<HTMLElement>,
): PositionResult => {
  const anchorEl = $anchor[0] || $select[0];
  const rect = anchorEl.getBoundingClientRect();
  const targetDoc = anchorEl.ownerDocument || document;
  const targetWin = targetDoc.defaultView || window;
  const windowHeight = $(targetWin).height() || targetWin.innerHeight || 0;
  const windowWidth = $(targetWin).width() || targetWin.innerWidth || 0;
  const $dialog = $select.closest('dialog');
  const estimatedMaxHeight = 350;
  const spaceBelow = windowHeight - rect.bottom;

  let top = 0;
  let left = 0;
  let isDropUp = false;

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
      isDropUp = true;
    } else {
      top = baseTop + rect.height + 4;
    }
    left = Math.max(4, baseLeft);
  } else {
    $(targetDoc.body).append($dropdown);
    const actualHeight = $dropdown.outerHeight() ?? 300;
    const scrollTop = $(targetWin).scrollTop() || 0;
    const scrollLeft = $(targetWin).scrollLeft() || 0;

    if (spaceBelow < estimatedMaxHeight && rect.top > estimatedMaxHeight) {
      top = rect.top + scrollTop - actualHeight - 4;
      isDropUp = true;
    } else {
      top = rect.bottom + scrollTop + 4;
    }
    left = Math.max(4, rect.left + scrollLeft);
  }

  const minWidth = Math.max(rect.width, 200);

  // 防止超出视口右侧
  if (windowWidth > 0 && left + minWidth > windowWidth - 4) {
    left = Math.max(4, windowWidth - minWidth - 8);
  }

  $dropdown.css({
    top: `${top}px`,
    left: `${left}px`,
    minWidth: `${minWidth}px`,
  });

  return { top, left, minWidth, isDropUp };
};
