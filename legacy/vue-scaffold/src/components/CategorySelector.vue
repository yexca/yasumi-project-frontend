<template>
    <div class="category-selector">
      <h2>选择分类</h2>
      <select v-model="selectedCategory">
        <option v-for="category in categories" :key="category.id" :value="category.name">
          {{ category.name }}
        </option>
      </select>
  
      <h2>选择任务</h2>
      <input v-model="task" type="text" placeholder="请输入任务名称" />
  
      <button @click="startTask">开始</button>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from "vue";
  import type { Category } from "../types/Category";
  
  export default defineComponent({
    name: "CategorySelector",
    setup() {
      // 分类数据
      const categories = ref<Category[]>([
        { id: 1, name: "学习" },
        { id: 2, name: "运动" },
        { id: 3, name: "娱乐" },
      ]);
  
      // 用户选择的数据
      const selectedCategory = ref<string>("");
      const task = ref<string>("");
  
      // 开始任务
      const startTask = () => {
        if (!selectedCategory.value || !task.value) {
          alert("请选择分类并输入任务！");
          return;
        }
        alert(`任务开始：\n分类 - ${selectedCategory.value}\n任务 - ${task.value}`);
      };
  
      return {
        categories,
        selectedCategory,
        task,
        startTask,
      };
    },
  });
  </script>
  
  <style scoped>
  .category-selector {
    margin: 20px auto;
    padding: 20px;
    max-width: 400px;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  h2 {
    margin: 10px 0;
  }
  select,
  input {
    width: 100%;
    padding: 8px;
    margin: 10px 0;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  button {
    width: 100%;
    padding: 10px;
    background-color: #42b983;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  button:hover {
    background-color: #369f6e;
  }
  </style>
  