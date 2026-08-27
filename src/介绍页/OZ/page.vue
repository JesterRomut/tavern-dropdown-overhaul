<script setup lang="ts">
import _, { debounce } from 'lodash';
import NSFWIcon from './NSFWIcon.vue';
import { Start, starts } from './starts';
import StartTooltip from './StartTooltip.vue';
import { vTooltip } from './tooltip';
import { changeGreeting } from './util';

const PATH_TAGSTATES = 'OZ.TagStates';
const PATH_SEARCHQUERY = 'OZ.SearchQuery';
const PATH_FAVORITES = 'OZ.Favorites';
const PATH_FAVORITEONLY = 'OZ.FavoriteFilterState';

function loadFavorites(): number[] {
  const variables = getVariables({ type: 'global' });
  return _.get(variables, PATH_FAVORITES, []);
}

function loadFavoriteOnly(): boolean {
  const variables = getVariables({ type: 'global' });
  return _.get(variables, PATH_FAVORITEONLY, false);
}

function loadTagStates(): Record<string, number> {
  const variables = getVariables({ type: 'global' });
  return { ..._.get(variables, 'OZ.TagStates', {}) };
}

function loadSearchQuery(): string {
  const variables = getVariables({ type: 'global' });
  return _.get(variables, 'OZ.SearchQuery', '');
}

// 4. 更新 saveStates 方法（在其中加入 Favorites 的持久化）
function saveStates() {
  const rawState = toRaw(tagStates.value);
  const rawQuery = toRaw(searchQuery.value);
  const rawFavorites = toRaw(favorites.value);
  const rawFavOnly = toRaw(onlyFavorites.value);
  const stateToSave = Object.fromEntries(Object.entries(rawState).filter(([_, value]) => value !== 0));
  const variables = getVariables({ type: 'global' });
  if (
    _.isEqual(_.get(variables, PATH_TAGSTATES, {}), stateToSave) &&
    _.isEqual(_.get(variables, PATH_SEARCHQUERY, ''), rawQuery) &&
    _.isEqual(_.get(variables, PATH_FAVORITES, []), rawFavorites) &&
    _.isEqual(_.get(variables, PATH_FAVORITEONLY, false), rawFavOnly)
  )
    return;
  updateVariablesWith(
    variables => {
      if (_.isEmpty(stateToSave)) _.unset(variables, PATH_TAGSTATES);
      else _.set(variables, PATH_TAGSTATES, stateToSave);
      if (rawQuery === '') _.unset(variables, PATH_SEARCHQUERY);
      else _.set(variables, PATH_SEARCHQUERY, rawQuery);
      if (_.isEmpty(rawFavorites)) _.unset(variables, PATH_FAVORITES);
      else _.set(variables, PATH_FAVORITES, rawFavorites);
      if (rawFavOnly !== true) _.unset(variables, PATH_FAVORITEONLY);
      else _.set(variables, PATH_FAVORITEONLY, rawFavOnly);
      return variables;
    },
    { type: 'global' },
  );

  // replaceVariables(variables, { type: 'global' });
  // if (rawQuery === '') {
  //   deleteVariable(PATH_SEARCHQUERY, { type: 'global' });
  // }
  // if (rawFavorites.length === 0) {
  //   deleteVariable(PATH_FAVORITES, { type: 'global' });
  // }
  // if (_.isEmpty(stateToSave)) {
  //   deleteVariable(PATH_TAGSTATES, { type: 'global' });
  // }
  // if (!rawFavOnly) {
  //   deleteVariable(PATH_FAVORITEONLY, { type: 'global' });
  // }
}

$(window).on('pagehide', () => {
  saveStates();
});

const favorites = ref<number[]>(loadFavorites());
const onlyFavorites = ref(loadFavoriteOnly()); // 收藏过滤器开关

const isFavorite = (id: number) => favorites.value.includes(id);
const toggleFavorite = (id: number) => {
  const idx = favorites.value.indexOf(id);
  if (idx > -1) {
    favorites.value.splice(idx, 1);
  } else {
    favorites.value.push(id);
  }
};

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
watch([tagStates, searchQuery, favorites], debounce(saveStates, 3000), { deep: true });

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

    const matchFavorite = favorites.value.length > 0 ? !onlyFavorites.value || favorites.value.includes(s.id) : true;
    return (matchName || matchDesc) && matchRequired && matchExcluded && matchFavorite;
  });
});

function formatTooltip(s: Start) {
  const content = h(StartTooltip, {
    desc: s.desc ? builtin.renderMarkdown(s.desc) : undefined,
    tags: s.tags,
  });
  return content;
}
</script>

<template>
  <main>
    <p>作者@Kernschmelze。OZ，只是一个因特异功能实验室倒闭而出来混饭吃的超能力者。</p>
    <p>“大家早就不需要超能力者了。有了计算机和互联网，谁还需要被折弯的勺子和被撬开的锁呢？”</p>
    <section>
      <h3><i class="fa-solid fa-hamsa"></i> 开场一览</h3>
      <div class="search-bar">
        <input v-model="searchQuery" type="text" placeholder="搜索开场..." />
      </div>

      <div class="tags-root">
        <div>
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
        <Transition name="bounce">
          <div
            v-if="favorites.length > 0"
            class="tag-item fav-filter-btn"
            :class="{ 'is-active': onlyFavorites, 'is-visible': favorites.length > 0 }"
            @click="onlyFavorites = !onlyFavorites"
          >
            <i :class="onlyFavorites ? 'fa-solid fa-star' : 'fa-regular fa-star'" title="仅显示收藏"></i></div
        ></Transition>
      </div>

      <ul>
        <li v-tooltip="'此介绍页不会发送给AI：直接发送消息即可。'">
          <div><span>1</span>（自定义开局/本介绍页不会发送给AI）</div>
        </li>
        <li v-for="s in filteredStarts" :key="s.id" aria-label="button" :class="{ 'is-favorite': isFavorite(s.id) }">
          <div v-tooltip="formatTooltip(s)" @click="changeGreeting(s.id)">
            <span>{{ s.id + 1 }}</span>
            <i v-if="s.tags.has('NSFW')"><NSFWIcon /></i>
            {{ s.name }}
          </div>
          <i
            class="favorite"
            :class="isFavorite(s.id) ? 'fa-solid fa-star' : 'fa-regular fa-star'"
            :title="isFavorite(s.id) ? '取消收藏' : '添加收藏'"
            @click.stop="toggleFavorite(s.id)"
          ></i>
          <!--收藏-->
        </li>
        <li v-if="filteredStarts.length === 0" class="empty-moon">
          <div>月球的背面空荡荡...<i class="fa-regular fa-moon"></i></div>
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

.bounce-enter-active {
  animation: bounce-in 0.5s;
}
.bounce-leave-active {
  animation: bounce-in 0.5s reverse;
}
@keyframes bounce-in {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.25);
  }
  100% {
    transform: scale(1);
  }
}

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
.tags-root {
  display: flex;
  gap: 5px;
  margin-bottom: 1rem;
  > div:nth-child(1) {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-wrap: wrap;
    gap: 0.5rem;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    padding-bottom: 2px;

    @media screen and (max-width: 600px) {
      display: grid;
      /* 核心 1：固定为 2 行（如果想展示 3 行就写 3 个 max-content 或 repeat(3, auto)） */
      grid-template-rows: repeat(2, auto);
      /* 核心 2：让元素按“列”自动向右延展，而不是按行换行 */
      grid-auto-flow: column;
      /* 核心 3：每列宽度自适应内容 */
      grid-auto-columns: max-content;
      flex: 1;
      min-width: 0; /* 允许容器宽度收缩，从而触发横向滚动 */
      gap: 0.5rem;
      overflow-x: auto; /* 开启横向滚动 */
      -webkit-overflow-scrolling: touch;
      padding-bottom: 4px; /* 留一点边距防滚动条挤压/边框切边 */
    }
  }

  .tag-item {
    display: flex;
    flex-shrink: 0;
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
      flex: 1;
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
  .fav-filter-btn {
    flex-shrink: 0;
    flex-basis: 2rem;
    align-self: flex-end;
    display: flex;
    align-items: center;
    justify-items: center;
    justify-content: center;
    aspect-ratio: 1 / 1;
    &.is-active {
      background: rgba(147, 112, 216, 0.2) !important;
      border-color: mediumpurple !important;
      color: mediumpurple !important;
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

    scrollbar-gutter: stable;

    // padding-left: 0.5rem;

    // @media screen and (max-width: 600px) {
    //   padding-left: 0;
    // }
    li.is-favorite {
      background: rgba(163, 119, 249, 0.1);
      > i:first-of-type {
        color: rgba(147, 112, 216, 0.7);
      }
      > div:first-of-type > span:first-of-type {
        border: 1px solid rgb(87, 59, 145);
      }
    }
    // @media screen and (min-width: 600px) {
    //   > li.is-favorite:nth-child(odd) {
    //     background: rgba(186, 156, 246, 0.16);
    //   }
    // }
    li {
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

      transition: 0.3s;

      display: flex;
      align-items: center;

      > i:first-of-type {
        margin-right: 0.5rem;
        color: #ffffff44;
        font-size: 0.95rem;
        cursor: pointer;
        transition: all 0.2s ease;
        margin-left: auto;
        &:hover {
          color: mediumpurple;
          transform: scale(1.2);
        }
      }

      > div:first-of-type {
        flex-grow: 2;
        padding: 0.5rem 0;

        padding-left: 0.5rem;
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
      }

      @media screen and (max-width: 600px) {
        > div:first-of-type {
          padding-left: 0;
        }
        border-bottom: 1px solid #ffffff3d;
      }
      // .favorite {
      //   float: right;
      // }
    }
    > :not(li:first-of-type):not(.empty-moon):hover,
    > :not(li:first-of-type):not(.empty-moon):active {
      //color: mediumpurple;
      background: rgba(255, 255, 255, 0.15);
      > div:first-of-type > span:first-of-type {
        color: black;
        background-color: white;
      }
      &.is-favorite {
        background: rgba(147, 112, 216, 0.3);
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
    @media screen and (max-width: 600px) {
      width: 4px;
    }
    height: 6px; /* 横向滚动条高度变细 */
    @media screen and (max-width: 600px) {
      height: 4px;
    }
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
