<script setup lang="ts">
import { type SwitchGroup } from './type';

const props = defineProps<{
  groups: SwitchGroup[];
  worldbookName: string;
}>();

const toggleStates = ref<Record<string, boolean>>({});

function isMatch(name: string, matcher: SwitchGroup['match']): boolean {
  if (typeof matcher === 'function') return matcher(name);
  if (matcher.global) matcher.lastIndex = 0;
  return matcher.test(name);
}

async function initState() {
  const saved = (getVariables({ type: 'script' }) || {}) as Record<string, boolean>;
  const worldbook = await getWorldbook(props.worldbookName);

  for (const group of props.groups) {
    if (typeof saved[group.id] === 'boolean') {
      toggleStates.value[group.id] = saved[group.id];
    } else {
      const matchedEntries = worldbook.filter(entry => isMatch(entry.name, group.match));
      const hasEnabled = matchedEntries.some(entry => entry.enabled);
      toggleStates.value[group.id] = hasEnabled;
    }
  }
}

onMounted(() => {
  initState();
});

async function handleToggleClick(group: SwitchGroup) {
  const current = toggleStates.value[group.id] ?? false;
  const target = !current;
  toggleStates.value[group.id] = target;

  updateVariablesWith(
    vars => {
      vars[group.id] = target;
      return vars;
    },
    { type: 'script' },
  );

  await updateWorldbookWith(
    props.worldbookName,
    entries => {
      for (const entry of entries) {
        if (isMatch(entry.name, group.match)) {
          entry.enabled = target;
        }
      }
      return entries;
    },
    { render: 'immediate' },
  );
}

async function handleExportClick(group: SwitchGroup) {
  if (!group.export) return;

  const targetName = group.export.name;
  const message = `将导出为「${targetName}」，如有同名世界书会覆盖，是否确定导出？`;

  const result = await SillyTavern.callGenericPopup(message, SillyTavern.POPUP_TYPE.CONFIRM, '', {
    okButton: '确定',
    cancelButton: '取消',
  });

  if (result !== SillyTavern.POPUP_RESULT.AFFIRMATIVE && result !== 1 && result !== true) {
    return;
  }

  const worldbook = await getWorldbook(props.worldbookName);
  const matchedEntries = worldbook.filter(entry => isMatch(entry.name, group.match));

  if (matchedEntries.length === 0) {
    toastr.warning(`未找到匹配的条目`);
    return;
  }

  await createOrReplaceWorldbook(targetName, klona(matchedEntries), { render: 'immediate' });
  toastr.success(`已成功导出世界书「${targetName}」`);
}
</script>

<template>
  <ul class="world_entry wi-card-entry">
    <li v-for="group in groups" :key="group.id" class="wigroup-list-item">
      <div
        class="fa-solid killSwitch"
        :class="{
          'fa-toggle-on': toggleStates[group.id],
          'fa-toggle-off': !toggleStates[group.id],
        }"
        @click="handleToggleClick(group)"
      ></div>
      <div>
        {{ group.label }}
      </div>
      <div
        v-if="group.export"
        class="menu_button fa-solid fa-file-export interactable"
        title="导出为独立世界书"
        @click.stop="handleExportClick(group)"
      ></div>
    </li>
  </ul>
</template>

<style lang="scss" scoped>
ul.wi-card-entry {
  margin: 0;
  margin-block: 0.25rem;
}
.wigroup-list-item {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-block: 0.5rem;
}
</style>
