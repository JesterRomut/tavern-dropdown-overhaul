<script setup lang="ts">
import NSFWIcon from './NSFWIcon.vue';
import { starts } from './starts';
import { changeGreeting } from './util';

const searchQuery = ref('');
// 0: 未选中, 1: 包含, -1: 排除
const tagStates = ref<Record<string, number>>(loadTagStates());
const allTags = computed(() => {
  let tags = new Set<string>();
  starts.forEach(s => {
    tags = tags.union(s.tags);
  });
  return [...tags].reverse();
});
// 【修改】合并新标签：保留已加载的持久化状态，只为未记录的新 tag 初始化为 0
watch(
  allTags,
  tags => {
    tags.forEach(tag => {
      if (tagStates.value[tag] === undefined) {
        tagStates.value[tag] = 0;
      }
    });
  },
  { immediate: true },
);
watch(
  tagStates,
  async newState => {
    // 使用 toRaw 解除 Vue 的 Proxy 响应式代理
    const rawState = toRaw(newState);

    // 过滤掉值为 0 的项，只保留 1 和 -1
    const stateToSave = Object.fromEntries(Object.entries(rawState).filter(([_, value]) => value !== 0));

    // 传入纯净且已过滤的普通对象进行保存
    await saveTagStates(stateToSave);
  },
  { deep: true }, // 必须开启 deep，因为我们修改的是对象内部的属性
);

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

    // 必须包含所有 requiredTags
    const matchRequired = requiredTags.length === 0 || requiredTags.every(t => s.tags.has(t));

    // 不能包含任何 excludedTags
    const matchExcluded = excludedTags.length === 0 || !excludedTags.some(t => s.tags.has(t));

    return matchName && matchRequired && matchExcluded;
  });
});

// --- 持久化辅助函数 ---
function loadTagStates(): Record<string, number> {
  const variables = getVariables({ type: 'global' });
  // 【修正】将检查的 key 从 'OZ.Tag搜索' 改为 'OZ.TagStates' 保持一致
  return { ..._.get(variables, 'OZ.TagStates', {}) };
}
async function saveTagStates(option: Record<string, number>) {
  const variables = getVariables({ type: 'global' });
  _.set(variables, 'OZ.TagStates', option);
  await replaceVariables(variables, { type: 'global' });
}
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
        <li><span>1</span>（自定义开局/本介绍页不会发送给AI）</li>
        <li v-for="s in filteredStarts" :key="s.id" aria-label="button" @click="changeGreeting(s.id)">
          <span>{{ s.id + 1 }}</span
          ><i v-if="s.tags.has('NSFW')"><NSFWIcon /></i> {{ s.name }}
        </li>

        <!-- <span v-if="s.tags.length > 0" class="tag-list">
            <span v-for="tag in s.tags" :key="tag" class="tag-badge">[{{ tag }}]</span>
          </span> -->
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
<style lang="scss">
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
