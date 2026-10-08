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
      <i class="fa-solid fa-circle-exclamation"></i>
      <span>相关世界书设定未开启：</span>
    </div>
    <div>
      <div v-for="group in disabledGroups" :key="group.id">
        <div v-label="group.label" class="group-info"></div>
        <button class="enable-btn" title="点击开启此分组" @click="handleEnable(group)">
          <i class="fa-solid fa-toggle-off"></i>
          <span>开启</span>
        </button>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
main {
  color: var(--SmartThemeBodyColor);
}
</style>
