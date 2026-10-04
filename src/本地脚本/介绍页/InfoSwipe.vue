<script setup lang="ts">
const currentIndex = ref(0);
const direction = ref<'left' | 'right'>('right');

// 临时内置页面数据（后续移至 shared 时可改为 props 传入）
// const pages = ref([
//   `<div>
//     <p>除单击跳转外，新版酒馆点击右下角箭头下的<code>1/1</code>，也可快速跳转开场。</p>
//     <p>游玩出身同一实验室的开局时，给予user任意四字数学家名作为代号（如拉格朗日、克罗内克、勒文海姆）以达到最佳游玩效果。</p>
//     <p>非自用的二改（任何修改）都需授权。二传需标明作者及原帖<br />商业化禁止</p>
//   </div>`,
//   `<div>
//     <p>关于世界书：建议使用自定义排序/酒馆助手内置脚本“强制自定义排序”。</p>
//     <p>世界书可以加入全局世界书/角色额外世界书让OZ客串别的卡。</p>
//   </div>`,
// ]);

const { pages } = defineProps<{ pages: string[] }>();

const total = computed(() => pages.length);

function prev() {
  if (total.value <= 1) return;
  direction.value = 'left';
  currentIndex.value = (currentIndex.value - 1 + total.value) % total.value;
}

function next() {
  if (total.value <= 1) return;
  direction.value = 'right';
  currentIndex.value = (currentIndex.value + 1) % total.value;
}

function goTo(index: number) {
  if (index === currentIndex.value) return;
  direction.value = index > currentIndex.value ? 'right' : 'left';
  currentIndex.value = index;
}

// 触摸滑动手势
let touchStartX = 0;
let touchStartY = 0;

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function onTouchEnd(e: TouchEvent) {
  const deltaX = e.changedTouches[0].clientX - touchStartX;
  const deltaY = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
    if (deltaX < 0) {
      next();
    } else {
      prev();
    }
  }
}
</script>

<template>
  <div class="swipe-root" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
    <div class="swipe-viewport">
      <Transition :name="direction === 'right' ? 'slide-left' : 'slide-right'" mode="out-in">
        <div :key="currentIndex" class="swipe-page" v-html="pages[currentIndex]"></div>
      </Transition>
    </div>

    <!-- 底部居中控制栏：左右两箭头与指示圆点 -->
    <div class="swipe-controls">
      <button class="nav-btn" title="上一页" @click="prev">
        <i class="fa-solid fa-chevron-left"></i>
      </button>
      <div class="dots">
        <span
          v-for="(_, idx) in total"
          :key="idx"
          class="dot"
          :class="{ active: currentIndex === idx }"
          @click="goTo(idx)"
        ></span>
      </div>
      <button class="nav-btn" title="下一页" @click="next">
        <i class="fa-solid fa-chevron-right"></i>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.swipe-root {
  display: flex;
  flex-direction: column;
  padding: 0.6rem var(--section-padding, 0.5rem);
  user-select: text;

  .swipe-viewport {
    position: relative;
    overflow: hidden;

    .swipe-page {
      width: 100%;
      line-height: 1.6;

      :deep(p) {
        margin: 0.5rem 0;
      }

      :deep(ol) {
        list-style-type: decimal;
        padding-left: 1.5rem;
        margin: 0.5rem 0;

        li {
          margin: 0.25rem 0;
        }
      }

      :deep(ul) {
        list-style-type: disc;
        padding-left: 1.5rem;
        margin: 0.5rem 0;

        li {
          margin: 0.25rem 0;
        }
      }

      :deep(code) {
        background-color: black;
        padding: 0.1rem 0.3rem;
        border-radius: 3px;
      }

      :deep(a) {
        color: var(--oz-highlight, mediumpurple);
        text-decoration: underline;
        word-break: break-all;
      }
    }
  }

  .swipe-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.6rem;
    margin-top: 0.5rem;
    user-select: none;

    .nav-btn {
      background: transparent;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.75rem;
      transition: all 0.2s ease;

      &:hover {
        color: var(--oz-highlight, #fff);
        background: rgba(255, 255, 255, 0.1);
      }
    }

    .dots {
      display: flex;
      align-items: center;
      gap: 0.35rem;

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.25);
        cursor: pointer;
        transition: all 0.25s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.5);
        }

        &.active {
          width: 14px;
          border-radius: 3px;
          background: var(--oz-highlight, mediumpurple);
        }
      }
    }
  }
}

/* 翻页过渡动画 */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: all 0.2s ease;
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(20px);
}
.slide-left-leave-to {
  opacity: 0;
  transform: translateX(-20px);
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(-20px);
}
.slide-right-leave-to {
  opacity: 0;
  transform: translateX(20px);
}
</style>
