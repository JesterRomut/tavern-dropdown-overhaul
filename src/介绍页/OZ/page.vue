<script setup lang="ts">
import NSFWIcon from './NSFWIcon.vue';
import { changeGreeting } from './util';

// async function changeGreeting(swipe_id: number) {
//   try {
//     // 优先调用酒馆助手API，无缝刷新至0号开场白
//     if (typeof setChatMessages === 'function') {
//       await setChatMessages([{ message_id: 0, swipe_id }], { refresh: 'all' });
//     } else {
//       throw new Error('STHelper API not found.');
//     }
//   } catch (error) {
//     // 降级方案：执行STscript斜杠命令模拟切换
//     console.warn('UI交互降级: 使用triggerSlash返回开场白');
//     if (typeof triggerSlash === 'function') {
//       triggerSlash('/swipe 0 0');
//     }
//   }
// }

type Start = { id: number; name: string; tags: Set<string> };
function start(id: number, name: string, tags: Array<string> = []): Start {
  return { id, name, tags: new Set(tags) };
}
function NSFWstart(id: number, name: string, tags: Array<string> = []) {
  return start(id, name, ['NSFW', ...tags]);
}
const starts: Start[] = [
  // start(1, '（自定义开局/此介绍页不会发送给AI）'),
  start(1, 'user和OZ争抢半价便当', ['偶遇']),
  start(2, 'user要求OZ脑控自己并讨论方案', ['雇佣']),
  start(3, 'OZ来user家面试挖掘失传媒体的工作', ['雇佣']),
  start(4, 'user在图书馆发现了看书的OZ', ['偶遇']),
  start(5, 'user在实验室旧址拍到了隐身的OZ', ['偶遇']),
  start(6, 'user在野外徒步雇OZ当摄影师', ['雇佣']),
  start(7, 'user看见OZ被雨打湿衣服透出的高危精神病纹身', ['偶遇']),
  start(8, 'OZ发现自己的名字在21世纪已沦为无限膨胀的论战单位'),
  start(9, 'OZ在21世纪不会扫码支付，不得不求助user', ['求助']),
  start(10, 'user是警察接到OZ的报案', ['求助']),
  start(11, 'user和OZ出身同一实验室，正在叫OZ起床', ['旧识']),
  start(12, 'OZ读出身同一实验室的user的心，读到非常可怕的成人内容被破防', ['旧识', '雇佣']),
  NSFWstart(13, '爱爱时OZ掀开衣服露出小腹上的纹身，本以为是魅魔淫纹，没想到是……'),
  NSFWstart(14, 'OZ脑控user操自己泄欲'),
  NSFWstart(15, 'OZ被user脑子里的成人内容破防（这次真的是黄色废料了确信）'),
  NSFWstart(16, 'OZ看本子看流鼻血被抓包，嘴硬说是超能力用多了'),
];

const searchQuery = ref('');
// 0: 未选中, 1: 包含, -1: 排除
const tagStates = ref<Record<string, number>>({});

const allTags = computed(() => {
  let tags = new Set<string>();
  starts.forEach(s => {
    tags = tags.union(s.tags);
  });
  return [...tags].reverse();
});

// 初始化标签状态
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

const toggleTag = (tag: string) => {
  const current = tagStates.value[tag] || 0;
  if (current === 0)
    tagStates.value[tag] = 1; // 未选 -> 包含
  else if (current === 1)
    tagStates.value[tag] = -1; // 包含 -> 排除
  else tagStates.value[tag] = 0; // 排除 -> 未选
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
</script>

<template>
  <main>
    <p>作者@Kernschmelze。OZ，欧几里得。</p>
    <p>“大家早就不需要超能力者了。有了计算机和互联网，谁还需要被折弯的勺子和被撬开的锁呢？”</p>
    <section>
      <h3><i class="fa-solid fa-eye"></i> 开场一览</h3>
      <div class="search-bar">
        <input v-model="searchQuery" type="text" placeholder="搜索开场..." />
      </div>

      <div class="tags-container">
        <button
          v-for="tag in allTags"
          :key="tag"
          :class="[{ 'is-included': tagStates[tag] === 1, 'is-excluded': tagStates[tag] === -1 }]"
          @click="toggleTag(tag)"
        >
          <!-- <span v-if="tagStates[tag] === 1" class="tag-icon">+</span> -->
          <i v-if="tagStates[tag] === 1" class="fa-solid fa-circle-check"></i>
          <!-- <span v-else-if="tagStates[tag] === -1" class="tag-icon">-</span> -->
          <i v-else-if="tagStates[tag] === -1" class="fa-solid fa-circle-xmark"></i>
          {{ tag }}
        </button>
      </div>

      <ul>
        <li><span>1</span>（自定义开局/本介绍页不会发送给AI）</li>
        <li v-for="s in filteredStarts" :key="s.id" aria-label="button" @click="changeGreeting(s.id)">
          <span>{{ s.id + 1 }}</span> <i v-if="s.tags.has('NSFW')"> <NSFWIcon /></i>{{ s.name }}
          <!-- <span v-if="s.tags.length > 0" class="tag-list">
            <span v-for="tag in s.tags" :key="tag" class="tag-badge">[{{ tag }}]</span>
          </span> -->
        </li>

        <li v-if="filteredStarts.length === 0" style="color: #888"><i>月球的背面空荡荡...</i></li>
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
  margin: 1em 0 0.5em 0;
  input {
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #484a4c;
    color: aliceblue;
    padding: 0.4em 0.8em;
    border-radius: 4px;
    outline: none;
    flex: 1;
    font-size: 0.85em;
  }
  input:focus {
    border-color: mediumslateblue;
  }
}
/* 标签容器和按钮样式 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5em;
  margin-bottom: 1em;

  button {
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid #484a4c;
    color: #aaa;
    padding: 0.3em 0.6em;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.85em;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.3em;
  }
  button:hover {
    background: rgba(255, 255, 255, 0.1);
    color: aliceblue;
  }

  button.is-included {
    background: rgba(46, 139, 87, 0.3); /* 海绿色 */
    border-color: #2e8b57;
    color: #98fb98;
  }

  button.is-excluded {
    background: rgba(178, 34, 34, 0.3); /* 耐火砖红 */
    border-color: #b22222;
    color: #ffb6c1;
  }
}

.tag-list {
  margin-left: 0.5em;
  font-size: 0.85em;
  color: #888;
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
  font-size: 0.9em;

  > p {
    padding: 0.5em var(--section-padding);
  }

  > footer {
    text-align: center;
  }

  > footer h1 {
    font-family: 'ZSFT-685';
    font-weight: normal;
    font-size: 1.6em;
  }

  > footer h2 {
    font-family: 'ZSFT-651';
    font-weight: lighter;
    font-size: 0.9em;
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
  margin: 1em 0;
  padding-top: 1em;
  padding-bottom: 1em;

  ul {
    height: 20rem;
    overflow-x: auto;

    padding-left: 1em;

    @media screen and (max-width: 600px) {
      padding-left: 0;
    }

    li {
      padding: 0.5em;
      cursor: pointer;

      @media screen and (max-width: 600px) {
        border-bottom: 1px solid #484a4c;
      }

      transition: 0.3s;

      > i {
        width: 1.2em;
        height: 1.2em;
        margin-right: 0.2em;
        display: inline-block;
      }

      > span {
        background: black;
        font-family: monospace;
        display: inline-block;
        border: 1px solid #484a4c;
        width: 1.2rem;
        height: 1.2rem;
        line-height: 1.2rem;
        text-align: center;
        vertical-align: middle;
        border-radius: 4px;
      }
    }
    > :not(:first-child):hover {
      //color: mediumpurple;
      background: rgba(255, 255, 255, 0.15);
    }
    @media screen and (min-width: 600px) {
      > :nth-child(odd) {
        background: rgba(255, 255, 255, 0.05);
      }
    }
    > :first-child {
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
