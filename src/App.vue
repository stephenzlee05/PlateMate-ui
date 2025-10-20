<template>
  <div id="app">
    <header>
      <h1>PlateMate UI</h1>
      <p>Welcome to your Vue.js application!</p>
    </header>
    
    <main>
      <div class="card">
        <h2>Getting Started</h2>
        <p>This is a Vue.js application built with Vite and TypeScript.</p>
        <button @click="count++">Count is {{ count }}</button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>

<style scoped>
.card {
  padding: 2em;
  border-radius: 8px;
  background: #f9f9f9;
  margin: 1em 0;
}

button {
  background: #42b883;
  color: white;
  border: none;
  padding: 0.5em 1em;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1em;
}

button:hover {
  background: #369870;
}
</style>
