<!-- eslint-disable vue/no-v-html -->
<script setup lang="ts">
import _ from 'lodash';

const props = defineProps<{ desc: string | undefined; tags: Set<string> }>();
</script>
<template>
  <div v-if="desc" v-html="desc"></div>
  <span v-if="tags.size > 0">Tags: {{ _.join(Array.from(tags), ', ') }}</span>
</template>
<style lang="scss" scoped>
span {
  font-size: 0.7rem;
}
</style>
