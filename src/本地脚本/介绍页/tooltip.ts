import {
  type App,
  type Component,
  createVNode,
  type DirectiveBinding,
  h,
  isVNode,
  nextTick,
  type ObjectDirective,
  onMounted,
  onUnmounted,
  type Plugin,
  reactive,
  ref,
  render,
  type VNode,
  watch,
} from 'vue';

export type TooltipContent = string | number | VNode | Component | (() => VNode | string | number) | null | undefined;

interface TooltipState {
  show: boolean;
  x: number;
  y: number;
  content: TooltipContent;
}

interface TooltipHandlers {
  onMouseEnter: (e: MouseEvent) => void;
  onMouseMove: (e: MouseEvent) => void;
  onMouseLeave: () => void;
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: () => void;
}

interface TooltipElement extends HTMLElement {
  _tooltipHandlers?: TooltipHandlers;
  _timerId?: number;
}

const state = reactive<TooltipState>({
  show: false,
  x: 0,
  y: 0,
  content: null,
});

const TooltipOverlay = {
  name: 'TooltipOverlay',
  setup() {
    const tooltipRef = ref<HTMLElement | null>(null);

    const updatePosition = () => {
      const el = tooltipRef.value;
      if (!el || !state.show) return;

      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width === 0 && height === 0) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const GAP = 10;
      const MARGIN = 12;
      const ARROW_OFFSET = 16;

      let left = state.x - width / 2;
      left = Math.max(MARGIN, Math.min(left, vw - MARGIN - width));

      const arrowLeft = Math.max(ARROW_OFFSET, Math.min(state.x - left, width - ARROW_OFFSET));

      const spaceAbove = state.y - GAP - MARGIN;
      const spaceBelow = vh - (state.y + GAP) - MARGIN;

      let placement: 'top' | 'bottom';
      let top: number;

      if (spaceAbove >= height) {
        placement = 'top';
        top = state.y - GAP - height;
      } else if (spaceBelow >= height) {
        placement = 'bottom';
        top = state.y + GAP;
      } else if (spaceBelow > spaceAbove) {
        placement = 'bottom';
        top = Math.max(MARGIN, Math.min(state.y + GAP, vh - MARGIN - height));
      } else {
        placement = 'top';
        top = Math.max(MARGIN, Math.min(state.y - GAP - height, vh - MARGIN - height));
      }

      const leftRounded = Math.round(left);
      const topRounded = Math.round(top);
      const arrowRounded = Math.round(arrowLeft);

      el.style.left = `${leftRounded}px`;
      el.style.top = `${topRounded}px`;
      el.style.setProperty('--arrow-left', `${arrowRounded}px`);
      el.style.visibility = 'visible';
      el.className = `vue-custom-tooltip placement-${placement}`;
    };

    watch(
      () => [state.show, state.content],
      ([show]) => {
        if (!show) {
          if (tooltipRef.value) {
            tooltipRef.value.style.visibility = 'hidden';
          }
        } else {
          nextTick(() => {
            updatePosition();
          });
        }
      },
    );

    watch(
      () => [state.x, state.y],
      () => {
        if (state.show) {
          updatePosition();
        }
      },
      { flush: 'sync' },
    );

    onMounted(() => {
      window.addEventListener('resize', updatePosition);
    });

    onUnmounted(() => {
      window.removeEventListener('resize', updatePosition);
    });

    return () => {
      if (!state.show || !state.content) return null;

      let innerContent: VNode | string | number;
      if (typeof state.content === 'function') {
        innerContent = (state as any).content();
      } else if (isVNode(state.content)) {
        innerContent = state.content;
      } else if (typeof state.content === 'object' && state.content !== null) {
        innerContent = h(state.content as Component);
      } else {
        innerContent = h('span', { innerHTML: String(state.content) });
      }

      return h(
        'div',
        {
          ref: tooltipRef,
          class: 'vue-custom-tooltip',
          style: {
            position: 'fixed',
            visibility: 'hidden',
            pointerEvents: 'none',
            zIndex: 99999,
          },
        },
        h('div', { class: 'tooltip-content' }, innerContent),
      );
    };
  },
};

let isMounted = false;
function ensureMounted(): void {
  if (isMounted || typeof window === 'undefined') return;
  const container = document.createElement('div');
  container.id = 'v-tooltip-singleton-container';
  document.body.appendChild(container);
  render(createVNode(TooltipOverlay), container);
  isMounted = true;
}

const SHOW_DELAY = 600;

export const vTooltip: ObjectDirective<TooltipElement, TooltipContent> = {
  mounted(el: TooltipElement, binding: DirectiveBinding<TooltipContent>) {
    ensureMounted();

    let touchStartX = 0;
    let touchStartY = 0;

    const updatePosition = (clientX: number, clientY: number) => {
      state.x = clientX;
      state.y = clientY;
    };

    const showTooltip = (clientX: number, clientY: number) => {
      if (!binding.value) return;
      state.content = binding.value;
      updatePosition(clientX, clientY);
      state.show = true;
    };

    const hideTooltip = () => {
      state.show = false;
      state.content = null;
    };

    const onMouseEnter = (e: MouseEvent) => {
      if (el._timerId) {
        clearTimeout(el._timerId);
        el._timerId = undefined;
      }
      updatePosition(e.clientX, e.clientY);
      el._timerId = window.setTimeout(() => {
        if (binding.value) {
          showTooltip(state.x, state.y);
        }
        el._timerId = undefined;
      }, SHOW_DELAY);
    };

    const onMouseMove = (e: MouseEvent) => {
      updatePosition(e.clientX, e.clientY);
    };

    const onMouseLeave = () => {
      if (el._timerId) {
        clearTimeout(el._timerId);
        el._timerId = undefined;
      }
      hideTooltip();
    };

    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (el._timerId) {
        clearTimeout(el._timerId);
        el._timerId = undefined;
      }
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      updatePosition(touch.clientX, touch.clientY);
      el._timerId = window.setTimeout(() => {
        if (binding.value) {
          showTooltip(state.x, state.y);
        }
        el._timerId = undefined;
      }, SHOW_DELAY);
    };

    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      if (state.show) {
        updatePosition(touch.clientX, touch.clientY);
      } else if (el._timerId) {
        const dist = Math.hypot(touch.clientX - touchStartX, touch.clientY - touchStartY);
        if (dist > 10) {
          clearTimeout(el._timerId);
          el._timerId = undefined;
        } else {
          updatePosition(touch.clientX, touch.clientY);
        }
      }
    };

    const onTouchEnd = () => {
      if (el._timerId) {
        clearTimeout(el._timerId);
        el._timerId = undefined;
      }
      hideTooltip();
    };

    el._tooltipHandlers = {
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    };

    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('touchcancel', onTouchEnd);
  },

  updated(el: TooltipElement, binding: DirectiveBinding<TooltipContent>) {
    if (state.show && el._tooltipHandlers) {
      state.content = binding.value;
    }
  },

  unmounted(el: TooltipElement) {
    if (el._timerId) {
      clearTimeout(el._timerId);
      el._timerId = undefined;
    }

    const handlers = el._tooltipHandlers;
    if (handlers) {
      el.removeEventListener('mouseenter', handlers.onMouseEnter);
      el.removeEventListener('mousemove', handlers.onMouseMove);
      el.removeEventListener('mouseleave', handlers.onMouseLeave);

      el.removeEventListener('touchstart', handlers.onTouchStart);
      el.removeEventListener('touchmove', handlers.onTouchMove);
      el.removeEventListener('touchend', handlers.onTouchEnd);
      el.removeEventListener('touchcancel', handlers.onTouchEnd);

      delete el._tooltipHandlers;
    }
  },
};

const TooltipPlugin: Plugin = {
  install(app: App) {
    app.directive('tooltip', vTooltip);
  },
};

export default TooltipPlugin;
