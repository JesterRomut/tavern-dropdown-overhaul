import {
  type App,
  type Component,
  createVNode,
  type DirectiveBinding,
  h,
  isVNode,
  type ObjectDirective,
  type Plugin,
  reactive,
  render,
  type VNode,
} from 'vue';

// 1. 类型定义
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

// 扩展 DOM 元素类型以缓存事件处理函数和定时器 ID
interface TooltipElement extends HTMLElement {
  _tooltipHandlers?: TooltipHandlers;
  _timerId?: number; // 新增：延迟定时器 ID
}

// 2. 全局响应式状态
const state = reactive<TooltipState>({
  show: false,
  x: 0,
  y: 0,
  content: null,
});

// 3. 渲染浮层组件
const TooltipOverlay = {
  name: 'TooltipOverlay',
  setup() {
    return () => {
      if (!state.show || !state.content) return null;

      // 处理内容渲染
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
          class: 'vue-custom-tooltip',
          style: {
            position: 'fixed',
            left: `${state.x}px`,
            top: `${state.y}px`,
            pointerEvents: 'none', // 避免遮挡鼠标/手势
            zIndex: 9999,
          },
        },
        innerContent,
      );
    };
  },
};

// 4. 挂载单例到 document.body
let isMounted = false;
function ensureMounted(): void {
  if (isMounted || typeof window === 'undefined') return;
  const container = document.createElement('div');
  container.id = 'v-tooltip-singleton-container';
  document.body.appendChild(container);
  render(createVNode(TooltipOverlay), container);
  isMounted = true;
}

// 5. 指令定义
export const vTooltip: ObjectDirective<TooltipElement, TooltipContent> = {
  mounted(el: TooltipElement, binding: DirectiveBinding<TooltipContent>) {
    ensureMounted();

    // ---- 统一的更新与隐藏逻辑 ----
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

    // ---- PC 端事件（带 500ms 延迟） ----
    const onMouseEnter = (e: MouseEvent) => {
      // 清除之前的定时器（如果有）
      if (el._timerId) {
        clearTimeout(el._timerId);
        el._timerId = undefined;
      }
      // 记录初始位置
      updatePosition(e.clientX, e.clientY);
      // 设置延迟显示
      el._timerId = window.setTimeout(() => {
        if (binding.value) {
          // 使用当前已更新的最新位置（鼠标可能已经移动）
          showTooltip(state.x, state.y);
        }
        el._timerId = undefined;
      }, 500);
    };

    const onMouseMove = (e: MouseEvent) => {
      // 始终更新位置，即使 tooltip 未显示，保证延迟触发时位置准确
      updatePosition(e.clientX, e.clientY);
    };

    const onMouseLeave = () => {
      // 清除延迟定时器
      if (el._timerId) {
        clearTimeout(el._timerId);
        el._timerId = undefined;
      }
      // 隐藏 tooltip（如果正在显示）
      hideTooltip();
    };

    // ---- 移动端 Touch 事件（无延迟，立即显示） ----
    const onTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        showTooltip(touch.clientX, touch.clientY);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!state.show) return;
      const touch = e.touches[0];
      if (touch) {
        updatePosition(touch.clientX, touch.clientY);
      }
    };

    const onTouchEnd = () => hideTooltip();

    // 缓存 handlers 以便 unmounted 清理
    el._tooltipHandlers = {
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    };

    // 注册 PC 监听
    el.addEventListener('mouseenter', onMouseEnter);
    el.addEventListener('mousemove', onMouseMove);
    el.addEventListener('mouseleave', onMouseLeave);

    // 注册移动端监听 (使用 passive: true 保证滑动流畅)
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
    // 清除定时器
    if (el._timerId) {
      clearTimeout(el._timerId);
      el._timerId = undefined;
    }

    const handlers = el._tooltipHandlers;
    if (handlers) {
      // 移除 PC 监听
      el.removeEventListener('mouseenter', handlers.onMouseEnter);
      el.removeEventListener('mousemove', handlers.onMouseMove);
      el.removeEventListener('mouseleave', handlers.onMouseLeave);

      // 移除移动端监听
      el.removeEventListener('touchstart', handlers.onTouchStart);
      el.removeEventListener('touchmove', handlers.onTouchMove);
      el.removeEventListener('touchend', handlers.onTouchEnd);
      el.removeEventListener('touchcancel', handlers.onTouchEnd);

      delete el._tooltipHandlers;
    }
  },
};

// 6. 导出插件
const TooltipPlugin: Plugin = {
  install(app: App) {
    app.directive('tooltip', vTooltip);
  },
};

export default TooltipPlugin;
