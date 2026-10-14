<script setup lang="ts">
const current = ref('');
const names = [
  '希尔伯特',
  '莫比乌斯',
  '斐波那契',
  '莱布尼茨',
  '切比雪夫',
  '拉马努金',
  '拉普拉斯',
  '拉格朗日',
  '莱昂哈德',
  '拉德马赫',
  '勒文海姆',
  '费迪南德',
  '埃尔米特',
  '克罗内克',
  '布尔巴基',
  '狄利克雷',
  '冯诺依曼',
  '海因里希',
  '阿基米德',
  '利普希茨',
  '哥德巴赫',
];

function rollName() {
  current.value = names[Math.floor(Math.random() * names.length)];
}
</script>
<template>
  <button @click="rollName">
    <span>点击随机名字</span>
    <span v-if="current">{{ current }}</span>
  </button>
</template>
<style lang="scss"></style>
