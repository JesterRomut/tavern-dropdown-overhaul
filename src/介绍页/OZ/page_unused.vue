<template>
  <svg style="width: 0; height: 0; position: absolute; z-index: -999">
    <filter id="wavy2">
      <feTurbulence x="0" y="0" baseFrequency="0.015" numOctaves="3" seed="1" />
      <feDisplacementMap in="SourceGraphic" scale="4" />
    </filter>
  </svg>

  <div class="archive-container">
    <!-- 背景层挂载滤镜 -->
    <div class="archive-bg"></div>

    <!-- 文本层不挂滤镜，保证字迹清晰 -->
    <div class="archive-content">
      <Page_content></Page_content>
    </div>
  </div>
</template>
<script setup lang="ts">
import Page_content from './page_content.vue';
</script>
<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: transparent;
  padding: 20px;
}

/* 外层容器，提供定位上下文 */
.archive-container {
  position: relative;
  margin: 40px auto;
  /* 给伪元素阴影留出空间 */
  padding-bottom: 20px;
  z-index: 1;
}

/* 纸张背景层，应用撕边滤镜，避免影响文字清晰度 */
.archive-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: calc(100% - 20px);
  background: #cdcbc9;
  border: 1px solid #777777;
  filter: url(#wavy2);
  z-index: -2;
}

/* 底部卷边阴影 (Paper lift effect) */
.archive-container::before,
.archive-container::after {
  content: '';
  position: absolute;
  bottom: 30px;
  width: 40%;
  height: 15px;
  box-shadow: 0 8px 18px rgb(0, 0, 0);
  z-index: -3;
  transition: all 0.3s ease-in-out;
}

.archive-container::before {
  left: 15px;
  transform: skew(-5deg) rotate(-5deg);
}

.archive-container::after {
  right: 15px;
  transform: skew(5deg) rotate(5deg);
}

/* 鼠标悬停时的动态阴影 */
.archive-container:hover::before,
.archive-container:hover::after {
  box-shadow: 0 4px 14px rgba(20, 25, 30, 0.2);
}

.archive-container:hover::before {
  left: 5px;
}

.archive-container:hover::after {
  right: 5px;
}

/* 内容层排版 */
.archive-content {
  padding: 30px 40px;
  color: #374151;
  line-height: 1.6;
  font-size: 0.9em;
}

.quote {
  background: #e2e8f0;
  border-left: 4px solid #94a3b8;
  padding: 12px 16px;
  margin: 20px 0;
  font-style: italic;
  color: #475569;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.05);
}

section {
  margin: 25px 0;
  background: rgba(255, 255, 255, 0.5);
  padding: 15px;
  border: 1px dashed #cbd5e1;
}

h3 {
  font-size: 15px;
  color: #1e293b;
  margin-bottom: 12px;
  border-bottom: 1px solid #e2e8f0;
  display: inline-block;
}

ol {
  padding-left: 25px;
  color: #475569;
}

ol li {
  margin-bottom: 6px;
}

p {
  margin-bottom: 15px;
}

.footer {
  margin-top: 30px;
  padding-top: 15px;
  border-top: 1px solid #cbd5e1;
  font-size: 12px;
  color: #64748b;
  text-align: center;
}
</style>
