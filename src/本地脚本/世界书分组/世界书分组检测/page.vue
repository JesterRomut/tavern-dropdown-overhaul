<script setup lang="ts">
import { useParentTheme, withColors, withTypography } from '@util/theme';
import { type SwitchGroup, type WorldbookSwitcherAPI, vLabel } from '../世界书分组切换/type';

useParentTheme([withColors(), withTypography()]);

const chat_message = getChatMessages(getCurrentMessageId())[0];

const match = chat_message.message.match(/<WorldGroupRequire ?id="(.*?)" ?\/>/g);

if (!match) throw new Error('未匹配到世界书分组ID');

const target_ids = computed(() =>
  match[0]
    .split(',')
    .map(s => s.trim())
    .filter(Boolean),
);

const disabledGroups = ref<SwitchGroup[]>([]);
let switcher: WorldbookSwitcherAPI | null = null;

async function checkDisabledGroups() {
  if (!switcher) return;
  const list: SwitchGroup[] = [];
  for (const id of target_ids.value) {
    const group = switcher.getGroup(id);
    if (!group) continue;
    const enabled = await switcher.isGroupEnabled(id);
    if (!enabled) {
      list.push(group);
    }
  }
  disabledGroups.value = list;
}

async function handleEnable(group: SwitchGroup) {
  if (!switcher) return;
  await switcher.toggleGroup(group.id, true);
  await checkDisabledGroups();
}

onMounted(async () => {
  switcher = await waitGlobalInitialized<WorldbookSwitcherAPI>('WorldbookSwitcher');
  await checkDisabledGroups();

  eventOn(tavern_events.WORLDINFO_UPDATED, () => {
    checkDisabledGroups();
  });
});
</script>

<template>
  <div v-if="disabledGroups.length > 0" class="group-detector-card">
    <div class="detector-header">
      <i class="fa-solid fa-circle-exclamation detector-icon"></i>
      <span>检测到相关世界书设定未开启：</span>
    </div>
    <div class="detector-list">
      <div v-for="group in disabledGroups" :key="group.id" class="detector-item">
        <div v-label="group.label" class="group-info"></div>
        <button class="enable-btn" title="点击开启此分组" @click="handleEnable(group)">
          <i class="fa-solid fa-toggle-off"></i>
          <span>开启</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.group-detector-card {
  box-sizing: border-box;
  width: 100%;
  margin: 0.5rem 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--SmartThemeBorderColor, rgba(128, 128, 128, 0.35));
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detector-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  opacity: 0.85;

  .detector-icon {
    color: var(--SmartThemeQuoteColor, #e5a93b);
  }
}

.detector-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detector-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.35rem 0.5rem;
  border-radius: 6px;
  border: 1px dashed var(--SmartThemeBorderColor, rgba(128, 128, 128, 0.2));

  .group-info {
    flex: 1;
    min-width: 0;
    line-height: 1.4;

    :deep(small) {
      display: block;
      opacity: 0.7;
      font-size: 0.8rem;
    }
  }

  .enable-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.25rem 0.65rem;
    border-radius: 4px;
    border: 1px solid var(--SmartThemeBorderColor, rgba(128, 128, 128, 0.4));
    background: transparent;
    color: inherit;
    cursor: pointer;
    font-size: 0.85rem;
    white-space: nowrap;
    transition:
      background-color 0.2s,
      opacity 0.2s;

    &:hover {
      opacity: 0.8;
      background-color: rgba(128, 128, 128, 0.15);
    }
  }
}
</style>
