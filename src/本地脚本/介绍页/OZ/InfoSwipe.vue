<script setup lang="ts">
function swipeLeft() {
  toastr.info('网佐');
}
function swipeRight() {
  toastr.info('往右');
}
</script>
<template>
  <div class="swipe-root">
    <div class="overlay">
      <div @click.stop="swipeLeft()"></div>
      <div @click.stop="swipeRight()"></div>
    </div>
    <div>
      <p>除单击跳转外，新版酒馆点击右下角箭头下的<code>1/1</code>，也可快速跳转开场。</p>
      <p>
        <!-- 希尔伯特、拉格朗日、斐波那契）费迪南德 -->
        游玩出身同一实验室的开局时，给予user任意四字数学家名作为代号（如拉格朗日、克罗内克、勒文海姆）以达到最佳游玩效果。
      </p>
      <p>
        非自用的二改（任何修改）都需授权。二传需标明作者及原帖
        <br />
        商业化禁止
      </p>
    </div>
    <div>
      关于世界书： 建议使用自定义排序/酒馆助手内置脚本“强制自定义排序”
      世界书可以加入全局世界书/角色额外世界书让OZ客串别的卡
    </div>
  </div>
</template>
<style scoped lang="scss">
.swipe-root {
  position: relative;

  .overlay {
    position: absolute;
    width: 100%;
    height: 100%;
    display: flex;
    > div {
      flex: 1;
    }
  }
}
</style>
