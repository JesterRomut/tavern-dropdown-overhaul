<script setup lang="ts">
import { type SwitchGroup } from './type';
const { groups } = defineProps<{ groups: SwitchGroup[] }>();

const toggle = ref(true);
</script>
<template>
  <form class="world_entry_form wi-card-entry">
    <div v-for="{ match, label } in groups" :key="label">
      <div class="fa-solid fa-toggle-on killSwitch"></div>
      <div>
        {{ label }}
      </div>
    </div>
  </form>
</template>
