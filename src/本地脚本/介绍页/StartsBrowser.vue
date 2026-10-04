<script setup lang="ts">
import _, { debounce } from 'lodash';
import { watch } from 'vue';
import NSFWIcon from './NSFWIcon.vue';
import { Start, starts } from './starts';
import StartTooltip from './StartTooltip.vue';
import { vTooltip } from './tooltip';
import { changeGreeting } from './util';

// TODO:标签排序

const props = defineProps<{ path: string }>();

const PATH_TAGSTATES = `${props.path}.TagStates`;
const PATH_SEARCHQUERY = `${props.path}.SearchQuery`;
const PATH_FAVORITES = `${props.path}.Favorites`;
const PATH_FAVORITEONLY = `${props.path}.FavoriteFilterState`;
const PATH_OPEN = `${props.path}.Open`;

// 读取初始状态（仅获取一次全局变量）
const initialVars = getVariables({ type: 'global' });

function loadConvertedFavorites(): Set<number | string> {
  const fav: (number | string)[] = _.get(initialVars, PATH_FAVORITES, []);
  return new Set(
    fav.map(value => {
      if (typeof value !== 'number') return value;
      return starts[value - 1]?.uid ?? value;
    }),
  );
}

const favorites = ref<Set<number | string>>(loadConvertedFavorites());
const onlyFavorites = ref<boolean>(_.get(initialVars, PATH_FAVORITEONLY, false));
const searchQuery = ref<string>(_.get(initialVars, PATH_SEARCHQUERY, ''));
const open = ref<boolean>(_.get(initialVars, PATH_OPEN, true));

enum TagState {
  UNFILTERED = 0,
  INCLUDE = 1,
  EXCLUDE = -1,
}
const tagStates = ref<Record<string, TagState>>({ ..._.get(initialVars, PATH_TAGSTATES, {}) });

let isDirty = false;

function saveStates() {
  if (!isDirty) return;

  const rawQuery = toRaw(searchQuery.value).trim();
  const rawFavOnly = onlyFavorites.value;
  const rawOpen = open.value;
  const rawFavorites = [...toRaw(favorites.value)];
  const stateToSave = Object.fromEntries(
    Object.entries(toRaw(tagStates.value)).filter(([_, v]) => v !== 0 && v !== undefined),
  );

  const variables = getVariables({ type: 'global' });

  // 优先原生 === 短路快速比对，全部相同时再进行 deep equal
  const isSameQuery = rawQuery === _.get(variables, PATH_SEARCHQUERY, '');
  const isSameFavOnly = rawFavOnly === _.get(variables, PATH_FAVORITEONLY, false);
  const isSameOpen = rawOpen === _.get(variables, PATH_OPEN, true);
  if (
    isSameQuery &&
    isSameFavOnly &&
    isSameOpen &&
    _.isEqual(_.get(variables, PATH_TAGSTATES, {}), stateToSave) &&
    _.isEqual(_.get(variables, PATH_FAVORITES, []), rawFavorites)
  ) {
    isDirty = false;
    return;
  }

  updateVariablesWith(
    vars => {
      const put = (key: string, val: any, isDef: boolean) => (isDef ? _.unset(vars, key) : _.set(vars, key, val));
      put(PATH_TAGSTATES, stateToSave, _.isEmpty(stateToSave));
      put(PATH_SEARCHQUERY, rawQuery, !rawQuery);
      put(PATH_FAVORITES, rawFavorites, rawFavorites.length === 0);
      put(PATH_FAVORITEONLY, rawFavOnly, !rawFavOnly);
      put(PATH_OPEN, rawOpen, rawOpen);
      return vars;
    },
    { type: 'global' },
  );

  isDirty = false;
}

const isFavorite = (id: number, uid?: string) => {
  if (uid) return favorites.value.has(id) || favorites.value.has(uid);
  return favorites.value.has(id);
};

const toggleFavorite = (id: number, uid?: string) => {
  const target = uid ?? id;
  if (favorites.value.has(id) || (uid && favorites.value.has(uid))) {
    favorites.value.delete(id);
    if (uid) favorites.value.delete(uid);
  } else {
    favorites.value.add(target);
  }
};

const allTags = computed(() => {
  const tags = new Set<string>();
  starts.forEach(s => s.tags.forEach(t => tags.add(t)));
  return [...tags].reverse();
});

const debouncedSave = debounce(saveStates, 3000);
watch(
  [tagStates, searchQuery, favorites, onlyFavorites, open],
  () => {
    isDirty = true;
    debouncedSave();
  },
  { deep: true },
);

$(window).on('pagehide', () => {
  saveStates();
});

const toggleInclude = (tag: string) => {
  tagStates.value[tag] = tagStates.value[tag] === 1 ? 0 : 1;
};

const toggleExclude = (tag: string) => {
  tagStates.value[tag] = tagStates.value[tag] === -1 ? 0 : -1;
};

const filteredStarts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  const hasQuery = Boolean(query);
  const reqTags = Object.keys(tagStates.value).filter(t => tagStates.value[t] === 1);
  const excTags = Object.keys(tagStates.value).filter(t => tagStates.value[t] === -1);
  const favOnly = onlyFavorites.value;

  return starts.filter(s => {
    // 1. 若开启“仅看收藏”，非收藏项直接短路跳过
    if (favOnly && !isFavorite(s.id, s.uid)) return false;

    // 2. 必选标签：必须全部包含
    if (reqTags.length > 0 && !reqTags.every(t => s.tags.has(t))) return false;

    // 3. 排除标签：包含任意一个即剔除
    if (excTags.length > 0 && excTags.some(t => s.tags.has(t))) return false;

    // 4. 搜索框文本匹配（没搜东西时直接放行，完全不跑字符串小写和匹配）
    if (hasQuery) {
      return s.name.toLowerCase().includes(query) || (s.desc?.toLowerCase().includes(query) ?? false);
    }
    return true;
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
  <section class="oz-section">
    <h3 :class="{ 'is-open': open }" @click="open = !open">
      <span><i class="fa-solid fa-hamsa"></i> 开场一览</span>
    </h3>
    <Transition name="slide-fade">
      <div v-if="open == true">
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
              v-if="favorites.size > 0"
              class="tag-item fav-filter-btn"
              :class="{ 'is-active': onlyFavorites, 'is-visible': favorites.size > 0 }"
              @click="onlyFavorites = !onlyFavorites"
            >
              <i :class="onlyFavorites ? 'fa-solid fa-star' : 'fa-regular fa-star'" title="仅显示收藏"></i></div
          ></Transition>
        </div>

        <ul>
          <li v-tooltip="'此介绍页不会发送给AI：直接发送消息即可。'">
            <div><span>1</span>（自定义开局/本介绍页不会发送给AI）</div>
          </li>
          <li
            v-for="s in filteredStarts"
            :key="s.id"
            aria-label="button"
            :class="{ 'is-favorite': isFavorite(s.id, s.uid) }"
          >
            <div v-tooltip="formatTooltip(s)" @click="changeGreeting(s.id)">
              <span>{{ s.id + 1 }}</span>
              <i v-if="s.tags.has('NSFW')"><NSFWIcon /></i>
              {{ s.name }}
            </div>
            <i
              class="favorite"
              :class="isFavorite(s.id, s.uid) ? 'fa-solid fa-star' : 'fa-regular fa-star'"
              :title="isFavorite(s.id, s.uid) ? '取消收藏' : '添加收藏'"
              @click.stop="toggleFavorite(s.id, s.uid)"
            ></i>
            <!--收藏-->
          </li>
          <li v-if="filteredStarts.length === 0" class="empty-moon">
            <div>月球的背面空荡荡...<i class="fa-regular fa-moon"></i></div>
          </li>
        </ul></div
    ></Transition>
  </section>
</template>
<script lang="ts">
export default {
  directives: {
    tooltip: vTooltip,
  },
};
</script>
<style scoped lang="scss">
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
      background: color-mix(in srgb, var(--oz-highlight) 20%, transparent 80%) !important;
      border-color: var(--oz-highlight) !important;
      color: var(--oz-highlight) !important;
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
.slide-fade-enter-from,
.slide-fade-leave-to {
  ul {
    height: unset;
    max-height: 0px !important;
  }
}

.slide-fade-enter-active,
.slide-fade-leave-active {
  ul {
    height: unset;
  }
}

ul {
  height: 20rem;
  max-height: 20rem;
  overflow-x: auto;
  scrollbar-gutter: stable;

  li.is-favorite {
    background: color-mix(in srgb, var(--oz-highlight) 10%, transparent 90%);
    > i:first-of-type {
      color: color-mix(in srgb, var(--oz-highlight) 70%, transparent 30%);
    }
    > div:first-of-type > span:first-of-type {
      border: 1px solid color-mix(in srgb, var(--oz-highlight) 60%, black 30%);
    }
  }

  li {
    user-select: none;
    gap: 4px;
    cursor: pointer;
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
        color: var(--oz-highlight);
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
  }

  > :not(li:first-of-type):not(.empty-moon):hover,
  > :not(li:first-of-type):not(.empty-moon):active {
    background: rgba(255, 255, 255, 0.15);
    > div:first-of-type > span:first-of-type {
      color: black;
      background-color: white;
    }
    &.is-favorite {
      background: color-mix(in srgb, var(--oz-highlight) 30%, transparent 70%);
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
</style>
