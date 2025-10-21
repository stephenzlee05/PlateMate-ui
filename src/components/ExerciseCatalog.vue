<template>
  <div class="exercise-catalog">
    <div class="header">
      <h2>Exercise Catalog</h2>
      <button @click="showAddForm = !showAddForm" class="btn btn-primary">
        {{ showAddForm ? 'Cancel' : 'Add Exercise' }}
      </button>
    </div>

    <!-- Add Exercise Form -->
    <div v-if="showAddForm" class="add-form">
      <h3>Add New Exercise</h3>
      <form @submit.prevent="addExercise">
        <div class="form-group">
          <label for="name">Exercise Name:</label>
          <input 
            id="name" 
            v-model="newExercise.name" 
            type="text" 
            required 
            placeholder="e.g., Bench Press"
          />
        </div>

        <div class="form-group">
          <label for="muscleGroups">Muscle Groups:</label>
          <input 
            id="muscleGroups" 
            v-model="muscleGroupsInput" 
            type="text" 
            placeholder="e.g., chest, shoulders, triceps"
          />
          <small>Separate multiple muscle groups with commas</small>
        </div>

        <div class="form-group">
          <label for="movementPattern">Movement Pattern:</label>
          <select id="movementPattern" v-model="newExercise.movementPattern" required>
            <option value="">Select pattern</option>
            <option value="push">Push</option>
            <option value="pull">Pull</option>
            <option value="squat">Squat</option>
            <option value="hinge">Hinge</option>
            <option value="carry">Carry</option>
            <option value="isolation">Isolation</option>
          </select>
        </div>

        <div class="form-group">
          <label for="equipment">Equipment:</label>
          <input 
            id="equipment" 
            v-model="newExercise.equipment" 
            type="text" 
            placeholder="e.g., Barbell, Dumbbells, Bodyweight"
          />
        </div>

        <div class="form-group">
          <label for="instructions">Instructions:</label>
          <textarea 
            id="instructions" 
            v-model="newExercise.instructions" 
            rows="4"
            placeholder="Exercise instructions and form tips..."
          ></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn btn-primary" :disabled="loading">
            {{ loading ? 'Adding...' : 'Add Exercise' }}
          </button>
        </div>
      </form>
    </div>

    <!-- Search and Filter -->
    <div class="search-section">
      <div class="search-controls">
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Search exercises..." 
          class="search-input"
        />
        <select v-model="selectedMuscleGroup" class="filter-select">
          <option value="">All Muscle Groups</option>
          <option v-for="group in muscleGroups" :key="group" :value="group">
            {{ group }}
          </option>
        </select>
        <button @click="searchExercises" class="btn btn-secondary">Search</button>
      </div>
    </div>

    <!-- Exercise List -->
    <div class="exercise-list">
      <div v-if="loading" class="loading">Loading exercises...</div>
      <div v-else-if="exercises.length === 0" class="no-results">
        No exercises found. Try adjusting your search criteria.
      </div>
      <div v-else class="exercise-grid">
        <div v-for="exercise in exercises" :key="exercise.exerciseId" class="exercise-card">
          <h3>{{ exercise.name }}</h3>
          <div class="exercise-details">
            <div class="detail-item">
              <strong>Muscle Groups:</strong>
              <span class="muscle-groups">
                <span v-for="group in exercise.muscleGroups" :key="group" class="muscle-tag">
                  {{ group }}
                </span>
              </span>
            </div>
            <div class="detail-item">
              <strong>Pattern:</strong> {{ exercise.movementPattern }}
            </div>
            <div v-if="exercise.equipment" class="detail-item">
              <strong>Equipment:</strong> {{ exercise.equipment }}
            </div>
            <div v-if="exercise.instructions" class="detail-item">
              <strong>Instructions:</strong>
              <p class="instructions">{{ exercise.instructions }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { exerciseCatalogApi } from '../services/api'
import type { Exercise, AddExerciseRequest } from '../types/api'

const exercises = ref<Exercise[]>([])
const loading = ref(false)
const showAddForm = ref(false)
const searchQuery = ref('')
const selectedMuscleGroup = ref('')
const muscleGroupsInput = ref('')

const newExercise = ref<AddExerciseRequest>({
  name: '',
  muscleGroups: [],
  movementPattern: '',
  equipment: '',
  instructions: ''
})

const muscleGroups = computed(() => {
  const groups = new Set<string>()
  exercises.value.forEach(exercise => {
    exercise.muscleGroups.forEach(group => groups.add(group))
  })
  return Array.from(groups).sort()
})

const addExercise = async () => {
  loading.value = true
  try {
    const muscleGroupsArray = muscleGroupsInput.value
      .split(',')
      .map(g => g.trim())
      .filter(g => g.length > 0)

    const exerciseData: AddExerciseRequest = {
      ...newExercise.value,
      muscleGroups: muscleGroupsArray,
      equipment: newExercise.value.equipment || null,
      instructions: newExercise.value.instructions || null
    }

    await exerciseCatalogApi.addExercise(exerciseData)
    
    // Reset form
    newExercise.value = {
      name: '',
      muscleGroups: [],
      movementPattern: '',
      equipment: '',
      instructions: ''
    }
    muscleGroupsInput.value = ''
    showAddForm.value = false
    
    // Refresh exercise list
    await loadExercises()
  } catch (error) {
    console.error('Error adding exercise:', error)
    alert('Failed to add exercise. Please try again.')
  } finally {
    loading.value = false
  }
}

const searchExercises = async () => {
  loading.value = true
  try {
    const result = await exerciseCatalogApi.searchExercises({
      query: searchQuery.value || null,
      muscleGroup: selectedMuscleGroup.value || null
    })
    exercises.value = result.exercises
  } catch (error) {
    console.error('Error searching exercises:', error)
    alert('Failed to search exercises. Please try again.')
  } finally {
    loading.value = false
  }
}

const loadExercises = async () => {
  loading.value = true
  try {
    const result = await exerciseCatalogApi.getAllExercises()
    exercises.value = result.exercises
  } catch (error) {
    console.error('Error loading exercises:', error)
    alert(`Failed to load exercises: ${error.message}`)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadExercises()
})
</script>

<style scoped>
.exercise-catalog {
  padding: 1rem;
  color: #495057;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h2 {
  color: #2c3e50;
  margin: 0;
}

.add-form {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  margin-bottom: 2rem;
  border: 1px solid #dee2e6;
}

.add-form h3 {
  margin-top: 0;
  color: #495057;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #495057;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.form-group small {
  color: #6c757d;
  font-size: 0.875rem;
}

.form-actions {
  margin-top: 1.5rem;
}

.search-section {
  margin-bottom: 2rem;
}

.search-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.search-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
}

.filter-select {
  padding: 0.75rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  min-width: 200px;
}

.exercise-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.exercise-card {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s ease;
}

.exercise-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.exercise-card h3 {
  margin-top: 0;
  color: #2c3e50;
  font-size: 1.25rem;
}

.exercise-details {
  margin-top: 1rem;
}

.detail-item {
  margin-bottom: 0.75rem;
}

.detail-item strong {
  color: #495057;
}

.muscle-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.muscle-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.instructions {
  margin: 0.5rem 0 0 0;
  color: #6c757d;
  line-height: 1.5;
}

.loading, .no-results {
  text-align: center;
  padding: 2rem;
  color: #6c757d;
  font-style: italic;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.btn-primary {
  background: #42b883;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #369870;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background: #5a6268;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
