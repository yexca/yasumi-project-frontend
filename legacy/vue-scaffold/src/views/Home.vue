<template>
    <div>
      <h1>首页</h1>
      <p>欢迎访问！</p>
      <router-link to="/category">前往分类</router-link>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent } from "vue";
  
  export default defineComponent({
    name: "Home",
  });
  </script>
  
  <style scoped>
  h1 {
    color: #42b983;
  }
  </style>
  