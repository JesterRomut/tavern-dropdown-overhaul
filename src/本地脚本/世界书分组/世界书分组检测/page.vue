<script setup lang="ts">
import { useParentTheme, withColors, withTypography } from '@util/theme';
import { type SwitchGroup, type WorldbookSwitcherAPI, vLabel } from '../世界书分组切换/type';

useParentTheme([withColors(), withTypography()]);

const target_ids = computed(() => {
  try {
    const message = getChatMessages(getCurrentMessageId())[0]?.message ?? '';
    const regex = /<WorldGroupRequire\s+[^>]*?id=["']([^"']+)["'][^>]*?\/?>/gi;
    const ids: string[] = [];
    for (const match of message.matchAll(regex)) {
      if (match[1]) {
        for (const item of match[1].split(',')) {
          const trimmed = item.trim();
          if (trimmed) ids.push(trimmed);
        }
      }
    }
    return ids;
  } catch {
    return [];
  }
});

const disabledGroups = ref<SwitchGroup[]>([]);
const hasHadDisabled = ref(false);
const isCompleted = ref(false);
let switcher: WorldbookSwitcherAPI | null = null;

async function getSwitcher(): Promise<WorldbookSwitcherAPI | null> {
  if (switcher) return switcher;
  await waitGlobalInitialized('WorldbookSwitcher');
  switcher = (window as any).WorldbookSwitcher;
  return switcher;
}

async function checkDisabledGroups() {
  const ws = await getSwitcher();
  if (!ws) return;
  const list: SwitchGroup[] = [];
  for (const id of target_ids.value) {
    const group = ws.getGroup(id);
    if (!group) continue;
    const enabled = await ws.isGroupEnabled(id);
    if (!enabled) {
      list.push(group);
    }
  }

  if (list.length > 0) {
    hasHadDisabled.value = true;
    isCompleted.value = false;
  } else if (hasHadDisabled.value) {
    isCompleted.value = true;
  }

  disabledGroups.value = list;
}

async function handleEnable(group: SwitchGroup) {
  const ws = await getSwitcher();
  if (!ws) return;
  await ws.toggleGroup(group.id, true);
  await checkDisabledGroups();
}

onMounted(async () => {
  await checkDisabledGroups();

  eventOn(tavern_events.WORLDINFO_UPDATED, () => {
    checkDisabledGroups();
  });
  eventOn(tavern_events.MESSAGE_UPDATED, id => {
    if (id === getCurrentMessageId()) {
      checkDisabledGroups();
    }
  });
});
</script>

<template>
  <main v-if="disabledGroups.length > 0">
    <div>
      <h1>
        <i class="fa-solid fa-triangle-exclamation"></i>
        <span>相关世界书分组未开启</span>
      </h1>
    </div>
    <div>
      <ul>
        <li v-for="group in disabledGroups" :key="group.id">
          <div v-label="group.label"></div>
          <button class="enable-btn" title="点击开启此分组" @click="handleEnable(group)">
            <i class="fa-solid fa-circle-plus"></i>
          </button>
        </li>
      </ul>
    </div>
  </main>
  <main v-else-if="isCompleted">
    <div>
      <h1><i class="fa-solid fa-circle-check"></i> <span>相关世界书分组已开启</span></h1>
    </div>
  </main>
  <div v-else class="placeholder"></div>
</template>

<style lang="scss">
main {
  color: var(--theme-body-color);
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  > div {
    display: flex;
    justify-content: center;
  }

  font-size: var(--theme-font-size);
  font-family: var(--theme-font-family);
  letter-spacing: var(--theme-letter-spacing);
  font-weight: var(--theme-font-weight);
}

h1 {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  // background-color: var(--theme-body-color);
  // color: color(from var(--theme-blur-tint-color) srgb r g b / 1);
  // border-radius: 9999rem;
  // padding-inline: 0.5rem;
  // padding-block: 0.25rem;
}

ul {
  margin-block: 0.75rem;
}
ul li {
  display: flex;
  background: var(--theme-blur-tint-color);
  padding-inline: 2rem;
  padding-block: 1rem;
  border-radius: 9999rem;
  box-shadow: 0px 0px 0.5rem 0px color-mix(in oklab, contrast-color(var(--theme-blur-tint-color)) 20%, transparent);

  transition: 0.2s;
  &:has(button:hover) {
    background-color: var(--theme-body-color);
    color: color(from var(--theme-blur-tint-color) srgb r g b / 1);

    small {
      color: color(from var(--theme-blur-tint-color) srgb r g b / 0.7);
    }
  }
}

small {
  color: var(--theme-em-color);
}

.placeholder {
  height: 1px;
}
</style>
