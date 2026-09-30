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

async function handleClick(group: SwitchGroup) {
  const current = toggleStates.value[group.id] ?? false;
  const target = !current;
  toggleStates.value[group.id] = target;

  updateVariablesWith(vars => {
    vars[group.id] = target;
    return vars;
  }, { type: 'script' });

  await updateWorldbookWith(props.worldbookName, entries => {
    for (const entry of entries) {
      if (isMatch(entry.name, group.match)) {
        entry.enabled = target;
      }
    }
    return entries;
  }, { render: 'debounced' });
}
</script>

<template>
  <form class="world_entry_form wi-card-entry">
    <div v-for="group in groups" :key="group.id">
      <div
        class="fa-solid killSwitch"
        :class="{
          'fa-toggle-on': toggleStates[group.id],
          'fa-toggle-off': !toggleStates[group.id],
        }"
        @click="handleClick(group)"
      ></div>
      <div>
        {{ group.label }}
      </div>
    </div>
  </form>
</template>
