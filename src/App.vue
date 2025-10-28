<template>
  <div id="app">
    <header>
      <h1>PlateMate</h1>
      <p>Your comprehensive fitness tracking companion</p>
    </header>
    
    <nav class="nav-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
        class="tab-button"
      >
        {{ tab.label }}
      </button>
    </nav>

    <main class="main-content">
      <!-- Exercise Catalog Tab -->
      <div v-if="activeTab === 'exercises'" class="tab-content">
        <ExerciseCatalog />
      </div>

      <!-- User Management Tab -->
      <div v-if="activeTab === 'users'" class="tab-content">
        <UserManagement />
      </div>

      <!-- Workout Tracking Tab -->
      <div v-if="activeTab === 'workouts'" class="tab-content">
        <WorkoutTracking />
      </div>

      <!-- Progression Tracking Tab -->
      <div v-if="activeTab === 'progression'" class="tab-content">
        <ProgressionTracking />
      </div>

      <!-- Routine Planning Tab -->
      <div v-if="activeTab === 'routines'" class="tab-content">
        <RoutinePlanning />
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ExerciseCatalog from './components/ExerciseCatalog.vue'
import UserManagement from './components/UserManagement.vue'
import WorkoutTracking from './components/WorkoutTracking.vue'
import ProgressionTracking from './components/ProgressionTracking.vue'
import RoutinePlanning from './components/RoutinePlanning.vue'

const activeTab = ref('exercises')

const tabs = [
  { id: 'exercises', label: 'Exercise Catalog' },
  { id: 'users', label: 'User Management' },
  { id: 'workouts', label: 'Workout Tracking' },
  { id: 'progression', label: 'Progression' },
  { id: 'routines', label: 'Routine Planning' }
]
</script>

<style scoped>
#app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

header {
  text-align: center;
  margin-bottom: 2rem;
}

header h1 {
  color: #4a90a4;
  margin-bottom: 0.5rem;
  font-size: 2.5rem;
}

header p {
  color: #5a7a88;
  font-size: 1.1rem;
}

.nav-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid #90caf9;
  padding-bottom: 1rem;
}

.tab-button {
  background: #f5f8fa;
  border: 1px solid #d1e7f0;
  padding: 0.75rem 1.5rem;
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  color: #4a90a4;
  transition: all 0.2s ease;
}

.tab-button:hover {
  background: #e8f2f7;
  color: #3a7080;
}

.tab-button.active {
  background: #5a9bb4;
  color: white;
  border-color: #5a9bb4;
}

.main-content {
  min-height: 500px;
}

.tab-content {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>