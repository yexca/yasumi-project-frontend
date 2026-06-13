<template>
    <div>
      <h1>任务页面</h1>
      <p>这里是任务的内容。</p>
      <router-link to="/">返回首页</router-link>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from "vue";
  
  export default defineComponent({
    name: "Task",
  });
  </script>
  
  <style scoped>
  h1 {
    color: #ff6347;
  }
  </style>
  