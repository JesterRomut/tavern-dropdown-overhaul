<script setup lang="ts">
import _, { debounce } from 'lodash';
import NSFWIcon from './NSFWIcon.vue';
import { Start, starts } from './starts';
import StartTooltip from './StartTooltip.vue';
import { vTooltip } from './tooltip';
import { changeGreeting } from './util';

const PATH_TAGSTATES = 'OZ.TagStates';
const PATH_SEARCHQUERY = 'OZ.SearchQuery';

function loadTagStates(): Record<string, number> {
  const variables = getVariables({ type: 'global' });
  return { ..._.get(variables, 'OZ.TagStates', {}) };
}

function loadSearchQuery(): string {
  const variables = getVariables({ type: 'global' });
  return _.get(variables, 'OZ.SearchQuery', '');
}

function saveStates() {
  const rawState = toRaw(tagStates.value);
  const rawQuery = toRaw(searchQuery.value);

  const stateToSave = Object.fromEntries(Object.entries(rawState).filter(([_, value]) => value !== 0));

  const variables = getVariables({ type: 'global' });

  if (
    _.isEqual(_.get(variables, PATH_TAGSTATES, {}), stateToSave) &&
    _.isEqual(_.get(variables, PATH_SEARCHQUERY, ''), rawQuery)
  )
    return;
  _.set(variables, PATH_TAGSTATES, stateToSave);
  _.set(variables, PATH_SEARCHQUERY, rawQuery);
  replaceVariables(variables, { type: 'global' });
  if (rawQuery === '') {
    deleteVariable(PATH_SEARCHQUERY, { type: 'global' });
  }
}

$(window).on('pagehide', () => {
  saveStates();
});
// 从持久化加载搜索关键词
const searchQuery = ref(loadSearchQuery());

enum TagState {
  UNFILTERED = 0,
  INCLUDE = 1,
  EXCLUDE = -1,
}
const tagStates = ref<Record<string, TagState>>(loadTagStates());
const allTags = computed(() => {
  let tags = new Set<string>();
  starts.forEach(s => {
    tags = tags.union(s.tags);
  });
  return [...tags].reverse();
});
watch(
  allTags,
  tags => {
    tags.forEach(tag => {
      if (tagStates.value[tag] === undefined) {
        tagStates.value[tag] = TagState.UNFILTERED;
      }
    });
  },
  { immediate: true },
);
watch([tagStates, searchQuery], debounce(saveStates, 3000), { deep: true });

const toggleInclude = (tag: string) => {
  tagStates.value[tag] = tagStates.value[tag] === 1 ? 0 : 1;
};
// 切换“排除(-1)”和“未选(0)”的双态
const toggleExclude = (tag: string) => {
  tagStates.value[tag] = tagStates.value[tag] === -1 ? 0 : -1;
};

const filteredStarts = computed(() => {
  const requiredTags = Object.keys(tagStates.value).filter(t => tagStates.value[t] === 1);
  const excludedTags = Object.keys(tagStates.value).filter(t => tagStates.value[t] === -1);

  return starts.filter(s => {
    const matchName = s.name.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchDesc = s.desc?.toLowerCase().includes(searchQuery.value.toLowerCase()) ?? false;

    // 必须包含所有 requiredTags
    const matchRequired = requiredTags.length === 0 || requiredTags.every(t => s.tags.has(t));

    // 不能包含任何 excludedTags
    const matchExcluded = excludedTags.length === 0 || !excludedTags.some(t => s.tags.has(t));

    return (matchName || matchDesc) && matchRequired && matchExcluded;
  });
});

function formatTooltip(s: Start) {
  // const content = h('div', [
  //   s.desc ? h('span', builtin.renderMarkdown(s.desc)) : null,
  //   s.desc ? h('br') : null,
  //   s.tags.size > 0 ? h('span', `Tags: ` + _.join(Array.from(s.tags), ', ')) : null,
  // ]);
  const content = h(StartTooltip, {
    desc: s.desc ? builtin.renderMarkdown(s.desc) : undefined,
    tags: s.tags,
  });
  // const content = <div><span>sss</span></div>;
  return content;
}

// const tooltipOffsetX = ref(0);
// // 缓存当前 hover 元素的 rect
// let cachedRect: DOMRect | null = null;
// let rafId: number | null = null;
// let lastClientX = 0;

// function handleMouseEnter(e: MouseEvent) {
//   const target = e.currentTarget as HTMLLIElement;
//   cachedRect = target.getBoundingClientRect();
// }

// function handleMouseMove(e: MouseEvent) {
//   lastClientX = e.clientX;
//   if (rafId !== null) return; // 已有待执行的帧，跳过
//   rafId = requestAnimationFrame(() => {
//     if (cachedRect) {
//       const mouseX = lastClientX - cachedRect.left;
//       const centerX = cachedRect.width / 2;
//       tooltipOffsetX.value = mouseX - centerX;
//     }
//     rafId = null;
//   });
// }

// // 组件卸载时取消动画帧
// onBeforeUnmount(() => {
//   if (rafId !== null) {
//     cancelAnimationFrame(rafId);
//     rafId = null;
//   }
// });
</script>

<template>
  <main>
    <p>作者@Kernschmelze。OZ，欧几里得。</p>
    <p>“大家早就不需要超能力者了。有了计算机和互联网，谁还需要被折弯的勺子和被撬开的锁呢？”</p>
    <section>
      <h3><i class="fa-solid fa-hamsa"></i> 开场一览</h3>
      <div class="search-bar">
        <input v-model="searchQuery" type="text" placeholder="搜索开场..." />
      </div>

      <div class="tags-container">
        <div
          v-for="tag in allTags"
          :key="tag"
          class="tag-item"
          :class="[{ 'is-included': tagStates[tag] === 1, 'is-excluded': tagStates[tag] === -1 }]"
        >
          <!-- 左侧：点击切换包含状态 -->
          <div class="tag-main" @click="toggleInclude(tag)">
            <i v-if="tagStates[tag] === 1" class="fa-solid fa-circle-check"></i>
            <i v-else-if="tagStates[tag] === -1" class="fa-solid fa-circle-xmark"></i>
            <span>{{ tag }}</span>
          </div>
          <!-- 右侧：减号，点击切换排除状态 -->
          <div class="tag-exclude-btn" title="排除此标签" @click.stop="toggleExclude(tag)">
            <i class="fa-solid fa-minus"></i>
          </div>
        </div>
      </div>

      <ul>
        <li v-tooltip="'此介绍页不会发送给AI：直接发送消息即可。'">
          <span>1</span>（自定义开局/本介绍页不会发送给AI）
        </li>
        <li
          v-for="s in filteredStarts"
          :key="s.id"
          v-tooltip="formatTooltip(s)"
          aria-label="button"
          @click="changeGreeting(s.id)"
        >
          <span>{{ s.id + 1 }}</span
          ><i v-if="s.tags.has('NSFW')"><NSFWIcon /></i> {{ s.name }}
          <!--           v-tooltip="formatTooltip(s)" <div class="tooltip" :style="{ transform: `translateX(calc(-50% + ${tooltipOffsetX}px))` }">
            Tag: {{ _.join(Array.from(s.tags), ', ') }}
          </div> -->
        </li>
        <li v-if="filteredStarts.length === 0" class="empty-moon">
          月球的背面空荡荡...<i class="fa-regular fa-moon"></i>
        </li>
      </ul>
    </section>
    <p>
      除单击跳转外，新版酒馆点击右下角箭头下的<code>1/{{ starts.length + 1 }}</code
      >，也可快速跳转开场。
    </p>
    <p>
      游玩出身同一实验室的开局时，将user命名为任意四字数学家名（如希尔伯特、拉格朗日、斐波那契）或填写user设定以达到最佳游玩效果。
    </p>
    <p>
      非自用的二改（任何修改）都需授权。二传需标明作者及原帖
      <br />
      商业化禁止
    </p>
    <footer>
      <h1>OZ</h1>
      <h2>- In my dreams I'm beautiful... and bad. -</h2>
    </footer>
  </main>
</template>
<script lang="ts">
export default {
  directives: {
    tooltip: vTooltip,
  },
};
</script>
<style lang="scss">
@use 'tooltip.scss';
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-685%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F685%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A400%3Bfont-display%3Aswap%3B%7D');
@import url('data:text/css,%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fitalic.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Aitalic%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D%40font-face%7Bfont-family%3A%22ZSFT-651%22%3Bsrc%3Aurl(%22https%3A%2F%2Ffontsapi.zeoseven.com%2F651%2Fmain.woff2%22)%20format(%22woff2%22)%3Bfont-style%3Anormal%3Bfont-weight%3A100%20900%3Bfont-display%3Aswap%3B%7D');

/* 搜索栏样式 */
.search-bar {
  display: flex;
  margin: 1rem 0 0.5rem 0;
  input {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #484a4c;
    color: aliceblue;
    padding: 0.4rem 0.8rem;
    border-radius: 4px;
    outline: none;
    flex: 1;
    font-size: 0.85rem;
    max-width: 100%;
  }
  input:focus {
    border-color: mediumslateblue;
  }
}
/* 标签容器和按钮样式 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  .tag-item {
    display: flex;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #484a4c;
    color: #aaa;
    border-radius: 4px;
    font-size: 0.8rem;
    transition: all 0.2s ease;
    overflow: hidden; /* 防止内部悬停超出边框圆角 */
    &.is-included {
      background: rgba(46, 139, 87, 0.3); /* 海绿色 */
      border-color: #2e8b57;
      color: #98fb98;
      .tag-exclude-btn {
        border-left-color: #2e8b57;
      }
    }
    &.is-excluded {
      background: rgba(178, 34, 34, 0.3); /* 耐火砖红 */
      border-color: #b22222;
      color: #ffb6c1;
      .tag-exclude-btn {
        border-left-color: #b22222;
      }
    }
    /* 标签主体（点击包含） */
    .tag-main {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.5rem 0.3rem 0.6rem;
      cursor: pointer;
      transition: all 0.2s ease;
      &:hover {
        background: rgba(255, 255, 255, 0.1);
        color: aliceblue;
      }
    }
    /* 标签排除按钮（点击排除） */
    .tag-exclude-btn {
      font-size: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.3rem 0.5rem;
      border-left: 1px solid #484a4c;
      cursor: pointer;
      transition: all 0.2s ease;
      opacity: 0.8;
      &:hover {
        background: rgba(178, 34, 34, 0.6);
        color: white;
        opacity: 1;
      }
    }
  }
}

.tag-list {
  margin-left: 0.5rem;
  font-size: 0.85rem;
  color: #888;
}

li.empty-moon {
  color: #888;
  font-style: italic;
  cursor: not-allowed;

  display: flex;
  .fa-regular {
    align-self: baseline;
  }
}

main {
  /* background: linear-gradient(160deg, rgba(45, 45, 45, 0.75), rgba(35, 35, 35, 0.85)); */
  background-image:
    linear-gradient(122deg, rgb(10, 10, 10), rgba(35, 35, 35, 0.85)),
    url('https://cdn.jsdelivr.net/gh/JesterRomut/tavern-resources@main/character/OZ/cover_background.png');
  background-size: cover;
  background-position: center;
  border-radius: 4px;
  background-blend-mode: multiply, normal;
  padding: var(--main-padding);
  color: aliceblue;
  font-size: 0.9rem;

  > p {
    padding: 0.5rem var(--section-padding);
  }

  > footer {
    text-align: center;
  }

  > footer h1 {
    font-family: 'ZSFT-685';
    font-weight: normal;
    font-size: 1.6rem;
  }

  > footer h2 {
    font-family: 'ZSFT-651';
    font-weight: lighter;
    font-size: 0.9rem;
    text-transform: uppercase;
  }

  > section {
    padding-left: var(--section-padding);
    padding-right: var(--section-padding);
  }
}

section {
  background: rgba(255, 255, 255, 0.05);
  border-radius: inherit;
  box-shadow:
    0 0 0 1px #484a4c,
    0 1px 3px 0 rgb(0 0 0 / 0.1),
    0 1px 2px -1px rgb(0 0 0 / 0.1);
  margin: 1rem 0;
  padding-top: 1rem;
  padding-bottom: 1rem;

  ul {
    height: 20rem;
    overflow-x: auto;

    padding-left: 0.5rem;

    @media screen and (max-width: 600px) {
      padding-left: 0;
    }

    li {
      padding: 0.5rem 0;
      padding-left: 0.5rem;
      // display: flex;
      // justify-content: flex-start;
      // align-items: baseline;
      gap: 4px;
      cursor: pointer;

      user-select: none;
      -moz-user-select: none;
      -khtml-user-select: none;
      -webkit-user-select: none;
      -o-user-select: none;

      @media screen and (max-width: 600px) {
        padding-left: 0;
        border-bottom: 1px solid #484a4c;
      }

      transition: 0.3s;

      position: relative;

      > i:first-of-type {
        width: 1.2rem;
        height: 1.2rem;
        display: inline-block;
        padding-top: 4px;
      }

      > span:first-of-type {
        background: black;
        font-family: 'Consolas', 'Menlo', 'Monaco', 'DejaVu Sans Mono', 'Ubuntu Mono', 'Courier New', monospace;
        display: inline-block;
        border: 1px solid #484a4c;
        width: 1.2rem;
        height: 1.2rem;
        line-height: 1.2rem;
        font-size: 0.8rem;
        text-align: center;
        border-radius: 4px;
        transition: 0.3s;
      }

      // position: relative; // 必须添加，使 tooltip 定位生效

      // &:hover {
      //   .tooltip {
      //     display: block;
      //   }
      // }
      // .tooltip {
      //   position: absolute;
      //   display: none;
      //   bottom: calc(100% + 8px); // 显示在 li 上方
      //   transform: translateX(var(--move-x));
      //   transition: transform 0.05s linear; // 加一点过渡更平滑
      //   left: 50%;
      //   transform: translateX(-50%);
      //   background: black;
      //   color: white;
      //   border: 1px solid white;
      //   padding: 4px 8px;
      //   border-radius: 4px;
      //   font-size: 0.8rem;
      //   white-space: nowrap;
      //   z-index: 1000;

      //   // 白色边框箭头（下）
      //   &::before {
      //     content: '';
      //     position: absolute;
      //     top: 100%;
      //     left: 50%;
      //     transform: translateX(-50%);
      //     width: 0;
      //     height: 0;
      //     border-style: solid;
      //     border-width: 6px 6px 0 6px;
      //     border-color: white transparent transparent transparent;
      //     z-index: 1;
      //   }
      //   // 黑色填充箭头（偏移 1px，形成边框效果）
      //   &::after {
      //     content: '';
      //     position: absolute;
      //     top: calc(100% - 1px);
      //     left: 50%;
      //     transform: translateX(-50%);
      //     width: 0;
      //     height: 0;
      //     border-style: solid;
      //     border-width: 6px 6px 0 6px;
      //     border-color: black transparent transparent transparent;
      //     z-index: 2;
      //   }
      // }
    }
    > :not(li:first-of-type):not(.empty-moon):hover,
    > :not(li:first-of-type):not(.empty-moon):active {
      //color: mediumpurple;
      background: rgba(255, 255, 255, 0.15);
      > span:first-of-type {
        color: black;
        background-color: white;
      }
    }
    @media screen and (min-width: 600px) {
      > :nth-child(odd) {
        background: rgba(255, 255, 255, 0.05);
      }
    }
    > li:first-of-type {
      cursor: not-allowed;
    }
  }

  ::-webkit-scrollbar {
    width: 6px;
  }

  ::-webkit-scrollbar-track {
    border-radius: 8px;
    background-color: rgba(0, 0, 0, 0.3);
    border: 1px solid #666;
  }

  ::-webkit-scrollbar-thumb {
    border-radius: 8px;
    background-color: #666;
  }
}

code {
  background-color: black;
}

h3 {
  font-weight: bold;
}
@media screen and (max-width: 600px) {
  :root {
    --main-padding: 0.5rem;
    --section-padding: 0.5rem;
  }
  main {
    background-position: 65% center;
    font-size: 0.85rem;
  }
}

@media screen and (min-width: 600px) {
  :root {
    --main-padding: 1.5rem;
    --section-padding: 1rem;
  }
}
</style>
