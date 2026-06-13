<template>
    <div>
      <h1>分类页面</h1>
      <p>这里是分类的内容。</p>
      <router-link to="/task">前往任务页面</router-link>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from "vue";
  
  export default defineComponent({
    name: "Category",
  });
  </script>
  
  <style scoped>
  h1 {
    color: #369f6e;
  }
  </style>
  