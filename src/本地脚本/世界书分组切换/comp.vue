<script setup lang="ts">
import { type Directive } from 'vue';
import { type GroupLabel, type SwitchGroup } from './type';

const props = defineProps<{
  groups: SwitchGroup[];
  worldbookName: string;
}>();

const vLabel: Directive<HTMLElement, GroupLabel> = (el, binding) => {
  el.replaceChildren();
  const val = typeof binding.value === 'function' ? binding.value() : binding.value;
  if (!val) return;

  if (typeof val === 'string') {
    el.innerHTML = val;
  } else if ('jquery' in (val as any)) {
    $(el).append(val as JQuery);
  } else if (val instanceof Node) {
    el.appendChild(val);
  }
};

const toggleStates = ref<Record<string, boolean>>({});

function isMatch(name: string, matcher: SwitchGroup['match']): boolean {
  if (typeof matcher === 'function') return matcher(name);
  if (matcher.global) matcher.lastIndex = 0;
  return matcher.test(name);
}

async function initState() {
  const worldbook = await getWorldbook(props.worldbookName);

  for (const group of props.groups) {
    const matchedEntries = worldbook.filter(entry => isMatch(entry.name, group.match));
    toggleStates.value[group.id] = matchedEntries.some(entry => entry.enabled);
  }
}

onMounted(() => {
  initState();
});

async function handleToggleClick(group: SwitchGroup) {
  const current = toggleStates.value[group.id] ?? false;
  const target = !current;
  toggleStates.value[group.id] = target;

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
  <table class="world_entry wi-card-entry">
    <tr v-for="group in groups" :key="group.id" class="wigroup-list-item">
      <td>
        <div
          class="fa-solid killSwitch"
          :class="{ 'fa-toggle-on': toggleStates[group.id], 'fa-toggle-off': !toggleStates[group.id] }"
          @click="handleToggleClick(group)"
        ></div>
      </td>
      <td v-label="group.label"></td>
      <td v-if="group.export">
        <div
          class="menu_button fa-solid fa-file-export interactable"
          title="导出为独立世界书"
          @click.stop="handleExportClick(group)"
        ></div>
      </td>
    </tr>
  </table>
</template>

<style lang="scss" scoped>
table.wi-card-entry {
  margin: 0;
  margin-block: 0.25rem;
  border-spacing: 0 0.5rem;
  tr {
    align-items: center;
    margin-block: 0.5rem;

    td {
      padding-inline: 0.5rem;
    }
  }
}
</style>
