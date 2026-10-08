<script setup lang="ts">
import { type SwitchGroup, type WorldbookSwitcherAPI, vLabel } from './type';

const props = defineProps<{
  api: WorldbookSwitcherAPI;
}>();

const toggleStates = ref<Record<string, boolean>>({});

async function initState() {
  for (const group of props.api.groups) {
    toggleStates.value[group.id] = await props.api.isGroupEnabled(group.id);
  }
}

onMounted(() => {
  initState();
  eventOn(tavern_events.WORLDINFO_UPDATED, () => {
    initState();
  });
});

async function handleToggleClick(group: SwitchGroup) {
  const current = toggleStates.value[group.id] ?? false;
  const target = !current;
  toggleStates.value[group.id] = target;
  await props.api.toggleGroup(group.id, target);
}

async function handleExportClick(group: SwitchGroup) {
  await props.api.exportGroup(group.id);
}
</script>

<template>
  <table class="world_entry wi-card-entry">
    <tr v-for="group in api.groups" :key="group.id" class="wigroup-list-item">
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

