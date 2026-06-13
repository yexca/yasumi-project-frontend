<template>
    <header class="header-bar">
      <h1>yasumiProject</h1>
    </header>
  </template>
  
  <script lang="ts">
  import { defineComponent } from "vue";
  
  export default defineComponent({
    name: "HeaderBar",
  });
  </script>
  
  <style>
  .header-bar {
    background-color: #34495e;
    color: white;
    text-align: center;
    line-height: 60px;
  }
  </style>
  