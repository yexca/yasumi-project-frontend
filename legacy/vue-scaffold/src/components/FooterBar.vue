<template>
    <footer class="footer-bar">
      <p>&copy; 2024 <a href="https://lit.link/yexca" style="text-decoration: none; color: pink;">yexca</a></p>
    </footer>
  </template>
  
  <script lang="ts">
  import { defineComponent } from "vue";
  
  export default defineComponent({
    name: "FooterBar",
  });
  </script>
  
  <style>
  .footer-bar {
    background-color: #34495e;
    color: white;
    text-align: center;
    line-height: 30px;
  }
  </style>
  