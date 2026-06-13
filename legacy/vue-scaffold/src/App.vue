<template>
  <div id="app">
    <div class="layout">
      <!-- 左侧菜单栏 -->
      <aside class="menu-bar">
        <MenuBar />
      </aside>

      <!-- 右侧内容区 -->
      <div class="content-area">
        <HeaderBar />
        <main class="main-content">
          <router-view />
        </main>
        <FooterBar />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import MenuBar from "./components/MenuBar.vue";
import HeaderBar from "./components/HeaderBar.vue";
import FooterBar from "./components/FooterBar.vue";

export default defineComponent({
  name: "App",
  components: {
    MenuBar,
    HeaderBar,
    FooterBar,
  },
});
</script>

<style>
/* 全局样式 */
body, html, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: Arial, sans-serif;
  background: url('/src/assets/img/50635973_p1.jpg') no-repeat center center fixed;
  background-size: cover;
}

@media (max-width: 768px) {
  body, html, #app {
  margin: 0;
  padding: 0;
  height: 100%;
  font-family: Arial, sans-serif;
  background: url('/src/assets/img/CFVS0787.PNG') no-repeat center center fixed;
  background-size: cover;
}
}

/* 主布局样式-毛玻璃效果容器 */
.layout {
  display: flex;
  height: 100%;
  backdrop-filter: blur(1px);
  -webkit-backdrop-filter: blur(10px); /* Safari 支持 */
  background-color: rgba(255, 255, 255, 0.1); /* 半透明背景 */
}

/* 左侧菜单栏 */
.menu-bar {
  width: 55px;
  height: 100vh;
  background-color: #2c3e50; 
  background-color: rgba(44, 62, 80, 0.3); /* 半透明背景 */
  color: white;
}

/* 响应式处理 */
/* @media (max-width: 768px) {
  .menu-bar {
    width: 55px;  /* 只显示图标 
  }
} */
/* 针对电脑端 */
/* @media (min-width: 769px) {
  .menu-bar {
    display: flex;
    flex-direction: column;
    width: 240px; 显示完整菜单
  }
} */

.content-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* 右侧内容区 Header、Footer */
.header-bar {
  height: 60px;
  background-color: rgba(52, 73, 94, 0.3); /* 半透明背景 */;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}


.footer-bar {
  height: 30px;
  background-color: rgba(52, 73, 94, 0.3); /* 半透明背景 */;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 主内容区 */
.main-content {
  flex: 1;
  background-color: rgba(255, 255, 255, 0.5); /* 半透明背景 */;
  border-radius: 10px; /* 圆角 */
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); /* 添加阴影效果 */
}
</style>
