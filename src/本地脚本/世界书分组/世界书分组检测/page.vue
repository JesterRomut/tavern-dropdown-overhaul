<script setup lang="ts">
import { useParentTheme, withColors, withTypography } from '@util/theme';

useParentTheme([withColors(), withTypography()]);

const raw_group_ids = `$1`; //运行时正则会把$1替换成逗号分隔的分组id，如a,b,c
const group_ids = raw_group_ids.split(',');
</script>
<template>
  <div>{{ raw_group_ids }}</div>
</template>
<style lang="scss"></style>
