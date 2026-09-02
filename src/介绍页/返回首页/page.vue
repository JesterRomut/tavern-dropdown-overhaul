<script setup lang="ts">
import { changeGreeting } from '../shared/util';
</script>
<template>
  <main>
    <div @click="changeGreeting(0)">
      ·
      <i class="fa-solid fa-retweet"></i>
      <span>返回介绍页</span>
      ·
    </div>
  </main>
</template>
<style lang="scss">
main {
  color-scheme: dark light;
  display: flex;
  align-items: center;
  justify-content: center;

  user-select: none;
  -moz-user-select: none;
  -khtml-user-select: none;
  -webkit-user-select: none;
  -o-user-select: none;

  div {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5em;
  }

  cursor: pointer;
  color: rgba(240, 248, 255, 0.49);
  font-size: 0.7em;
  // text-shadow:
  //   0 0 10px rgba(83, 196, 237, 0.5),
  //   0 0 15px #18161d,
  //   0 0 20px #18161d;
  font-weight: 400;
  div {
    padding: 0.5em 2em;
    border-radius: 2em;
    //background: #18161d7a;
    background: linear-gradient(108deg, transparent 0%, #18161d99 50%, transparent 100%);
    // box-shadow:
    //   rgb(0, 0, 0) 0px 50px 100px -20px,
    //   rgb(0, 0, 0) 0px 30px 60px -30px,
    //   rgb(39, 23, 100) 0px -2px 6px 0px inset;
    transition: all 0.3s;
  }

  div:hover {
    background: #ffffff99;
    // box-shadow:
    //   rgb(0, 0, 0) 0px 50px 100px -20px,
    //   rgb(0, 0, 0) 0px 30px 60px -30px,
    //   rgb(255, 255, 255) 0px -2px 6px 0px inset;
    color: #18161d;
  }
  // background: linear-gradient(108deg, transparent 0%, #18161d44 50%, transparent 100%);
}
</style>
